require('dotenv').config({ path: './tests/.env.test' })
const { mongoose } = require('./../db/mongoose')
const {ObjectID} = require('mongodb')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')

const User = require('./../users/model')
const Wish = require('./../wishes/model')

const userbase = (id, name) => {
  return {
    _id: id,
    email: name + '@example.com',
    password: 'userTwoPass',
    name,
    username: name,
    tokens: [{
      access: 'auth',
      token: jwt.sign({_id: id, access: 'auth'}, process.env.SECRET).toString()
    }]
  }
}

const wishbase = (wid, uid) => {
  return {
    _id: wid,
    title: 'title_' + Date.now(),
    description: 'desc one',
    _creator: uid
  }
}

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

const populateWishes = (wishes) => {
  return Promise.all(wishes.map(w => {
    const wish = new Wish(w)
    return wish.save()
  }))
}

const datagen = () => {
  User.deleteMany({})
    .then(() => {
      Wish.deleteMany({})
        .then(() => {
          for (let i = 0; i < 500; i++) {
            console.log('[', Date.now(), ']', 'seed user ', i)
            const userid = new ObjectID()
            const userdata = userbase(userid, 'user' + i)
            seedUser(userdata)
              .then(() => {
                console.log('[', Date.now(), ']', 'seeded user ', i)
                const wishes = []
                console.log('[', Date.now(), ']', 'seed wish for user ', i)
                for (let j = 0; j < 100; j++) {
                  const wishid = new ObjectID()
                  const wishdata = wishbase(wishid, userid)
                  wishes.push(wishdata)
                }
                populateWishes(wishes)
                  .then(() => console.log('[', Date.now(), ']', 'seeded wishes for user ', i))
              })
              .catch(err => console.log(err))
          }
        })
    })
}

datagen()
