function cors (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, X-Authorization')
  res.header('Access-Control-Expose-Headers', 'X-Authorization')
  res.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE')
  next()
}

module.exports = {cors}
