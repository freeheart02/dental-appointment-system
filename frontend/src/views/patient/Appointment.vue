<template>
  <div class="min-h-screen bg-gray-50">
    <div v-if="isBlocked" class="min-h-screen flex items-center justify-center">
      <div class="bg-white rounded-xl p-8 shadow-lg text-center max-w-md mx-4">
        <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Lock class="w-8 h-8 text-red-500" />
        </div>
        <h2 class="text-xl font-semibold text-gray-800 mb-2">预约限制</h2>
        <p class="text-gray-600 mb-6">
          由于您的爽约次数已达到3次，暂时无法进行预约。如有疑问，请联系诊所工作人员。
        </p>
        <button
          @click="logout"
          class="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all"
        >
          返回登录
        </button>
      </div>
    </div>
    
    <header class="bg-white shadow-sm">
      <div class="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
        <div class="flex items-center gap-3">
          <button @click="goBack" class="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft class="w-5 h-5 text-gray-600" />
          </button>
          <span class="text-xl font-bold text-gray-800">预约就诊</span>
        </div>
        <div class="flex items-center gap-4">
          <span class="text-gray-600">{{ user?.name }}</span>
          <button @click="logout" class="text-red-500 hover:text-red-600">
            退出
          </button>
        </div>
      </div>
    </header>

    <main class="max-w-4xl mx-auto px-4 py-8">
      <div v-if="!step1Done" class="bg-white rounded-xl p-6 shadow-md">
        <h2 class="text-lg font-semibold text-gray-800 mb-4">选择医生</h2>
        <div class="grid md:grid-cols-2 gap-4">
          <div
            v-for="doctor in doctors"
            :key="doctor._id"
            @click="selectDoctor(doctor)"
            :class="[
              'p-4 rounded-lg border-2 cursor-pointer transition-all',
              selectedDoctor?._id === doctor._id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            ]"
          >
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 bg-gradient-to-br from-blue-400 to-dental-400 rounded-full flex items-center justify-center">
                <User class="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 class="font-semibold text-gray-800">{{ doctor.name }}</h3>
                <p class="text-sm text-gray-500">{{ doctor.specialty }}</p>
              </div>
            </div>
            <p v-if="doctor.description" class="mt-2 text-sm text-gray-600">{{ doctor.description }}</p>
          </div>
        </div>
        <button
          @click="nextStep"
          :disabled="!selectedDoctor"
          class="mt-6 w-full py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all"
        >
          下一步
        </button>
      </div>

      <div v-else-if="!step2Done" class="bg-white rounded-xl p-6 shadow-md">
        <div class="flex items-center gap-4 mb-6">
          <button @click="prevStep" class="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft class="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h2 class="text-lg font-semibold text-gray-800">选择日期</h2>
            <p class="text-sm text-gray-500">医生：{{ selectedDoctor?.name }} - {{ selectedDoctor?.specialty }}</p>
          </div>
        </div>
        
        <div class="grid grid-cols-7 gap-2 mb-6">
          <div v-for="day in weekDays" :key="day" class="text-center text-sm font-medium text-gray-500 py-2">
            {{ day }}
          </div>
          <div
            v-for="date in calendarDates"
            :key="date.date"
            @click="selectDate(date)"
            :class="[
              'py-3 rounded-lg text-center cursor-pointer transition-all',
              !date.available ? 'bg-gray-100 text-gray-400 cursor-not-allowed' :
              selectedDate?.date === date.date ? 'bg-blue-500 text-white' :
              'bg-white hover:bg-blue-50 text-gray-800'
            ]"
          >
            {{ date.day }}
          </div>
        </div>
        
        <button
          @click="nextStep"
          :disabled="!selectedDate"
          class="w-full py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all"
        >
          下一步
        </button>
      </div>

      <div v-else-if="!step3Done" class="bg-white rounded-xl p-6 shadow-md">
        <div class="flex items-center gap-4 mb-6">
          <button @click="prevStep" class="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft class="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h2 class="text-lg font-semibold text-gray-800">选择时间段</h2>
            <p class="text-sm text-gray-500">{{ selectedDate?.date }}</p>
          </div>
        </div>
        
        <div v-if="availableSlots.length > 0" class="grid grid-cols-3 gap-3">
          <div
            v-for="slot in availableSlots"
            :key="slot.time"
            @click="selectTimeSlot(slot)"
            :class="[
              'py-3 px-4 rounded-lg text-center cursor-pointer transition-all',
              selectedTimeSlot?.time === slot.time
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 hover:bg-blue-100 text-gray-800'
            ]"
          >
            {{ slot.time }}
            <p class="text-xs mt-1" :class="selectedTimeSlot?.time === slot.time ? 'text-blue-100' : 'text-gray-500'">
              剩余{{ slot.available }}个号
            </p>
          </div>
        </div>
        <div v-else class="text-center py-8 text-gray-500">
          <Clock class="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>该日期暂无可用时间段</p>
        </div>
        
        <button
          v-if="availableSlots.length > 0"
          @click="nextStep"
          :disabled="!selectedTimeSlot"
          class="mt-6 w-full py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all"
        >
          下一步
        </button>
      </div>

      <div v-else class="bg-white rounded-xl p-6 shadow-md">
        <div class="flex items-center gap-4 mb-6">
          <button @click="prevStep" class="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft class="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h2 class="text-lg font-semibold text-gray-800">选择就诊类型</h2>
          </div>
        </div>
        
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div
            v-for="type in appointmentTypes"
            :key="type"
            @click="selectType(type)"
            :class="[
              'p-4 rounded-lg border-2 cursor-pointer transition-all text-center',
              selectedType === type
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            ]"
          >
            <span class="font-medium text-gray-800">{{ type }}</span>
          </div>
        </div>
        
        <div class="mt-8 p-4 bg-gray-50 rounded-lg">
          <h3 class="font-semibold text-gray-800 mb-2">预约信息确认</h3>
          <div class="space-y-2 text-sm text-gray-600">
            <div class="flex justify-between">
              <span>医生：</span>
              <span>{{ selectedDoctor?.name }}</span>
            </div>
            <div class="flex justify-between">
              <span>日期：</span>
              <span>{{ selectedDate?.date }}</span>
            </div>
            <div class="flex justify-between">
              <span>时间：</span>
              <span>{{ selectedTimeSlot?.time }}</span>
            </div>
            <div class="flex justify-between">
              <span>就诊类型：</span>
              <span>{{ selectedType }}</span>
            </div>
          </div>
        </div>
        
        <button
          @click="confirmAppointment"
          :disabled="!selectedType || isSubmitting"
          class="mt-6 w-full py-3 bg-gradient-to-r from-blue-500 to-dental-500 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-dental-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all"
        >
          {{ isSubmitting ? '提交中...' : '确认预约' }}
        </button>
      </div>

      <div v-if="showSuccess" class="bg-white rounded-xl p-8 shadow-md text-center">
        <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle class="w-8 h-8 text-green-500" />
        </div>
        <h2 class="text-xl font-bold text-gray-800 mb-2">预约成功</h2>
        <p class="text-gray-600 mb-6">您的预约已成功提交，请按时前往诊所就诊</p>
        <div class="flex gap-4 justify-center">
          <button @click="goBack" class="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all">
            返回首页
          </button>
          <button @click="goToMyAppointments" class="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all">
            查看预约
          </button>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, User, Clock, CheckCircle, Lock } from 'lucide-vue-next'
