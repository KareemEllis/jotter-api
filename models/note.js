const mongoose = require('mongoose')

const noteSchema = new mongoose.Schema({
  title: {
    type: String,
    default: ''
  },
  details: {
    type: String,
    default: ''
  },
  pinned: {
    type: Boolean,
    default: false
  },
  labels: Array,
  backgroundColor: {
    type: String,
    default: '#ffffff'
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  }
})

noteSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject._id
    delete returnedObject.__v
  }
})

module.exports = mongoose.model('Note', noteSchema)