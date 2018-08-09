/* eslint-disable no-undef */
const request = require('supertest')
const app = require('../app')
const { User } = require('./model')
const { mongoose } = require('./../db/mongoose')
const { populateUsers, users } = require('./../tests/seed')
const urlPrefix = '/api/users'

jest.mock('./../mail/helper', () => ({
  sendEmailVerificationMail: (to, { token }) => Promise.resolve()
}))

describe('users', () => {
  afterAll(() => {
    mongoose.connection.close()
  })

  beforeEach(populateUsers)

  describe('[POST /]: create', () => {
    const mockUser = {
      email: 'example1@example.com',
      password: '123mnb!',
      name: 'Test user'
    }

    test('should create a user', (done) => {
      request(app)
        .post(urlPrefix)
        .send(mockUser)
        .expect(200)
        .expect((res) => {
          expect(typeof res.body._id).toBe('string')
          expect(res.body.email).toBe(mockUser.email)
          expect(typeof res.headers['x-authorization']).toBe('string')
        })
        .end((err) => {
          if (err) {
            return done(err)
          }

          User
            .findOne({email: mockUser.email})
            .then((user) => {
              expect(user).toBeTruthy()
              expect(user.password).not.toBe(mockUser.password)
              done()
            })
            .catch((e) => done(e))
        })
    })

    test('should return validation errors', (done) => {
      request(app)
        .post(urlPrefix)
        .send({email: 'inv', password: 'inv', name: 'Test'})
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toBe(400)
          expect(typeof res.body.error).toBe('string')
        })
        .end((err) => {
          if (err) {
            return done(err)
          }

          User
            .findOne({email: mockUser.email})
            .then((user) => {
              expect(user).toBeFalsy()
              done()
            })
            .catch((e) => done(e))
        })
    })

    test('should not create user with existing email', (done) => {
      request(app)
        .post(urlPrefix)
        .send({email: users[0].email, password: users[0].password, name: 'Test'})
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toBe(400)
          expect(typeof res.body.error).toBe('string')
        })
        .end((err) => {
          if (err) {
            return done(err)
          }

          User
            .findOne({email: mockUser.email})
            .then((user) => {
              expect(user).toBeFalsy()
              done()
            })
            .catch((e) => done(e))
        })
    })
  })

  describe('[POST /login]: authorize', () => {
    it('should authorize and return token with user info', (done) => {
      request(app)
        .post(`${urlPrefix}/login`)
        .send({email: users[0].email, password: users[0].password})
        .expect(200)
        .expect((res) => {
          expect(typeof res.body._id).toBe('string')
          expect(res.body.email).toBe(users[0].email)
          expect(typeof res.headers['x-authorization']).toBe('string')
          done()
        })
        .end(e => done(e))
    })

    it('should reject invalid login', (done) => {
      request(app)
        .post(`${urlPrefix}/login`)
        .send({email: users[0].email, password: 'testtesttest'})
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toBe(400)
          expect(res.body.error).toBe('Wrong password')
          expect(res.headers['x-authorization']).toBe(undefined)

          done()
        })
        .end(e => done(e))
    })
  })

  describe('[POST /logout]: logout', () => {
    it('should remove auth token', (done) => {
      request(app)
        .post(`${urlPrefix}/logout`)
        .set('x-authorization', users[1].tokens[0].token)
        .expect(200)
        .end((err, res) => {
          if (err) {
            return done(err)
          }

          User.findById(users[1]._id).then((user) => {
            expect(user.tokens.length).toBe(0)
            done()
          }).catch((e) => done(e))
        })
    })
  })

  describe('[GET /:id]: get user', () => {
    test('should return public user profile by id', (done) => {
      request(app)
        .get(`${urlPrefix}/${users[0]._id}`)
        .expect(200)
        .expect((res) => {
          expect(res.body._id).toBe(users[0]._id.toHexString())
          expect(res.body.name).toBe(users[0].name)
        })
        .end((err) => done(err))
    })

    test('should return error when id is invalid', (done) => {
      request(app)
        .get(`${urlPrefix}/69banana`)
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toBe(503)
          expect(res.body.error).toBe('Invalid id')
        })
        .end((err) => done(err))
    })

    test('should return error when user not found', (done) => {
      request(app)
        .get(`${urlPrefix}/a${users[0]._id.toHexString().slice(1)}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toBe(400)
          expect(res.body.error).toBe('User not found')
        })
        .end((err) => done(err))
    })
  })

  describe('[PATCH /:id]: update user', () => {
    test('should not update other users', (done) => {
      request(app)
        .patch(`${urlPrefix}/${users[0]._id}`)
        .set('x-authorization', users[1].tokens[0].token)
        .send({
          name: 'PatchTest'
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toBe(403)
          expect(res.body.error).toBe('No access')
        })
        .end((err) => done(err))
    })

    test('should update basic user info', (done) => {
      request(app)
        .patch(`${urlPrefix}/${users[0]._id}`)
        .set('x-authorization', users[0].tokens[0].token)
        .send({
          name: 'PatchTest'
        })
        .expect(200)
        .expect((res) => {
          expect(res.body._id).toBe(users[0]._id.toHexString())
          expect(res.body.name).toBe('PatchTest')
        })
        .end((err) => done(err))
    })

    test('should skip extra or disallowed fields', (done) => {
      request(app)
        .patch(`${urlPrefix}/${users[0]._id}`)
        .set('x-authorization', users[0].tokens[0].token)
        .send({
          supersecurename: 'PatchTest'
        })
        .expect(200)
        .expect((res) => {
          expect(res.body._id).toBe(users[0]._id.toHexString())
          expect(res.body.supersecurename).toBeFalsy()
        })
        .end((err) => done(err))
    })

    test('should update password correctly', (done) => {
      const password = 'patchtestpass'

      request(app)
        .patch(`${urlPrefix}/${users[0]._id}`)
        .set('x-authorization', users[0].tokens[0].token)
        .send({ password })
        .expect(200)
        .expect((res) => {
          expect(res.body._id).toBe(users[0]._id.toHexString())
          expect(res.body.password).not.toBe(password)
        })
        .end((err) => done(err))
    })
  })

  describe('[POST /me/verify]: request verification', () => {
    test('should create verify token', (done) => {
      request(app)
        .post(`${urlPrefix}/me/verify`)
        .set('x-authorization', users[0].tokens[0].token)
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toBe(200)
        })
        .end((err) => {
          if (err) {
            return done(err)
          }

          User
            .findOne({ email: users[0].email, 'tokens.access': 'email_verify' })
            .then((user) => {
              expect(user).toBeTruthy()
              done()
            })
            .catch((e) => done(e))
        })
    })

    test('should return error if not authorized', (done) => {
      request(app)
        .post(`${urlPrefix}/me/verify`)
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toBe(403)
          expect(res.body.error.name).toBe('JsonWebTokenError')
        })
        .end((err) => done(err))
    })
  })

  describe('[GET /verify/:token]: verify email token', () => {
    test('should verify valid token', (done) => {
      request(app)
        .get(`${urlPrefix}/verify/${users[0].tokens[1].token}`)
        .expect(200)
        .expect((res) => {
          expect(res.body._id).toBe(users[0]._id.toHexString())
          expect(typeof res.headers['x-authorization']).toBe('string')
        })
        .end((err) => {
          if (err) {
            return done(err)
          }

          User
            .findOne({email: users[0].email})
            .then((user) => {
              expect(user.verified).toBe(true)
            })
            .then(() => {
              return User
                .findOne({email: users[0].email, 'tokens.token': users[0].tokens[1].token})
                .then(user => {
                  expect(user).toBeFalsy()
                })
            })
            .then(() => done())
            .catch((e) => done(e))
        })
    })

    test('should reject invalid token', (done) => {
      request(app)
        .get(`${urlPrefix}/verify/banana`)
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toBe(403)
          expect(res.body.error.name).toBe('JsonWebTokenError')
        })
        .end((err) => done(err))
    })
  })
})
