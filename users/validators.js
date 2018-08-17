const { check } = require('express-validator/check')

const validateUpdate = [
  check('email').optional({nullable: true}).isEmail().isLength({min: 3, max: 120}),
  check('password').optional({nullable: true}).isString().isLength({min: 6, max: 128}),
  check('name').optional({nullable: true}).isString().isLength({min: 2, max: 120}),
  check('description').optional({nullable: true}).isString().isLength({min: 3, max: 240}),
  check('profiles').optional({nullable: true})
]

const validateCreate = [
  check('email').isEmail().isLength({min: 3, max: 120}),
  check('password').isString().isLength({min: 6, max: 128}),
  check('name').optional({nullable: true}).isString().isLength({min: 2, max: 120})
]

const validateGoogle = [
  check('token').isString()
]

const validateFacebook = [
  check('accessToken').isString()
]

const validateLogin = [
  check('email').isEmail().isLength({min: 3, max: 120}),
  check('password').isString().isLength({min: 6, max: 128})
]

module.exports = {
  validateUpdate,
  validateCreate,
  validateFacebook,
  validateGoogle,
  validateLogin
}
