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
            class="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>
      </div>
      
      <div class="p-4">
        <div v-for="(daySchedules, date) in schedulesByDate" :key="date" class="mb-6">
          <div class="bg-blue-50 px-4 py-3 rounded-t-lg border border-blue-200">
            <h3 class="font-semibold text-blue-800">{{ formatDate(date) }}</h3>
          </div>
          <div class="border border-t-0 border-blue-200 rounded-b-lg divide-y divide-gray-200">
            <div v-for="schedule in daySchedules" :key="schedule._id" class="p-4 flex items-center justify-between hover:bg-gray-50">
              <div class="flex items-center gap-4">
                <div class="flex flex-col">
                  <span class="font-medium text-gray-800">{{ schedule.doctorId?.name || schedule.doctorId }}</span>
                  <span class="text-sm text-gray-500">{{ schedule.doctorId?.department || schedule.doctorId?.specialty || '口腔科' }}</span>
                </div>
                <div class="flex flex-wrap gap-1">
                  <button
                    v-for="slot in schedule.timeSlots"
                    :key="slot.time"
                    @click="openSlotModal(schedule, slot)"
                    :class="[
                      'px-2 py-0.5 rounded text-xs cursor-pointer transition-all',
                      slot.available > 0 ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-500'
                    ]"
                  >
                    {{ slot.time }}
                    <span v-if="getSlotAppointment(schedule._id, slot.time)" class="ml-1">(已约)</span>
                  </button>
                </div>
              </div>
              <div class="flex gap-2">
                <button @click="editSchedule(schedule)" class="text-blue-500 hover:text-blue-600">
                  <Edit class="w-4 h-4" />
                </button>
                <button @click="deleteSchedule(schedule._id)" class="text-red-500 hover:text-red-600">
                  <Trash2 class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div v-if="schedules.length === 0" class="p-12 text-center">
          <Calendar class="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p class="text-gray-500">暂无排班数据</p>
        </div>
      </div>
    </div>

    <div v-if="showSlotModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-xl p-6 w-full max-w-md">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-semibold text-gray-800">
            {{ currentSlot?.time }} - {{ currentSchedule?.doctorId?.name }}
          </h3>
          <button @click="closeSlotModal" class="text-gray-400 hover:text-gray-600">
            <X class="w-5 h-5" />
          </button>
        </div>
        
        <div v-if="currentSlotAppointment" class="mb-4 p-4 bg-yellow-50 rounded-lg">
          <div class="flex justify-between items-center">
            <div>
              <p class="font-medium text-gray-800">{{ currentSlotAppointment.patientId?.name || '未知患者' }}</p>
              <p class="text-sm text-gray-500">{{ currentSlotAppointment.patientId?.phone }}</p>
            </div>
            <div class="text-right">
              <p class="text-sm text-gray-500">预约类型</p>
              <p class="font-medium text-gray-800">{{ currentSlotAppointment.type || '初诊' }}</p>
            </div>
          </div>
          <button 
            @click="cancelAppointment(currentSlotAppointment._id)" 
            class="mt-3 w-full py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all"
          >
            取消预约
          </button>
        </div>
        
        <div v-else class="space-y-4">
          <p class="text-gray-500 text-sm">该时段尚未预约，选择患者进行预约：</p>
          
          <div class="relative">
            <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              v-model="patientSearchQuery"
              type="text"
              placeholder="搜索患者姓名或手机号"
              class="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none w-full"
            />
          </div>
          
          <div class="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
            <div
              v-for="patient in filteredPatientsForSlot"
              :key="patient._id"
              @click="selectPatientForSlot(patient)"
              class="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
            >
              <div class="flex justify-between items-center">
                <div>
                  <p class="font-medium text-gray-800">{{ patient.name }}</p>
                  <p class="text-sm text-gray-500">{{ patient.phone }}</p>
                </div>
                <ChevronRight class="w-4 h-4 text-gray-400" />
              </div>
            </div>
            <div v-if="filteredPatientsForSlot.length === 0" class="px-4 py-8 text-center text-gray-500">
              暂无患者，可在患者管理中添加
            </div>
          </div>
          
          <div v-if="selectedPatient" class="p-3 bg-blue-50 rounded-lg">
            <p class="text-sm text-gray-600">已选择：</p>
            <p class="font-medium text-blue-800">{{ selectedPatient.name }} - {{ selectedPatient.phone }}</p>
          </div>
          
          <div class="flex gap-3">
            <button
              @click="closeSlotModal"
              class="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all"
            >
              取消
            </button>
            <button
              @click="bookSlot"
              :disabled="!selectedPatient"
              class="flex-1 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all"
            >
              确认预约
            </button>
          </div>
        </div>
      </div>
    </div>

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
const showSlotModal = ref(false)
const today = new Date().toISOString().split('T')[0]
const filterDate = ref(today)
const isEditing = ref(false)
const editingId = ref(null)
const currentSchedule = ref(null)
const currentSlot = ref(null)
const patientSearchQuery = ref('')
const selectedPatient = ref(null)
const editingTimeSlots = ref([])

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

