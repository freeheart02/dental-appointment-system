const { getAllSchedules, getSchedulesByDoctor, createSchedule, updateSchedule, deleteSchedule, getAllDoctors } = require('../utils/fileStore')

const TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'
]

const normalizeDate = (date) => {
  if (!date) return date
  if (typeof date === 'string') {
    if (date.includes('T')) {
      const d = new Date(date)
      return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`
    }
    return date
  }
  return date
}

exports.getAllSchedules = async (req, res) => {
  try {
    const { doctorId } = req.query
    let schedules = getAllSchedules()
    const doctors = getAllDoctors()
    
    if (doctorId) {
      schedules = schedules.filter(s => s.doctorId === doctorId)
    }
    
    schedules = schedules.map(s => {
      const doctor = doctors.find(d => d._id === s.doctorId)
      return {
        ...s,
        date: normalizeDate(s.date),
        doctorId: doctor || s.doctorId
      }
    })
    
    res.json(schedules)
  } catch (err) {
    res.status(500).json({ message: '服务器错误' })
  }
}

exports.getScheduleById = async (req, res) => {
  try {
    const schedule = getAllSchedules().find(s => s._id === req.params.id)
    if (!schedule) {
      return res.status(404).json({ message: '排班不存在' })
    }
    res.json(schedule)
  } catch (err) {
    res.status(500).json({ message: '服务器错误' })
  }
}

exports.getSchedulesByDoctor = async (req, res) => {
  try {
    let schedules = getSchedulesByDoctor(req.params.doctorId)
    schedules = schedules.map(s => ({
      ...s,
      date: normalizeDate(s.date)
    }))
    res.json(schedules)
  } catch (err) {
    res.status(500).json({ message: '服务器错误' })
  }
}

exports.createSchedule = async (req, res) => {
  try {
    const { doctorId, date, timeSlots } = req.body
    if (!doctorId || !date) {
      return res.status(400).json({ message: '请填写医生和日期' })
    }
    
    // 确保日期格式是 YYYY-MM-DD，使用本地时间
    let normalizedDate
    if (typeof date === 'string' && date.includes('T')) {
      // 如果是 ISO 格式字符串，先转换
      const d = new Date(date)
      normalizedDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    } else if (typeof date === 'string') {
      // 已经是 YYYY-MM-DD 格式
      normalizedDate = date
    } else {
      // Date 对象
      normalizedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    }
    
    console.log('创建排班，日期:', normalizedDate)
    
    const existing = getAllSchedules().find(
      s => s.doctorId === doctorId && s.date === normalizedDate
    )
    if (existing) {
      return res.status(400).json({ message: '该医生当天已有排班' })
    }
    
    const schedule = createSchedule({ 
      doctorId, 
      date: normalizedDate, 
      timeSlots: timeSlots || TIME_SLOTS 
    })
    res.json({ success: true, message: '排班创建成功', schedule })
  } catch (err) {
    console.error('创建排班错误:', err)
    res.status(500).json({ message: '服务器错误' })
  }
}

exports.updateSchedule = async (req, res) => {
  try {
    const { timeSlots } = req.body
    const schedule = updateSchedule(req.params.id, { timeSlots })
    if (!schedule) {
      return res.status(404).json({ message: '排班不存在' })
    }
    res.json({ success: true, message: '排班更新成功', schedule })
  } catch (err) {
    res.status(500).json({ message: '服务器错误' })
  }
}

exports.deleteSchedule = async (req, res) => {
  try {
    const schedule = deleteSchedule(req.params.id)
    if (!schedule) {
      return res.status(404).json({ message: '排班不存在' })
    }
    res.json({ success: true, message: '排班删除成功' })
  } catch (err) {
    res.status(500).json({ message: '服务器错误' })
  }
}

exports.batchCreateSchedule = async (req, res) => {
  try {
    const { doctorId, startDate, endDate, weekdays, timeSlots } = req.body
    
    if (!doctorId || !startDate || !endDate) {
      return res.status(400).json({ message: '请填写医生、开始日期和结束日期' })
    }
    
    const start = new Date(startDate)
    const end = new Date(endDate)
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ message: '日期格式不正确' })
    }
    
    if (start > end) {
      return res.status(400).json({ message: '开始日期不能晚于结束日期' })
    }
    
    const days = weekdays || [1, 2, 3, 4, 5]
    const slots = timeSlots || TIME_SLOTS
    
    const results = []
    const errors = []
    
    let currentDate = new Date(start)
    while (currentDate <= end) {
      const dayOfWeek = currentDate.getDay()
      
      if (days.includes(dayOfWeek)) {
        const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`
        
        const existing = getAllSchedules().find(
          s => s.doctorId === doctorId && s.date === dateStr
        )
        
        if (existing) {
          errors.push(`${dateStr} 已有排班`)
        } else {
          const timeSlotsData = slots.map(time => ({
            time,
            available: 1,
            maxCapacity: 1
          }))
          
          const schedule = createSchedule({
            doctorId,
            date: dateStr,
            timeSlots: timeSlotsData
          })
          results.push(dateStr)
        }
      }
      
      currentDate.setDate(currentDate.getDate() + 1)
    }
    
    res.json({
      success: true,
      message: `成功创建 ${results.length} 个排班`,
      createdCount: results.length,
      createdDates: results,
      errors
    })
  } catch (err) {
    console.error('批量创建排班错误:', err)
    res.status(500).json({ message: '服务器错误' })
  }
}

exports.getTimeSlots = async (req, res) => {
  res.json(TIME_SLOTS)
}
