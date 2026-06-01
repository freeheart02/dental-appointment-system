<template>
  <AdminLayout title="预约管理">
    <div class="bg-white rounded-xl shadow-md">
      <div class="p-4 border-b border-gray-200">
        <div class="flex flex-wrap gap-4 items-center mb-4">
          <div class="relative flex-1 min-w-[250px]">
            <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="搜索患者姓名或手机号"
              class="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none w-full"
            />
          </div>
          <select
            v-model="filterStatus"
            class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          >
            <option value="">全部状态</option>
            <option value="pending">未就诊</option>
            <option value="checked_in">待就诊</option>
            <option value="visited">已就诊</option>
            <option value="no_show">爽约</option>
            <option value="canceled">已取消</option>
          </select>
        </div>

        <div class="flex gap-6">
          <div class="w-80 flex-shrink-0">
            <div class="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
              <div class="flex items-center justify-between mb-4">
                <button @click="navMonth(currentDate, -1)" class="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <ChevronLeft class="w-5 h-5" />
                </button>
                <h3 class="text-lg font-semibold">{{ monthNames[currentDate.getMonth()] }} {{ currentDate.getFullYear() }}</h3>
                <button @click="navMonth(currentDate, 1)" class="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <ChevronRight class="w-5 h-5" />
                </button>
              </div>
              <div class="grid grid-cols-7 gap-1 mb-2">
                <div v-for="day in weekDays" :key="day" class="text-center text-sm font-medium text-gray-600 py-2">
                  {{ day }}
                </div>
              </div>
              <div class="grid grid-cols-7 gap-1">
                <div
                v-for="(day, index) in calendarDays(currentDate, filterDate)"
                :key="index"
                @click="day.date && (filterDate = day.date)"
                :class="[
                  'text-center py-2 cursor-pointer rounded-lg transition-all text-sm',
                  day.isToday ? 'bg-blue-100 font-bold' : '',
                  day.isSelected ? 'bg-blue-500 text-white hover:bg-blue-600' : 'hover:bg-gray-100',
                  !day.date ? 'text-gray-300 cursor-default' : 'text-gray-700'
                ]"
              >
                {{ day.day }}
                <div v-if="day.hasAppointment" class="flex justify-center mt-1">
                  <span class="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                </div>
              </div>
              </div>
              <div class="mt-4 flex gap-2">
                <button @click="filterDate = ''" class="flex-1 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all text-sm">
                  清除日期
                </button>
                <button @click="filterDate = today" class="flex-1 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all text-sm">
                  回到今天
                </button>
              </div>
            </div>
          </div>

          <div class="flex-1 overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="bg-gray-50">
                  <th class="px-6 py-3 text-left text-sm font-medium text-gray-600">患者</th>
                  <th class="px-6 py-3 text-left text-sm font-medium text-gray-600">医生</th>
                  <th class="px-6 py-3 text-left text-sm font-medium text-gray-600">日期</th>
                  <th class="px-6 py-3 text-left text-sm font-medium text-gray-600">时间</th>
                  <th class="px-6 py-3 text-left text-sm font-medium text-gray-600">就诊类型</th>
                  <th class="px-6 py-3 text-left text-sm font-medium text-gray-600">状态</th>
                  <th class="px-6 py-3 text-left text-sm font-medium text-gray-600">签到</th>
                  <th class="px-6 py-3 text-left text-sm font-medium text-gray-600">操作</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="appointment in filteredAppointments"
                  :key="appointment._id"
                  class="border-b border-gray-100 hover:bg-gray-50"
                >
                  <td class="px-6 py-4 text-sm">
                    <div>
                      <span class="text-gray-800">{{ getPatientName(appointment) }}</span>
                      <p class="text-gray-500 text-xs">{{ getPatientPhone(appointment) }}</p>
                    </div>
                  </td>
                  <td class="px-6 py-4 text-sm text-gray-600">{{ getDoctorName(appointment) }}</td>
                  <td class="px-6 py-4 text-sm text-gray-600">{{ formatDate(appointment.date) }}</td>
                  <td class="px-6 py-4 text-sm text-gray-600">{{ appointment.timeSlot }}</td>
                  <td class="px-6 py-4 text-sm text-gray-600">{{ appointment.type }}</td>
                  <td class="px-6 py-4">
                    <span :class="getStatusClass(appointment.status)" class="px-3 py-1 rounded-full text-sm font-medium">
                      {{ getStatusText(appointment.status) }}
                    </span>
                    <p v-if="appointment.checkedInAt" class="text-xs text-green-600 mt-1">
                      签到: {{ formatTime(appointment.checkedInAt) }}
                    </p>
                  </td>
                  <td class="px-6 py-4">
                    <div v-if="appointment.status === 'pending'">
                      <button
                        @click="checkInAppointment(appointment._id)"
                        class="px-3 py-1 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600 transition-all"
                      >
                        签到
                      </button>
                    </div>
                    <div v-else-if="appointment.status === 'checked_in'" class="flex flex-col gap-1">
                      <span class="text-green-600 text-sm font-medium">✓ 已签到</span>
                      <button
                        @click="undoCheckIn(appointment._id)"
                        class="px-2 py-0.5 bg-red-50 text-red-600 rounded text-xs hover:bg-red-100 transition-all"
                      >
                        取消签到
                      </button>
                    </div>
                    <span v-else class="text-gray-400 text-sm">-</span>
                  </td>
                  <td class="px-6 py-4">
                    <div class="flex gap-2">
                      <button @click="showStatusModal(appointment)" class="text-blue-500 hover:text-blue-600">
                        <Edit class="w-4 h-4" />
                      </button>
                      <button @click="deleteAppointment(appointment._id)" class="text-red-500 hover:text-red-600">
                        <Trash2 class="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      <div v-if="appointments.length === 0" class="p-12 text-center">
        <Clock class="w-12 h-12 mx-auto mb-4 text-gray-300" />
        <p class="text-gray-500">暂无预约数据</p>
      </div>
    </div>

    <div v-if="showStatusModalFlag" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-xl p-6 w-full max-w-sm">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-semibold text-gray-800">修改预约状态</h3>
          <button @click="showStatusModalFlag = false" class="text-gray-400 hover:text-gray-600">
            <X class="w-5 h-5" />
          </button>
        </div>
        
        <div class="space-y-3">
          <button
            v-for="status in statusOptions"
            :key="status.value"
            @click="updateStatus(status.value)"
            :class="[
              'w-full px-4 py-3 rounded-lg border-2 transition-all',
              selectedStatus === status.value
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            ]"
          >
            <span :class="status.class">{{ status.label }}</span>
          </button>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Search, Edit, Trash2, Clock, X, ChevronRight, ChevronLeft } from 'lucide-vue-next'
