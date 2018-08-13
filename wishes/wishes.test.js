/* eslint-disable no-undef */
const request = require('supertest')
const app = require('../app')
const { Wish } = require('./model')
const { populateUsers, populateWishes, users, wishes } = require('./../tests/seed')
const urlPrefix = '/api/wishes'

describe('wishes', () => {
  beforeEach(populateUsers)
  beforeEach(populateWishes)

  describe('[POST /]: create', () => {
    const mockWish = {
      title: 'title one',
      description: 'desc one'
    }

    test('should create a wish', (done) => {
      request(app)
        .post(urlPrefix)
        .set('x-authorization', users[0].tokens[0].token)
        .send(mockWish)
        .expect(200)
        .expect((res) => {
          expect(typeof res.body._id).toBe('string')
        })
        .end((err) => {
          if (err) {
            return done(err)
          }

          Wish
            .findOne({title: mockWish.title})
            .then((wish) => {
              expect(wish).toBeTruthy()
              done()
            })
            .catch((e) => done(e))
        })
    })

    test('should not create wish without title', (done) => {
      request(app)
        .post(urlPrefix)
        .set('x-authorization', users[0].tokens[0].token)
        .send({description: 'ha, no title'})
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toBe(400)
        })
        .end(done)
    })
  })

  describe('[PATCH /:id]: create', () => {
    const mockWish = {
      title: 'title changed',
      description: 'desc changed',
      price: '24.99',
      currency: 'usd',
      link: 'https://hello@adele.love/'
    }

    test('should update wish', (done) => {
      request(app)
        .patch(`${urlPrefix}/${wishes[0]._id}`)
        .set('x-authorization', users[0].tokens[0].token)
        .send(mockWish)
        .expect(200)
        .expect((res) => {
          expect(typeof res.body._id).toBe('string')
          expect(res.body).toEqual(expect.objectContaining(mockWish))
        })
        .end((err) => {
          if (err) {
            return done(err)
          }

          Wish
            .findById(wishes[0]._id)
            .then((wish) => {
              expect(wish).toBeTruthy()
              expect(wish).toEqual(expect.objectContaining(mockWish))
              done()
            })
            .catch((e) => done(e))
        })
    })
  })
})
