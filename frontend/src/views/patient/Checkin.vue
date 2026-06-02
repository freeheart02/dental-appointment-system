<template>
  <div class="checkin-container">
    <div class="checkin-card">
      <h1>患者签到</h1>
      
      <div v-if="!checkedIn" class="step-1">
        <div class="form-group">
          <label>手机号</label>
          <input 
            v-model="phone" 
            type="tel" 
            placeholder="请输入手机号"
            maxlength="11"
          />
        </div>
        
        <button @click="searchAppointments" class="btn btn-primary" :disabled="!phone || loading">
          {{ loading ? '查询中...' : '查询预约' }}
        </button>
      </div>

      <div v-if="appointments.length > 0 && !checkedIn" class="step-2">
        <h3>请选择要签到的预约</h3>
        <div class="appointments-list">
          <div 
            v-for="appointment in appointments" 
            :key="appointment._id"
            class="appointment-item"
            :class="{ selected: selectedAppointment?._id === appointment._id }"
            @click="selectAppointment(appointment)"
          >
            <div class="doctor-info">
              <div class="doctor-name">{{ appointment.doctor?.name || '未知医生' }}</div>
              <div class="specialty">{{ appointment.doctor?.specialty || '' }}</div>
            </div>
            <div class="appointment-details">
              <div class="date">{{ formatDate(appointment.date) }}</div>
              <div class="time">{{ appointment.timeSlot }}</div>
            </div>
            <div class="status" :class="appointment.status">
              {{ getStatusText(appointment.status) }}
            </div>
          </div>
        </div>

        <button 
          v-if="selectedAppointment" 
          @click="checkin" 
          class="btn btn-success"
          :disabled="checkingIn"
        >
          {{ checkingIn ? '签到中...' : '确认签到' }}
        </button>

        <button @click="reset" class="btn btn-secondary">
          返回
        </button>
      </div>

      <div v-if="noAppointments" class="no-appointments">
        <div class="icon">📋</div>
        <p>未找到今天的预约记录</p>
        <button @click="reset" class="btn btn-secondary">
          返回
        </button>
      </div>

      <div v-if="checkedIn" class="success-message">
        <div class="icon">✅</div>
        <h2>签到成功！</h2>
        <p>您已成功签到，请在候诊区等待叫号</p>
        <div class="queue-info" v-if="queueInfo">
          <p>您的排队信息：</p>
          <p class="doctor-name">{{ queueInfo.doctorName }}</p>
          <p class="patient-name">{{ queueInfo.patientMaskedName }}</p>
        </div>
        <button @click="goHome" class="btn btn-primary">
          返回首页
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { appointmentAPI, patientAPI, queueAPI } from '../../utils/api'

const router = useRouter()
const phone = ref('')
const appointments = ref([])
const selectedAppointment = ref(null)
const loading = ref(false)
const checkingIn = ref(false)
const checkedIn = ref(false)
const noAppointments = ref(false)
const queueInfo = ref(null)
const patient = ref(null)

const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  })
}

const getStatusText = (status) => {
  const statusMap = {
    'pending': '待就诊',
    'checked-in': '已签到',
    'completed': '已完成',
    'cancelled': '已取消',
    'no-show': '未到诊'
  }
  return statusMap[status] || status
}

const searchAppointments = async () => {
  if (!phone.value) return
  
  loading.value = true
  noAppointments.value = false
  
  try {
    const patientResponse = await patientAPI.getByPhone(phone.value)
    if (patientResponse.data.success && patientResponse.data.data) {
      patient.value = patientResponse.data.data
      
      const appointmentsResponse = await appointmentAPI.getByPatient(patient.value._id)
      if (appointmentsResponse.data.success) {
        const today = new Date().toISOString().split('T')[0]
        const todayAppointments = appointmentsResponse.data.data.filter(apt => {
          const aptDate = new Date(apt.date).toISOString().split('T')[0]
          return aptDate === today && apt.status === 'pending'
        })
        
        if (todayAppointments.length > 0) {
          appointments.value = todayAppointments
        } else {
          noAppointments.value = true
        }
      }
    } else {
      noAppointments.value = true
    }
  } catch (error) {
    console.error('查询失败:', error)
    noAppointments.value = true
  } finally {
    loading.value = false
  }
}

