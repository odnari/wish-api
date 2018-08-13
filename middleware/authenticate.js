const {User} = require('./../users/model')

const authenticate = (req, res, next) => {
  const token = req.headers['x-authorization']

  User.findByToken(token)
    .then(user => {
      if (!user) return Promise.reject(new Error('User not found'))

      req.user = user
      req.token = token
      next()
    })
    .catch(error => res.send({status: 403, error: error}))
}

const authenticatedOrGuest = (req, res, next) => {
  const token = req.headers['x-authorization']

  if (token) {
    authenticate(req, res, next)
  } else {
    next()
  }
}

module.exports = {
  authenticate,
  authenticatedOrGuest
}
