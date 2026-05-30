const express = require('express')
const router = express.Router()
const { verifyToken, verifyAdmin } = require('../middleware/auth')
const {
  getAllAppointments,
  getAppointmentsByPatient,
  createAppointment,
  updateAppointment,
  deleteAppointment
} = require('../controllers/appointmentController')

router.get('/', getAllAppointments)
router.get('/patient/:patientId', verifyToken, getAppointmentsByPatient)
router.post('/', verifyToken, createAppointment)
router.put('/:id', verifyToken, updateAppointment)
router.delete('/:id', verifyToken, deleteAppointment)

module.exports = router
