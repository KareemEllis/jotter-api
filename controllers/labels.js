const labelsRouter = require('express').Router()
const Label = require('../models/label')
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

// Get all labels for specific user
labelsRouter.get('/', async (request, response) => {
  const decodedToken = jwt.verify(getTokenFrom(request), process.env.SECRET)
  if (!decodedToken.id) {
    return response.status(401).json({ error: 'token invalid' })
  }

  const labels = await Label.find({ user: decodedToken.id })
  response.json(labels)
})

// Get a specific label for user
labelsRouter.get('/:id', async (request, response) => {
  const label = await Label.findById(request.params.id)
  if (label) {
    response.json(label)
  } else {
    response.status(404).end()
  }
})

// Create a new label
labelsRouter.post('/', async (request, response) => {
  const body = request.body

  const decodedToken = jwt.verify(getTokenFrom(request), process.env.SECRET)
  if (!decodedToken.id) {
    return response.status(401).json({ error: 'token invalid' })
  }

  const user = await User.findById(decodedToken.id)

  const label = new Label({
    name: body.name,
    user: user._id
  })

  const savedLabel = await label.save()
  response.status(201).json(savedLabel)
})

// Delete a label
labelsRouter.delete('/:id', async (request, response) => {
  const decodedToken = jwt.verify(getTokenFrom(request), process.env.SECRET)
  if (!decodedToken.id) {
    return response.status(401).json({ error: 'token invalid' })
  }

  await Label.findOneAndDelete({ _id: request.params.id, user: decodedToken.id })

  //Remove label from existing notes
  //await Note.updateMany({ labels: { $in: [request.params.id] }, user: decodedToken.id }, {  })

  const notes = await Note.find({ labels: { $in: [request.params.id] } })

  await Promise.all(
    notes.map(async (note) => {
      const updatedNote = {
        ...note._doc,
        labels: note._doc.labels.filter((label) => label !== request.params.id)
      }

      await Note.findByIdAndUpdate(updatedNote._id, updatedNote, { new: true })
      console.log(updatedNote)
    })
  )

  response.status(204).end()
})

// Update a label
labelsRouter.patch('/:id', async (request, response) => {
  const body = request.body

  const decodedToken = jwt.verify(getTokenFrom(request), process.env.SECRET)
  if (!decodedToken.id) {
    return response.status(401).json({ error: 'token invalid' })
  }

  const label = {
    name: body.name,
    user: decodedToken.id
  }

  Label.findOneAndUpdate({ _id: request.params.id, user: decodedToken.id }, label, { new: true })
    .then(updatedLabel => {
      if (!updatedLabel) {
        // Label not found
        return response.status(404).json({ error: 'Label not found' })
      }
      response.json(updatedLabel)
    })
})

module.exports = labelsRouter