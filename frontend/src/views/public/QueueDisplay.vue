<template>
  <div class="queue-display">
    <div v-if="showCalling && currentCalling" class="calling-overlay" @click="closeCalling">
      <div class="calling-content">
        <div class="calling-patient-name">{{ currentCalling.patientName }}</div>
        <div class="calling-doctor-info">
          请前往 {{ currentCalling.doctorName }} 医生诊室
        </div>
      </div>
    </div>

    <div class="header">
      <h1>口腔诊所候诊大厅</h1>
      <div class="current-time">{{ currentTime }}</div>
    </div>

    <div class="main-content">
      <div class="doctors-section">
        <div v-for="doctor in doctorsWithQueue" :key="doctor._id" class="doctor-card">
          <div class="doctor-header">
            <h2>{{ doctor.name }}</h2>
            <span class="specialty">{{ doctor.specialty }}</span>
          </div>
          
          <div v-if="doctor.currentPatient" class="current-patient">
            <div class="label">正在就诊</div>
            <div class="patient-name">{{ doctor.currentPatient.patientMaskedName }}</div>
            <div class="appointment-time">预约时间: {{ doctor.currentPatient.appointmentTimeSlot }}</div>
          </div>
          
          <div v-else class="no-patient">
            暂无患者就诊
          </div>

          <div class="queue-list">
            <div class="queue-title">等待队列</div>
            <div v-if="doctor.queue.length > 0" class="queue-items">
              <div v-for="(item, index) in doctor.queue.slice(0, 5)" :key="item._id" class="queue-item">
                <span class="queue-number">{{ index + 1 }}</span>
                <span class="patient-name">{{ item.patientMaskedName }}</span>
                <span v-if="item.isLate" class="late-tag">迟到</span>
              </div>
            </div>
            <div v-else class="empty-queue">暂无等待患者</div>
            <div v-if="doctor.queue.length > 5" class="more-patients">
              还有 {{ doctor.queue.length - 5 }} 位患者等待
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="marquee-section">
      <div class="marquee-container">
        <div class="marquee-content" :style="{ animationDuration: `${marqueeDuration}s` }">
          <span v-for="(item, index) in allWaitingPatients" :key="index" class="marquee-item">
            {{ item.patientMaskedName }} - {{ item.doctorName }}
          </span>
          <span v-if="allWaitingPatients.length === 0" class="marquee-item">
            欢迎来到口腔诊所
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { queueAPI } from '../../utils/api'

const doctorsWithQueue = ref([])
const currentCalling = ref(null)
const showCalling = ref(false)
const currentTime = ref('')
const refreshInterval = ref(null)
const speechSynthesis = window.speechSynthesis

const marqueeDuration = computed(() => {
  const baseDuration = 10
  const itemDuration = 2
  return Math.max(baseDuration, allWaitingPatients.value.length * itemDuration)
})

const allWaitingPatients = computed(() => {
  return doctorsWithQueue.value.flatMap(doctor => doctor.queue || [])
})

