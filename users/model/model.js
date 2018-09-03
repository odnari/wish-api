const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const pick = require('lodash/pick')
const pullAllBy = require('lodash/pullAllBy')
const mailHelper = require('./../../mail/helper')
const UserSchema = require('./schema')
const saltPassword = require('./../utils/saltPassword')

UserSchema.methods.toJSON = function (isPublic) {
  let fields = ['_id', 'verified', 'name', 'username', 'profiles', 'description', 'style']

  if (!isPublic) {
    fields = [...fields, 'email']
  }

  return pick(this, fields)
}

UserSchema.statics.saltPassword = saltPassword
UserSchema.methods.saltPassword = function () {
  const user = this

  return saltPassword(user.password)
    .then((salted) => {
      user.password = salted
      return user.save().then(() => user)
    })
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

UserSchema.methods.removeToken = function (token) {
  return this.update({
    $pull: {
      tokens: {token}
    }
  }, {multi: true})
}

UserSchema.statics.verifyByToken = function (token) {
  return this.findByToken(token)
    .then((user) => {
      if (!user) throw new Error('User not found')

      user.verified = true
      user.tokens = pullAllBy(user.tokens, [{token}], 'token')

      return user.save()
    })
}

UserSchema.statics.socialize = function (userInfo, socialization) {
  const User = this

  return saltPassword(userInfo.password)
    .then(salted => {
      return {
        ...userInfo,
        password: salted
      }
    })
    .then(userSec => {
      return User.findOne({email: userSec.email})
        .then(user => {
          if (!user) return Promise.reject(new Error('User not found'))

          user.social[socialization] = userSec.social[socialization]
          if (!user.verified) user.verified = userSec.verified
          if (!user.name && userSec.name) user.name = userSec.name
          if (!user.password && userSec.password) user.password = userSec.password

          return user
        })
        .catch(() => new User(userSec))
    })
}

UserSchema.methods.updateStyle = function (prop, filePath) {
  this.style[prop] = filePath
  return this.save()
    .then(user => {
      if (!user) throw new Error('Not found')

      return user.toJSON()
    })
}

module.exports = mongoose.model('User', UserSchema)
