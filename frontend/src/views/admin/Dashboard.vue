<template>
  <AdminLayout title="控制台">
    <div class="grid grid-cols-3 gap-6">
      <div class="col-span-1 flex flex-col gap-6">
        <div class="bg-white rounded-xl shadow-md">
          <div class="p-4 border-b border-gray-200">
            <div class="flex items-center justify-between">
              <button @click="navMonth(currentDate, -1)" class="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <ChevronLeft class="w-5 h-5" />
              </button>
              <h3 class="text-lg font-semibold">{{ monthNames[currentDate.getMonth()] }} {{ currentDate.getFullYear() }}</h3>
              <button @click="navMonth(currentDate, 1)" class="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <ChevronRight class="w-5 h-5" />
              </button>
            </div>
          </div>
          <div class="p-4">
            <div class="grid grid-cols-7 gap-1 mb-2">
              <div v-for="day in weekDays" :key="day" class="text-center text-sm font-medium text-gray-600 py-2">
                {{ day }}
              </div>
            </div>
            <div class="grid grid-cols-7 gap-1">
              <div
                v-for="(day, index) in calendarDays(currentDate, selectedDate)"
                :key="index"
                @click="day.date && selectDate(day)"
                :class="[
                  'text-center py-2 cursor-pointer rounded-lg transition-all text-sm',
                  day.isToday ? 'bg-blue-100 font-bold' : '',
                  day.isSelected ? 'bg-blue-500 text-white hover:bg-blue-600' : 'hover:bg-gray-100',
                  !day.date ? 'text-gray-300 cursor-default' : 'text-gray-700'
                ]"
              >
                {{ day.day }}
              </div>
            </div>
          </div>
        </div>
        
        <div class="grid grid-cols-2 gap-4">
          <router-link to="/admin/patients" class="bg-white rounded-xl p-4 shadow-md cursor-pointer hover:shadow-lg transition-all flex flex-col">
            <div class="flex items-center justify-between flex-1">
              <div>
                <p class="text-gray-500 text-xs">今日预约患者</p>
                <p class="text-2xl font-bold text-gray-800 mt-1">{{ stats.todayPatients }}</p>
              </div>
              <div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Users class="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <div class="mt-3 text-blue-500 text-xs flex items-center gap-1">
              <span>查看详情</span>
              <ChevronRight class="w-3 h-3" />
            </div>
          </router-link>
          
          <router-link to="/admin/doctors" class="bg-white rounded-xl p-4 shadow-md cursor-pointer hover:shadow-lg transition-all flex flex-col">
            <div class="flex items-center justify-between flex-1">
              <div>
                <p class="text-gray-500 text-xs">今日出诊医生</p>
                <p class="text-2xl font-bold text-gray-800 mt-1">{{ stats.todayDoctors }}</p>
              </div>
              <div class="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <User class="w-5 h-5 text-green-600" />
              </div>
            </div>
            <div class="mt-3 text-green-500 text-xs flex items-center gap-1">
              <span>查看详情</span>
              <ChevronRight class="w-3 h-3" />
            </div>
          </router-link>
        </div>
      </div>
      
      <div class="col-span-2">
        <div class="bg-white rounded-xl p-5 shadow-md h-full">
          <div class="flex items-center justify-between mb-4">
            <h4 class="text-base font-semibold text-gray-800">{{ selectedDateDisplay || '今日预约列表' }}</h4>
            <button v-if="selectedDate" @click="selectedDate = null" class="text-gray-500 hover:text-gray-700">
              <X class="w-5 h-5" />
            </button>
          </div>
          
          <div v-if="selectedDateAppointments.length > 0" class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-gray-200">
                  <th 
                    @click="handleSort('patientName')"
                    class="text-left py-2 px-3 text-xs font-medium text-gray-500 cursor-pointer hover:text-blue-600"
                  >
                    患者姓名
                    <span v-if="sortField === 'patientName'" class="ml-1">
                      <ArrowUp v-if="sortOrder === 'asc'" class="w-3 h-3 inline" />
                      <ArrowDown v-else class="w-3 h-3 inline" />
                    </span>
                  </th>
                  <th 
                    @click="handleSort('phone')"
                    class="text-left py-2 px-3 text-xs font-medium text-gray-500 cursor-pointer hover:text-blue-600"
                  >
                    电话
                    <span v-if="sortField === 'phone'" class="ml-1">
                      <ArrowUp v-if="sortOrder === 'asc'" class="w-3 h-3 inline" />
                      <ArrowDown v-else class="w-3 h-3 inline" />
                    </span>
                  </th>
                  <th 
                    @click="handleSort('slot')"
                    class="text-left py-2 px-3 text-xs font-medium text-gray-500 cursor-pointer hover:text-blue-600"
                  >
                    预约时间
                    <span v-if="sortField === 'slot'" class="ml-1">
                      <ArrowUp v-if="sortOrder === 'asc'" class="w-3 h-3 inline" />
                      <ArrowDown v-else class="w-3 h-3 inline" />
                    </span>
                  </th>
                  <th 
                    @click="handleSort('department')"
                    class="text-left py-2 px-3 text-xs font-medium text-gray-500 cursor-pointer hover:text-blue-600"
                  >
                    科室
                    <span v-if="sortField === 'department'" class="ml-1">
                      <ArrowUp v-if="sortOrder === 'asc'" class="w-3 h-3 inline" />
                      <ArrowDown v-else class="w-3 h-3 inline" />
                    </span>
                  </th>
                  <th 
                    @click="handleSort('doctorName')"
                    class="text-left py-2 px-3 text-xs font-medium text-gray-500 cursor-pointer hover:text-blue-600"
                  >
                    医生
                    <span v-if="sortField === 'doctorName'" class="ml-1">
                      <ArrowUp v-if="sortOrder === 'asc'" class="w-3 h-3 inline" />
                      <ArrowDown v-else class="w-3 h-3 inline" />
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="appointment in selectedDateAppointments"
                  :key="appointment._id"
                  class="border-b border-gray-100 hover:bg-gray-50"
                >
                  <td class="py-2 px-3 text-gray-800">{{ appointment.patientName }}</td>
                  <td class="py-2 px-3 text-gray-700">{{ appointment.phone || '-' }}</td>
                  <td class="py-2 px-3 text-blue-600 font-medium">{{ appointment.slot }}</td>
                  <td class="py-2 px-3 text-gray-700">{{ appointment.department }}</td>
                  <td class="py-2 px-3 text-gray-700">{{ appointment.doctorName }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-else class="text-center py-12 text-gray-400">
            <Calendar class="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>{{ selectedDate ? '该日期暂无预约' : '暂无预约记录' }}</p>
          </div>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Users, User, ChevronRight, ChevronLeft, X, Calendar, ArrowUp, ArrowDown } from 'lucide-vue-next'
