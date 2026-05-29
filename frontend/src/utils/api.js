import axios from 'axios'

const API_BASE_URL = 'http://localhost:3000/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const authAPI = {
  sendCode: (phone) => api.post('/auth/send-code', { phone }),
  verifyCode: (data) => api.post('/auth/verify-code', data),
  adminLogin: (data) => api.post('/auth/admin/login', data)
}

export const patientAPI = {
  getAll: (params) => api.get('/patients', { params }),
  getById: (id) => api.get(`/patients/${id}`),
  getByPhone: (phone) => api.get(`/patients/by-phone/${phone}`),
  create: (data) => api.post('/patients', data),
  update: (id, data) => api.put(`/patients/${id}`, data),
  delete: (id) => api.delete(`/patients/${id}`)
}

export const doctorAPI = {
  getAll: () => api.get('/doctors'),
  getById: (id) => api.get(`/doctors/${id}`),
  create: (data) => api.post('/doctors', data),
  update: (id, data) => api.put(`/doctors/${id}`, data),
  delete: (id) => api.delete(`/doctors/${id}`)
}

export const scheduleAPI = {
  getAll: () => api.get('/schedules'),
  getByDoctor: (doctorId) => api.get(`/schedules/doctor/${doctorId}`),
  create: (data) => api.post('/schedules', data),
  batchCreate: (data) => api.post('/schedules/batch', data),
  update: (id, data) => api.put(`/schedules/${id}`, data),
  delete: (id) => api.delete(`/schedules/${id}`)
}

export const appointmentAPI = {
  getAll: (params) => api.get('/appointments', { params }),
  getByPatient: (patientId) => api.get(`/appointments/patient/${patientId}`),
  create: (data) => api.post('/appointments', data),
  update: (id, data) => api.put(`/appointments/${id}`, data),
  delete: (id) => api.delete(`/appointments/${id}`)
}

export const statisticsAPI = {
  getNoShowRate: (params) => api.get('/statistics/no-show-rate', { params }),
  getAppointmentTrend: (params) => api.get('/statistics/appointment-trend', { params }),
  getDoctorWorkload: (params) => api.get('/statistics/doctor-workload', { params }),
  getDashboardStats: () => api.get('/statistics/dashboard')
}

export default api
