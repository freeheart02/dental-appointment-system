<template>
  <div class="min-h-screen bg-gray-50">
    <header class="bg-white shadow-sm">
      <div class="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
        <div class="flex items-center gap-3">
          <button @click="goBack" class="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft class="w-5 h-5 text-gray-600" />
          </button>
          <span class="text-xl font-bold text-gray-800">我的预约</span>
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
      <div v-if="appointments.length === 0" class="bg-white rounded-xl p-12 shadow-md text-center">
        <Calendar class="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <h2 class="text-lg font-semibold text-gray-800 mb-2">暂无预约记录</h2>
        <p class="text-gray-500 mb-6">您还没有任何预约，请前往预约页面进行预约</p>
        <button @click="goToAppointment" class="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all">
          去预约
        </button>
      </div>

      <div v-else class="space-y-4">
        <div
          v-for="appointment in sortedAppointments"
          :key="appointment._id"
          class="bg-white rounded-xl p-6 shadow-md"
        >
          <div class="flex justify-between items-start mb-4">
            <div>
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-gradient-to-br from-blue-400 to-dental-400 rounded-full flex items-center justify-center">
                  <User class="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 class="font-semibold text-gray-800">{{ appointment.doctorId?.name }}</h3>
                  <p class="text-sm text-gray-500">{{ appointment.doctorId?.specialty }}</p>
                </div>
              </div>
            </div>
            <span :class="getStatusClass(appointment.status)" class="px-3 py-1 rounded-full text-sm font-medium">
              {{ getStatusText(appointment.status) }}
            </span>
          </div>

          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span class="text-gray-500">就诊日期</span>
              <p class="font-medium text-gray-800">{{ formatDate(appointment.date) }}</p>
            </div>
            <div>
              <span class="text-gray-500">就诊时间</span>
              <p class="font-medium text-gray-800">{{ appointment.timeSlot }}</p>
            </div>
            <div>
              <span class="text-gray-500">就诊类型</span>
              <p class="font-medium text-gray-800">{{ appointment.type || '初诊' }}</p>
            </div>
            <div>
              <span class="text-gray-500">科室</span>
              <p class="font-medium text-gray-800">{{ appointment.doctorId?.specialty || appointment.doctorId?.department || '口腔科' }}</p>
            </div>
          </div>

          <div class="mt-4 flex gap-3">
            <button
              v-if="canCancel(appointment)"
              @click="cancelAppointment(appointment._id)"
              class="px-4 py-2 text-red-500 border border-red-500 rounded-lg hover:bg-red-50 transition-all"
            >
              取消预约
            </button>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, Calendar, User } from 'lucide-vue-next'
import { useAuthStore } from '../../stores/auth'
import { appointmentAPI } from '../../utils/api'

const router = useRouter()
const authStore = useAuthStore()

const user = ref(null)
const appointments = ref([])

const sortedAppointments = computed(() => {
  return [...appointments.value].sort((a, b) => new Date(b.date) - new Date(a.date))
})

const getStatusText = (status) => {
  const map = {
    pending: '待确认',
    confirmed: '已确认',
    visited: '已就诊',
    no_show: '爽约',
    canceled: '已取消'
  }
  return map[status] || status
}

const getStatusClass = (status) => {
  const map = {
    pending: 'bg-yellow-100 text-yellow-700',
    confirmed: 'bg-green-100 text-green-700',
    visited: 'bg-blue-100 text-blue-700',
    no_show: 'bg-red-100 text-red-700',
    canceled: 'bg-gray-100 text-gray-500'
  }
  return map[status] || 'bg-gray-100 text-gray-700'
}

const formatDate = (dateStr) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

const canCancel = (appointment) => {
  return appointment.status === 'pending' || appointment.status === 'confirmed'
}

const loadAppointments = async () => {
  try {
    const patientInfo = JSON.parse(localStorage.getItem('user') || '{}')
    const response = await appointmentAPI.getByPatient(patientInfo.patientId || '650000000000000000000001')
    appointments.value = response.data
  } catch (error) {
    console.error('Failed to load appointments')
  }
}

const cancelAppointment = async (id) => {
  if (!confirm('确定要取消这个预约吗？')) return
  try {
    await appointmentAPI.delete(id)
    loadAppointments()
    alert('取消成功')
  } catch (error) {
    alert('取消失败')
  }
}

const goBack = () => {
  router.push('/')
}

const goToAppointment = () => {
  router.push('/appointment')
}

const logout = () => {
  authStore.logout()
  router.push('/')
}

onMounted(() => {
  authStore.initUser()
  user.value = authStore.user
  loadAppointments()
})
</script>
