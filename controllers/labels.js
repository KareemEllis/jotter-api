const labelsRouter = require('express').Router()
const Label = require('../models/label')
const Note = require('../models/note')

labelsRouter.get('/', async (request, response) => {
  const labels = await Label.find({})
  response.json(labels)
})

labelsRouter.get('/:id', async (request, response) => {
  const label = await Label.findById(request.params.id)
  if (label) {
    response.json(label)
  } else {
    response.status(404).end()
  }
})

labelsRouter.post('/', async (request, response) => {
  const body = request.body

  const label = new Label({
    name: body.name
  })

  const savedLabel = await label.save()
  response.status(201).json(savedLabel)
})

labelsRouter.delete('/:id', async (request, response) => {
  await Label.findByIdAndRemove(request.params.id)
  //Remove label from existing notes
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

labelsRouter.patch('/:id', async (request, response) => {
  const body = request.body

  const label = {
    name: body.name
  }

  Label.findByIdAndUpdate(request.params.id, label, { new: true })
    .then(updatedLabel => {
      if (!updatedLabel) {
        // Label not found
        return response.status(404).json({ error: 'Label not found' })
      }
      response.json(updatedLabel)
    })
})

module.exports = labelsRouter