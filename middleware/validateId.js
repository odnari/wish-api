const {ObjectID} = require('mongodb')

module.exports = (req, res, next) => {
  if (ObjectID.isValid(req.params.id)) {
    next()
  } else {
    return res.send({status: 422, error: 'Invalid id'})
  }
}
