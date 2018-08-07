require('dotenv').config()

const express = require('express')
const bodyParser = require('body-parser')
const path = require('path')

require('./db/mongoose')
const {mailer} = require('./mail/mailer')
const {cors} = require('./middleware/cors')
const {router: userRouter} = require('./users/routes')
const {router: wishRouter} = require('./wishes/routes')

const app = express()

// fix for chrome caching
app.disable('etag')

app.use(bodyParser.json())
app.use(cors)

app.get('/', (req, res) => res.send(`${process.env.APP_NAME} API`))
app.use('/api/users', userRouter)
app.use('/api/wishes', wishRouter)
app.use('/uploads/', express.static(path.join(__dirname, 'uploads')))

app.listen(process.env.PORT, (err) => {
  if (err) {
    console.error('[express] ' + err.message)
  } else {
    console.info('[express] running at ' + process.env.PORT)
  }
})

mailer.verify((err) => {
  if (err) {
    console.error('[mailer] ' + err.message)
  } else {
    console.info('[mailer] server is ready')
  }
})

module.exports = app
