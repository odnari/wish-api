const {mailer} = require('./mailer')

const baseMessage = {
  from: process.env.EMAIL_FROM,
  text: 'Plaintext version of the message'
}

const sendEmailVerificationMail = (to, { token }) => {
  const message = Object.assign({}, baseMessage, {
    to,
    subject: `${process.env.APP_NAME}: E-mail verification`,
    template: 'email_verification',
    context: {
      appName: process.env.APP_NAME,
      homepage_url: `${process.env.BASE_URL}:${process.env.PORT}/`,
      verify_token_url: `${process.env.BASE_URL}:${process.env.PORT}/api/users/verify/${token}`
    }
  })

  return mailer.sendMail(message)
}

module.exports = {
  sendEmailVerificationMail
}
