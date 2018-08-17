const { validationResult } = require('express-validator/check')

module.exports = (req, res, next) => {
  const validationErrors = validationResult(req)
  if (validationErrors.isEmpty()) {
    next()
  } else {
    return res.send({status: 422, error: validationErrors.array()})
  }
}
