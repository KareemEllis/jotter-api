const notesRouter = require('express').Router()
const Note = require('../models/note')
const User = require('../models/user')

const jwt = require('jsonwebtoken')

const getTokenFrom = request => {
  const authorization = request.get('authorization')
  if (authorization && authorization.startsWith('Bearer ')) {
    return authorization.replace('Bearer ', '')
  }
  return null
}

// Get all notes for specific user
notesRouter.get('/', async (request, response) => {
  const decodedToken = jwt.verify(getTokenFrom(request), process.env.SECRET)
  if (!decodedToken.id) {
    return response.status(401).json({ error: 'token invalid' })
  }

  const notes = await Note.find({ user: decodedToken.id })
  response.json(notes)
})

// Get a specific note for user
notesRouter.get('/:id', async (request, response) => {
  const note = await Note.findById(request.params.id)
  if (note) {
    response.json(note)
  } else {
    response.status(404).end()
  }
})

// Create a new note
notesRouter.post('/', async (request, response) => {
  const body = request.body

  const decodedToken = jwt.verify(getTokenFrom(request), process.env.SECRET)
  if (!decodedToken.id) {
    return response.status(401).json({ error: 'token invalid' })
  }

  const user = await User.findById(decodedToken.id)

  const note = new Note({
    title: body.title,
    details: body.details,
    pinned: body.pinned,
    labels: body.labels,
    backgroundColor: body.backgroundColor,
    user: user._id
  })

  const savedNote = await note.save()
  response.status(201).json(savedNote)
})

// Delete a note
notesRouter.delete('/:id', async (request, response) => {
  const decodedToken = jwt.verify(getTokenFrom(request), process.env.SECRET)
  if (!decodedToken.id) {
    return response.status(401).json({ error: 'token invalid' })
  }

  await Note.findOneAndDelete({ _id: request.params.id, user: decodedToken.id })

  response.status(204).end()
})

// Update Note
notesRouter.patch('/:id', async (request, response) => {
  const body = request.body

  const decodedToken = jwt.verify(getTokenFrom(request), process.env.SECRET)
  if (!decodedToken.id) {
    return response.status(401).json({ error: 'token invalid' })
  }

  const note = {
    title: body.title,
    details: body.details,
    pinned: body.pinned,
    labels: body.labels,
    backgroundColor: body.backgroundColor,
    user: decodedToken.id
  }

  //Note.findByIdAndUpdate(request.params.id, note, { new: true })
  Note.findOneAndUpdate({ _id: request.params.id, user: decodedToken.id }, note, { new: true })
    .then(updatedNote => {
      if (!updatedNote) {
        // Note not found
        return response.status(404).json({ error: 'Note not found' })
      }
      response.json(updatedNote)
    })
})

module.exports = notesRouter