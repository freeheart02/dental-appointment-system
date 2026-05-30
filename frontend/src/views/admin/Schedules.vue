<template>
  <AdminLayout title="排班管理">
    <div class="bg-white rounded-xl shadow-md">
      <div class="p-4 border-b border-gray-200 flex justify-between items-center">
        <div class="flex gap-3">
          <button @click="showAddModal = true" class="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all">
            <Plus class="w-5 h-5" />
            <span>添加排班</span>
          </button>
          <button @click="showBatchModal = true" class="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all">
            <List class="w-5 h-5" />
            <span>批量排班</span>
          </button>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-sm text-gray-600">筛选日期:</span>
          <input
            v-model="filterDate"
            type="date"
            @change="loadSchedulesByDate"
            class="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>
      </div>
      
      <div class="p-4">
        <div v-if="filteredSchedules.length > 0" class="overflow-x-auto">
          <table class="w-full border-collapse">
            <thead>
              <tr class="bg-gradient-to-r from-blue-50 to-blue-100">
                <th class="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700 bg-blue-50 sticky left-0 z-10 min-w-[100px]">
                  时间
                </th>
                <th 
                  v-for="doctor in doctorsInSchedule" 
                  :key="doctor._id"
                  class="border border-gray-300 px-4 py-3 text-center font-semibold text-gray-700 min-w-[180px]"
                >
                  <div class="flex flex-col items-center">
                    <span class="font-bold">{{ doctor.name }}</span>
                    <span class="text-xs text-gray-500 font-normal">{{ doctor.department || doctor.specialty || '口腔科' }}</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr 
                v-for="timeSlot in timeSlots" 
                :key="timeSlot"
                class="hover:bg-gray-50"
              >
                <td class="border border-gray-300 px-4 py-3 font-medium text-gray-700 bg-gray-50 sticky left-0 z-10">
                  {{ timeSlot }}
                </td>
                <td 
                  v-for="doctor in doctorsInSchedule" 
                  :key="`${doctor._id}-${timeSlot}`"
                  class="border border-gray-300 px-2 py-2 text-center"
                >
                  <div v-if="getAppointmentForSlot(doctor._id, timeSlot)" 
                       class="p-2 bg-green-50 rounded-lg border border-green-200 cursor-pointer hover:bg-green-100 transition-all"
                       @click="viewAppointment(getAppointmentForSlot(doctor._id, timeSlot))">
                    <div class="font-medium text-green-800 text-sm">
                      {{ getAppointmentForSlot(doctor._id, timeSlot).patientName }}
                    </div>
                    <div class="text-xs text-green-600">
                      {{ getAppointmentForSlot(doctor._id, timeSlot).phone }}
                    </div>
                  </div>
                  <div v-else class="p-2 bg-gray-100 rounded-lg border border-gray-200 opacity-50">
                    <span class="text-xs text-gray-400">空闲</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div v-else class="p-12 text-center">
          <Calendar class="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p class="text-gray-500">当天暂无排班数据</p>
          <button @click="showAddModal = true" class="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all">
            添加排班
          </button>
        </div>
      </div>
    </div>

    <!-- 预约详情弹窗 -->
    <div v-if="showAppointmentModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-xl p-6 w-full max-w-md">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-semibold text-gray-800">预约详情</h3>
          <button @click="closeAppointmentModal" class="text-gray-400 hover:text-gray-600">
            <X class="w-5 h-5" />
          </button>
        </div>
        
        <div v-if="selectedAppointment" class="space-y-4">
          <div class="p-4 bg-blue-50 rounded-lg">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <p class="text-sm text-gray-500">患者姓名</p>
                <p class="font-semibold text-gray-800">{{ selectedAppointment.patientName }}</p>
              </div>
              <div>
                <p class="text-sm text-gray-500">联系电话</p>
                <p class="font-semibold text-gray-800">{{ selectedAppointment.phone }}</p>
              </div>
              <div>
                <p class="text-sm text-gray-500">预约医生</p>
                <p class="font-semibold text-gray-800">{{ selectedAppointment.doctorName }}</p>
              </div>
              <div>
                <p class="text-sm text-gray-500">预约时间</p>
                <p class="font-semibold text-gray-800">{{ selectedAppointment.date }} {{ selectedAppointment.timeSlot }}</p>
              </div>
            </div>
          </div>
          
          <div class="flex gap-3">
            <button
              @click="closeAppointmentModal"
              class="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all"
            >
              关闭
            </button>
            <button
              @click="cancelAppointment(selectedAppointment._id)"
              class="flex-1 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all"
            >
              取消预约
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 添加排班弹窗 -->
    <div v-if="showAddModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-xl p-6 w-full max-w-lg">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-semibold text-gray-800">{{ isEditing ? '编辑排班' : '添加排班' }}</h3>
          <button @click="closeModal" class="text-gray-400 hover:text-gray-600">
            <X class="w-5 h-5" />
          </button>
        </div>
        
        <form @submit.prevent="saveSchedule" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">医生</label>
            <select
              v-model="formData.doctorId"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="">请选择医生</option>
              <template v-for="(deptDoctors, department) in doctorsByDepartment" :key="department">
                <option disabled class="text-gray-400 font-semibold">--- {{ department }} ---</option>
                <option v-for="doctor in deptDoctors" :key="doctor._id" :value="doctor._id">
                  {{ doctor.name }} - {{ doctor.specialty }}
                </option>
              </template>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">日期</label>
            <input
              v-model="formData.date"
              type="date"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
          <div>
            <div class="flex justify-between items-center mb-2">
              <label class="block text-sm font-medium text-gray-700">时间段</label>
              <button
                type="button"
                @click="toggleAllSlots('form')"
                class="text-sm text-blue-500 hover:text-blue-600"
              >
                {{ formData.selectedSlots.length === currentTimeSlots.length ? '取消全选' : '全选' }}
              </button>
            </div>
            <div class="grid grid-cols-4 gap-2">
              <label
                v-for="slot in currentTimeSlots"
                :key="slot"
                class="flex items-center gap-2 p-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  v-model="formData.selectedSlots"
                  :value="slot"
                  class="rounded text-blue-500 focus:ring-blue-500"
                />
                <span class="text-sm">{{ slot }}</span>
              </label>
            </div>
          </div>
          
          <button
            type="submit"
            class="w-full py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-all"
          >
            {{ isEditing ? '保存修改' : '添加排班' }}
          </button>
        </form>
      </div>
    </div>

    <!-- 批量排班弹窗 -->
    <div v-if="showBatchModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-semibold text-gray-800">批量排班</h3>
          <button @click="closeBatchModal" class="text-gray-400 hover:text-gray-600">
            <X class="w-5 h-5" />
          </button>
        </div>
        
        <form @submit.prevent="saveBatchSchedule" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">医生</label>
            <select
              v-model="batchFormData.doctorId"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="">请选择医生</option>
              <template v-for="(deptDoctors, department) in doctorsByDepartment" :key="department">
                <option disabled class="text-gray-400 font-semibold">--- {{ department }} ---</option>
                <option v-for="doctor in deptDoctors" :key="doctor._id" :value="doctor._id">
                  {{ doctor.name }} - {{ doctor.specialty }}
                </option>
              </template>
            </select>
          </div>
          
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">开始日期</label>
              <input
                v-model="batchFormData.startDate"
                type="date"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">结束日期</label>
              <input
                v-model="batchFormData.endDate"
                type="date"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">选择出诊星期</label>
            <div class="flex flex-wrap gap-2">
              <label
                v-for="day in weekdays"
                :key="day.value"
                class="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  v-model="batchFormData.weekdays"
                  :value="day.value"
                  class="rounded text-blue-500 focus:ring-blue-500"
                />
                <span class="text-sm">{{ day.label }}</span>
              </label>
            </div>
          </div>
          
          <div>
            <div class="flex justify-between items-center mb-2">
              <label class="block text-sm font-medium text-gray-700">时间段</label>
              <button
                type="button"
                @click="toggleAllSlots('batch')"
                class="text-sm text-blue-500 hover:text-blue-600"
              >
                {{ batchFormData.selectedSlots.length === batchTimeSlots.length ? '取消全选' : '全选' }}
              </button>
            </div>
            <div class="grid grid-cols-4 gap-2">
              <label
                v-for="slot in batchTimeSlots"
                :key="slot"
                class="flex items-center gap-2 p-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  v-model="batchFormData.selectedSlots"
                  :value="slot"
                  class="rounded text-blue-500 focus:ring-blue-500"
                />
                <span class="text-sm">{{ slot }}</span>
              </label>
            </div>
          </div>
          
          <div class="p-3 bg-blue-50 rounded-lg">
            <p class="text-sm text-blue-700">
              <Info class="w-4 h-4 inline mr-1" />
              将为选中的医生在 <span class="font-semibold">{{ batchFormData.startDate }}</span> 至 <span class="font-semibold">{{ batchFormData.endDate }}</span> 期间，
              每周的 <span class="font-semibold">{{ getSelectedWeekdaysText() }}</span> 创建排班。
              已存在排班的日期将被跳过。
            </p>
          </div>
          
          <button
            type="submit"
            class="w-full py-3 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-all"
          >
            批量创建排班
          </button>
        </form>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Plus, Edit, Trash2, Calendar, X, List, Info, Search, ChevronRight } from 'lucide-vue-next'
