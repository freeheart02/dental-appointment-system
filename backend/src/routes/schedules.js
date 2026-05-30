const express = require('express')
const router = express.Router()
const { verifyToken, verifyAdmin } = require('../middleware/auth')
const {
  getAllSchedules,
  getSchedulesByDoctor,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  batchCreateSchedule
} = require('../controllers/scheduleController')

router.get('/', getAllSchedules)
router.get('/doctor/:doctorId', getSchedulesByDoctor)
router.post('/', verifyToken, verifyAdmin, createSchedule)
router.post('/batch', verifyToken, verifyAdmin, batchCreateSchedule)
router.put('/:id', verifyToken, verifyAdmin, updateSchedule)
router.delete('/:id', verifyToken, verifyAdmin, deleteSchedule)

module.exports = router
