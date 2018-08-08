const mongoose = require('mongoose')
const validator = require('validator')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const pick = require('lodash/pick')
const mailHelper = require('./../mail/helper')

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    require: true,
    minlength: 3
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

UserSchema.methods.toJSON = function (isPublic) {
  let fields = ['verified', 'name', 'profiles', 'description', 'style']

  if (!isPublic) {
    fields = [...fields, 'email', '_id']
  }

  return pick(this, fields)
}

UserSchema.methods.authenticate = function () {
  const access = 'auth'
  const token = jwt.sign({_id: this._id.toHexString(), access}, process.env.SECRET, {
    expiresIn: process.env.TOKEN_EXP
  })

  this.tokens = this.tokens.concat([{access, token}])
  return this.save().then(() => token)
}

UserSchema.statics.findByToken = function (token) {
  let decoded

  try {
    decoded = jwt.verify(token, process.env.SECRET)
  } catch (e) {
    return Promise.reject(e)
  }

  return this.findOne({
    _id: decoded._id,
    'tokens.token': token,
    'tokens.access': decoded.access
  })
}

UserSchema.methods.removeToken = function (token) {
  return this.update({
    $pull: {
      tokens: {token}
    }
  })
}

UserSchema.statics.findByCreds = function (email, password) {
  return this.findOne({email})
    .then(user => {
      if (!user) return Promise.reject(new Error('Not found'))

      return new Promise((resolve, reject) => {
        bcrypt.compare(password, user.password, (err, result) => {
          if (result) {
            resolve(user)
          } else if (err) {
            reject(err)
          } else {
            reject(new Error('Wrong password'))
          }
        })
      })
    })
}

UserSchema.methods.requestVerification = function () {
  if (this.verified) return Promise.resolve()

  const access = 'email_verify'
  const token = jwt.sign({_id: this._id.toHexString(), access}, process.env.SECRET, {
    expiresIn: process.env.EMAIL_TOKEN_EXP
  })

  this.tokens = this.tokens.concat([{token, access}])
  return this.save().then(() => mailHelper.sendEmailVerificationMail(this.email, {token}))
}

const User = mongoose.model('User', UserSchema)

module.exports = {User}
