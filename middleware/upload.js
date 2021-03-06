const multer = require('multer')
const crypto = require('crypto')
const path = require('path')

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, process.env.UPLOADS_FOLDER)
  },
  filename: function (req, file, cb) {
    crypto.pseudoRandomBytes(16, (_, raw) => {
      cb(null, raw.toString('hex') + Date.now() + path.extname(file.originalname))
    })
  }
})

const upload = multer({
  limits: {
    fileSize: 2 * 1024 * 1024
  },
  storage: storage
})

module.exports = upload