const updateCurrentTime = () => {
  const now = new Date()
  currentTime.value = now.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

const speak = (text) => {
  if (speechSynthesis) {
    speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'zh-CN'
    utterance.rate = 0.9
    utterance.pitch = 1
    utterance.volume = 1
    speechSynthesis.speak(utterance)
  }
}

const announceCalling = (callingData) => {
  const text = `请 ${callingData.patientName} 前往 ${callingData.doctorName} 医生诊室就诊`
  speak(text)
}

const fetchQueueData = async () => {
  try {
    const response = await queueAPI.getPublic()
    if (response.data.success) {
      const newDoctors = response.data.data.doctorsWithQueue || []
      const newCalling = response.data.data.currentCalling
      
      doctorsWithQueue.value = newDoctors
      
      if (newCalling && (!currentCalling.value || newCalling.time !== currentCalling.value.time)) {
        currentCalling.value = newCalling
        showCalling.value = true
        
        setTimeout(() => {
          announceCalling(newCalling)
        }, 500)
        
        setTimeout(() => {
          closeCalling()
        }, 10000)
      }
    }
  } catch (error) {
    console.error('获取排队数据失败:', error)
  }
}

const closeCalling = () => {
  showCalling.value = false
}

onMounted(() => {
  updateCurrentTime()
  fetchQueueData()
  
  refreshInterval.value = setInterval(() => {
    updateCurrentTime()
    fetchQueueData()
  }, 3000)
})

onUnmounted(() => {
  if (refreshInterval.value) {
    clearInterval(refreshInterval.value)
  }
  if (speechSynthesis) {
    speechSynthesis.cancel()
  }
})
</script>

<style scoped>
.queue-display {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  flex-direction: column;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.calling-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease;
  cursor: pointer;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.calling-content {
  text-align: center;
  color: white;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.calling-patient-name {
  font-size: 120px;
  font-weight: bold;
  margin-bottom: 40px;
  text-shadow: 0 0 30px rgba(102, 126, 234, 0.8);
}

.calling-doctor-info {
  font-size: 48px;
  opacity: 0.9;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding: 20px 40px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  backdrop-filter: blur(10px);
}

.header h1 {
  color: white;
  font-size: 48px;
  margin: 0;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
}

.current-time {
  color: white;
  font-size: 28px;
  font-weight: 500;
}

.main-content {
  flex: 1;
  padding: 0 20px;
}

.doctors-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 30px;
}

.doctor-card {
  background: white;
  border-radius: 20px;
  padding: 30px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  transition: transform 0.3s ease;
}

.doctor-card:hover {
  transform: translateY(-5px);
}

.doctor-header {
  margin-bottom: 25px;
  padding-bottom: 20px;
  border-bottom: 3px solid #667eea;
}

.doctor-header h2 {
  font-size: 32px;
  color: #333;
  margin: 0 0 10px 0;
}

.specialty {
  font-size: 18px;
  color: #667eea;
  font-weight: 500;
}

.current-patient {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 25px;
  border-radius: 15px;
  margin-bottom: 20px;
  text-align: center;
}

.current-patient .label {
  font-size: 16px;
  opacity: 0.9;
  margin-bottom: 10px;
}

.current-patient .patient-name {
  font-size: 36px;
  font-weight: bold;
  margin-bottom: 10px;
}

.current-patient .appointment-time {
  font-size: 16px;
  opacity: 0.85;
}

.no-patient {
  background: #f3f4f6;
  color: #9ca3af;
  padding: 30px;
  border-radius: 15px;
  text-align: center;
  font-size: 18px;
  margin-bottom: 20px;
}

.queue-list {
  margin-top: 20px;
}

.queue-title {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin-bottom: 15px;
  padding-left: 10px;
  border-left: 4px solid #667eea;
}

.queue-items {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.queue-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px;
  background: #f9fafb;
  border-radius: 10px;
  transition: background 0.2s ease;
}

.queue-item:hover {
  background: #f3f4f6;
}

.queue-number {
  width: 35px;
  height: 35px;
  background: #667eea;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 16px;
}

.queue-item .patient-name {
  flex: 1;
  font-size: 18px;
  color: #333;
  font-weight: 500;
}

.late-tag {
  background: #ef4444;
  color: white;
  padding: 4px 10px;
  border-radius: 5px;
  font-size: 12px;
  font-weight: 600;
}

.empty-queue {
  color: #9ca3af;
  text-align: center;
  padding: 20px;
  font-size: 16px;
}

.more-patients {
  color: #667eea;
  text-align: center;
  padding: 15px;
  font-size: 14px;
  font-weight: 500;
}

.marquee-section {
  margin-top: 30px;
  background: white;
  border-radius: 15px;
  padding: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.marquee-container {
  overflow: hidden;
}

.marquee-content {
  display: flex;
  gap: 60px;
  white-space: nowrap;
  animation: marquee linear infinite;
}

@keyframes marquee {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}

.marquee-item {
  font-size: 24px;
  color: #333;
  font-weight: 500;
}

/* Duplicate for seamless loop */
.marquee-content::after {
  content: '';
  flex: 0 0 100%;
}
</style>
