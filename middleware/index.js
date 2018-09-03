const {authenticate, authenticatedOrGuest} = require('./authenticate')

module.exports = {
  authenticate,
  authenticatedOrGuest,
  cors: require('./cors'),
  upload: require('./upload'),
  validateId: require('./validateId'),
  validateUsername: require('./validateUsername'),
  validationErrorsHandler: require('./validationErrorsHandler')
}
