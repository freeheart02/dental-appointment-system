<template>
  <AdminLayout title="排班管理">
    <div class="bg-white rounded-xl shadow-md">
      <div class="p-4 border-b border-gray-200 flex justify-between items-center flex-wrap gap-3">
        <div class="flex gap-3 flex-wrap">
          <button @click="showAddModal = true" class="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all">
            <Plus class="w-5 h-5" />
            <span>添加排班</span>
          </button>
          <button @click="showBatchModal = true" class="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all">
            <List class="w-5 h-5" />
            <span>批量排班</span>
          </button>
        </div>
        <div class="flex items-center gap-3 flex-wrap">
          <div class="flex items-center gap-2">
            <span class="text-sm text-gray-600">筛选科室:</span>
            <select
              v-model="filterDepartment"
              class="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="">全部科室</option>
              <option v-for="dept in departments" :key="dept" :value="dept">{{ dept }}</option>
            </select>
          </div>
        </div>
      </div>

      <div class="p-4">
        <div v-if="filteredSchedules.length > 0 && visibleDoctors.length > 0" class="overflow-x-auto">
          <table class="w-full border-collapse">
            <thead>
              <tr class="bg-gradient-to-r from-blue-50 to-blue-100">
                <th class="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700 bg-blue-50 sticky left-0 z-10 min-w-[100px]">
                  时间
                </th>
                <th
                  v-for="doctor in visibleDoctors"
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
              <tr v-for="timeSlot in timeSlots" :key="timeSlot" class="hover:bg-gray-50">
                <td class="border border-gray-300 px-4 py-3 font-medium text-gray-700 bg-gray-50 sticky left-0 z-10">
                  {{ timeSlot }}
                </td>
                <td
                  v-for="doctor in visibleDoctors"
                  :key="doctor._id + '-' + timeSlot"
                  class="border border-gray-300 px-2 py-2 text-center"
                >
                  <div v-if="getAppointmentInfo(doctor._id, timeSlot)"
                       class="p-2 bg-green-50 rounded-lg border border-green-200 cursor-pointer hover:bg-green-100 transition-all"
                       @click="viewAppointment(getAppointmentInfo(doctor._id, timeSlot))">
                    <div class="font-medium text-green-800 text-sm">
                      {{ getAppointmentInfo(doctor._id, timeSlot).patientName }}
                    </div>
                    <div class="text-xs text-green-600">
                      {{ getAppointmentInfo(doctor._id, timeSlot).phone }}
                    </div>
                  </div>
                  <div v-else-if="isDoctorScheduled(doctor._id, timeSlot)"
                       class="p-2 bg-gray-100 rounded-lg border border-gray-200 opacity-50">
                    <span class="text-xs text-gray-400">空闲</span>
                  </div>
                  <div v-else class="p-2 bg-gray-50 rounded-lg border border-gray-100 opacity-30">
                    <span class="text-xs text-gray-300">未排班</span>
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
            <button @click="closeAppointmentModal" class="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all">
              关闭
            </button>
            <button @click="cancelSelectedAppointment" class="flex-1 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all">
              取消预约
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showAddModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
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
              <option v-for="doc in doctors" :key="doc._id" :value="doc._id">
                {{ doc.name }} - {{ doc.specialty }}
              </option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">日期</label>
            <input type="date" v-model="formData.date" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">时间段</label>
            <div class="grid grid-cols-4 gap-2">
              <label v-for="slot in timeSlots" :key="slot" class="flex items-center gap-2 p-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                <input type="checkbox" v-model="formData.selectedSlots" :value="slot" class="rounded text-blue-500 focus:ring-blue-500" />
                <span class="text-sm">{{ slot }}</span>
              </label>
            </div>
          </div>
          <button type="submit" class="w-full py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-all">
            {{ isEditing ? '保存修改' : '添加排班' }}
          </button>
        </form>
      </div>
    </div>

    <div v-if="showBatchModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-xl p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-semibold text-gray-800">批量排班</h3>
          <button @click="closeBatchModal" class="text-gray-400 hover:text-gray-600">
            <X class="w-5 h-5" />
          </button>
        </div>
        <form @submit.prevent="saveBatch" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">医生</label>
            <select
              v-model="batchForm.doctorId"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="">请选择医生</option>
              <option v-for="doc in doctors" :key="doc._id" :value="doc._id">
                {{ doc.name }} - {{ doc.specialty }}
              </option>
            </select>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">开始日期</label>
              <input type="date" v-model="batchForm.startDate" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">结束日期</label>
              <input type="date" v-model="batchForm.endDate" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">出诊星期</label>
            <div class="flex flex-wrap gap-2">
              <label v-for="day in weekOptions" :key="day.value" class="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                <input type="checkbox" v-model="batchForm.weekdays" :value="day.value" class="rounded text-blue-500 focus:ring-blue-500" />
                <span class="text-sm">{{ day.label }}</span>
              </label>
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">时间段</label>
            <div class="grid grid-cols-4 gap-2">
              <label v-for="slot in timeSlots" :key="slot" class="flex items-center gap-2 p-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                <input type="checkbox" v-model="batchForm.slots" :value="slot" class="rounded text-blue-500 focus:ring-blue-500" />
                <span class="text-sm">{{ slot }}</span>
              </label>
            </div>
          </div>
          <button type="submit" class="w-full py-3 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-all">
            批量创建排班
          </button>
        </form>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Plus, Calendar, X, List } from 'lucide-vue-next'
import AdminLayout from '../../components/AdminLayout.vue'
import { scheduleAPI, doctorAPI, appointmentAPI } from '../../utils/api'

