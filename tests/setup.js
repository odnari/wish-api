const { mongoose, cachegoose } = require('./../db/mongoose')

afterAll(() => {
  mongoose.connection.close()
  cachegoose.clearCache()
})
