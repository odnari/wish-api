function cors (req, res, next) {
  res.header('Access-Control-Allow-Origin', process.env.CORS_ORIGIN)
  res.header('Access-Control-Allow-Headers', process.env.CORS_ALLOW_HEADERS)
  res.header('Access-Control-Expose-Headers', process.env.CORS_EXPOSE_HEADERS)
  res.header('Access-Control-Allow-Methods', process.env.CORS_ALLOW_METHODS)
  next()
}

module.exports = {cors}