import AdminLayout from '../../components/AdminLayout.vue'
import { scheduleAPI, doctorAPI, patientAPI, appointmentAPI } from '../../utils/api'

const schedules = ref([])
const doctors = ref([])
const patients = ref([])
const appointments = ref([])
const showAddModal = ref(false)
const showBatchModal = ref(false)
const showAppointmentModal = ref(false)
const today = new Date().toISOString().split('T')[0]
const filterDate = ref(today)
const isEditing = ref(false)
const editingId = ref(null)
const selectedAppointment = ref(null)
const editingTimeSlots = ref([])

const timeSlots = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'
]

const weekdays = [
  { value: 0, label: '周日' },
  { value: 1, label: '周一' },
  { value: 2, label: '周二' },
  { value: 3, label: '周三' },
  { value: 4, label: '周四' },
  { value: 5, label: '周五' },
  { value: 6, label: '周六' }
]

const generateTimeSlots = (interval = 30) => {
  const slots = []
  const morningStart = 8 * 60
  const morningEnd = 11 * 60 + 30
  const afternoonStart = 13 * 60 + 30
  const afternoonEnd = 16 * 60 + 30
  
  for (let time = morningStart; time <= morningEnd; time += interval) {
    const hours = Math.floor(time / 60)
    const minutes = time % 60
    slots.push(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`)
  }
  
  for (let time = afternoonStart; time <= afternoonEnd; time += interval) {
    const hours = Math.floor(time / 60)
    const minutes = time % 60
    slots.push(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`)
  }
  
  return slots
}

