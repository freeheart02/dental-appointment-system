const express = require('express')
const router = express.Router()
const { verifyToken, verifyAdmin } = require('../middleware/auth')
const fileStore = require('../utils/fileStore')

router.post('/checkin', verifyToken, (req, res) => {
  try {
    const { appointmentId, patientId, doctorId } = req.body
    
    if (!appointmentId || !patientId || !doctorId) {
      return res.status(400).json({ error: '缺少必要参数' })
    }

    const result = fileStore.checkInPatient(appointmentId, patientId, doctorId)
    
    if (!result) {
      return res.status(404).json({ error: '预约记录、患者或医生未找到' })
    }

    res.json({ success: true, data: result })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/doctor/:doctorId', verifyToken, (req, res) => {
  try {
    const { doctorId } = req.params
    const queue = fileStore.getQueueByDoctor(doctorId)
    const currentPatient = fileStore.getDoctorCurrentPatient(doctorId)
    
    res.json({ 
      success: true, 
      data: {
        queue,
        currentPatient
      }
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/complete', verifyToken, (req, res) => {
  try {
    const queue = fileStore.getCompleteQueue()
    const currentCalling = fileStore.getCurrentCalling()
    
    res.json({ 
      success: true, 
      data: {
        queue,
        currentCalling
      }
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/public', (req, res) => {
  try {
    const queue = fileStore.getCompleteQueue()
    const currentCalling = fileStore.getCurrentCalling()
    const doctors = fileStore.getAllDoctors()
    
    const doctorsWithQueue = doctors.map(doctor => {
      const doctorQueue = fileStore.getQueueByDoctor(doctor._id)
      const currentPatient = fileStore.getDoctorCurrentPatient(doctor._id)
      
      return {
        ...doctor,
        currentPatient,
        queue: doctorQueue
      }
    })
    
    res.json({ 
      success: true, 
      data: {
        queue,
        currentCalling,
        doctorsWithQueue
      }
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/call-next', verifyAdmin, (req, res) => {
  try {
    const { doctorId } = req.body
    
    if (!doctorId) {
      return res.status(400).json({ error: '缺少医生ID' })
    }

    const result = fileStore.callNextPatient(doctorId)
    
    if (!result) {
      return res.status(404).json({ error: '当前没有等待的患者' })
    }

    res.json({ success: true, data: result })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/complete', verifyAdmin, (req, res) => {
  try {
    const { queueItemId } = req.body
    
    if (!queueItemId) {
      return res.status(400).json({ error: '缺少排队项目ID' })
    }

    const result = fileStore.completePatientVisit(queueItemId)
    
    if (!result) {
      return res.status(404).json({ error: '排队项目未找到' })
    }

    res.json({ success: true, data: result })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/skip', verifyAdmin, (req, res) => {
  try {
    const { queueItemId } = req.body
    
    if (!queueItemId) {
      return res.status(400).json({ error: '缺少排队项目ID' })
    }

    const result = fileStore.skipPatient(queueItemId)
    
    if (!result) {
      return res.status(404).json({ error: '排队项目未找到' })
    }

    res.json({ success: true, data: result })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.delete('/:queueItemId', verifyAdmin, (req, res) => {
  try {
    const { queueItemId } = req.params
    
    const result = fileStore.removeFromQueue(queueItemId)
    
    if (!result) {
      return res.status(404).json({ error: '排队项目未找到' })
    }

    res.json({ success: true, data: result })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/current-calling', (req, res) => {
  try {
    const currentCalling = fileStore.getCurrentCalling()
    res.json({ success: true, data: currentCalling })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/history', verifyAdmin, (req, res) => {
  try {
    const history = fileStore.getCallHistory()
    res.json({ success: true, data: history })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

module.exports = router
