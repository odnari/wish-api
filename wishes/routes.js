const router = require('express').Router()
const pick = require('lodash/pick')
const { ObjectID } = require('mongodb')
const { Wish } = require('./model')
const { authenticate, authenticatedOrGuest } = require('./../middleware/authenticate')
const { defaults } = require('./constants')

const findByIdAndUpdateWith = (id, body) => {
  if (!ObjectID.isValid(id)) {
    // eslint-disable-next-line prefer-promise-reject-errors
    return Promise.reject({status: 503, error: 'Invalid id'})
  }

  return Wish
    .findByIdAndUpdate(id, {$set: body}, { new: true })
    .then(note => {
      if (!note) return { status: 404, error: 'Not found' }

      return note
    })
    .catch(error => ({ status: 400, error }))
}

router.get('/', authenticate, (req, res) => {
  Wish
    .find({ _creator: req.user._id, deleted: false }, defaults.listVisibleFields)
    .sort({createdAt: -1})
    .then(notes => {
      if (!notes) res.send({ status: 404, error: 'Not found' })

      res.send(notes)
    })
    .catch(error => res.send({ status: 400, error }))
})

router.get('/reserved', authenticate, (req, res) => {
  Wish
    .find({ reservedBy: req.user._id, deleted: false }, defaults.listVisibleFields)
    .sort({createdAt: -1})
    .then(notes => {
      if (!notes) res.send({ status: 404, error: 'Not found' })

      res.send(notes)
    })
    .catch(error => res.send({ status: 400, error }))
})

router.get('/user/:id', authenticatedOrGuest, (req, res) => {
  const userId = req.params.id

  if (!ObjectID.isValid(userId)) {
    return res.send({ status: 503, error: 'Invalid id' })
  }

  Wish
    .find({ _creator: userId, deleted: false }, defaults.listVisibleFields)
    .sort({createdAt: -1})
    .then(notes => {
      if (!notes) res.send({ status: 404, error: 'Not found' })

      res.send(notes)
    })
    .catch(error => res.send({ status: 400, error }))
})

router.get('/:id', authenticate, (req, res) => {
  const id = req.params.id

  if (!ObjectID.isValid(id)) {
    return res.send({ status: 503, error: 'Invalid id' })
  }

  Wish
    .findById(id)
    .then(note => {
      if (!note) res.send({ status: 404, error: 'Not found' })

      res.send(note)
    })
    .catch(error => res.send({ status: 400, error }))
})

router.post('/', authenticate, (req, res) => {
  const body = pick(req.body, defaults.bodyFields)
  body._creator = req.user._id
  body.creatorName = req.user.name
  body.price = (+body.price).toFixed(2)

  if (!(+body.price)) {
    body.price = null
    body.currency = null
  }

  const note = new Wish(body)
  note
    .save()
    .then(note => res.send({ _id: note._id }))
    .catch(error => res.send({ status: 400, error }))
})

router.patch('/:id', authenticate, (req, res) => {
  const id = req.params.id
  const body = pick(req.body, defaults.bodyFields)
  body.price = (+body.price).toFixed(2)

  if (!(+body.price)) {
    body.price = null
    body.currency = null
  }

  Wish.findById(id)
    .then((wish) => {
      if (!wish) return res.send({ status: 404, error: 'Not found' })

      if (wish._creator.toHexString() !== req.user._id.toHexString()) {
        return res.send({ status: 503, error: 'No access' })
      }

      return findByIdAndUpdateWith(id, body)
        .then(responseObject => res.send(responseObject))
    })
    .catch(error => res.send({ status: 400, error }))
})

router.post('/:id/complete', authenticate, (req, res) => {
  const id = req.params.id
  const body = pick(req.body, [
    'completedReason'
  ])
  body.completed = true

  if (id !== req.user._id.toHexString()) {
    return res.send({status: 503, error: 'Access denied'})
  }

  findByIdAndUpdateWith(id, body)
    .then(responseObject => res.send(responseObject))
})

router.delete('/:id/complete', authenticate, (req, res) => {
  const id = req.params.id
  const body = {
    completed: false,
    completedReason: null
  }

  if (id !== req.user._id.toHexString()) {
    return res.send({status: 503, error: 'Access denied'})
  }

  findByIdAndUpdateWith(id, body)
    .then(responseObject => res.send(responseObject))
})

router.post('/:id/reserve', authenticate, (req, res) => {
  const id = req.params.id
  const body = {
    reserved: true,
    reservedBy: req.user._id,
    reservedByName: req.body.name
  }

  if (body.reservedBy === req.user._id.toHexString()) {
    return res.send({status: 503, error: 'Not permitted'})
  }

  findByIdAndUpdateWith(id, body)
    .then(responseObject => res.send(responseObject))
})

router.delete('/:id/reserve', authenticate, (req, res) => {
  const id = req.params.id
  const body = {
    reserved: false,
    reservedBy: null,
    reservedByName: null
  }

  Wish.findById(id)
    .then((note) => {
      if (!note) return res.send({ status: 404, error: 'Not found' })

      if (note.reservedBy.toHexString() !== req.user._id.toHexString()) {
        return res.send({ status: 503, error: 'No access' })
      }

      return findByIdAndUpdateWith(id, body)
        .then(responseObject => res.send(responseObject))
    })
    .catch(error => res.send({ status: 400, error }))
})

router.delete('/:id', authenticate, (req, res) => {
  const id = req.params.id

  if (!ObjectID.isValid(id) || id !== req.user._id.toHexString()) {
    return res.send({ status: 503, error: 'Invalid id' })
  }

  Wish
    .findByIdAndUpdate(req.params.id, {
      $set: {
        deleted: true
      }
    }, { new: true })
    .then(note => {
      if (!note) res.send({ status: 404, error: 'Not found' })

      res.send()
    })
    .catch(error => res.send({ status: 400, error }))
})

module.exports = { router }
