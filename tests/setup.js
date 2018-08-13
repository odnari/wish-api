const { mongoose } = require('./../db/mongoose')

afterAll(() => {
  mongoose.connection.close()
})
