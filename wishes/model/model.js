const mongoose = require('mongoose')
const WishSchema = require('./schema')

module.exports = mongoose.model('Wish', WishSchema)
