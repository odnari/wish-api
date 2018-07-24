const {OAuth2Client} = require('google-auth-library')
const https = require('https')
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

const getFacebookUser = (token) => {
  const userRequest = new Promise((resolve, reject) => {
    const req = https.get(process.env.FACEBOOK_ME_URL + token, (res) => {
      if (res.statusCode !== 200) reject(new Error(res.statusCode))

      let body = ''

      res.on('data', chunk => {
        body += chunk
      })

      res.on('end', () => {
        resolve(JSON.parse(body))
      })
    })

    req.on('error', reject)
    req.end()
  })

  return userRequest
    .then(payload => ({
      email: payload['email'],
      verified: true,
      password: token.slice(0, 16),
      social: {
        facebook: payload['id']
      }
    }))
}

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
  getFacebookUser,
  socialize,
  SOCIALIZATIONS
}
