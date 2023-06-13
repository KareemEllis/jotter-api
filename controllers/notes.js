const notesRouter = require('express').Router()
const Note = require('../models/note')

notesRouter.get('/', async (request, response) => {
  const notes = await Note.find({})
  response.json(notes)
})

notesRouter.get('/:id', async (request, response) => {
  const note = await Note.findById(request.params.id)
  if (note) {
    response.json(note)
  } else {
    response.status(404).end()
  }
})

notesRouter.post('/', async (request, response) => {
  const body = request.body

  const note = new Note({
    title: body.title,
    details: body.details,
    pinned: body.pinned,
    labels: body.labels
  })

  const savedNote = await note.save()
  response.status(201).json(savedNote)
})

notesRouter.delete('/:id', async (request, response) => {
  await Note.findByIdAndRemove(request.params.id)
  response.status(204).end()
})

notesRouter.patch('/:id', async (request, response) => {
  const body = request.body

  const note = {
    title: body.title,
    details: body.details,
    pinned: body.pinned,
    labels: body.labels
  }

  Note.findByIdAndUpdate(request.params.id, note, { new: true })
    .then(updatedNote => {
      if (!updatedNote) {
        // Note not found
        return response.status(404).json({ error: 'Note not found' })
      }
      response.json(updatedNote)
    })
})

module.exports = notesRouter