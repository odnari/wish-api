/* eslint-disable no-undef */
const request = require('supertest')
const app = require('../app')
const { User } = require('./model')
const { mongoose } = require('./../db/mongoose')

// eslint-disable-next-line no-undef

jest.mock('./../mail/helper', () => ({
  sendEmailVerificationMail: (to, { token }) => Promise.resolve()
}))

describe('users', () => {
  afterAll(() => mongoose.connection.close())

  describe('POST /', () => {
    beforeEach((done) => {
      User.remove({}, () => done())
    })

    test('should create a user', (done) => {
      const email = 'example1@example.com'
      const password = '123mnb!'
      const name = 'Test user'

      request(app)
        .post('/api/users')
        .send({email, password, name})
        .expect(200)
        .expect((res) => {
          if (res.body.status !== 200) done(res.body.error)

          expect(typeof res.body._id).toBe('string')
          expect(res.body.email).toBe(email)
          expect(typeof res.headers['x-authorization']).toBe('string')
        })
        .end((err) => {
          if (err) {
            return done(err)
          }

          User
            .findOne({email})
            .then((user) => {
              expect(user).toBeTruthy()
              expect(user.password).not.toBe(password)
              done()
            })
            .catch((e) => done(e))
        })
    })
  })
})
