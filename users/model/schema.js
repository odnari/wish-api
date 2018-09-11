const mongoose = require('mongoose')
const validator = require('validator')

module.exports = new mongoose.Schema({
  username: {
    type: String,
    trim: true,
    require: true,
    unique: true,
    minlength: 3
  },
  name: {
    type: String,
    trim: true,
    require: false
  },
  email: {
    type: String,
    require: true,
    minlength: 1,
    trim: true,
    unique: true,
    validate: {
      validator: validator.isEmail,
      message: '{VALUE} is not a valid email'
    }
  },
  description: {
    type: String,
    maxlength: 120,
    trim: true
  },
  password: {
    type: String,
    require: true,
    minlength: 6
  },
  verified: {
    type: Boolean,
    default: false
  },
  profiles: {
    facebook: {
      type: String,
      default: null
    },
    twitter: {
      type: String,
      default: null
    }
  },
  social: {
    google: {
      type: String,
      default: null
    },
    facebook: {
      type: String,
      default: null
    }
  },
  style: {
    avatar: {
      type: String,
      default: null
    },
    background: {
      type: String,
      default: null
    }
  },
  tokens: [
    {
      access: {
        type: String,
        required: true
      },
      token: {
        type: String,
        required: true
      }
    }
  ]
})
