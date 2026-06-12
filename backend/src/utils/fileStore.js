const fs = require('fs')
const path = require('path')

const DATA_DIR = path.join(__dirname, '../data')
const DATA_FILE = path.join(DATA_DIR, 'database.json')
const BACKUP_DIR = path.join(__dirname, '../backups')
const MAX_BACKUPS = 10 // 保留最近备份数量

let store = {
  users: [],
  patients: [],
  doctors: [],
  schedules: [],
  appointments: [],
  verificationCodes: {},
  queue: [],
  calledPatients: [],
  currentCalling: null,
  callHistory: []
}

const ensureDataDir = () => {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }
}

const loadData = () => {
  ensureDataDir()
  if (fs.existsSync(DATA_FILE)) {
    try {
      const content = fs.readFileSync(DATA_FILE, 'utf-8')
      const data = JSON.parse(content)
      store = { ...store, ...data }
      console.log('Data loaded from file')
    } catch (err) {
      console.error('Error loading data:', err.message)
    }
  }
}

const saveData = () => {
  ensureDataDir()
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2))
  } catch (err) {
    console.error('Error saving data:', err.message)
  }
}

loadData()

// ==================== 备份功能 ====================
const ensureBackupDir = () => {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true })
  }
}

const getBackupList = () => {
  ensureBackupDir()
  try {
    const files = fs.readdirSync(BACKUP_DIR)
      .filter(f => f.startsWith('backup_') && f.endsWith('.json'))
      .map(f => {
        const stats = fs.statSync(path.join(BACKUP_DIR, f))
        return {
          filename: f,
          size: stats.size,
          createdAt: stats.mtime.toISOString()
        }
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    return files
  } catch (err) {
    console.error('Error getting backup list:', err.message)
    return []
  }
}

const createBackup = () => {
  ensureBackupDir()
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const filename = `backup_${timestamp}.json`
  const backupPath = path.join(BACKUP_DIR, filename)
  
  try {
    fs.writeFileSync(backupPath, JSON.stringify(store, null, 2))
    console.log(`Backup created: ${filename}`)
    
    // 清理旧备份，保留最近 MAX_BACKUPS 份
    const backups = getBackupList()
    if (backups.length > MAX_BACKUPS) {
      const toDelete = backups.slice(MAX_BACKUPS)
      toDelete.forEach(b => {
        fs.unlinkSync(path.join(BACKUP_DIR, b.filename))
        console.log(`Old backup removed: ${b.filename}`)
      })
    }
    
    return { success: true, filename, message: '备份成功' }
  } catch (err) {
    console.error('Error creating backup:', err.message)
    return { success: false, message: '备份失败: ' + err.message }
  }
}

const restoreBackup = (filename) => {
  const backupPath = path.join(BACKUP_DIR, filename)
  if (!fs.existsSync(backupPath)) {
    return { success: false, message: '备份文件不存在' }
  }
  try {
    const content = fs.readFileSync(backupPath, 'utf-8')
    const data = JSON.parse(content)
    store = { ...store, ...data }
    saveData()
    return { success: true, message: '恢复成功' }
  } catch (err) {
    return { success: false, message: '恢复失败: ' + err.message }
  }
}

// 自动备份：每小时一次
setInterval(() => {
  createBackup()
}, 60 * 60 * 1000)

// 每5秒保存一次数据
setInterval(() => {
  saveData()
}, 5000)

const generateId = () => {
  return Math.random().toString(36).substring(2, 15)
}

exports.store = store

exports.getUserByPhone = (phone) => {
  return store.users.find(u => u.phone === phone)
}

exports.createUser = (data) => {
  const user = {
    _id: generateId(),
    phone: data.phone,
    name: data.name || '用户',
    role: 'patient',
    createdAt: new Date().toISOString()
  }
  store.users.push(user)
  return user
}

exports.getPatientByPhone = (phone) => {
  return store.patients.find(p => p.phone === phone)
}

exports.createPatient = (data) => {
  const patient = {
    _id: generateId(),
    phone: data.phone,
    name: data.name || '用户',
    gender: data.gender,
    age: data.age,
    createdAt: new Date().toISOString()
  }
  store.patients.push(patient)
  return patient
}

exports.setVerificationCode = (phone, code) => {
  store.verificationCodes[phone] = {
    code,
    expiresAt: Date.now() + 5 * 60 * 1000
  }
}

exports.getVerificationCode = (phone) => {
  const item = store.verificationCodes[phone]
  if (!item || Date.now() > item.expiresAt) {
    return null
  }
  return item.code
}

exports.getAllDoctors = () => {
  return store.doctors
}

exports.getDoctorById = (id) => {
  return store.doctors.find(d => d._id === id)
}

exports.createDoctor = (data) => {
  const doctor = {
    _id: generateId(),
    name: data.name,
    title: data.title,
    specialty: data.specialty,
    description: data.description,
    department: data.department,
    slotInterval: data.slotInterval || 30,
    createdAt: new Date().toISOString()
  }
  store.doctors.push(doctor)
  saveData()
  return doctor
}

exports.updateDoctor = (id, data) => {
  const index = store.doctors.findIndex(d => d._id === id)
  if (index !== -1) {
    store.doctors[index] = { ...store.doctors[index], ...data, updatedAt: new Date().toISOString() }
    saveData()
    return store.doctors[index]
  }
  return null
}

exports.deleteDoctor = (id) => {
  const index = store.doctors.findIndex(d => d._id === id)
  if (index !== -1) {
    return store.doctors.splice(index, 1)[0]
  }
  return null
}

exports.getAllSchedules = () => {
  return store.schedules
}

exports.getSchedulesByDoctor = (doctorId) => {
  return store.schedules.filter(s => s.doctorId === doctorId)
}

exports.createSchedule = (data) => {
  const schedule = {
    _id: generateId(),
    doctorId: data.doctorId,
    date: data.date,
    timeSlots: data.timeSlots || [],
    createdAt: new Date().toISOString()
  }
  store.schedules.push(schedule)
  saveData()
  return schedule
}

exports.updateSchedule = (id, data) => {
  const index = store.schedules.findIndex(s => s._id === id)
  if (index !== -1) {
    store.schedules[index] = { ...store.schedules[index], ...data, updatedAt: new Date().toISOString() }
    return store.schedules[index]
  }
  return null
}

exports.deleteSchedule = (id) => {
  const index = store.schedules.findIndex(s => s._id === id)
  if (index !== -1) {
    return store.schedules.splice(index, 1)[0]
  }
  return null
}

exports.createAppointment = (data) => {
  const appointment = {
    _id: generateId(),
    patientId: data.patientId,
    doctorId: data.doctorId,
    date: data.date,
    timeSlot: data.timeSlot,
    status: 'pending',
    createdAt: new Date().toISOString()
  }
  store.appointments.push(appointment)
  return appointment
}

exports.getAppointmentsByPatient = (patientId) => {
  return store.appointments.filter(a => a.patientId === patientId)
}

exports.getAppointments = () => {
  return store.appointments
}

exports.updateAppointment = (id, data) => {
  const index = store.appointments.findIndex(a => a._id === id)
  if (index !== -1) {
    store.appointments[index] = { ...store.appointments[index], ...data, updatedAt: new Date().toISOString() }
    return store.appointments[index]
  }
  return null
}

exports.deleteAppointment = (id) => {
  const index = store.appointments.findIndex(a => a._id === id)
  if (index !== -1) {
    return store.appointments.splice(index, 1)[0]
  }
  return null
}

exports.getDashboardStats = () => {
  const today = new Date().toISOString().split('T')[0]
  
  const totalAppointments = store.appointments.length
  const completedAppointments = store.appointments.filter(a => a.status === 'completed').length
  const noShowAppointments = store.appointments.filter(a => a.status === 'no_show').length
  const pendingAppointments = store.appointments.filter(a => a.status === 'pending').length
  
  const todayAppointments = store.appointments.filter(a => a.date === today && a.status !== 'cancelled')
  const todayPatients = new Set(todayAppointments.map(a => a.patientId)).size
  
  const todaySchedules = store.schedules.filter(s => s.date === today)
  const todayDoctors = new Set(todaySchedules.map(s => s.doctorId)).size
  
  return {
    totalPatients: store.patients.length,
    totalDoctors: store.doctors.length,
    todayPatients,
    todayDoctors,
    totalAppointments,
    completedAppointments,
    pendingAppointments,
    noShowAppointments,
    noShowRate: totalAppointments > 0 ? (noShowAppointments / totalAppointments * 100).toFixed(1) : 0
  }
}

exports.getAllPatients = () => {
  return store.patients
}

exports.getPatientById = (id) => {
  return store.patients.find(p => p._id === id)
}

exports.getPatientByPhone = (phone) => {
  return store.patients.find(p => p.phone === phone)
}

exports.updatePatient = (id, data) => {
  const index = store.patients.findIndex(p => p._id === id)
  if (index !== -1) {
    const updateData = { ...data }
    
    if (updateData.incrementNoShow) {
      updateData.noShowCount = (store.patients[index].noShowCount || 0) + 1
      delete updateData.incrementNoShow
    }
    
    if (updateData.resetNoShow) {
      updateData.noShowCount = 0
      delete updateData.resetNoShow
    }
    
    store.patients[index] = { ...store.patients[index], ...updateData, updatedAt: new Date().toISOString() }
    return store.patients[index]
  }
  return null
}

exports.deletePatient = (id) => {
  const index = store.patients.findIndex(p => p._id === id)
  if (index !== -1) {
    return store.patients.splice(index, 1)[0]
  }
  return null
}

exports.maskName = (name) => {
  if (!name || name.length < 2) return name
  return name[0] + '*' + name.slice(2)
}

exports.checkInPatient = (appointmentId, patientId, doctorId) => {
  const appointment = store.appointments.find(a => a._id === appointmentId)
  const patient = store.patients.find(p => p._id === patientId)
  const doctor = store.doctors.find(d => d._id === doctorId)
  
  if (!appointment || !patient || !doctor) {
    return null
  }

  const checkInTime = new Date()
  const isLate = checkIfLate(appointment.date, appointment.timeSlot, checkInTime)

  const queueItem = {
    _id: generateId(),
    appointmentId,
    patientId,
    doctorId,
    patientName: patient.name,
    patientMaskedName: exports.maskName(patient.name),
    doctorName: doctor.name,
    appointmentDate: appointment.date,
    appointmentTimeSlot: appointment.timeSlot,
    checkInTime: checkInTime.toISOString(),
    isLate,
    status: 'waiting',
    priority: calculatePriority(appointment.timeSlot, isLate, checkInTime)
  }

  store.queue.push(queueItem)

  exports.updateAppointment(appointmentId, { status: 'checked-in' })
  
  saveData()
  return queueItem
}

const checkIfLate = (appointmentDate, timeSlot, checkInTime) => {
  const [hours, minutes] = timeSlot.split(':').map(Number)
  const appointmentDateTime = new Date(appointmentDate)
  appointmentDateTime.setHours(hours, minutes, 0, 0)
  
  const diffMinutes = (checkInTime - appointmentDateTime) / (1000 * 60)
  return diffMinutes > 15
}

const calculatePriority = (timeSlot, isLate, checkInTime) => {
  const [hours, minutes] = timeSlot.split(':').map(Number)
  const timeValue = hours * 60 + minutes
  
  if (isLate) {
    return 10000 + timeValue
  }
  return timeValue
}

exports.getQueueByDoctor = (doctorId) => {
  return store.queue
    .filter(item => item.doctorId === doctorId && item.status === 'waiting')
    .sort((a, b) => a.priority - b.priority)
}

exports.getCompleteQueue = () => {
  return store.queue
    .filter(item => item.status === 'waiting')
    .sort((a, b) => a.priority - b.priority)
}

exports.getDoctorCurrentPatient = (doctorId) => {
  return store.queue.find(
    item => item.doctorId === doctorId && item.status === 'in-progress'
  )
}

exports.callNextPatient = (doctorId) => {
  const queue = exports.getQueueByDoctor(doctorId)
  
  if (queue.length === 0) {
    return null
  }

  const nextPatient = queue[0]
  nextPatient.status = 'in-progress'
  nextPatient.callTime = new Date().toISOString()

  store.currentCalling = {
    patientName: nextPatient.patientMaskedName,
    doctorName: nextPatient.doctorName,
    doctorId: doctorId,
    time: new Date().toISOString()
  }

  store.callHistory.unshift({
    _id: generateId(),
    ...nextPatient,
    calledAt: new Date().toISOString()
  })

  saveData()
  return nextPatient
}

exports.completePatientVisit = (queueItemId) => {
  const index = store.queue.findIndex(item => item._id === queueItemId)
  if (index !== -1) {
    const completed = store.queue[index]
    completed.status = 'completed'
    completed.completedAt = new Date().toISOString()
    store.calledPatients.push(completed)
    store.queue.splice(index, 1)

    if (store.currentCalling && store.currentCalling.doctorId === completed.doctorId) {
      store.currentCalling = null
    }

    saveData()
    return completed
  }
  return null
}

exports.skipPatient = (queueItemId) => {
  const index = store.queue.findIndex(item => item._id === queueItemId)
  if (index !== -1) {
    const item = store.queue[index]
    item.priority += 1000
    saveData()
    return item
  }
  return null
}

exports.removeFromQueue = (queueItemId) => {
  const index = store.queue.findIndex(item => item._id === queueItemId)
  if (index !== -1) {
    const removed = store.queue.splice(index, 1)[0]
    saveData()
    return removed
  }
  return null
}

exports.getCurrentCalling = () => {
  return store.currentCalling
}

exports.getCallHistory = () => {
  return store.callHistory
}

exports.saveData = saveData
exports.createBackup = createBackup
exports.getBackupList = getBackupList
exports.restoreBackup = restoreBackup
exports.BACKUP_DIR = BACKUP_DIR
