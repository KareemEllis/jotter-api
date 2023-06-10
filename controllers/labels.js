const labelsRouter = require('express').Router()
const Label = require('../models/label')

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
  response.status(204).end()
})

labelsRouter.patch('/:id', async (request, response) => {
  const body = request.body

  // const label = {
  //   name: body.name
  // }

  const label = new Label({
    name: body.name
  })

  Label.findByIdAndUpdate(request.params.id, label, { new: true })
    .then(updatedLabel => {
      response.json(updatedLabel)
    })
})