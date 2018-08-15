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

  describe('[PATCH /:id]: update', () => {
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

    test('should not update other user\'s wish', (done) => {
      request(app)
        .patch(`${urlPrefix}/${wishes[0]._id}`)
        .set('x-authorization', users[1].tokens[0].token)
        .send(mockWish)
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toBe(503)
        })
        .end(done)
    })
  })

  describe('[POST /:id/complete]: complete', () => {
    test('should complete wish with reason', (done) => {
      const mockWish = {
        completedReason: 'reason'
      }

      request(app)
        .post(`${urlPrefix}/${wishes[0]._id}/complete`)
        .set('x-authorization', users[0].tokens[0].token)
        .send(mockWish)
        .expect(200)
        .expect((res) => {
          expect(typeof res.body._id).toBe('string')
          expect(res.body).toEqual(expect.objectContaining(mockWish))
          expect(res.body.completed).toBeTruthy()
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
              expect(wish.completed).toBeTruthy()
              done()
            })
            .catch((e) => done(e))
        })
    })

    test('should complete wish without reason', (done) => {
      request(app)
        .post(`${urlPrefix}/${wishes[0]._id}/complete`)
        .set('x-authorization', users[0].tokens[0].token)
        .expect(200)
        .expect((res) => {
          expect(typeof res.body._id).toBe('string')
          expect(res.body.completed).toBeTruthy()
        })
        .end((err) => {
          if (err) {
            return done(err)
          }

          Wish
            .findById(wishes[0]._id)
            .then((wish) => {
              expect(wish).toBeTruthy()
              expect(wish.completed).toBeTruthy()
              done()
            })
            .catch((e) => done(e))
        })
    })

    test('should not complete other user\'s wish', (done) => {
      request(app)
        .post(`${urlPrefix}/${wishes[0]._id}/complete`)
        .set('x-authorization', users[1].tokens[0].token)
        .send()
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toBe(503)
        })
        .end(done)
    })
  })

  describe('[DELETE /:id/complete]: uncomplete', () => {
    test('should uncomplete wish', (done) => {
      request(app)
        .delete(`${urlPrefix}/${wishes[0]._id}/complete`)
        .set('x-authorization', users[0].tokens[0].token)
        .expect(200)
        .expect((res) => {
          expect(typeof res.body._id).toBe('string')
          expect(res.body.completed).toBeFalsy()
          expect(res.body.completedReason).toBeFalsy()
        })
        .end((err) => {
          if (err) {
            return done(err)
          }

          Wish
            .findById(wishes[0]._id)
            .then((wish) => {
              expect(wish).toBeTruthy()
              expect(wish.completed).toBeFalsy()
              expect(wish.completedReason).toBeFalsy()
              done()
            })
            .catch((e) => done(e))
        })
    })

    test('should not uncomplete other user\'s wish', (done) => {
      request(app)
        .delete(`${urlPrefix}/${wishes[0]._id}/complete`)
        .set('x-authorization', users[1].tokens[0].token)
        .send()
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toBe(503)
        })
        .end(done)
    })
  })

  describe('[POST /:id/reserve]: reserve', () => {
    test('should reserve wish with custom name', (done) => {
      const mockWish = {
        name: 'custom name'
      }

      request(app)
        .post(`${urlPrefix}/${wishes[0]._id}/reserve`)
        .set('x-authorization', users[1].tokens[0].token)
        .send(mockWish)
        .expect(200)
        .expect((res) => {
          expect(typeof res.body._id).toBe('string')
          expect(res.body.reserved).toBeTruthy()
          expect(res.body.reservedBy).toBeTruthy()
          expect(res.body.reservedByName).toBe(mockWish.name)
        })
        .end((err) => {
          if (err) {
            return done(err)
          }

          Wish
            .findById(wishes[0]._id)
            .then((wish) => {
              expect(wish).toBeTruthy()
              expect(wish.reserved).toBeTruthy()
              expect(wish.reservedBy).toBeTruthy()
              expect(wish.reservedByName).toBe(mockWish.name)
              done()
            })
            .catch((e) => done(e))
        })
    })

    test('should reserve wish without name', (done) => {
      request(app)
        .post(`${urlPrefix}/${wishes[0]._id}/reserve`)
        .set('x-authorization', users[1].tokens[0].token)
        .expect(200)
        .expect((res) => {
          expect(typeof res.body._id).toBe('string')
          expect(res.body.reserved).toBeTruthy()
          expect(res.body.reservedBy).toBeTruthy()
          expect(res.body.reservedByName).toBeFalsy()
        })
        .end((err) => {
          if (err) {
            return done(err)
          }

          Wish
            .findById(wishes[0]._id)
            .then((wish) => {
              expect(wish).toBeTruthy()
              expect(wish.reserved).toBeTruthy()
              expect(wish.reservedBy).toBeTruthy()
              expect(wish.reservedByName).toBeFalsy()
              done()
            })
            .catch((e) => done(e))
        })
    })

    test('should not reserve current user\'s wish', (done) => {
      request(app)
        .post(`${urlPrefix}/${wishes[0]._id}/reserve`)
        .set('x-authorization', users[0].tokens[0].token)
        .send()
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toBe(503)
        })
        .end(done)
    })
  })

  describe('[DELETE /:id/reserve]: unreserve', () => {
    test('should unreserve wish', (done) => {
      request(app)
        .delete(`${urlPrefix}/${wishes[3]._id}/reserve`)
        .set('x-authorization', users[1].tokens[0].token)
        .expect(200)
        .expect((res) => {
          expect(typeof res.body._id).toBe('string')
          expect(res.body.reserved).toBeFalsy()
          expect(res.body.reservedBy).toBeFalsy()
          expect(res.body.reservedByName).toBeFalsy()
        })
        .end((err) => {
          if (err) {
            return done(err)
          }

          Wish
            .findById(wishes[3]._id)
            .then((wish) => {
              expect(wish).toBeTruthy()
              expect(wish.reserved).toBeFalsy()
              expect(wish.reservedBy).toBeFalsy()
              expect(wish.reservedByName).toBeFalsy()
              done()
            })
            .catch((e) => done(e))
        })
    })

    test('should not unreserve same user\'s wish', (done) => {
      request(app)
        .delete(`${urlPrefix}/${wishes[3]._id}/reserve`)
        .set('x-authorization', users[0].tokens[0].token)
        .send()
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toBe(503)
        })
        .end(done)
    })
  })
})
