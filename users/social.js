const {OAuth2Client} = require('google-auth-library')
const {User} = require('./model')
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

const SOCIALIZATIONS = {
  google: 'google',
  facebook: 'facebook'
}

const verifyGoogleUser = (token) => (
  client
    .verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID
    })
    .then(ticket => ticket.getPayload())
)

const getGoogleUser = (token) => (
  verifyGoogleUser(token)
    .then(payload => ({
      email: payload['email'],
      verified: payload['email_verified'],
      password: token.slice(0, 16),
      social: {
        google: payload['sub']
      }
    }))
)

const socialize = (userInfo, socialization) => (
  User.findOne({email: userInfo.email})
    .then(user => {
      if (!user) return Promise.reject(new Error('User not found'))

      user.social[socialization] = userInfo.social[socialization]
      return user
    })
    .catch(() => new User(userInfo))
)

module.exports = {
  getGoogleUser,
  socialize,
  SOCIALIZATIONS
}
