const {OAuth2Client} = require('google-auth-library')
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

const verifyGoogleAuth = (token) => {
  return client.verifyIdToken({
    idToken: token,
    audience: process.env.GOOGLE_CLIENT_ID
  }).then(ticket => ticket.getPayload())
}

module.exports = {
  verifyGoogleAuth
}
