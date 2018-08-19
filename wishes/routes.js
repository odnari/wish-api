const router = require('express').Router()
const pick = require('lodash/pick')
const { ObjectID } = require('mongodb')
const Wish = require('./model')
const { authenticatedOrGuest, authenticate, validateId, validationErrorsHandler } = require('./../middleware')
const { validateCreate, validateUpdate, validateComplete, validateReserve } = require('./validators')
const { defaults } = require('./constants')

const findByIdAndUpdateWith = (id, body) => {
  return Wish
    .findByIdAndUpdate(id, {$set: body}, { new: true })
    .then(note => {
      if (!note) return { status: 404, error: 'Not found' }

      return note
    })
    .catch(error => ({ status: 400, error }))
}

router.get('/', authenticate, (req, res) => {
  if (!ObjectID.isValid(req.user._id)) {
    return res.send({ status: 422, error: 'Invalid id' })
  }

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
  if (!ObjectID.isValid(req.user._id)) {
    return res.send({ status: 422, error: 'Invalid id' })
  }

  Wish
    .find({ reservedBy: req.user._id, deleted: false }, defaults.listVisibleFields)
    .sort({createdAt: -1})
    .then(notes => {
      if (!notes) res.send({ status: 404, error: 'Not found' })

      res.send(notes)
    })
    .catch(error => res.send({ status: 400, error }))
})

router.get('/user/:id', validateId, authenticatedOrGuest, (req, res) => {
  const userId = req.params.id

  Wish
    .find({ _creator: userId, deleted: false }, defaults.listVisibleFields)
    .sort({createdAt: -1})
    .then(notes => {
      if (!notes) return res.send({ status: 404, error: 'Not found' })

      return res.send(notes)
    })
    .catch(error => res.send({ status: 400, error }))
})

router.get('/:id', validateId, authenticate, (req, res) => {
  const id = req.params.id

  Wish
    .findById(id)
    .then(note => {
      if (!note) return res.send({ status: 404, error: 'Not found' })

      return res.send(note)
    })
    .catch(error => res.send({ status: 400, error }))
})

router.post('/', authenticate, validateCreate, validationErrorsHandler, (req, res) => {
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

router.patch('/:id', authenticate, validateId, validateUpdate, validationErrorsHandler, (req, res) => {
  const id = req.params.id
  const body = pick(req.body, defaults.bodyFields)
  body.price = (+body.price).toFixed(2)

  if (!(+body.price)) {
    body.price = null
    body.currency = null
  }

  if (!ObjectID.isValid(id)) {
    return res.send({ status: 422, error: 'Invalid id' })
  }

  Wish.findById(id)
    .then((wish) => {
      if (!wish) return res.send({ status: 404, error: 'Not found' })

      if (wish._creator.toHexString() !== req.user._id.toHexString()) {
        return res.send({ status: 403, error: 'No access' })
      }

      return findByIdAndUpdateWith(id, body)
        .then(responseObject => res.send(responseObject))
    })
    .catch(error => res.send({ status: 400, error }))
})

router.post('/:id/complete', validateId, authenticate, validateComplete, validationErrorsHandler, (req, res) => {
  const id = req.params.id
  const body = pick(req.body, [
    'completedReason'
  ])
  body.completed = true

  Wish.findById(id)
    .then((wish) => {
      if (!wish) return res.send({ status: 404, error: 'Not found' })

      if (wish._creator.toHexString() !== req.user._id.toHexString()) {
        return res.send({ status: 403, error: 'No access' })
      }

      return findByIdAndUpdateWith(id, body)
        .then(responseObject => res.send(responseObject))
    })
    .catch(error => res.send({ status: 400, error }))
})

router.delete('/:id/complete', validateId, authenticate, (req, res) => {
  const id = req.params.id
  const body = {
    completed: false,
    completedReason: null
  }

  Wish.findById(id)
    .then((wish) => {
      if (!wish) return res.send({ status: 404, error: 'Not found' })

      if (wish._creator.toHexString() !== req.user._id.toHexString()) {
        return res.send({ status: 403, error: 'No access' })
      }

      return findByIdAndUpdateWith(id, body)
        .then(responseObject => res.send(responseObject))
    })
    .catch(error => res.send({ status: 400, error }))
})

router.post('/:id/reserve', validateId, authenticate, validateReserve, validationErrorsHandler, (req, res) => {
  const id = req.params.id
  const body = {
    reserved: true,
    reservedBy: req.user._id,
    reservedByName: req.body.name
  }

  Wish.findById(id)
    .then((wish) => {
      if (!wish) return res.send({ status: 404, error: 'Not found' })

      if (wish._creator.toHexString() === req.user._id.toHexString()) {
        return res.send({ status: 403, error: 'No access' })
      }

      return findByIdAndUpdateWith(id, body)
        .then(responseObject => res.send(responseObject))
    })
    .catch(error => res.send({ status: 400, error }))
})

router.delete('/:id/reserve', validateId, authenticate, (req, res) => {
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
        return res.send({ status: 403, error: 'No access' })
      }

      return findByIdAndUpdateWith(id, body)
        .then(responseObject => res.send(responseObject))
    })
    .catch(error => res.send({ status: 400, error }))
})

router.delete('/:id', validateId, authenticate, (req, res) => {
  const id = req.params.id

  Wish.findById(id)
    .then((note) => {
      if (!note) return res.send({status: 404, error: 'Not found'})

      if (note._creator.toHexString() !== req.user._id.toHexString()) {
        return res.send({status: 403, error: 'No access'})
      }

      return Wish
        .findByIdAndUpdate(req.params.id, {
          $set: {
            deleted: true
          }
        }, {new: true})
        .then(note => {
          if (!note) res.send({status: 404, error: 'Not found'})

          res.send(note)
        })
        .catch(error => res.send({status: 400, error}))
    })
})

module.exports = { router }