import AdminLayout from '../../components/AdminLayout.vue'
import { statisticsAPI, appointmentAPI, scheduleAPI, doctorAPI } from '../../utils/api'

const stats = ref({
  totalPatients: 0,
  totalDoctors: 0,
  todayPatients: 0,
  todayDoctors: 0,
  totalAppointments: 0,
  noShowRate: 0
})

const appointments = ref([])
const schedules = ref([])
const doctors = ref([])
const sortField = ref('date')
const sortOrder = ref('desc')
const currentDate = ref(new Date())
const today = new Date().toISOString().split('T')[0]
const selectedDate = ref({
  day: new Date().getDate(),
  date: today,
  isToday: true
})

const weekDays = ['日', '一', '二', '三', '四', '五', '六']
const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']

const navMonth = (dateRef, delta) => {
  const d = dateRef.value
  dateRef.value = new Date(d.getFullYear(), d.getMonth() + delta, 1)
}

const calendarDays = (date, selected) => {
  const year = date.getFullYear()
  const month = date.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const todayStr = today
  const selectedStr = selected?.date || null
  const days = []
  
  for (let i = 0; i < firstDay; i++) days.push({ day: '', date: null, isToday: false, isSelected: false })
  for (let i = 1; i <= daysInMonth; i++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`
    days.push({ day: i, date: dateStr, isToday: dateStr === todayStr, isSelected: dateStr === selectedStr })
  }
  return days
}

const handleSort = (field) => {
  if (sortField.value === field) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortField.value = field
    sortOrder.value = 'asc'
  }
}

const selectedDateDisplay = computed(() => {
  if (!selectedDate.value) return ''
  const date = new Date(selectedDate.value.date)
  const weekDay = weekDays[date.getDay()]
  return `${selectedDate.value.date} (周${weekDay})`
})

const selectedDateAppointments = computed(() => {
  let filtered = appointments.value
  
  if (selectedDate.value?.date) {
    const targetDate = selectedDate.value.date
    filtered = appointments.value.filter(a => {
      const apptDate = typeof a.date === 'string' ? a.date.split('T')[0] : new Date(a.date).toISOString().split('T')[0]
      return apptDate === targetDate
    })
  }
  
  return [...filtered].sort((a, b) => {
    let valA, valB
    switch (sortField.value) {
      case 'patientName':
        valA = a.patientName || ''
        valB = b.patientName || ''
        break
      case 'phone':
        valA = a.phone || ''
        valB = b.phone || ''
        break
      case 'slot':
        valA = a.slot || ''
        valB = b.slot || ''
        break
      case 'department':
        valA = a.department || ''
        valB = b.department || ''
        break
      case 'doctorName':
        valA = a.doctorName || ''
        valB = b.doctorName || ''
        break
      default:
        valA = a.date || ''
        valB = b.date || ''
    }
    
    if (sortOrder.value === 'asc') {
      return valA > valB ? 1 : valA < valB ? -1 : 0
    } else {
      return valA < valB ? 1 : valA > valB ? -1 : 0
    }
  })
})

const selectDate = (day) => {
  if (selectedDate.value?.date === day.date) {
    selectedDate.value = null
  } else {
    selectedDate.value = { ...day }
  }
}

const loadData = async () => {
  try {
    const [s, a, sc, d] = await Promise.all([
      statisticsAPI.getDashboardStats(),
      appointmentAPI.getAll(),
      scheduleAPI.getAll(),
      doctorAPI.getAll()
    ])
    stats.value = s.data
    appointments.value = a.data
    schedules.value = sc.data
    doctors.value = d.data
  } catch (error) {
    console.error('Failed to load data')
  }
}

let refreshInterval = null

onMounted(() => {
  loadData()
  refreshInterval = setInterval(loadData, 30000)
})

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
})
</script>
