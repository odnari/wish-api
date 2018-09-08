const mongoose = require('mongoose')
const cachegoose = require('cachegoose')

mongoose.Promise = global.Promise
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true })

cachegoose(mongoose, {
  engine: 'redis',
  port: process.env.REDIS_PORT,
  host: process.env.REDIS_ADDR
})

module.exports = {
  mongoose,
  cachegoose
}
