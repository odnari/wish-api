const express = require('express')
const router = express.Router()
const {ObjectID} = require('mongodb')
const bcrypt = require('bcryptjs')
const pullAllBy = require('lodash/pullAllBy')
const pick = require('lodash/pick')
const {User} = require('./model')
const {authenticate, authenticatedOrGuest} = require('./../middleware/authenticate')
const {upload} = require('./../middleware/upload')
const {getGoogleUser, getFacebookUser, socialize, SOCIALIZATIONS} = require('./social')

const createUserFlow = (user, res) => (
  user
    .save()
    .then(() => user.requestVerification())
    .then(() => user.authenticate())
    .then(token => res.header('X-Authorization', token).send(user.toJSON()))
)

router.post('/', (req, res) => {
  const {email, password, name} = req.body
  const user = new User({email, password, name})

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

router.post('/:id/avatar', authenticate, upload.single('avatar'), (req, res) => {
  const body = {
    style: {
      ...req.user.style
    }
  }

  if (!req.file) {
    return res.send({status: 500, error: 'Image saving error'})
  } else {
    body.style.avatar = req.file.path
  }

  if (!ObjectID.isValid(req.params.id) || (req.user._id.toHexString() !== req.params.id)) {
    return res.send({status: 503, error: 'Invalid id'})
  }

  User.findByIdAndUpdate(req.params.id, {$set: body})
    .then(user => {
      if (!user) return { status: 404, error: 'Not found' }

      return res.send(req.file.path)
    })
    .catch(error => ({ status: 400, error }))
})

router.post('/:id/background', authenticate, upload.single('background'), (req, res) => {
  const body = {
    style: {
      ...req.user.style
    }
  }

  if (!req.file) {
    return res.send({status: 500, error: 'Image saving error'})
  } else {
    body.style.background = req.file.path
  }

  if (!ObjectID.isValid(req.params.id) || (req.user._id.toHexString() !== req.params.id)) {
    return res.send({status: 503, error: 'Invalid id'})
  }

  User.findByIdAndUpdate(req.params.id, {$set: body})
    .then(user => {
      if (!user) return { status: 404, error: 'Not found' }

      return res.send(req.file.path)
    })
    .catch(error => ({ status: 400, error }))
})

router.patch('/:id', authenticate, (req, res) => {
  const body = pick(req.body, ['email', 'password', 'name', 'description', 'profiles'])

  if (!body.email.length) {
    delete body.email
  }

  if (!ObjectID.isValid(req.params.id) || (req.user._id.toHexString() !== req.params.id)) {
    return res.send({status: 503, error: 'Invalid id'})
  }

  if (!body.password.length) {
    delete body.password
    User.findByIdAndUpdate(req.params.id, {$set: body}, { new: true })
      .then(user => {
        if (!user) return { status: 404, error: 'Not found' }

        return res.send(user.toJSON())
      })
      .catch(error => ({ status: 400, error }))
  } else {
    bcrypt.genSalt(10, (_, salt) => {
      bcrypt.hash(body.password, salt, (_, hash) => {
        body.password = hash
        User.findByIdAndUpdate(req.params.id, {$set: body}, { new: true })
          .then(user => {
            if (!user) return { status: 404, error: 'Not found' }

            return res.send(user.toJSON())
          })
          .catch(error => ({ status: 400, error }))
      })
    })
  }
})

module.exports = {
  router
}
