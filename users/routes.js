const express = require('express')
const router = express.Router()
const {ObjectID} = require('mongodb')
const pullAllBy = require('lodash/pullAllBy')
const pick = require('lodash/pick')
const {User} = require('./model')
const {authenticate, authenticatedOrGuest} = require('./../middleware/authenticate')
const {getGoogleUser, getFacebookUser, socialize, SOCIALIZATIONS} = require('./social')

const createUserFlow = (user, res) => (
  user
    .save()
    .then(() => user.requestVerification())
    .then(() => user.authenticate())
    .then(token => res.header('X-Authorization', token).send(user.toJSON()))
)

router.post('/', (req, res) => {
  const {email, password, description, name} = req.body
  const user = new User({email, password, description, name})

  createUserFlow(user, res)
    .catch(error => res.send({status: 400, error: error.message}))
})

router.post('/google', (req, res) => {
  const {token} = req.body

  getGoogleUser(token)
    .then(userInfo => socialize(userInfo, SOCIALIZATIONS.google))
    .then(user => createUserFlow(user, res))
    .catch(error => res.send({status: 400, error: error.message}))
})

router.post('/facebook', (req, res) => {
  const {accessToken: token} = req.body

  getFacebookUser(token)
    .then(userInfo => socialize(userInfo, SOCIALIZATIONS.facebook))
    .then(user => createUserFlow(user, res))
    .catch(error => res.send({status: 400, error: error.message}))
})

router.post('/login', (req, res) => {
  const {email, password} = req.body

  User.findByCreds(email, password)
    .then(user => {
      return user.authenticate()
        .then(token => res.header('X-Authorization', token).send(user))
    })
    .catch(error => res.send({status: 400, error: error.message}))
})

router.post('/me/verify', authenticate, (req, res) => {
  req.user.requestVerification()
    .then(() => res.send({status: 200}))
    .catch(error => res.send({status: 400, error: error.message}))
})

router.get('/:id', authenticatedOrGuest, (req, res) => {
  const userId = req.params.id

  if (!ObjectID.isValid(userId)) {
    return res.send({status: 503, error: 'Invalid id'})
  }

  User.findById(userId)
    .then(user => {
      if (!user) return Promise.reject(new Error('User not found'))

      res.send(user.toJSON(true))
    })
    .catch(error => res.send({status: 400, error: error.message}))
})

router.get('/verify/:token', (req, res) => {
  const token = req.params.token

  User.findByToken(token)
    .then(user => {
      if (!user) return Promise.reject(new Error('User not found'))

      user.verified = true
      user.tokens = pullAllBy(user.tokens, [{token}], 'token')
      return user.save()
    })
    .then(user => {
      user
        .authenticate()
        .then(token => res.header('X-Authorization', token).send(user))
    })
    .catch(error => res.send({status: 403, error}))
})

router.patch('/:id', authenticate, (req, res) => {
  const body = pick(req.body, ['email', 'password', 'name', 'description', 'profiles'])

  if (!body.password.length) {
    delete body.password
  }

  if (!ObjectID.isValid(req.params.id) || (req.user._id.toHexString() !== req.params.id)) {
    return res.send({status: 503, error: 'Invalid id'})
  }

  User.findByIdAndUpdate(req.params.id, {$set: body}, { new: true })
    .then(user => {
      if (!user) return { status: 404, error: 'Not found' }

      return res.send(user.toJSON())
    })
    .catch(error => ({ status: 400, error }))
})

module.exports = {
  router
}
