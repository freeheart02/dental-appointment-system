const { getAllPatients, getPatientById, createPatient, updatePatient, deletePatient, getAppointments, getPatientByPhone } = require('../utils/fileStore')

exports.getAllPatients = async (req, res) => {
  try {
    const { search } = req.query
    let patients = getAllPatients()
    const appointments = getAppointments()
    
    if (search) {
      patients = patients.filter(p => 
        p.name.toLowerCase().includes(search.toLowerCase()) || 
        p.phone.includes(search)
      )
    }
    
    const patientsWithLastAppointment = patients.map(patient => {
      const patientAppointments = appointments.filter(
        a => a.patientId === patient._id && 
             a.status !== 'cancelled'
      )
      
      let lastAppointmentDate = null
      if (patientAppointments.length > 0) {
        patientAppointments.sort((a, b) => new Date(b.date) - new Date(a.date))
        lastAppointmentDate = patientAppointments[0].date
      }
      
      return {
        ...patient,
        lastAppointmentDate
      }
    })
    
    patientsWithLastAppointment.sort((a, b) => {
      if (!a.lastAppointmentDate && !b.lastAppointmentDate) {
        return new Date(b.createdAt) - new Date(a.createdAt)
      }
      if (!a.lastAppointmentDate) return 1
      if (!b.lastAppointmentDate) return -1
      return new Date(b.lastAppointmentDate) - new Date(a.lastAppointmentDate)
    })
    
    res.json(patientsWithLastAppointment)
  } catch (err) {
    res.status(500).json({ message: '服务器错误' })
  }
}

exports.getPatientById = async (req, res) => {
  try {
    const patient = getPatientById(req.params.id)
    if (!patient) {
      return res.status(404).json({ message: '患者不存在' })
    }
    res.json(patient)
  } catch (err) {
    res.status(500).json({ message: '服务器错误' })
  }
}

exports.getPatientByPhone = async (req, res) => {
  try {
    const patient = getPatientByPhone(req.params.phone)
    if (!patient) {
      return res.status(404).json({ message: '患者不存在' })
    }
    res.json(patient)
  } catch (err) {
    res.status(500).json({ message: '服务器错误' })
  }
}

exports.createPatient = async (req, res) => {
  try {
    const { phone, name, gender, age } = req.body
    if (!phone || !name) {
      return res.status(400).json({ message: '请填写必填信息' })
    }
    const existing = getAllPatients().find(p => p.phone === phone)
    if (existing) {
      return res.status(400).json({ message: '该手机号已存在' })
    }
    
    const patient = createPatient({ phone, name, gender, age })
    res.status(201).json(patient)
  } catch (err) {
    res.status(500).json({ message: '服务器错误' })
  }
}

exports.updatePatient = async (req, res) => {
  try {
    const { name, gender, age, incrementNoShow, resetNoShow } = req.body
    const updateData = {}
    
    if (name !== undefined) updateData.name = name
    if (gender !== undefined) updateData.gender = gender
    if (age !== undefined) updateData.age = age
    if (incrementNoShow) updateData.incrementNoShow = true
    if (resetNoShow) updateData.resetNoShow = true
    
    const patient = updatePatient(req.params.id, updateData)
    if (!patient) {
      return res.status(404).json({ message: '患者不存在' })
    }
    res.json(patient)
  } catch (err) {
    res.status(500).json({ message: '服务器错误' })
  }
}

exports.deletePatient = async (req, res) => {
  try {
    const patient = deletePatient(req.params.id)
    if (!patient) {
      return res.status(404).json({ message: '患者不存在' })
    }
    res.json({ message: '删除成功' })
  } catch (err) {
    res.status(500).json({ message: '服务器错误' })
  }
}
