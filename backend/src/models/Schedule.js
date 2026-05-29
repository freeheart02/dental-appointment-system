const mongoose = require('mongoose')

const timeSlotSchema = new mongoose.Schema({
  time: {
    type: String,
    required: true
  },
  available: {
    type: Number,
    default: 1
  },
  maxCapacity: {
    type: Number,
    default: 1
  }
})

const scheduleSchema = new mongoose.Schema({
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  timeSlots: [timeSlotSchema],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
})

module.exports = mongoose.model('Schedule', scheduleSchema)
