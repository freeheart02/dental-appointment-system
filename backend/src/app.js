require('dotenv').config()
const express = require('express')
const cors = require('cors')

const authRoutes = require('./routes/auth')
const patientRoutes = require('./routes/patients')
const doctorRoutes = require('./routes/doctors')
const scheduleRoutes = require('./routes/schedules')
const appointmentRoutes = require('./routes/appointments')
const statisticsRoutes = require('./routes/statistics')
const queueRoutes = require('./routes/queue')
const backupRoutes = require('./routes/backup')

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}))
app.use(express.json())

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`)
  next()
})

app.use('/api/auth', authRoutes)
app.use('/api/patients', patientRoutes)
app.use('/api/doctors', doctorRoutes)
app.use('/api/schedules', scheduleRoutes)
app.use('/api/appointments', appointmentRoutes)
app.use('/api/statistics', statisticsRoutes)
app.use('/api/queue', queueRoutes)
app.use('/api/backup', backupRoutes)

app.get('/', (req, res) => {
  res.json({ message: '口腔诊所患者预约登记系统 API' })
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`)
  console.log('Using file-based storage (data is persisted)')
})