const defaultTimeSlots = generateTimeSlots(30)

const currentTimeSlots = computed(() => {
  if (!formData.value.doctorId) {
    return defaultTimeSlots
  }
  
  if (isEditing.value && editingTimeSlots.value.length > 0) {
    return editingTimeSlots.value
  }
  
  const doctor = doctors.value.find(d => d._id === formData.value.doctorId)
  if (doctor && doctor.slotInterval) {
    return generateTimeSlots(doctor.slotInterval)
  }
  return defaultTimeSlots
})

const batchTimeSlots = computed(() => {
  if (!batchFormData.value.doctorId) {
    return defaultTimeSlots
  }
  const doctor = doctors.value.find(d => d._id === batchFormData.value.doctorId)
  if (doctor && doctor.slotInterval) {
    return generateTimeSlots(doctor.slotInterval)
  }
  return defaultTimeSlots
})

const formData = ref({
  doctorId: '',
  date: '',
  selectedSlots: []
})

const batchFormData = ref({
  doctorId: '',
  startDate: '',
  endDate: '',
  weekdays: [1, 2, 3, 4, 5],
  selectedSlots: []
})

const filteredSchedules = computed(() => {
  if (!filterDate.value) return schedules.value
  return schedules.value.filter(schedule => {
    const scheduleDate = new Date(schedule.date).toISOString().split('T')[0]
    return scheduleDate === filterDate.value
  })
})