import { useAuthStore } from '../../stores/auth'
import { doctorAPI, scheduleAPI, appointmentAPI, patientAPI } from '../../utils/api'

const router = useRouter()
const authStore = useAuthStore()

const user = ref(null)
const patient = ref(null)
const doctors = ref([])
const schedules = ref([])
const isBlocked = ref(false)

const selectedDoctor = ref(null)
const selectedDate = ref(null)
const selectedTimeSlot = ref(null)
const selectedType = ref('')

const step1Done = ref(false)
const step2Done = ref(false)
const step3Done = ref(false)
const showSuccess = ref(false)
const isSubmitting = ref(false)

const weekDays = ['日', '一', '二', '三', '四', '五', '六']
const appointmentTypes = ['洗牙', '补牙', '拔牙', '根管治疗', '牙齿矫正', '种植牙', '口腔检查', '其他']

const calendarDates = computed(() => {
  const dates = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  for (let i = 0; i < 35; i++) {
    const date = new Date(today)
    date.setDate(today.getDate() + i)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const dateStr = `${year}-${month}-${day}`
    
    const hasSchedule = schedules.value.some(
      s => s.doctorId === selectedDoctor.value?._id && s.date === dateStr
    )
    dates.push({
      date: dateStr,
      day: date.getDate(),
      available: hasSchedule
    })
  }
  return dates
})