const selectAppointment = (appointment) => {
  selectedAppointment.value = appointment
}

const checkin = async () => {
  if (!selectedAppointment.value || !patient.value) return
  
  checkingIn.value = true
  
  try {
    const response = await queueAPI.checkIn({
      appointmentId: selectedAppointment.value._id,
      patientId: patient.value._id,
      doctorId: selectedAppointment.value.doctorId
    })
    
    if (response.data.success) {
      checkedIn.value = true
      queueInfo.value = response.data.data
    }
  } catch (error) {
    console.error('签到失败:', error)
    alert('签到失败，请重试')
  } finally {
    checkingIn.value = false
  }
}

const reset = () => {
  phone.value = ''
  appointments.value = []
  selectedAppointment.value = null
  noAppointments.value = false
  checkedIn.value = false
  queueInfo.value = null
  patient.value = null
}

const goHome = () => {
  router.push('/')
}
</script>

<style scoped>
.checkin-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.checkin-card {
  background: white;
  border-radius: 20px;
  padding: 40px;
  max-width: 600px;
  width: 100%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.checkin-card h1 {
  text-align: center;
  color: #333;
  margin-bottom: 30px;
  font-size: 32px;
}

.form-group {
  margin-bottom: 25px;
}

.form-group label {
  display: block;
  margin-bottom: 10px;
  color: #333;
  font-weight: 600;
  font-size: 16px;
}

.form-group input {
  width: 100%;
  padding: 15px;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  font-size: 18px;
  transition: border-color 0.2s ease;
  box-sizing: border-box;
}

.form-group input:focus {
  outline: none;
  border-color: #667eea;
}

.btn {
  width: 100%;
  padding: 15px 30px;
  border: none;
  border-radius: 10px;
  font-size: 18px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: 10px;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
}

.btn-secondary {
  background: #f3f4f6;
  color: #333;
}

.btn-secondary:hover:not(:disabled) {
  background: #e5e7eb;
}

.btn-success {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
}

.btn-success:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(16, 185, 129, 0.3);
}

.step-2 h3 {
  color: #333;
  margin-bottom: 20px;
  text-align: center;
}

.appointments-list {
  margin-bottom: 25px;
  max-height: 400px;
  overflow-y: auto;
}

.appointment-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  background: #f9fafb;
  border-radius: 12px;
  margin-bottom: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 2px solid transparent;
}

.appointment-item:hover {
  background: #f3f4f6;
}

.appointment-item.selected {
  border-color: #667eea;
  background: #f0f4ff;
}

.doctor-info {
  flex: 1;
}

.doctor-info .doctor-name {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin-bottom: 5px;
}

.doctor-info .specialty {
  font-size: 14px;
  color: #667eea;
}

.appointment-details {
  text-align: center;
  margin: 0 20px;
}

.appointment-details .date {
  font-size: 14px;
  color: #666;
  margin-bottom: 5px;
}

.appointment-details .time {
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.status {
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
}

.status.pending {
  background: #fef3c7;
  color: #d97706;
}

.no-appointments,
.success-message {
  text-align: center;
  padding: 40px 20px;
}

.no-appointments .icon,
.success-message .icon {
  font-size: 80px;
  margin-bottom: 20px;
}

.no-appointments p,
.success-message p {
  color: #666;
  font-size: 18px;
  margin-bottom: 30px;
}

.success-message h2 {
  color: #10b981;
  font-size: 32px;
  margin-bottom: 15px;
}

.queue-info {
  background: #f0f4ff;
  padding: 25px;
  border-radius: 12px;
  margin-bottom: 25px;
}

.queue-info p {
  margin: 8px 0;
}

.queue-info .doctor-name {
  font-size: 24px;
  font-weight: 600;
  color: #667eea;
}

.queue-info .patient-name {
  font-size: 20px;
  color: #333;
}
</style>
