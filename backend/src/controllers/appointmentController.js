const { 
  createAppointment, 
  getAppointmentsByPatient, 
  getAppointments, 
  updateAppointment, 
  deleteAppointment,
  getAllSchedules,
  getAllDoctors,
  getAllPatients,
  createPatient
} = require('../utils/fileStore')

exports.createAppointment = async (req, res) => {
  try {
    const { patientId, patientName, patientPhone, doctorId, date, timeSlot, type } = req.body
    console.log('预约请求:', { patientId, patientName, patientPhone, doctorId, date, timeSlot, type })
    
    if (!doctorId || !date || !timeSlot) {
      return res.status(400).json({ message: '请填写完整预约信息' })
    }
    
    // 如果提供了患者姓名和手机号，自动创建患者记录
    let finalPatientId = patientId
    if (patientName && patientPhone && !patientId) {
      // 检查患者是否已存在
      const existingPatients = getAllPatients()
      const existingPatient = existingPatients.find(p => p.phone === patientPhone)
      
      if (existingPatient) {
        finalPatientId = existingPatient._id
      } else {
        // 创建新患者
        const newPatient = createPatient({
          name: patientName,
          phone: patientPhone,
          gender: '',
          age: undefined
        })
        finalPatientId = newPatient._id
        console.log('自动创建患者:', newPatient)
      }
    }
    
    if (!finalPatientId) {
      return res.status(400).json({ message: '请填写完整预约信息' })
    }
    
    // 标准化日期格式
    let normalizedDate
    if (typeof date === 'string') {
      normalizedDate = date.split('T')[0]
    } else {
      normalizedDate = new Date(date).toISOString().split('T')[0]
    }
    
    console.log('标准化日期:', normalizedDate)
    
    const schedule = getAllSchedules().find(
      s => s.doctorId === doctorId && 
           (s.date === normalizedDate || new Date(s.date).toISOString().split('T')[0] === normalizedDate)
    )
    
    console.log('找到的排班:', schedule ? '是' : '否')
    
    if (!schedule) {
      console.log('返回: 该医生当天没有排班')
      return res.status(400).json({ message: '该医生当天没有排班' })
    }
    
    // 检查时间段是否可用
    let timeSlotAvailable = false
    console.log('时间段类型:', typeof schedule.timeSlots[0])
    console.log('请求的时间段:', timeSlot)
    
    if (Array.isArray(schedule.timeSlots)) {
      if (typeof schedule.timeSlots[0] === 'string') {
        timeSlotAvailable = schedule.timeSlots.includes(timeSlot)
      } else {
        const slot = schedule.timeSlots.find(item => item.time === timeSlot)
        console.log('找到的时间段:', slot)
        timeSlotAvailable = slot && slot.available > 0
      }
    }
    
    console.log('时间段可用:', timeSlotAvailable)
    
    if (!timeSlotAvailable) {
      console.log('返回: 该时间段不可预约')
      return res.status(400).json({ message: '该时间段不可预约' })
    }
    
    // 检查是否已被预约
    const existing = getAppointments().find(
      a => a.doctorId === doctorId && 
           (a.date === normalizedDate || new Date(a.date).toISOString().split('T')[0] === normalizedDate) && 
           a.timeSlot === timeSlot && 
           a.status !== 'cancelled' && 
           a.status !== 'completed'
    )
    
    console.log('已有预约:', existing ? '是' : '否')
    
    if (existing) {
      console.log('返回: 该时间段已被预约')
      return res.status(400).json({ message: '该时间段已被预约' })
    }
    
    console.log('准备创建预约')
    const appointment = createAppointment({ patientId: finalPatientId, doctorId, date: normalizedDate, timeSlot, type })
    console.log('预约创建成功:', appointment)
    res.json({ success: true, message: '预约成功', appointment })
  } catch (err) {
    console.error('预约错误:', err)
    res.status(500).json({ message: '服务器错误' })
  }
}

exports.getAppointmentsByPatient = async (req, res) => {
  try {
    const appointments = getAppointmentsByPatient(req.params.patientId)
    // 关联医生信息
    const appointmentsWithDoctor = appointments.map(appointment => {
      const doctor = getAllDoctors().find(d => d._id === appointment.doctorId)
      return {
        ...appointment,
        doctorId: doctor || appointment.doctorId
      }
    })
    res.json(appointmentsWithDoctor)
  } catch (err) {
    console.error('获取预约错误:', err)
    res.status(500).json({ message: '服务器错误' })
  }
}

exports.getAllAppointments = async (req, res) => {
  try {
    const { patientId, doctorId, status } = req.query
    let appointments = [...getAppointments()]
    
    if (patientId) {
      appointments = appointments.filter(a => a.patientId === patientId)
    }
    if (doctorId) {
      appointments = appointments.filter(a => a.doctorId === doctorId)
    }
    if (status) {
      appointments = appointments.filter(a => a.status === status)
    }
    
    const doctors = getAllDoctors()
    const patients = getAllPatients()
    
    const appointmentsWithDetails = appointments.map(appointment => {
      const doctor = doctors.find(d => d._id === appointment.doctorId)
      const patient = patients.find(p => p._id === appointment.patientId)
      return {
        ...appointment,
        doctorName: doctor?.name || '',
        department: doctor?.specialty || '',
        patientName: patient?.name || '',
        phone: patient?.phone || '',
        slot: appointment.timeSlot || ''
      }
    })
    
    appointmentsWithDetails.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    res.json(appointmentsWithDetails)
  } catch (err) {
    res.status(500).json({ message: '服务器错误' })
  }
}

exports.updateAppointment = async (req, res) => {
  try {
    const { status, checkedInAt } = req.body
    const updateData = { status }
    if (checkedInAt) {
      updateData.checkedInAt = checkedInAt
    }
    const appointment = updateAppointment(req.params.id, updateData)
    if (!appointment) {
      return res.status(404).json({ message: '预约不存在' })
    }
    res.json({ success: true, message: '预约状态已更新', appointment })
  } catch (err) {
    res.status(500).json({ message: '服务器错误' })
  }
}

exports.deleteAppointment = async (req, res) => {
  try {
    const appointment = deleteAppointment(req.params.id)
    if (!appointment) {
      return res.status(404).json({ message: '预约不存在' })
    }
    res.json({ success: true, message: '预约已取消' })
  } catch (err) {
    res.status(500).json({ message: '服务器错误' })
  }
}
