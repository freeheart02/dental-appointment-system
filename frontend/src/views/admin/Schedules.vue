<template>
  <AdminLayout title="排班管理">
    <div class="bg-white rounded-xl shadow-md">
      <div class="p-4 border-b border-gray-200 flex justify-between items-center flex-wrap gap-3">
        <div class="flex gap-3 flex-wrap">
          <button @click="openAddModal" class="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all">
            <Plus class="w-5 h-5" />
            <span>添加排班</span>
          </button>
          <button @click="openBatchModal" class="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all">
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

      <div class="p-4 flex gap-6">
        <div class="w-80 flex-shrink-0">
          <div class="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
            <div class="flex items-center justify-between mb-4">
              <button @click="navMonthPrev" class="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <ChevronLeft class="w-5 h-5" />
              </button>
              <h3 class="text-lg font-semibold">{{ currentMonthText }}</h3>
              <button @click="navMonthNext" class="p-2 hover:bg-gray-100 rounded-lg transition-colors">
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
                v-for="(day, idx) in mainCalendarDays"
                :key="idx"
                @click="handleDateClick(day)"
                :class="getDayClass(day)"
              >
                <span>{{ day.day }}</span>
                <div v-if="day.hasSchedule || day.hasAppointment" class="flex justify-center mt-1 gap-1">
                  <span v-if="day.hasSchedule" class="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                  <span v-if="day.hasAppointment" class="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="flex-1">
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
                    <template v-if="getAppointmentInfo(doctor._id, timeSlot)">
                      <div class="p-2 bg-green-50 rounded-lg border border-green-200 cursor-pointer hover:bg-green-100 transition-all"
                           @click="openAppointmentModal(getAppointmentInfo(doctor._id, timeSlot))">
                        <div class="font-medium text-green-800 text-sm">
                          {{ getAppointmentInfo(doctor._id, timeSlot).patientName }}
                        </div>
                        <div class="text-xs text-green-600">
                          {{ getAppointmentInfo(doctor._id, timeSlot).phone }}
                        </div>
                      </div>
                    </template>
                    <template v-else-if="isDoctorScheduled(doctor._id, timeSlot)">
                      <div class="p-2 bg-gray-100 rounded-lg border border-gray-200 opacity-50">
                        <span class="text-xs text-gray-400">空闲</span>
                      </div>
                    </template>
                    <template v-else>
                      <div class="p-2 bg-gray-50 rounded-lg border border-gray-100 opacity-30">
                        <span class="text-xs text-gray-300">未排班</span>
                      </div>
                    </template>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-else-if="filteredSchedules.length > 0 && visibleDoctors.length === 0" class="p-12 text-center">
            <Calendar class="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p class="text-gray-500 mb-2">当天有排班数据，但当前筛选科室无医生排班</p>
            <p class="text-gray-400 text-sm mb-4">请尝试选择其他科室查看</p>
            <button @click="filterDepartment = ''" class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all">
              显示全部科室
            </button>
          </div>
          <div v-else class="p-12 text-center">
            <Calendar class="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p class="text-gray-500">当天暂无排班数据</p>
            <button @click="openAddModal" class="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all">
              添加排班
            </button>
          </div>
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

    <div v-if="showAddModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" id="add-modal">
      <div class="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-semibold text-gray-800">{{ isEditing ? '编辑排班' : '添加排班' }}</h3>
          <button @click="closeAddModal" class="text-gray-400 hover:text-gray-600">
            <X class="w-5 h-5" />
          </button>
        </div>
        <form @submit.prevent="handleSaveSchedule" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">医生</label>
            <select
              v-model="formData.doctorId"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="">请选择医生</option>
              <optgroup v-for="dept in groupedDepartments" :key="dept" :label="dept">
                <option v-for="doc in getDoctorsByDept(dept)" :key="doc._id" :value="doc._id">
                  {{ doc.name }} - {{ doc.specialty }}
                </option>
              </optgroup>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">选择日期</label>
            <div class="bg-gray-50 rounded-lg p-4">
              <div class="flex items-center justify-between mb-4">
                <button type="button" @click="navMonthPrevForm" class="p-2 hover:bg-gray-200 rounded-lg transition-colors">
                  <ChevronLeft class="w-5 h-5" />
                </button>
                <h4 class="text-base font-semibold">{{ formMonthText }}</h4>
                <button type="button" @click="navMonthNextForm" class="p-2 hover:bg-gray-200 rounded-lg transition-colors">
                  <ChevronRight class="w-5 h-5" />
                </button>
              </div>
              <div class="grid grid-cols-7 gap-1">
                <div
                  v-for="(day, idx) in formCalendarDays"
                  :key="idx"
                  @click="day.date && (formData.date = day.date)"
                  :class="getDayClass(day)"
                >
                  <span>{{ day.day }}</span>
                  <div v-if="day.hasSchedule || day.hasAppointment" class="flex justify-center mt-1 gap-1">
                    <span v-if="day.hasSchedule" class="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                    <span v-if="day.hasAppointment" class="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div>
            <div class="flex justify-between items-center mb-2">
              <label class="block text-sm font-medium text-gray-700">时间段</label>
              <button type="button" @click="toggleAllFormSlots" class="text-sm text-blue-500 hover:text-blue-600">
                {{ formData.selectedSlots.length === timeSlots.length ? '取消全选' : '全选' }}
              </button>
            </div>
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

    <div v-if="showBatchModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" id="batch-modal">
      <div class="bg-white rounded-xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-semibold text-gray-800">批量排班</h3>
          <button @click="closeBatchModal" class="text-gray-400 hover:text-gray-600">
            <X class="w-5 h-5" />
          </button>
        </div>
        <form @submit.prevent="handleSaveBatch" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">医生</label>
            <select
              v-model="batchData.doctorId"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="">请选择医生</option>
              <optgroup v-for="dept in groupedDepartments" :key="dept" :label="dept">
                <option v-for="doc in getDoctorsByDept(dept)" :key="doc._id" :value="doc._id">
                  {{ doc.name }} - {{ doc.specialty }}
                </option>
              </optgroup>
            </select>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">开始日期</label>
              <div class="bg-gray-50 rounded-lg p-4">
                <div class="flex items-center justify-between mb-4">
                  <button type="button" @click="navMonthPrevBatchStart" class="p-2 hover:bg-gray-200 rounded-lg transition-colors">
                    <ChevronLeft class="w-5 h-5" />
                  </button>
                  <h4 class="text-base font-semibold">{{ batchStartMonthText }}</h4>
                  <button type="button" @click="navMonthNextBatchStart" class="p-2 hover:bg-gray-200 rounded-lg transition-colors">
                    <ChevronRight class="w-5 h-5" />
                  </button>
                </div>
                <div class="grid grid-cols-7 gap-1">
                  <div
                    v-for="(day, idx) in batchStartCalendarDays"
                    :key="idx"
                    @click="day.date && (batchData.startDate = day.date)"
                    :class="getDayClass(day)"
                  >
                    <span>{{ day.day }}</span>
                    <div v-if="day.hasSchedule || day.hasAppointment" class="flex justify-center mt-1 gap-1">
                      <span v-if="day.hasSchedule" class="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                      <span v-if="day.hasAppointment" class="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">结束日期</label>
              <div class="bg-gray-50 rounded-lg p-4">
                <div class="flex items-center justify-between mb-4">
                  <button type="button" @click="navMonthPrevBatchEnd" class="p-2 hover:bg-gray-200 rounded-lg transition-colors">
                    <ChevronLeft class="w-5 h-5" />
                  </button>
                  <h4 class="text-base font-semibold">{{ batchEndMonthText }}</h4>
                  <button type="button" @click="navMonthNextBatchEnd" class="p-2 hover:bg-gray-200 rounded-lg transition-colors">
                    <ChevronRight class="w-5 h-5" />
                  </button>
                </div>
                <div class="grid grid-cols-7 gap-1">
                  <div
                    v-for="(day, idx) in batchEndCalendarDays"
                    :key="idx"
                    @click="day.date && (batchData.endDate = day.date)"
                    :class="getDayClass(day)"
                  >
                    <span>{{ day.day }}</span>
                    <div v-if="day.hasSchedule || day.hasAppointment" class="flex justify-center mt-1 gap-1">
                      <span v-if="day.hasSchedule" class="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                      <span v-if="day.hasAppointment" class="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                    </div>
                  </div>
                </div>
              </div>
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
                  :checked="isWeekdaySelected(day.value)"
                  @change="toggleWeekday(day.value)"
                  class="rounded text-blue-500 focus:ring-blue-500"
                />
                <span class="text-sm">{{ day.label }}</span>
              </label>
            </div>
          </div>
          <div>
            <div class="flex justify-between items-center mb-2">
              <label class="block text-sm font-medium text-gray-700">时间段</label>
              <button type="button" @click="toggleAllBatchSlots" class="text-sm text-blue-500 hover:text-blue-600">
                {{ batchData.selectedSlots.length === timeSlots.length ? '取消全选' : '全选' }}
              </button>
            </div>
            <div class="grid grid-cols-4 gap-2">
              <label v-for="slot in timeSlots" :key="slot" class="flex items-center gap-2 p-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                <input type="checkbox" v-model="batchData.selectedSlots" :value="slot" class="rounded text-blue-500 focus:ring-blue-500" />
                <span class="text-sm">{{ slot }}</span>
              </label>
            </div>
          </div>
          <div class="p-3 bg-blue-50 rounded-lg">
            <p class="text-sm text-blue-700">
              <Info class="w-4 h-4 inline mr-1" />
              将为选中的医生在 <span class="font-semibold">{{ batchData.startDate }}</span> 至 <span class="font-semibold">{{ batchData.endDate }}</span> 期间，
              每周的 <span class="font-semibold">{{ weekdaysLabel }}</span> 创建排班。
              已存在排班的日期将被跳过。
            </p>
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
import { Plus, Calendar, X, List, Info, ChevronRight, ChevronLeft } from 'lucide-vue-next'
import AdminLayout from '../../components/AdminLayout.vue'
import { scheduleAPI, doctorAPI, appointmentAPI } from '../../utils/api'

