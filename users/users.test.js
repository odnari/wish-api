/* eslint-disable no-undef */
const request = require('supertest')
const app = require('../app')
const User = require('./model')
const { populateUsers, users } = require('./../tests/seed')
const urlPrefix = '/api/users'

jest.mock('./../mail/helper', () => ({
  sendEmailVerificationMail: (to, { token }) => Promise.resolve()
}))
jest.mock('./social')

const mockNewGoogleUser = {
  email: 'google@example.com',
  verified: false,
  password: 'password',
  name: 'Google',
  social: {
    google: '3213454654765765'
  }
}

const mockExistingGoogleUser = {
  email: users[0].email,
  verified: false,
  password: 'password',
  name: 'Google',
  social: {
    google: '3213454654765344'
  }
}

const mockExistingGoogleUserVerified = {
  email: users[1].email,
  verified: true,
  password: 'password',
  name: 'Google',
  social: {
    google: '32134546547678678'
  }
}

const mockNewFacebookUser = {
  email: 'facebook@example.com',
  verified: false,
  password: 'password',
  name: 'Facebook',
  social: {
    facebook: '3213454654765765'
  }
}

const mockExistingFacebookUser = {
  email: users[0].email,
  verified: false,
  password: 'password',
  name: 'Facebook',
  social: {
    facebook: '3213454654765344'
  }
}

const mockExistingFacebookUserVerified = {
  email: users[1].email,
  verified: true,
  password: 'password',
  name: 'Facebook',
  social: {
    facebook: '32134546547678678'
  }
}

