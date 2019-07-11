const express = require('express')
const router = express.Router()
const pick = require('lodash/pick')
const User = require('./model')
const { getGoogleUser, getFacebookUser, SOCIALIZATIONS } = require('./social')
const { validateCreate, validateUpdate, validateGoogle, validateFacebook, validateLogin } = require('./validators')
const {
  validateId,
  validationErrorsHandler,
  authenticate,
  authenticatedOrGuest,
  upload,
  validateUsername
} = require('../middleware')

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
    return user.updateStyle(prop, `${process.env.UPLOADS_PATH}/${file.filename}`)
  }
}

router.get('/:username', validateUsername, authenticatedOrGuest, (req, res) => {
  User.find({ username: req.params.username })
    .cache(+process.env.CACHE_USER_TIME, `u-${req.params.username}`)
    .then(users => {
      if (!users || !users.length) throw new Error('User not found')

      res.send(users[0].toJSON(true))
    })
    .catch(error => res.send({ status: 400, error: error.message }))
})

router.patch('/:id', validateId, authenticate, validateUpdate, validationErrorsHandler, (req, res) => {
  const body = pick(req.body, ['email', 'password', 'name', 'username', 'description', 'profiles'])

  Object.keys(body).forEach(key => {
    if (body[key] instanceof String && !body[key].length) {
      delete body[key]
    }
  })

  if (req.user._id.toHexString() !== req.params.id) {
    return res.send({ status: 403, error: 'No access' })
  }

  User.findByIdAndUpdate(req.params.id, { $set: body }, { new: true })
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
    .then(user => res.send(user))
    .catch(error => res.send({ status: 400, error }))
})

router.post('/:id/background', validateId, authenticate, upload.single('background'), (req, res) => {
  updateUserStyle(req.user, 'background', req.file)
    .then(user => res.send(user))
    .catch(error => res.send({ status: 400, error }))
})

router.post('/', validateCreate, validationErrorsHandler, (req, res) => {
  const { email, password, username } = req.body
  User.saltPassword(password)
    .then(salted => new User({ email, password: salted, username }))
    .then(user => user.save().then(() => user))
    .then(user => user.requestVerification().then(() => user))
    .then(user => authenticateAndSendToken(user, res))
    .catch(error => res.send({ status: 400, error: error.message }))
})

// tested
router.post('/google', validateGoogle, validationErrorsHandler, (req, res) => {
  const { token } = req.body

  getGoogleUser(token)
    .then(userInfo => User.socialize(userInfo, SOCIALIZATIONS.google))
    .then(user => createAndLoginUser(user, res))
    .catch(error => res.send({ status: 400, error: error.message }))
})

// tested
router.post('/facebook', validateFacebook, validationErrorsHandler, (req, res) => {
  const { accessToken: token } = req.body

  getFacebookUser(token)
    .then(userInfo => User.socialize(userInfo, SOCIALIZATIONS.facebook))
    .then(user => createAndLoginUser(user, res))
    .catch(error => res.send({ status: 400, error: error.message }))
})

// tested
router.post('/login', validateLogin, validationErrorsHandler, (req, res) => {
  const { email, password } = req.body

  User.findByCreds(email, password)
    .then(user => authenticateAndSendToken(user, res))
    .catch(error => res.send({ status: 400, error: error.message }))
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
    .then(() => res.send({ status: 200 }))
    .catch(error => res.send({ status: 400, error: error.message }))
})

// tested
router.get('/verify/:token', (req, res) => {
  const token = req.params.token

  User.verifyByToken(token)
    .then(() => res.redirect(302, process.env.CLIENT_URL))
    .catch(error => res.send({ status: 403, error }))
})

module.exports = {
  router
}