const schedules = ref([])
const doctors = ref([])
const appointments = ref([])
const showAddModal = ref(false)
const showBatchModal = ref(false)
const showAppointmentModal = ref(false)
const today = new Date().toISOString().split('T')[0]
const filterDate = ref(today)
const filterDepartment = ref('')
const isEditing = ref(false)
const editingId = ref(null)
const selectedAppointment = ref(null)

const currentNavDate = ref(new Date())
const formNavDate = ref(new Date())
const batchStartNavDate = ref(new Date())
const batchEndNavDate = ref(new Date())

const weekDays = ['日', '一', '二', '三', '四', '五', '六']
const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']
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

const formData = ref({ doctorId: '', date: '', selectedSlots: [] })
const batchData = ref({ doctorId: '', startDate: '', endDate: '', weekdays: [1, 2, 3, 4, 5], selectedSlots: [] })

const buildCalendar = (navDate, selectedDate) => {
  const year = navDate.getFullYear()
  const month = navDate.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const days = []

  const datesWithSchedules = new Set(
    schedules.value.map(s => new Date(s.date).toISOString().split('T')[0])
  )
  const datesWithAppointments = new Set(
    appointments.value.map(a => new Date(a.date).toISOString().split('T')[0])
  )

  for (let i = 0; i < firstDay; i++) {
    days.push({ day: '', date: null, isToday: false, isSelected: false, hasSchedule: false, hasAppointment: false })
  }
  for (let i = 1; i <= daysInMonth; i++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`
    days.push({
      day: i,
      date: dateStr,
      isToday: dateStr === today,
      isSelected: dateStr === selectedDate,
      hasSchedule: datesWithSchedules.has(dateStr),
      hasAppointment: datesWithAppointments.has(dateStr)
    })
  }
  return days
}

const mainCalendarDays = computed(() => buildCalendar(currentNavDate.value, filterDate.value))
const formCalendarDays = computed(() => buildCalendar(formNavDate.value, formData.value.date))
const batchStartCalendarDays = computed(() => buildCalendar(batchStartNavDate.value, batchData.value.startDate))
const batchEndCalendarDays = computed(() => buildCalendar(batchEndNavDate.value, batchData.value.endDate))

const getMonthText = (date) => {
  const y = date.getFullYear()
  return `${monthNames[date.getMonth()]} ${y}`
}

const currentMonthText = computed(() => getMonthText(currentNavDate.value))
const formMonthText = computed(() => getMonthText(formNavDate.value))
const batchStartMonthText = computed(() => getMonthText(batchStartNavDate.value))
const batchEndMonthText = computed(() => getMonthText(batchEndNavDate.value))

const departments = computed(() => [...new Set(doctors.value.map(d => d.department || d.specialty || '未分类'))].sort())

const filteredSchedules = computed(() =>
  filterDate.value ? schedules.value.filter(s =>
    new Date(s.date).toISOString().split('T')[0] === filterDate.value
  ) : schedules.value
)

const visibleDoctors = computed(() => {
  const doctorIds = new Set(filteredSchedules.value.map(s => s.doctorId._id || s.doctorId))
  return doctors.value.filter(d => {
    if (!doctorIds.has(d._id)) return false
    if (filterDepartment.value) {
      return (d.department || d.specialty || '未分类') === filterDepartment.value
    }
    return true
  })
})

const groupedDepartments = computed(() => {
  const depts = new Set()
  doctors.value.forEach(doctor => {
    depts.add(doctor.department || doctor.specialty || '未分类')
  })
  return [...depts].sort()
})

const getDoctorsByDept = (dept) => {
  return doctors.value.filter(d => (d.department || d.specialty || '未分类') === dept)
}

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

const weekdaysLabel = computed(() => {
  const labels = batchData.value.weekdays
    .map(v => weekdays.find(d => d.value === v)?.label)
    .filter(Boolean)
  return labels.length > 0 ? labels.join('、') : '所有天'
})

const getDayClass = (day) => {
  const classes = ['text-center py-2 cursor-pointer rounded-lg transition-all text-sm']
  if (day.isToday) classes.push('bg-blue-100 font-bold')
  if (day.isSelected) classes.push('bg-blue-500 text-white hover:bg-blue-600')
  else if (day.date) classes.push('hover:bg-gray-100')
  else classes.push('text-gray-300 cursor-default')
  return classes.join(' ')
}

const handleDateClick = (day) => {
  if (day.date) {
    filterDate.value = day.date
  }
}

const getAppointmentInfo = (doctorId, slot) => {
  return appointmentMap.value[`${doctorId}-${slot}`] || null
}

const isDoctorScheduled = (doctorId, slot) => {
  return scheduleMap.value[doctorId]?.has(slot) || false
}

const isWeekdaySelected = (val) => batchData.value.weekdays.includes(val)

const toggleWeekday = (val) => {
  const idx = batchData.value.weekdays.indexOf(val)
  if (idx >= 0) {
    batchData.value.weekdays.splice(idx, 1)
  } else {
    batchData.value.weekdays.push(val)
  }
}

const toggleAllFormSlots = () => {
  formData.value.selectedSlots = formData.value.selectedSlots.length === timeSlots.length ? [] : [...timeSlots]
}

const toggleAllBatchSlots = () => {
  batchData.value.selectedSlots = batchData.value.selectedSlots.length === timeSlots.length ? [] : [...timeSlots]
}

const navMonthPrev = () => {
  const d = new Date(currentNavDate.value)
  currentNavDate.value = new Date(d.getFullYear(), d.getMonth() - 1, 1)
}

const navMonthNext = () => {
  const d = new Date(currentNavDate.value)
  currentNavDate.value = new Date(d.getFullYear(), d.getMonth() + 1, 1)
}

const navMonthPrevForm = () => {
  const d = new Date(formNavDate.value)
  formNavDate.value = new Date(d.getFullYear(), d.getMonth() - 1, 1)
}

const navMonthNextForm = () => {
  const d = new Date(formNavDate.value)
  formNavDate.value = new Date(d.getFullYear(), d.getMonth() + 1, 1)
}

const navMonthPrevBatchStart = () => {
  const d = new Date(batchStartNavDate.value)
  batchStartNavDate.value = new Date(d.getFullYear(), d.getMonth() - 1, 1)
}

const navMonthNextBatchStart = () => {
  const d = new Date(batchStartNavDate.value)
  batchStartNavDate.value = new Date(d.getFullYear(), d.getMonth() + 1, 1)
}

const navMonthPrevBatchEnd = () => {
  const d = new Date(batchEndNavDate.value)
  batchEndNavDate.value = new Date(d.getFullYear(), d.getMonth() - 1, 1)
}

const navMonthNextBatchEnd = () => {
  const d = new Date(batchEndNavDate.value)
  batchEndNavDate.value = new Date(d.getFullYear(), d.getMonth() + 1, 1)
}

const loadData = async () => {
  try {
    const [s, d, a] = await Promise.all([
      scheduleAPI.getAll(),
      doctorAPI.getAll(),
      appointmentAPI.getAll()
    ])
    schedules.value = s.data
    doctors.value = d.data
    appointments.value = a.data
  } catch (err) {
    console.error('Failed to load data')
  }
}

const openAddModal = () => {
  showAddModal.value = true
}

const closeAddModal = () => {
  showAddModal.value = false
  isEditing.value = false
  editingId.value = null
  formData.value = { doctorId: '', date: '', selectedSlots: [] }
}

const openBatchModal = () => {
  showBatchModal.value = true
}

const closeBatchModal = () => {
  showBatchModal.value = false
  batchData.value = { doctorId: '', startDate: '', endDate: '', weekdays: [1, 2, 3, 4, 5], selectedSlots: [] }
}

const openAppointmentModal = (appt) => {
  selectedAppointment.value = appt
  showAppointmentModal.value = true
}

const closeAppointmentModal = () => {
  showAppointmentModal.value = false
  selectedAppointment.value = null
}

const cancelSelectedAppointment = async () => {
  if (!selectedAppointment.value?._id) return
  if (!confirm('确定要取消该预约吗？')) return
  try {
    await appointmentAPI.update(selectedAppointment.value._id, { status: 'cancelled' })
    alert('取消成功')
    loadData()
    closeAppointmentModal()
  } catch (err) {
    alert(err.response?.data?.message || '取消失败')
  }
}

const handleSaveSchedule = async () => {
  if (!formData.value.doctorId || !formData.value.date) {
    alert('请选择医生和日期')
    return
  }
  try {
    const timeSlotsData = formData.value.selectedSlots.map(time => ({ time, available: 1, maxCapacity: 1 }))
    if (isEditing.value) {
      await scheduleAPI.update(editingId.value, { timeSlots: timeSlotsData })
      alert('修改成功')
    } else {
      await scheduleAPI.create({
        doctorId: formData.value.doctorId,
        date: new Date(formData.value.date).toISOString(),
        timeSlots: timeSlotsData
      })
      alert('添加成功')
    }
    loadData()
    closeAddModal()
  } catch (err) {
    alert(err.response?.data?.message || '操作失败')
  }
}

const handleSaveBatch = async () => {
  if (!batchData.value.doctorId || !batchData.value.startDate || !batchData.value.endDate) {
    alert('请填写医生和日期范围')
    return
  }
  if (batchData.value.selectedSlots.length === 0) {
    alert('请选择至少一个时间段')
    return
  }
  try {
    const response = await scheduleAPI.batchCreate(batchData.value)
    loadData()
    closeBatchModal()
    const msg = response.data.message
    if (response.data.errors?.length) {
      alert(`${msg}\n已跳过的日期：${response.data.errors.join('\n')}`)
    } else {
      alert(msg)
    }
  } catch (err) {
    alert(err.response?.data?.message || '批量创建失败')
  }
}

onMounted(loadData)
</script>

<style scoped>
table { border-collapse: separate; border-spacing: 0; }
th, td { border: 1px solid #e5e7eb; }
.sticky { position: sticky; }
.sticky.left-0 { left: 0; }
</style>
