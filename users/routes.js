const express = require('express')
const router = express.Router()
const {ObjectID} = require('mongodb')
const { check } = require('express-validator/check')
const pick = require('lodash/pick')
const User = require('./model')
const {authenticate, authenticatedOrGuest} = require('./../middleware/authenticate')
const {upload} = require('./../middleware/upload')
const validationErrorsHandler = require('../middleware/validationErrorsHandler')
const validateId = require('../middleware/validateId')
const {getGoogleUser, getFacebookUser, SOCIALIZATIONS} = require('./social')

const authenticateAndSendToken = (user, res) => (
  user.authenticate()
    .then(token => res.header('X-Authorization', token).send(user.toJSON()))
)

const createAndLoginUser = (user, res) => (
  user
    .save()
    .then(() => authenticateAndSendToken(user, res))
)

const updateUserStyle = (user, prop, file) => {
  if (!file) {
    return Promise.reject(new Error('Image saving error'))
  } else {
    return user.updateStyle(prop, file.path)
  }
}

router.get('/:id', validateId, authenticatedOrGuest, (req, res) => {
  const userId = req.params.id

  User.findById(userId)
    .then(user => {
      if (!user) throw new Error('User not found')

      res.send(user.toJSON(true))
    })
    .catch(error => res.send({status: 400, error: error.message}))
})

router.patch('/:id', validateId, authenticate, [
  check('email').optional({nullable: true}).isEmail().isLength({min: 3, max: 120}),
  check('password').optional({nullable: true}).isString().isLength({min: 6, max: 128}),
  check('name').optional({nullable: true}).isString().isLength({min: 2, max: 120}),
  check('description').optional({nullable: true}).isString().isLength({min: 3, max: 240}),
  check('profiles').optional({nullable: true})
], validationErrorsHandler, (req, res) => {
  const body = pick(req.body, ['email', 'password', 'name', 'description', 'profiles'])

  Object.keys(body).forEach(key => {
    if (body[key] instanceof String && !body[key].length) {
      delete body[key]
    }
  })

  if (req.user._id.toHexString() !== req.params.id) {
    return res.send({status: 403, error: 'No access'})
  }

  User.findByIdAndUpdate(req.params.id, {$set: body}, { new: true })
    .then(user => {
      if (body.password) {
        // todo: salt before saving (what if db will shutdown after save and before salt?)
        return user.saltPassword()
      } else {
        return user
      }
    })
    .then(user => user.toJSON())
    .then(jsonUser => res.send(jsonUser))
    .catch(error => ({ status: 400, error }))
})

router.post('/:id/avatar', validateId, authenticate, upload.single('avatar'), (req, res) => {
  updateUserStyle(req.user, 'avatar', req.file)
    .catch(error => res.send({ status: 400, error }))
})

router.post('/:id/background', validateId, authenticate, upload.single('background'), (req, res) => {
  updateUserStyle(req.user, 'background', req.file)
    .catch(error => res.send({ status: 400, error }))
})

router.post('/', [
  check('email').isEmail().isLength({min: 3, max: 120}),
  check('password').isString().isLength({min: 6, max: 128}),
  check('name').optional({nullable: true}).isString().isLength({min: 2, max: 120})
], validationErrorsHandler, (req, res) => {
  const {email, password, name} = req.body
  User.saltPassword(password)
    .then(salted => new User({email, password: salted, name}))
    .then(user => user.save().then(() => user))
    .then(user => user.requestVerification().then(() => user))
    .then(user => authenticateAndSendToken(user, res))
    .catch(error => res.send({status: 400, error: error.message}))
})

// tested
router.post('/google', [
  check('token').isString()
], validationErrorsHandler, (req, res) => {
  const {token} = req.body

  getGoogleUser(token)
    .then(userInfo => User.socialize(userInfo, SOCIALIZATIONS.google))
    .then(user => createAndLoginUser(user, res))
    .catch(error => res.send({status: 400, error: error.message}))
})

// tested
router.post('/facebook', [
  check('accessToken').isString()
], validationErrorsHandler, (req, res) => {
  const {accessToken: token} = req.body

  getFacebookUser(token)
    .then(userInfo => User.socialize(userInfo, SOCIALIZATIONS.facebook))
    .then(user => createAndLoginUser(user, res))
    .catch(error => res.send({status: 400, error: error.message}))
})

// tested
router.post('/login', [
  check('email').isEmail().isLength({min: 3, max: 120}),
  check('password').isString().isLength({min: 6, max: 128})
], validationErrorsHandler, (req, res) => {
  const {email, password} = req.body

  User.findByCreds(email, password)
    .then(user => authenticateAndSendToken(user, res))
    .catch(error => res.send({status: 400, error: error.message}))
})

// tested
router.post('/logout', authenticate, (req, res) => {
  req.user.removeToken(req.token)
    .then(() => res.status(200).send())
    .catch(() => res.status(400).send())
})

// tested
router.post('/me/verify', authenticate, (req, res) => {
  req.user.requestVerification()
    .then(() => res.send({status: 200}))
    .catch(error => res.send({status: 400, error: error.message}))
})

// tested
router.get('/verify/:token', (req, res) => {
  const token = req.params.token

  User.verifyByToken(token)
    .then(user => authenticateAndSendToken(user, res))
    .catch(error => res.send({status: 403, error}))
})

module.exports = {
  router
}