const weekdays = [
  { value: 0, label: '周日' },
  { value: 1, label: '周一' },
  { value: 2, label: '周二' },
  { value: 3, label: '周三' },
  { value: 4, label: '周四' },
  { value: 5, label: '周五' },
  { value: 6, label: '周六' }
]

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

const formatDate = (dateStr) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  })
}

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

const schedulesByDate = computed(() => {
  const grouped = {}
  let filteredSchedules = [...schedules.value]
  
  if (filterDate.value) {
    filteredSchedules = filteredSchedules.filter(schedule => {
      return schedule.date >= filterDate.value
    })
  }
  
  const sortedSchedules = filteredSchedules.sort((a, b) => new Date(a.date) - new Date(b.date))
  sortedSchedules.forEach(schedule => {
    const date = schedule.date
    if (!grouped[date]) {
      grouped[date] = []
    }
    grouped[date].push(schedule)
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

const getSlotAppointment = (scheduleId, timeSlot) => {
  return appointments.value.find(a => 
    a.scheduleId === scheduleId && 
    a.timeSlot === timeSlot &&
    a.status !== 'cancelled'
  )
}

const openSlotModal = (schedule, slot) => {
  currentSchedule.value = schedule
  currentSlot.value = slot
  patientSearchQuery.value = ''
  selectedPatient.value = null
  showSlotModal.value = true
}

const closeSlotModal = () => {
  showSlotModal.value = false
  currentSchedule.value = null
  currentSlot.value = null
  selectedPatient.value = null
  patientSearchQuery.value = ''
}

const filteredPatientsForSlot = computed(() => {
  let result = patients.value
  if (patientSearchQuery.value) {
    const query = patientSearchQuery.value.toLowerCase()
    result = result.filter(p => 
      p.name.toLowerCase().includes(query) || 
      p.phone.includes(query)
    )
  }
  return result
})

const currentSlotAppointment = computed(() => {
  if (!currentSchedule.value || !currentSlot.value) return null
  return appointments.value.find(a =>
    a.doctorId === currentSchedule.value.doctorId._id &&
    a.date === currentSchedule.value.date &&
    a.timeSlot === currentSlot.value.time &&
    a.status !== 'cancelled'
  )
})

const selectPatientForSlot = (patient) => {
  selectedPatient.value = patient
}

const bookSlot = async () => {
  if (!selectedPatient.value || !currentSchedule.value || !currentSlot.value) return
  
  try {
    await appointmentAPI.create({
      patientId: selectedPatient.value._id,
      doctorId: currentSchedule.value.doctorId._id,
      date: currentSchedule.value.date,
      timeSlot: currentSlot.value.time,
      type: '初诊'
    })
    alert('预约成功')
    await loadAppointments()
    await loadSchedules()
    closeSlotModal()
  } catch (error) {
    alert(error.response?.data?.message || '预约失败')
  }
}

const cancelAppointment = async (appointmentId) => {
  if (!confirm('确定要取消该预约吗？')) return
  
  try {
    await appointmentAPI.update(appointmentId, { status: 'cancelled' })
    alert('取消成功')
    await loadAppointments()
    await loadSchedules()
    closeSlotModal()
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