const nodemailer = require('nodemailer')
const path = require('path')
const hbs = require('nodemailer-express-handlebars')
const handlebars = require('express-handlebars')

const config = {
  pool: true,
  host: process.env.EMAIL_SERVER,
  port: process.env.EMAIL_PORT,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  },
  tls: {
    ciphers: 'SSLv3'
  }
}

const mailer = nodemailer.createTransport(config)
mailer.use('compile', hbs({
  viewEngine: handlebars.create(),
  viewPath: path.resolve(__dirname, './templates')
}))

module.exports = {mailer}
