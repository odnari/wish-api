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

  describe('[POST /logout] - logout', () => {
    it('should remove auth token', (done) => {
      request(app)
        .post(`${urlPrefix}/logout`)
        .set('x-authorization', users[0].tokens[0].token)
        .expect(200)
        .end((err, res) => {
          if (err) {
            return done(err)
          }

          User.findById(users[0]._id).then((user) => {
            expect(user.tokens.length).toBe(0)
            done()
          }).catch((e) => done(e))
        })
    })
  })
})
