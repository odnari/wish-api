const {mailer} = require('./mail/mailer')
const app = require('./app')

app.listen(process.env.PORT, (err) => {
  if (err) {
    console.error('[express] ' + err.message)
  } else {
    console.info('[express] running at ' + process.env.PORT)
  }
})

if (process.env.NODE_ENV !== 'test') {
  mailer.verify((err) => {
    if (err) {
      console.error('[mailer] ' + err.message)
    } else {
      console.info('[mailer] server is ready')
    }
  })
}
