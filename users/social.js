const {OAuth2Client} = require('google-auth-library')
const https = require('https')
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
    .then(payload => {
      const nameMatch = payload['email'].match(/^([^@]*)@/)
      const username = nameMatch ? nameMatch[1] : `u${token.slice(8, 32)}`

      return ({
        email: payload['email'],
        verified: payload['email_verified'],
        name: payload['name'],
        username: username,
        password: token.slice(0, 16),
        social: {
          google: payload['sub']
        }
      })
    })
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
      name: payload['name'],
      social: {
        facebook: payload['id']
      }
    }))
}

module.exports = {
  getGoogleUser,
  getFacebookUser,
  SOCIALIZATIONS
}
