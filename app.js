require('dotenv').config()

const express = require('express')
const bodyParser = require('body-parser')

require('./db/mongoose')
const cors = require('./middleware/cors')
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

module.exports = app
