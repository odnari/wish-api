const express = require('express')
const router = express.Router()
const {ObjectID} = require('mongodb')
const bcrypt = require('bcryptjs')
const pick = require('lodash/pick')
const {User} = require('./model')
const {authenticate, authenticatedOrGuest} = require('./../middleware/authenticate')
const {upload} = require('./../middleware/upload')
const {getGoogleUser, getFacebookUser, socialize, SOCIALIZATIONS} = require('./social')

const authFlow = (user, res) => (
  user.authenticate()
    .then(token => res.header('X-Authorization', token).send(user.toJSON()))
)

const createUserFlow = (user, res) => (
  user
    .save()
    .then(() => user.requestVerification())
    .then(() => authFlow(user, res))
)

const updateUserStyle = (user, prop, file) => {
  if (!file) {
    return Promise.reject(new Error('Image saving error'))
  } else {
    return user.updateStyle(prop, file.path)
  }
}

// tested
router.get('/:id', authenticatedOrGuest, (req, res) => {
  const userId = req.params.id

  if (!ObjectID.isValid(userId)) {
    return res.send({status: 503, error: 'Invalid id'})
  }

  User.findById(userId)
    .then(user => {
      if (!user) throw new Error('User not found')

      res.send(user.toJSON(true))
    })
    .catch(error => res.send({status: 400, error: error.message}))
})

// tested
router.patch('/:id', authenticate, (req, res) => {
  const body = pick(req.body, ['email', 'password', 'name', 'description', 'profiles'])

  Object.keys(body).forEach(key => {
    if (body[key] instanceof String && !body[key].length) {
      delete body[key]
    }
  })

  if (!ObjectID.isValid(req.params.id) || (req.user._id.toHexString() !== req.params.id)) {
    return res.send({status: 403, error: 'No access'})
  }

  if (!body.password) {
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

// not testable TODO: handle errors on api side
router.post('/:id/avatar', authenticate, upload.single('avatar'), (req, res) => {
  updateUserStyle(req.user, 'avatar', req.file)
    .catch(error => res.send({ status: 400, error }))
})

// not testable TODO: handle errors on api side
router.post('/:id/background', authenticate, upload.single('background'), (req, res) => {
  updateUserStyle(req.user, 'background', req.file)
    .catch(error => res.send({ status: 400, error }))
})

// tested
router.post('/', (req, res) => {
  const {email, password, name} = req.body

  bcrypt.genSalt(10, (_, salt) => {
    bcrypt.hash(password, salt, (_, hash) => {
      const user = new User({email, password: hash, name})

      createUserFlow(user, res)
        .catch(error => res.send({status: 400, error: error.message}))
    })
  })
})

// not testable
router.post('/google', (req, res) => {
  const {token} = req.body

  getGoogleUser(token)
    .then(userInfo => socialize(userInfo, SOCIALIZATIONS.google))
    .then(user => createUserFlow(user, res))
    .catch(error => res.send({status: 400, error: error.message}))
})

// not testable
router.post('/facebook', (req, res) => {
  const {accessToken: token} = req.body

  getFacebookUser(token)
    .then(userInfo => socialize(userInfo, SOCIALIZATIONS.facebook))
    .then(user => createUserFlow(user, res))
    .catch(error => res.send({status: 400, error: error.message}))
})

// tested
router.post('/login', (req, res) => {
  const {email, password} = req.body

  User.findByCreds(email, password)
    .then(user => authFlow(user, res))
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
    .then(user => authFlow(user, res))
    .catch(error => res.send({status: 403, error}))
})

module.exports = {
  router
}
