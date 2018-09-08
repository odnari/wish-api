const {ObjectID} = require('mongodb')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')

const User = require('./../users/model')
const Wish = require('./../wishes/model')

const userOneId = new ObjectID()
const userTwoId = new ObjectID()
const users = [
  {
    _id: userOneId,
    email: 'andrew@example.com',
    password: 'userOnePass',
    name: 'userone',
    username: 'userone',
    tokens: [
      {
        access: 'auth',
        token: jwt.sign({_id: userOneId, access: 'auth'}, process.env.SECRET).toString()
      }, {
        access: 'email_verify',
        token: jwt.sign({_id: userOneId, access: 'email_verify'}, process.env.SECRET).toString()
      }
    ]
  }, {
    _id: userTwoId,
    email: 'jen@example.com',
    password: 'userTwoPass',
    name: 'usertwo',
    username: 'usertwo',
    tokens: [{
      access: 'auth',
      token: jwt.sign({_id: userTwoId, access: 'auth'}, process.env.SECRET).toString()
    }]
  }
]

const wishId1 = new ObjectID()
const wishId2 = new ObjectID()
const wishId3 = new ObjectID()
const wishId4 = new ObjectID()

const wishes = [
  {
    _id: wishId1,
    title: 'title one',
    description: 'desc one',
    _creator: userOneId,
    creatorName: 'creator one'
  },
  {
    _id: wishId2,
    title: 'title one',
    description: 'desc one',
    _creator: userOneId,
    creatorName: 'creator one'
  },
  {
    _id: wishId3,
    title: 'title one',
    description: 'desc one',
    _creator: userTwoId,
    creatorName: 'creator one'
  },
  {
    _id: wishId4,
    title: 'title one',
    description: 'desc one',
    _creator: userOneId,
    creatorName: 'creator one',
    reserved: true,
    reservedBy: userTwoId
  }
]

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
  User.deleteMany({}).then(() => {
    return Promise.all(users.map(u => {
      return seedUser(u)
    }))
  }).then(() => done())
}

const populateWishes = (done) => {
  Wish.deleteMany({}).then(() => {
    return Promise.all(wishes.map(w => {
      const wish = new Wish(w)
      return wish.save()
    }))
  }).then(() => done())
}

module.exports = {users, wishes, populateUsers, populateWishes}