const doctorsInSchedule = computed(() => {
  const doctorIds = [...new Set(filteredSchedules.value.map(s => s.doctorId._id || s.doctorId))]
  return doctors.value.filter(d => doctorIds.includes(d._id))
})

const getAppointmentForSlot = (doctorId, timeSlot) => {
  const appointment = appointments.value.find(a => {
    const appointmentDoctorId = a.doctorId._id || a.doctorId
    const scheduleDate = a.date ? new Date(a.date).toISOString().split('T')[0] : null
    return appointmentDoctorId === doctorId && 
           a.timeSlot === timeSlot && 
           scheduleDate === filterDate.value &&
           a.status !== 'cancelled'
  })
  
  if (appointment) {
    return {
      ...appointment,
      patientName: appointment.patientId?.name || appointment.patientName || '未知',
      phone: appointment.patientId?.phone || appointment.phone || '-',
      doctorName: appointment.doctorId?.name || '未知'
    }
  }
  return null
})

const doctorsByDepartment = computed(() => {
  const grouped = {}
  doctors.value.forEach(doctor => {
    const department = doctor.department || '未分类'
    if (!grouped[department]) {
      grouped[department] = []
    }
    grouped[department].push(doctor)
  })
  return grouped
})

const getSelectedWeekdaysText = () => {
  const selected = batchFormData.value.weekdays.map(v => weekdays.find(d => d.value === v)?.label).filter(Boolean)
  return selected.join('、') || '所有天'
}

const toggleAllSlots = (formType) => {
  const targetForm = formType === 'batch' ? batchFormData.value : formData.value
  const targetSlots = formType === 'batch' ? batchTimeSlots.value : currentTimeSlots.value
  if (targetForm.selectedSlots.length === targetSlots.length) {
    targetForm.selectedSlots = []
  } else {
    targetForm.selectedSlots = [...targetSlots]
  }
}

const loadSchedulesByDate = () => {
  loadSchedules()
}

const loadSchedules = async () => {
  try {
    const response = await scheduleAPI.getAll()
    schedules.value = response.data
  } catch (error) {
    console.error('Failed to load schedules')
  }
}

const loadDoctors = async () => {
  try {
    const response = await doctorAPI.getAll()
    doctors.value = response.data
  } catch (error) {
    console.error('Failed to load doctors')
  }
}

const loadPatients = async () => {
  try {
    const response = await patientAPI.getAll()
    patients.value = response.data
  } catch (error) {
    console.error('Failed to load patients')
  }
}

const loadAppointments = async () => {
  try {
    const response = await appointmentAPI.getAll()
    appointments.value = response.data
  } catch (error) {
    console.error('Failed to load appointments')
  }
}

const viewAppointment = (appointment) => {
  selectedAppointment.value = appointment
  showAppointmentModal.value = true
}

const closeAppointmentModal = () => {
  showAppointmentModal.value = false
  selectedAppointment.value = null
}

const cancelAppointment = async (appointmentId) => {
  if (!confirm('确定要取消该预约吗？')) return
  
  try {
    await appointmentAPI.update(appointmentId, { status: 'cancelled' })
    alert('取消成功')
    await loadAppointments()
    closeAppointmentModal()
  } catch (error) {
    alert(error.response?.data?.message || '取消失败')
  }
}

