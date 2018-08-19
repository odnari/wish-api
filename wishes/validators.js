const { check } = require('express-validator/check')

const validateUpdate = [
  check('title').optional({nullable: true}).isString().isLength({min: 3, max: 120}),
  check('description').optional({nullable: true}).isString().isLength({min: 3, max: 240}),
  check('link').optional({nullable: true}).isString().isURL().isLength({min: 3, max: 1024}),
  check('price').optional({nullable: true}).isNumeric(),
  check('currency').optional({nullable: true}).isString().isLength({min: 3, max: 3})
]

const validateCreate = [
  check('title').isString().isLength({min: 3, max: 120}),
  check('description').optional({nullable: true}).isString().isLength({min: 3, max: 240}),
  check('link').optional({nullable: true}).isString().isURL().isLength({min: 3, max: 1024}),
  check('price').optional({nullable: true}).isNumeric(),
  check('currency').optional({nullable: true}).isString().isLength({min: 3, max: 3})
]

const validateComplete = [
  check('completedReason').optional({nullable: true}).isString().isLength({min: 3, max: 120})
]

const validateReserve = [
  check('name').optional({nullable: true}).isString().isLength({min: 2, max: 120})
]

const isUserCreator = user => wish => {
  return wish._creator.toHexString() === user._id.toHexString()
}

const isUserNotCreator = user => wish => {
  return wish._creator.toHexString() !== user._id.toHexString()
}

module.exports = {
  validateUpdate,
  validateCreate,
  validateComplete,
  validateReserve,
  isUserCreator,
  isUserNotCreator
}
