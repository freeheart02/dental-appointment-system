<template>
  <div class="queue-management">
    <div class="header">
      <h1>叫号管理</h1>
      <button @click="goToDashboard" class="btn btn-secondary">
        返回控制台
      </button>
    </div>

    <div class="content">
      <div class="doctors-section">
        <div v-for="doctor in doctors" :key="doctor._id" class="doctor-panel">
          <div class="doctor-header">
            <h2>{{ doctor.name }}</h2>
            <span class="specialty">{{ doctor.specialty }}</span>
          </div>

          <div v-if="getDoctorData(doctor._id)?.currentPatient" class="current-patient">
            <div class="label">正在就诊</div>
            <div class="patient-info">
              <div class="patient-name">{{ getDoctorData(doctor._id).currentPatient.patientMaskedName }}</div>
              <div class="appointment-time">
                预约: {{ getDoctorData(doctor._id).currentPatient.appointmentTimeSlot }}
              </div>
              <div v-if="getDoctorData(doctor._id).currentPatient.isLate" class="late-badge">
                迟到
              </div>
            </div>
            <button 
              @click="completeVisit(getDoctorData(doctor._id).currentPatient)" 
              class="btn btn-success btn-small"
            >
              完成就诊
            </button>
          </div>

          <div v-else class="no-patient">
            暂无患者就诊
          </div>

          <div class="queue-section">
            <div class="section-header">
              <h3>等待队列</h3>
              <span class="count">({{ getDoctorData(doctor._id)?.queue?.length || 0 }})</span>
            </div>

            <div v-if="getDoctorData(doctor._id)?.queue?.length > 0" class="queue-list">
              <div 
                v-for="(item, index) in getDoctorData(doctor._id).queue" 
                :key="item._id"
                class="queue-item"
              >
                <div class="queue-number">{{ index + 1 }}</div>
                <div class="patient-details">
                  <div class="name">{{ item.patientMaskedName }}</div>
                  <div class="time">预约: {{ item.appointmentTimeSlot }}</div>
                </div>
                <div class="item-actions">
                  <span v-if="item.isLate" class="late-tag">迟到</span>
                  <button 
                    @click="skipPatient(item)" 
                    class="btn btn-outline btn-small"
                    title="延后"
                  >
                    延后
                  </button>
                  <button 
                    @click="removeFromQueue(item)" 
                    class="btn btn-danger btn-small"
                    title="移除"
                  >
                    移除
                  </button>
                </div>
              </div>
            </div>

            <div v-else class="empty-queue">
              暂无等待患者
            </div>

            <button 
              v-if="getDoctorData(doctor._id)?.queue?.length > 0 && !getDoctorData(doctor._id)?.currentPatient"
              @click="callNextPatient(doctor._id)" 
              class="btn btn-primary call-btn"
              :disabled="callingDoctor === doctor._id"
            >
              {{ callingDoctor === doctor._id ? '叫号中...' : '叫下一位' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { doctorAPI, queueAPI } from '../../utils/api'

const router = useRouter()
const doctors = ref([])
const queueData = ref({})
const refreshInterval = ref(null)
const callingDoctor = ref(null)

const fetchDoctors = async () => {
  try {
    const response = await doctorAPI.getAll()
    if (response.data.success) {
      doctors.value = response.data.data
    }
  } catch (error) {
    console.error('获取医生列表失败:', error)
  }
}

const fetchQueueData = async () => {
  try {
    const response = await queueAPI.getPublic()
    if (response.data.success) {
      const data = {}
      response.data.data.doctorsWithQueue.forEach(doctor => {
        data[doctor._id] = {
          currentPatient: doctor.currentPatient,
          queue: doctor.queue
        }
      })
      queueData.value = data
    }
  } catch (error) {
    console.error('获取排队数据失败:', error)
  }
}

const getDoctorData = (doctorId) => {
  return queueData.value[doctorId] || { queue: [], currentPatient: null }
}

const callNextPatient = async (doctorId) => {
  callingDoctor.value = doctorId
  try {
    const response = await queueAPI.callNext(doctorId)
    if (response.data.success) {
      await fetchQueueData()
    }
  } catch (error) {
    console.error('叫号失败:', error)
    alert('叫号失败，请重试')
  } finally {
    callingDoctor.value = null
  }
}

const completeVisit = async (queueItem) => {
  if (!confirm('确认完成该患者的就诊？')) return
  
  try {
    const response = await queueAPI.completeVisit(queueItem._id)
    if (response.data.success) {
      await fetchQueueData()
    }
  } catch (error) {
    console.error('完成就诊失败:', error)
    alert('操作失败，请重试')
  }
}

const skipPatient = async (queueItem) => {
  try {
    const response = await queueAPI.skipPatient(queueItem._id)
    if (response.data.success) {
      await fetchQueueData()
    }
  } catch (error) {
    console.error('延后失败:', error)
    alert('操作失败，请重试')
  }
}

const removeFromQueue = async (queueItem) => {
  if (!confirm('确认将该患者从队列中移除？')) return
  
  try {
    const response = await queueAPI.removeFromQueue(queueItem._id)
    if (response.data.success) {
      await fetchQueueData()
    }
  } catch (error) {
    console.error('移除失败:', error)
    alert('操作失败，请重试')
  }
}

const goToDashboard = () => {
  router.push('/admin/dashboard')
}

onMounted(() => {
  fetchDoctors()
  fetchQueueData()
  
  refreshInterval.value = setInterval(() => {
    fetchQueueData()
  }, 3000)
})

onUnmounted(() => {
  if (refreshInterval.value) {
    clearInterval(refreshInterval.value)
  }
})
</script>

<style scoped>
.queue-management {
  padding: 30px;
  max-width: 1600px;
  margin: 0 auto;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.header h1 {
  color: #333;
  font-size: 32px;
  margin: 0;
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-small {
  padding: 8px 16px;
  font-size: 14px;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(102, 126, 234, 0.3);
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
  box-shadow: 0 5px 15px rgba(16, 185, 129, 0.3);
}

.btn-danger {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
}

.btn-danger:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(239, 68, 68, 0.3);
}

.btn-outline {
  background: white;
  color: #667eea;
  border: 2px solid #667eea;
}

.btn-outline:hover:not(:disabled) {
  background: #f0f4ff;
}

.content {
  background: white;
  border-radius: 16px;
  padding: 30px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.doctors-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
  gap: 30px;
}

.doctor-panel {
  background: #f9fafb;
  border-radius: 16px;
  padding: 25px;
  border: 2px solid #e5e7eb;
}

.doctor-header {
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 2px solid #e5e7eb;
}

.doctor-header h2 {
  font-size: 24px;
  color: #333;
  margin: 0 0 8px 0;
}

.specialty {
  font-size: 14px;
  color: #667eea;
  font-weight: 500;
}

.current-patient {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 20px;
}

.current-patient .label {
  font-size: 14px;
  opacity: 0.9;
  margin-bottom: 12px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.patient-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 15px;
}

.patient-info .patient-name {
  font-size: 24px;
  font-weight: bold;
}

.patient-info .appointment-time {
  font-size: 14px;
  opacity: 0.9;
}

.late-badge {
  display: inline-block;
  background: rgba(255, 255, 255, 0.2);
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  margin-top: 8px;
}

.no-patient {
  background: #f3f4f6;
  color: #9ca3af;
  padding: 30px;
  border-radius: 12px;
  text-align: center;
  margin-bottom: 20px;
  font-size: 16px;
}

.queue-section {
  margin-top: 20px;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
}

.section-header h3 {
  font-size: 18px;
  color: #333;
  margin: 0;
}

.section-header .count {
  color: #667eea;
  font-weight: 600;
}

.queue-list {
  max-height: 400px;
  overflow-y: auto;
  margin-bottom: 15px;
}

.queue-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px;
  background: white;
  border-radius: 10px;
  margin-bottom: 10px;
  border: 1px solid #e5e7eb;
}

.queue-number {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 16px;
  flex-shrink: 0;
}

.patient-details {
  flex: 1;
}

.patient-details .name {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.patient-details .time {
  font-size: 14px;
  color: #666;
}

.item-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.late-tag {
  background: #fef2f2;
  color: #dc2626;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
}

.empty-queue {
  color: #9ca3af;
  text-align: center;
  padding: 30px;
  font-size: 16px;
  margin-bottom: 15px;
}

.call-btn {
  width: 100%;
  font-size: 18px;
  padding: 15px;
}
</style>