const addSchedule = async () => {
  const timeSlotsData = formData.value.selectedSlots.map(time => ({
    time,
    available: 1,
    maxCapacity: 1
  }))
  try {
    await scheduleAPI.create({
      doctorId: formData.value.doctorId,
      date: new Date(formData.value.date).toISOString(),
      timeSlots: timeSlotsData
    })
    loadSchedules()
    closeModal()
    alert('添加成功')
  } catch (error) {
    alert(error.response?.data?.message || '添加失败')
  }
}

const addBatchSchedule = async () => {
  if (!batchFormData.value.doctorId || !batchFormData.value.startDate || !batchFormData.value.endDate) {
    alert('请填写医生和日期范围')
    return
  }
  
  if (batchFormData.value.selectedSlots.length === 0) {
    alert('请选择至少一个时间段')
    return
  }
  
  try {
    const response = await scheduleAPI.batchCreate({
      doctorId: batchFormData.value.doctorId,
      startDate: batchFormData.value.startDate,
      endDate: batchFormData.value.endDate,
      weekdays: batchFormData.value.weekdays,
      timeSlots: batchFormData.value.selectedSlots
    })
    
    loadSchedules()
    closeBatchModal()
    
    const msg = response.data.message
    if (response.data.errors && response.data.errors.length > 0) {
      alert(`${msg}\n已跳过的日期：${response.data.errors.join('\n')}`)
    } else {
      alert(msg)
    }
  } catch (error) {
    alert(error.response?.data?.message || '批量创建失败')
  }
}

const editSchedule = (schedule) => {
  isEditing.value = true
  editingId.value = schedule._id
  const existingSlots = schedule.timeSlots.map(s => s.time)
  
  const doctor = doctors.value.find(d => d._id === schedule.doctorId._id)
  let allTimeSlots = defaultTimeSlots
  if (doctor && doctor.slotInterval) {
    allTimeSlots = generateTimeSlots(doctor.slotInterval)
  }
  
  editingTimeSlots.value = allTimeSlots
  formData.value = {
    doctorId: schedule.doctorId._id,
    date: new Date(schedule.date).toISOString().split('T')[0],
    selectedSlots: [...existingSlots]
  }
  showAddModal.value = true
}

const updateSchedule = async () => {
  const timeSlotsData = formData.value.selectedSlots.map(time => ({
    time,
    available: 1,
    maxCapacity: 1
  }))
  try {
    await scheduleAPI.update(editingId.value, { timeSlots: timeSlotsData })
    loadSchedules()
    closeModal()
    alert('修改成功')
  } catch (error) {
    alert('修改失败')
  }
}

const saveSchedule = () => {
  if (isEditing.value) {
    updateSchedule()
  } else {
    addSchedule()
  }
}

const saveBatchSchedule = () => {
  addBatchSchedule()
}

const deleteSchedule = async (id) => {
  if (!confirm('确定要删除该排班吗？')) return
  try {
    await scheduleAPI.delete(id)
    loadSchedules()
    alert('删除成功')
  } catch (error) {
    alert('删除失败')
  }
}

const closeModal = () => {
  showAddModal.value = false
  isEditing.value = false
  editingId.value = null
  editingTimeSlots.value = []
  formData.value = { doctorId: '', date: '', selectedSlots: [] }
}

const closeBatchModal = () => {
  showBatchModal.value = false
  batchFormData.value = { doctorId: '', startDate: '', endDate: '', weekdays: [1, 2, 3, 4, 5], selectedSlots: [] }
}

onMounted(() => {
  loadSchedules()
  loadDoctors()
  loadPatients()
  loadAppointments()
})
</script>

<style scoped>
table {
  border-collapse: separate;
  border-spacing: 0;
}

th, td {
  border: 1px solid #e5e7eb;
}

.sticky {
  position: sticky;
}

.sticky.left-0 {
  left: 0;
}
</style>
