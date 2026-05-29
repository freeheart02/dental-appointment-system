const express = require('express')
const router = express.Router()
const { verifyToken, verifyAdmin } = require('../middleware/auth')
const {
  getAllPatients,
  getPatientById,
  getPatientByPhone,
  createPatient,
  updatePatient,
  deletePatient
} = require('../controllers/patientController')

router.get('/', verifyToken, verifyAdmin, getAllPatients)
router.get('/:id', verifyToken, getPatientById)
router.get('/by-phone/:phone', verifyToken, getPatientByPhone)
router.post('/', verifyToken, verifyAdmin, createPatient)
router.put('/:id', verifyToken, verifyAdmin, updatePatient)
router.delete('/:id', verifyToken, verifyAdmin, deletePatient)

module.exports = router
