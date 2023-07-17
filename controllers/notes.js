const notesRouter = require('express').Router()
const Note = require('../models/note')
const User = require('../models/user')

const fs = require('fs')
const path = require('path')
const jwt = require('jsonwebtoken')
const multer = require('multer')

const uploadDestination = path.join(__dirname, '..', 'uploads')

// Configure multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDestination) // Set the destination folder where files will be saved
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
    const filename = file.fieldname + '-' + uniqueSuffix + '.' + file.originalname.split('.').pop()
    cb(null, filename) // Set the filename for the uploaded file
  }
})

const upload = multer({ storage: storage })

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
notesRouter.post('/', upload.single('photo') ,async (request, response) => {
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
    labels: (body.labels) ? body.labels : [],
    backgroundColor: body.backgroundColor,
    photoFilename: request.file ? request.file.filename : null,
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

  const note = await Note.findOneAndDelete({ _id: request.params.id, user: decodedToken.id })

  // Delete image file if it exists
  if (note.photoFilename) {
    const filePath = path.join(__dirname, '..', 'uploads', note.photoFilename)
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error('Error deleting image file:', err)
      }
    })
  }

  response.status(204).end()
})


//Remove Photo from note
notesRouter.delete('/:id/photo', async (request, response) => {
  const decodedToken = jwt.verify(getTokenFrom(request), process.env.SECRET)
  if (!decodedToken.id) {
    return response.status(401).json({ error: 'token invalid' })
  }

  const note = await Note.findById(request.params.id)
  const newNote = { ...note, photoFilename: '' }
  console.log(newNote)

  // Delete image file if it exists
  if (note.photoFilename) {
    const filePath = path.join(__dirname, '..', 'uploads', note.photoFilename)
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error('Error deleting image file:', err)
      }
    })
  }

  response.status(204).end()
})

// Update Note
notesRouter.patch('/:id', upload.single('photo'), async (request, response) => {
  const body = request.body
  console.log(body)

  const decodedToken = jwt.verify(getTokenFrom(request), process.env.SECRET)
  if (!decodedToken.id) {
    return response.status(401).json({ error: 'token invalid' })
  }

  const prevNote = await Note.findById(request.params.id)

  //Property to check if there the photo should be removed
  const isRemovePhoto = body.isRemovePhoto

  const note = {
    title: body.title,
    details: body.details,
    pinned: body.pinned,
    labels: (body.labels) ? body.labels : [],
    backgroundColor: body.backgroundColor,
    user: decodedToken.id
  }

  console.log('Request File:')
  console.log(request.file)
  console.log('Remove Photo?')
  console.log(isRemovePhoto)

  if (request.file) {
    if (prevNote.photoFilename) {
      console.log('Removing (1)')
      // Delete previous photo if exists
      const previousPhotoPath = path.join(__dirname, '..', 'uploads', prevNote.photoFilename)
      fs.unlink(previousPhotoPath, (err) => {
        if (err) {
          console.error('Error deleting previous photo:', err)
        }
      })
    }
    note.photoFilename = request.file.filename
  }
  else if (isRemovePhoto === 'true') {
    if (prevNote.photoFilename) {
      console.log('Removing (2)')
      // Delete previous photo if exists
      const previousPhotoPath = path.join(__dirname, '..', 'uploads', prevNote.photoFilename)
      fs.unlink(previousPhotoPath, (err) => {
        if (err) {
          console.error('Error deleting previous photo:', err)
        }
      })
      note.photoFilename = null
    }
  }

  console.log(note)

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