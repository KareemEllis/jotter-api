const bcrypt = require('bcrypt')
const usersRouter = require('express').Router()
const User = require('../models/user')
const Note = require('../models/note')

usersRouter.post('/', async (request, response) => {
  const { username, name, password } = request.body

  if(!password){
    return response.status(400).json({ error: 'Password required' })
  }

  const saltRounds = 10
  const passwordHash = await bcrypt.hash(password, saltRounds)

  const user = new User({
    username,
    name,
    passwordHash,
  })

  const savedUser = await user.save()

  const starterNote = new Note({
    title: 'Welcome!',
    details: 'Thank you for using jotter.',
    pinned: true,
    labels: [],
    backgroundColor: '#FFFFFF',
    user: savedUser._id
  })

  await starterNote.save()

  response.status(201).json(savedUser)
})

usersRouter.get('/', async (request, response) => {
  const users = await User.find({})
  response.json(users)
})

module.exports = usersRouter