const availableSlots = computed(() => {
  if (!selectedDoctor.value || !selectedDate.value) return []
  const schedule = schedules.value.find(
    s => s.doctorId === selectedDoctor.value._id && s.date === selectedDate.value.date
  )
  
  if (!schedule) return []
  
  if (Array.isArray(schedule.timeSlots) && schedule.timeSlots.length > 0) {
    if (typeof schedule.timeSlots[0] === 'string') {
      return schedule.timeSlots.map(time => ({ time, available: 1 }))
    }
    return schedule.timeSlots
  }
  return []
})

const loadDoctors = async () => {
  try {
    const response = await doctorAPI.getAll()
    doctors.value = response.data
  } catch (error) {
    console.error('Failed to load doctors')
  }
}

const loadSchedules = async () => {
  if (!selectedDoctor.value) return
  try {
    const response = await scheduleAPI.getByDoctor(selectedDoctor.value._id)
    schedules.value = response.data
  } catch (error) {
    console.error('Failed to load schedules')
  }
}

const selectDoctor = (doctor) => {
  selectedDoctor.value = doctor
  selectedDate.value = null
  selectedTimeSlot.value = null
  loadSchedules()
}

const selectDate = (date) => {
  if (date.available) {
    selectedDate.value = date
    selectedTimeSlot.value = null
  }
}

const selectTimeSlot = (slot) => {
  if (slot.available > 0) {
    selectedTimeSlot.value = slot
  }
}

const selectType = (type) => {
  selectedType.value = type
}

const nextStep = () => {
  if (!step1Done.value) {
    step1Done.value = true
  } else if (!step2Done.value) {
    step2Done.value = true
  } else if (!step3Done.value) {
    step3Done.value = true
  }
}

const prevStep = () => {
  if (step3Done.value) {
    step3Done.value = false
  } else if (step2Done.value) {
    step2Done.value = false
  } else if (step1Done.value) {
    step1Done.value = false
  }
}

const confirmAppointment = async () => {
  isSubmitting.value = true
  try {
    const patientInfo = JSON.parse(localStorage.getItem('user') || '{}')
    console.log('预约信息:', {
      patientId: patientInfo.patientId,
      name: patientInfo.name,
      phone: patientInfo.phone,
      doctorId: selectedDoctor.value._id,
      date: selectedDate.value.date,
      timeSlot: selectedTimeSlot.value.time,
      type: selectedType.value
    })
    
    const response = await appointmentAPI.create({
      patientId: patientInfo.patientId || '650000000000000000000001',
      patientName: patientInfo.name,
      patientPhone: patientInfo.phone,
      doctorId: selectedDoctor.value._id,
      date: selectedDate.value.date,
      timeSlot: selectedTimeSlot.value.time,
      type: selectedType.value
    })
    
    console.log('预约响应:', response.data)
    
    if (response.data.success) {
      showSuccess.value = true
    } else {
      alert(response.data.message || '预约失败，请重试')
    }
  } catch (error) {
    console.error('预约失败:', error)
    console.error('错误响应:', error.response?.data)
    alert(error.response?.data?.message || '预约失败，请重试')
  }
  isSubmitting.value = false
}

const goBack = () => {
  router.push('/')
}

const goToMyAppointments = () => {
  router.push('/my-appointments')
}

const logout = () => {
  authStore.logout()
  router.push('/')
}

const loadPatient = async () => {
  try {
    const response = await patientAPI.getByPhone(authStore.user.phone)
    if (response.data) {
      patient.value = response.data
      if ((patient.value.noShowCount || 0) >= 3) {
        isBlocked.value = true
      }
    }
  } catch (error) {
    console.error('Failed to load patient')
  }
}

onMounted(() => {
  authStore.initUser()
  user.value = authStore.user
  loadPatient()
  loadDoctors()
})
</script>
