const express = require('express')
const router = express.Router()
const pullAllBy = require('lodash/pullAllBy')
const {User} = require('./model')
const {authenticate} = require('./../middleware/authenticate')
const socialAuth = require('./social')

router.post('/', (req, res) => {
  const {email, password} = req.body
  const user = new User({email, password})

  user
    .save()
    .then(user => user.authenticate())
    .then(() => user.requestVerification())
    .then(token => res.header('X-Authorization', token).send(user.toJSON()))
    .catch(error => res.send({status: 400, error: error.message}))
})

router.post('/google', (req, res) => {
  const {token} = req.body
  socialAuth.verifyGoogleAuth(token)
    .then(payload => ({
      email: payload['email'],
      verified: payload['email_verified'],
      password: token.slice(0, 16),
      social: {
        google: payload['sub']
      }
    }))
    .then(userInfo => {
      return User.findOne({email: userInfo.email})
        .then(user => {
          if (!user) return Promise.reject(new Error('User not found'))

          user.social.google = userInfo.social.google
          return user
        })
        .catch(() => new User(userInfo))
    })
    .then(user => user.save()
      .then(user => user.authenticate())
      .then(() => user.requestVerification())
      .then(token => res.header('X-Authorization', token).send(user.toJSON()))
    )
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
