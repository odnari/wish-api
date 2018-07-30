const mongoose = require('mongoose')
const validator = require('validator')

const WishSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    minlength: 3,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  link: {
    type: String,
    trim: true,
    validate: {
      validator: (value) => {
        return value ? validator.isURL(value) : true
      },
      message: '{VALUE} is not a valid url'
    }
  },
  price: {
    type: String,
    validate: {
      validator: (value) => {
        return value ? validator.isDecimal(value) : true
      },
      message: '{VALUE} is not a valid price'
    }
  },
  currency: {
    type: String,
    trim: true
  },
  deleted: {
    type: Boolean,
    default: false
  },
  completed: {
    type: Boolean,
    default: false
  },
  completedReason: {
    type: String,
    trim: true,
    minlength: 4,
    default: null
  },
  reserved: {
    type: Boolean,
    default: false
  },
  reservedBy: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },
  reservedByName: {
    type: String
  },
  _creator: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
})

const Wish = mongoose.model('Wish', WishSchema)

module.exports = {Wish}