const schedules = ref([])
const doctors = ref([])
const appointments = ref([])
const showAddModal = ref(false)
const showBatchModal = ref(false)
const showAppointmentModal = ref(false)
const filterDate = ref(new Date().toISOString().split('T')[0])
const filterDepartment = ref('')
const isEditing = ref(false)
const editingId = ref(null)
const selectedAppointment = ref(null)

const timeSlots = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'
]

const weekOptions = [
  { value: 1, label: '周一' },
  { value: 2, label: '周二' },
  { value: 3, label: '周三' },
  { value: 4, label: '周四' },
  { value: 5, label: '周五' },
  { value: 6, label: '周六' },
  { value: 0, label: '周日' }
]

const formData = ref({ doctorId: '', date: '', selectedSlots: [] })
const batchForm = ref({ doctorId: '', startDate: '', endDate: '', weekdays: [1, 2, 3, 4, 5], slots: [] })

const departments = computed(() => [...new Set(doctors.value.map(d => d.department || d.specialty || '未分类'))].sort())

const filteredSchedules = computed(() =>
  schedules.value.filter(s => new Date(s.date).toISOString().split('T')[0] === filterDate.value)
)

const visibleDoctors = computed(() => {
  const doctorIds = new Set(filteredSchedules.value.map(s => s.doctorId._id || s.doctorId))
  return doctors.value.filter(d => doctorIds.has(d._id))
})

const appointmentMap = computed(() => {
  const map = {}
  appointments.value.forEach(appt => {
    const apptDate = appt.date ? new Date(appt.date).toISOString().split('T')[0] : null
    if (apptDate === filterDate.value && appt.status !== 'cancelled') {
      const key = `${appt.doctorId._id || appt.doctorId}-${appt.timeSlot}`
      map[key] = {
        _id: appt._id,
        patientName: appt.patientName || appt.patientId?.name || '未知',
        phone: appt.phone || appt.patientId?.phone || '-',
        doctorName: appt.doctorName || appt.doctorId?.name || '未知',
        date: apptDate,
        timeSlot: appt.timeSlot
      }
    }
  })
  return map
})

const scheduleMap = computed(() => {
  const map = {}
  filteredSchedules.value.forEach(s => {
    const id = s.doctorId._id || s.doctorId
    if (!map[id]) map[id] = new Set()
    s.timeSlots.forEach(ts => map[id].add(ts.time))
  })
  return map
})

const getAppointmentInfo = (doctorId, slot) => {
  return appointmentMap.value[`${doctorId}-${slot}`] || null
}

const isDoctorScheduled = (doctorId, slot) => {
  return scheduleMap.value[doctorId]?.has(slot) || false
}

const loadData = async () => {
  const [s, d, a] = await Promise.all([
    scheduleAPI.getAll(),
    doctorAPI.getAll(),
    appointmentAPI.getAll()
  ])
  schedules.value = s.data
  doctors.value = d.data
  appointments.value = a.data
}

const viewAppointment = (appt) => {
  selectedAppointment.value = appt
  showAppointmentModal.value = true
}

const closeAppointmentModal = () => {
  showAppointmentModal.value = false
  selectedAppointment.value = null
}

const cancelSelectedAppointment = async () => {
  if (!selectedAppointment.value?._id || !confirm('确定要取消该预约吗？')) return
  await appointmentAPI.update(selectedAppointment.value._id, { status: 'cancelled' })
  alert('取消成功')
  loadData()
  closeAppointmentModal()
}

const closeModal = () => {
  showAddModal.value = false
  isEditing.value = false
  editingId.value = null
  formData.value = { doctorId: '', date: '', selectedSlots: [] }
}

const closeBatchModal = () => {
  showBatchModal.value = false
  batchForm.value = { doctorId: '', startDate: '', endDate: '', weekdays: [1, 2, 3, 4, 5], slots: [] }
}

const saveSchedule = async () => {
  if (!formData.value.doctorId || !formData.value.date) {
    alert('请选择医生和日期')
    return
  }
  const timeSlotsData = formData.value.selectedSlots.map(time => ({ time, available: 1, maxCapacity: 1 }))
  if (isEditing.value) {
    await scheduleAPI.update(editingId.value, { timeSlots: timeSlotsData })
  } else {
    await scheduleAPI.create({
      doctorId: formData.value.doctorId,
      date: new Date(formData.value.date).toISOString(),
      timeSlots: timeSlotsData
    })
  }
  alert(isEditing.value ? '修改成功' : '添加成功')
  loadData()
  closeModal()
}

const saveBatch = async () => {
  if (!batchForm.value.doctorId || !batchForm.value.startDate || !batchForm.value.endDate) {
    alert('请填写医生和日期范围')
    return
  }
  if (batchForm.value.slots.length === 0) {
    alert('请选择至少一个时间段')
    return
  }
  
  const data = {
    doctorId: batchForm.value.doctorId,
    startDate: batchForm.value.startDate,
    endDate: batchForm.value.endDate,
    weekdays: batchForm.value.weekdays,
    timeSlots: batchForm.value.slots
  }
  
  const response = await scheduleAPI.batchCreate(data)
  loadData()
  closeBatchModal()
  const msg = response.data.message
  if (response.data.errors?.length) {
    alert(`${msg}\n已跳过的日期：${response.data.errors.join('\n')}`)
  } else {
    alert(msg)
  }
}

onMounted(loadData)
</script>

<style scoped>
table { border-collapse: separate; border-spacing: 0; }
th, td { border: 1px solid #e5e7eb; }
</style>
