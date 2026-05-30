const express = require('express')
const router = express.Router()
const { verifyToken, verifyAdmin } = require('../middleware/auth')
const {
  getNoShowRate,
  getAppointmentTrend,
  getDoctorWorkload,
  getDashboardStats
} = require('../controllers/statisticsController')

router.get('/no-show-rate', verifyToken, verifyAdmin, getNoShowRate)
router.get('/appointment-trend', verifyToken, verifyAdmin, getAppointmentTrend)
router.get('/doctor-workload', verifyToken, verifyAdmin, getDoctorWorkload)
router.get('/dashboard', verifyToken, verifyAdmin, getDashboardStats)

module.exports = router
