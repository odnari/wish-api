const {authenticate, authenticatedOrGuest} = require('./authenticate')

module.exports = {
  authenticate,
  authenticatedOrGuest,
  cors: require('./cors'),
  upload: require('./upload'),
  validateId: require('./validateId'),
  validationErrorsHandler: require('./validationErrorsHandler')
}
