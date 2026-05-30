const express = require('express')
const router = express.Router()
const { verifyToken, verifyAdmin } = require('../middleware/auth')
const {
  getAllDoctors,
  getDoctorById,
  createDoctor,
  updateDoctor,
  deleteDoctor
} = require('../controllers/doctorController')

router.get('/', getAllDoctors)
router.get('/:id', getDoctorById)
router.post('/', verifyToken, verifyAdmin, createDoctor)
router.put('/:id', verifyToken, verifyAdmin, updateDoctor)
router.delete('/:id', verifyToken, verifyAdmin, deleteDoctor)

module.exports = router
