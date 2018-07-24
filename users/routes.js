const express = require('express')
const router = express.Router()
const pullAllBy = require('lodash/pullAllBy')
const {User} = require('./model')
const {authenticate} = require('./../middleware/authenticate')
const {getGoogleUser, getFacebookUser, socialize, SOCIALIZATIONS} = require('./social')

const createUserFlow = (user, res) => (
  user
    .save()
    .then(() => user.requestVerification())
    .then(() => user.authenticate())
    .then(token => res.header('X-Authorization', token).send(user.toJSON()))
)

router.post('/', (req, res) => {
  const {email, password} = req.body
  const user = new User({email, password})

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

router.get('/me', authenticate, (req, res) => {
  res.send(req.user.toJSON())
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

module.exports = {
  router
}
