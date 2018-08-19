const mongoose = require('mongoose')
const WishSchema = require('./schema')

WishSchema.statics.updateByIdWithPredicate = function (predicate, id, body) {
  const Wish = this

  return Wish.findById(id)
    .then((wish) => {
      if (!wish) return Promise.reject(new Error('Not found'))

      const predicateResult = predicate(wish)
      if (!predicateResult) return Promise.reject(new Error(predicateResult.error))

      wish.set(body)

      return new Promise((resolve, reject) => {
        wish.save((err, updatedWish) => {
          if (err) {
            reject(err)
          } else {
            resolve(updatedWish)
          }
        })
      })
    })
}

module.exports = mongoose.model('Wish', WishSchema)
