const { usernameValidation } = require('../users/validators')

module.exports = (req, res, next) => {
  if (usernameValidation(req.params.username)) {
    next()
  } else {
    return res.send({status: 422, error: 'Invalid username'})
  }
}