describe('users', () => {
  beforeEach(populateUsers)

  describe('[POST /]: create', () => {
    const mockUser = {
      email: 'example1@example.com',
      password: '123mnb!',
      username: 'Test user'
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
        .send({email: 'inv', password: 'inv', username: 'Test'})
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toBe(422)
          expect(typeof res.body.error).toBe('object')
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
        .send({email: users[0].email, password: users[0].password, username: 'Test'})
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
    test('should return public user profile by username', (done) => {
      request(app)
        .get(`${urlPrefix}/${users[0].username}`)
        .expect(200)
        .expect((res) => {
          expect(res.body._id).toBe(users[0]._id.toHexString())
          expect(res.body.username).toBe(users[0].username)
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

  describe('[POST /google]: create or link google account', () => {
    test('should create new user if no email match', (done) => {
      const social = require('./social')
      social.getGoogleUser.mockImplementation(() => Promise.resolve(mockNewGoogleUser))

      request(app)
        .post(`${urlPrefix}/google`)
        .send({ token: 'token' })
        .expect(200)
        .expect((res) => {
          expect(typeof res.body._id).toBe('string')
          expect(res.body.email).toBe(mockNewGoogleUser.email)
          expect(typeof res.headers['x-authorization']).toBe('string')
        })
        .end((err) => {
          if (err) {
            return done(err)
          }

          User
            .findOne({email: mockNewGoogleUser.email})
            .then((user) => {
              expect(user).toBeTruthy()
              expect(user.verified).toBe(mockNewGoogleUser.verified)
              expect(user.password).not.toBe(mockNewGoogleUser.password)
              expect(user.social.google).toBe(mockNewGoogleUser.social.google)
              done()
            })
            .catch((e) => done(e))
        })
    })

    test('should link to user with same email', (done) => {
      const social = require('./social')
      social.getGoogleUser.mockImplementation(() => Promise.resolve(mockExistingGoogleUser))

      request(app)
        .post(`${urlPrefix}/google`)
        .send({ token: 'token' })
        .expect(200)
        .expect((res) => {
          expect(typeof res.body._id).toBe('string')
          expect(res.body.email).toBe(users[0].email)
          expect(typeof res.headers['x-authorization']).toBe('string')
        })
        .end((err) => {
          if (err) {
            return done(err)
          }

          User
            .findOne({email: users[0].email})
            .then((user) => {
              expect(user).toBeTruthy()
              expect(user.verified).toBe(mockExistingGoogleUser.verified)
              expect(user.password).not.toBe(mockExistingGoogleUser.password)
              expect(user.social.google).toBe(mockExistingGoogleUser.social.google)
              done()
            })
            .catch((e) => done(e))
        })
    })

    test('should verify user if linked account is verified', (done) => {
      const social = require('./social')
      social.getGoogleUser.mockImplementation(() => Promise.resolve(mockExistingGoogleUserVerified))

      request(app)
        .post(`${urlPrefix}/google`)
        .send({ token: 'token' })
        .expect(200)
        .expect((res) => {
          expect(typeof res.body._id).toBe('string')
          expect(res.body.email).toBe(users[1].email)
          expect(typeof res.headers['x-authorization']).toBe('string')
        })
        .end((err) => {
          if (err) {
            return done(err)
          }

          User
            .findOne({email: users[1].email})
            .then((user) => {
              expect(user).toBeTruthy()
              expect(user.verified).toBe(mockExistingGoogleUserVerified.verified)
              expect(user.password).not.toBe(mockExistingGoogleUserVerified.password)
              expect(user.social.google).toBe(mockExistingGoogleUserVerified.social.google)
              done()
            })
            .catch((e) => done(e))
        })
    })
  })

  describe('[POST /facebook]: create or link facebook account', () => {
    test('should create new user if no email match', (done) => {
      const social = require('./social')
      social.getFacebookUser.mockImplementation(() => Promise.resolve(mockNewFacebookUser))

      request(app)
        .post(`${urlPrefix}/facebook`)
        .send({ accessToken: 'token' })
        .expect(200)
        .expect((res) => {
          expect(typeof res.body._id).toBe('string')
          expect(res.body.email).toBe(mockNewFacebookUser.email)
          expect(typeof res.headers['x-authorization']).toBe('string')
        })
        .end((err) => {
          if (err) {
            return done(err)
          }

          User
            .findOne({email: mockNewFacebookUser.email})
            .then((user) => {
              expect(user).toBeTruthy()
              expect(user.verified).toBe(mockNewFacebookUser.verified)
              expect(user.password).not.toBe(mockNewFacebookUser.password)
              expect(user.social.facebook).toBe(mockNewFacebookUser.social.facebook)
              done()
            })
            .catch((e) => done(e))
        })
    })

    test('should link to user with same email', (done) => {
      const social = require('./social')
      social.getFacebookUser.mockImplementation(() => Promise.resolve(mockExistingFacebookUser))

      request(app)
        .post(`${urlPrefix}/facebook`)
        .send({ accessToken: 'token' })
        .expect(200)
        .expect((res) => {
          expect(typeof res.body._id).toBe('string')
          expect(res.body.email).toBe(users[0].email)
          expect(typeof res.headers['x-authorization']).toBe('string')
        })
        .end((err) => {
          if (err) {
            return done(err)
          }

          User
            .findOne({email: users[0].email})
            .then((user) => {
              expect(user).toBeTruthy()
              expect(user.verified).toBe(mockExistingFacebookUser.verified)
              expect(user.password).not.toBe(mockExistingFacebookUser.password)
              expect(user.social.facebook).toBe(mockExistingFacebookUser.social.facebook)
              done()
            })
            .catch((e) => done(e))
        })
    })

    test('should verify user if linked account is verified', (done) => {
      const social = require('./social')
      social.getFacebookUser.mockImplementation(() => Promise.resolve(mockExistingFacebookUserVerified))

      request(app)
        .post(`${urlPrefix}/facebook`)
        .send({ accessToken: 'token' })
        .expect(200)
        .expect((res) => {
          expect(typeof res.body._id).toBe('string')
          expect(res.body.email).toBe(users[1].email)
          expect(typeof res.headers['x-authorization']).toBe('string')
        })
        .end((err) => {
          if (err) {
            return done(err)
          }

          User
            .findOne({email: users[1].email})
            .then((user) => {
              expect(user).toBeTruthy()
              expect(user.verified).toBe(mockExistingFacebookUserVerified.verified)
              expect(user.password).not.toBe(mockExistingFacebookUserVerified.password)
              expect(user.social.facebook).toBe(mockExistingFacebookUserVerified.social.facebook)
              done()
            })
            .catch((e) => done(e))
        })
    })
  })
})
