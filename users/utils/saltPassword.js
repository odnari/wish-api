const bcrypt = require('bcryptjs')

function saltPassword (password) {
  return new Promise((resolve, reject) => {
    bcrypt.genSalt(10, (error, salt) => {
      if (error) {
        reject(error)
      } else {
        bcrypt.hash(password, salt, (hashError, hash) => {
          if (hashError) {
            reject(hashError)
          } else {
            resolve(hash)
          }
        })
      }
    })
  })
}

module.exports = saltPassword
