require('dotenv').config()

const express = require('express')
const bodyParser = require('body-parser')
const path = require('path')
const https = require('https')
const fs = require('fs')

// eslint-disable-next-line no-unused-vars
const {mongoose} = require('./db/mongoose')
const {mailer} = require('./mail/mailer')
const {router: userRouter} = require('./users/routes')
const {router: wishRouter} = require('./wishes/routes')

const app = express()

app.use(bodyParser.json())
app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', 'http://localhost:8080')
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, X-Authorization')
  next()
})
app.use('/static', express.static(path.join(__dirname, 'public')))

app.get('/', (req, res) => res.send(`${process.env.APP_NAME} API`))
app.use('/api/users', userRouter)
app.use('/api/wishes', wishRouter)

if (process.env.ENV === 'development') {
  const options = {
    cert: fs.readFileSync('./cert.pem'),
    key: fs.readFileSync('./key.pem'),
    passphrase: '12qwaszx'
  }

  app.listen(process.env.PORT + 1, (err) => {
    if (err) {
      console.error('[express] ' + err.message)
    } else {
      console.info('[express] running at ' + process.env.PORT)
    }
  })

  https.createServer(options, app).listen(process.env.PORT)
} else {
  app.listen(process.env.PORT, (err) => {
    if (err) {
      console.error('[express] ' + err.message)
    } else {
      console.info('[express] running at ' + process.env.PORT)
    }
  })
}

mailer.verify((err) => {
  if (err) {
    console.error('[express] ' + err.message)
  } else {
    console.info('[express] server is ready')
  }
})

module.exports = app
