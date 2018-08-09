const {ObjectID} = require('mongodb')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')

const {User} = require('./../users/model')

const userOneId = new ObjectID()
const userTwoId = new ObjectID()
const users = [{
  _id: userOneId,
  email: 'andrew@example.com',
  password: 'userOnePass',
  tokens: [{
    access: 'auth',
    token: jwt.sign({_id: userOneId, access: 'auth'}, process.env.SECRET).toString()
  }]
}, {
  _id: userTwoId,
  email: 'jen@example.com',
  password: 'userTwoPass',
  tokens: [{
    access: 'auth',
    token: jwt.sign({_id: userTwoId, access: 'auth'}, process.env.SECRET).toString()
  }]
}]

const seedUser = (seed) => {
  return new Promise((resolve, reject) => {
    bcrypt.genSalt(10, (_, salt) => {
      bcrypt.hash(seed.password, salt, (_, hash) => {
        const user = new User({
          ...seed,
          password: hash
        })
        user.save().then(resolve).catch(reject)
      })
    })
  })
}

const populateUsers = (done) => {
  User.remove({}).then(() => {
    const userOne = seedUser(users[0])
    const userTwo = seedUser(users[1])

    return Promise.all([userOne, userTwo])
  }).then(() => done())
}

module.exports = {users, populateUsers}
