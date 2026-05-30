const fs = require('fs')
const path = require('path')

const DATA_DIR = path.join(__dirname, '../data')
const DATA_FILE = path.join(DATA_DIR, 'database.json')

let store = {
  users: [],
  patients: [],
  doctors: [],
  schedules: [],
  appointments: [],
  verificationCodes: {}
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

exports.saveData = saveData
