const router = require('express').Router()
const pick = require('lodash/pick')
const { ObjectID } = require('mongodb')
const { Wish } = require('./model')
const { authenticate } = require('./../middleware/authenticate')

router.get('/', authenticate, (req, res) => {
  const fields = [
    '_id',
    'title',
    'description',
    'link',
    'completed',
    'completedBy',
    'completedReason',
    'reserved',
    'reservedBy'
  ]

  Wish
    .find({ _creator: req.user._id, deleted: false }, fields.join(' '))
    .then(notes => {
      if (!notes) res.send({ status: 404, error: 'Not found' })

      res.send(notes)
    })
    .catch(error => res.send({ status: 400, error }))
})

// TODO: add guest view
router.get('/user/:id', authenticate, (req, res) => {
  const userId = req.params.id

  if (!ObjectID.isValid(userId)) {
    return res.send({ status: 503, error: 'Invalid id' })
  }

  const fields = [
    '_id',
    'title',
    'description',
    'link',
    'completed',
    'completedBy',
    'completedReason',
    'reserved',
    'reservedBy'
  ]

  Wish
    .find({ _creator: userId, deleted: false }, fields.join(' '))
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
  const body = pick(req.body, [
    'title',
    'description',
    'link'
  ])
  body._creator = req.user._id

  const note = new Wish(body)
  note
    .save()
    .then(note => res.send({ _id: note._id }))
    .catch(error => res.send({ status: 400, error }))
})

router.patch('/:id', authenticate, (req, res) => {
  const id = req.params.id
  const body = pick(req.body, [
    'title',
    'description',
    'link'
  ])

  if (!ObjectID.isValid(id)) {
    return res.send({ status: 503, error: 'Invalid id' })
  }

  Wish
    .findByIdAndUpdate(req.params.id, {$set: body}, { new: true })
    .then(note => {
      if (!note) res.send({ status: 404, error: 'Not found' })

      res.send({ _id: note._id })
    })
    .catch(error => res.send({ status: 400, error }))
})

router.post('/:id/complete', authenticate, (req, res) => {
  const id = req.params.id
  const body = pick(req.body, [
    'completedReason'
  ])
  body.completed = true
  body.completedBy = req.user._id

  if (!ObjectID.isValid(id)) {
    return res.send({ status: 503, error: 'Invalid id' })
  }

  Wish
    .findByIdAndUpdate(req.params.id, {$set: body}, { new: true })
    .then(note => {
      if (!note) res.send({ status: 404, error: 'Not found' })

      res.send(note)
    })
    .catch(error => res.send({ status: 400, error }))
})

router.delete('/:id/complete', authenticate, (req, res) => {
  const id = req.params.id
  const body = {
    completed: false,
    completedReason: null
  }

  // TODO: allow only if user === creator
  if (!ObjectID.isValid(id)) {
    return res.send({ status: 503, error: 'Invalid id' })
  }

  Wish
    .findByIdAndUpdate(req.params.id, {$set: body}, { new: true })
    .then(note => {
      if (!note) res.send({ status: 404, error: 'Not found' })

      res.send(note)
    })
    .catch(error => res.send({ status: 400, error }))
})

router.post('/:id/reserve', authenticate, (req, res) => {
  const id = req.params.id
  const body = {
    reserved: true,
    reservedBy: req.user._id,
    reservedByName: req.body.name || req.user.name
  }

  if (!ObjectID.isValid(id)) {
    return res.send({ status: 503, error: 'Invalid id' })
  }

  Wish
    .findByIdAndUpdate(req.params.id, {$set: body}, { new: true })
    .then(note => {
      if (!note) res.send({ status: 404, error: 'Not found' })

      res.send(note)
    })
    .catch(error => res.send({ status: 400, error }))
})

router.delete('/:id/reserve', authenticate, (req, res) => {
  const id = req.params.id
  const body = {
    reserved: false,
    reservedBy: null
  }
  // TODO: allow only if user === reserveBy
  if (!ObjectID.isValid(id)) {
    return res.send({ status: 503, error: 'Invalid id' })
  }

  Wish
    .findByIdAndUpdate(req.params.id, {$set: body}, { new: true })
    .then(note => {
      if (!note) res.send({ status: 404, error: 'Not found' })

      res.send(note)
    })
    .catch(error => res.send({ status: 400, error }))
})

router.delete('/:id', authenticate, (req, res) => {
  const id = req.params.id

  if (!ObjectID.isValid(id)) {
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