import AdminLayout from '../../components/AdminLayout.vue'
import { appointmentAPI } from '../../utils/api'

const appointments = ref([])
const searchQuery = ref('')
const filterStatus = ref('')
const currentDate = ref(new Date())
const today = new Date().toISOString().split('T')[0]
const filterDate = ref(today)
const showStatusModalFlag = ref(false)
const editingAppointment = ref(null)
const selectedStatus = ref('')

const weekDays = ['日', '一', '二', '三', '四', '五', '六']
const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']

const statusOptions = [
  { value: 'pending', label: '未就诊', class: 'text-yellow-700' },
  { value: 'checked_in', label: '待就诊', class: 'text-green-700' },
  { value: 'visited', label: '已就诊', class: 'text-blue-700' },
  { value: 'no_show', label: '爽约', class: 'text-red-700' },
  { value: 'canceled', label: '已取消', class: 'text-gray-500' }
]

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
  const selectedStr = selected || null
  const days = []
  
  const datesWithAppointments = new Set(
    appointments.value.map(a => {
      return new Date(a.date).toISOString().split('T')[0]
    })
  )
  
  for (let i = 0; i < firstDay; i++) {
    days.push({ day: '', date: null, isToday: false, isSelected: false, hasAppointment: false })
  }
  for (let i = 1; i <= daysInMonth; i++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`
    days.push({ 
      day: i, 
      date: dateStr, 
      isToday: dateStr === todayStr, 
      isSelected: dateStr === selectedStr,
      hasAppointment: datesWithAppointments.has(dateStr)
    })
  }
  return days
}

const filteredAppointments = computed(() => {
  let result = appointments.value
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(a => {
      const patientName = getPatientName(a).toLowerCase()
      const patientPhone = getPatientPhone(a)
      return patientName.includes(query) || patientPhone.includes(query)
    })
  }
  if (filterDate.value) {
    result = result.filter(a => a.date === filterDate.value)
  }
  if (filterStatus.value) {
    result = result.filter(a => a.status === filterStatus.value)
  }
  return result.sort((a, b) => new Date(a.date) - new Date(b.date))
})

const getPatientName = (appointment) => {
  if (appointment.patientId && typeof appointment.patientId === 'object') {
    return appointment.patientId?.name || appointment.patientName || ''
  }
  return appointment.patientName || ''
}

const getPatientPhone = (appointment) => {
  if (appointment.patientId && typeof appointment.patientId === 'object') {
    return appointment.patientId?.phone || ''
  }
  return appointment.phone || ''
}

const getDoctorName = (appointment) => {
  if (appointment.doctorId && typeof appointment.doctorId === 'object') {
    return appointment.doctorId?.name || ''
  }
  return appointment.doctorName || ''
}

const getStatusText = (status) => {
  const map = {
    pending: '未就诊',
    checked_in: '待就诊',
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
    checked_in: 'bg-green-100 text-green-700',
    confirmed: 'bg-blue-100 text-blue-700',
    visited: 'bg-indigo-100 text-indigo-700',
    no_show: 'bg-red-100 text-red-700',
    canceled: 'bg-gray-100 text-gray-500'
  }
  return map[status] || 'bg-gray-100 text-gray-700'
}

const formatDate = (dateStr) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN')
}

const formatTime = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const loadAppointments = async () => {
  try {
    const response = await appointmentAPI.getAll()
    appointments.value = response.data
  } catch (error) {
    console.error('Failed to load appointments')
  }
}

const showStatusModal = (appointment) => {
  editingAppointment.value = appointment
  selectedStatus.value = appointment.status
  showStatusModalFlag.value = true
}

const checkInAppointment = async (appointmentId) => {
  try {
    await appointmentAPI.update(appointmentId, {
      status: 'checked_in',
      checkedInAt: new Date().toISOString()
    })
    loadAppointments()
    alert('签到成功')
  } catch (error) {
    alert('签到失败')
  }
}

const undoCheckIn = async (appointmentId) => {
  if (!confirm('确定要取消签到吗？')) return
  try {
    await appointmentAPI.update(appointmentId, {
      status: 'pending',
      checkedInAt: null
    })
    loadAppointments()
    alert('已取消签到')
  } catch (error) {
    alert('取消签到失败')
  }
}

const updateStatus = async (status) => {
  try {
    const updateData = { status }
    if (status === 'checked_in') {
      updateData.checkedInAt = new Date().toISOString()
    }
    await appointmentAPI.update(editingAppointment.value._id, updateData)
    loadAppointments()
    showStatusModalFlag.value = false
    alert('状态更新成功')
  } catch (error) {
    alert('更新失败')
  }
}

const deleteAppointment = async (id) => {
  if (!confirm('确定要删除该预约吗？')) return
  try {
    await appointmentAPI.delete(id)
    loadAppointments()
    alert('删除成功')
  } catch (error) {
    alert('删除失败')
  }
}

onMounted(() => {
  loadAppointments()
})
</script>
