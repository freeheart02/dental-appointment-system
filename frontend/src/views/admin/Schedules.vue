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
              <option v-for="dept in deptList" :key="dept" :value="dept">{{ dept }}</option>
            </select>
          </div>
        </div>
      </div>

      <div class="p-4">
        <div v-if="tableRows.length > 0 && docList.length > 0" class="overflow-x-auto">
          <table class="w-full border-collapse">
            <thead>
              <tr class="bg-gradient-to-r from-blue-50 to-blue-100">
                <th class="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700 bg-blue-50 sticky left-0 z-10 min-w-[100px]">
                  时间
                </th>
                <th
                  v-for="doc in docList"
                  :key="doc._id"
                  class="border border-gray-300 px-4 py-3 text-center font-semibold text-gray-700 min-w-[180px]"
                >
                  <div class="flex flex-col items-center">
                    <span class="font-bold">{{ doc.name }}</span>
                    <span class="text-xs text-gray-500 font-normal">{{ doc.department || doc.specialty || '口腔科' }}</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="t in timeSlotList" :key="t" class="hover:bg-gray-50">
                <td class="border border-gray-300 px-4 py-3 font-medium text-gray-700 bg-gray-50 sticky left-0 z-10">
                  {{ t }}
                </td>
                <td
                  v-for="doc in docList"
                  :key="doc._id + '-slot-' + t"
                  class="border border-gray-300 px-2 py-2 text-center"
                >
                  <div v-if="lookupAppt(doc._id, t)"
                       class="p-2 bg-green-50 rounded-lg border border-green-200 cursor-pointer hover:bg-green-100 transition-all"
                       @click="showAppt(lookupAppt(doc._id, t))">
                    <div class="font-medium text-green-800 text-sm">{{ lookupAppt(doc._id, t).patientName }}</div>
                    <div class="text-xs text-green-600">{{ lookupAppt(doc._id, t).phone }}</div>
                  </div>
                  <div v-else-if="hasSchedule(doc._id, t)" class="p-2 bg-gray-100 rounded-lg border border-gray-200 opacity-50">
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
          <button @click="openAddModal" class="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all">
            添加排班
          </button>
        </div>
      </div>
    </div>

    <!-- Appointment Detail Modal -->
    <div v-if="apptModalVisible" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-xl p-6 w-full max-w-md">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-semibold text-gray-800">预约详情</h3>
          <button @click="closeApptModal" class="text-gray-400 hover:text-gray-600">
            <X class="w-5 h-5" />
          </button>
        </div>
        <div v-if="currentAppt" class="space-y-4">
          <div class="p-4 bg-blue-50 rounded-lg">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <p class="text-sm text-gray-500">患者姓名</p>
                <p class="font-semibold text-gray-800">{{ currentAppt.patientName }}</p>
              </div>
              <div>
                <p class="text-sm text-gray-500">联系电话</p>
                <p class="font-semibold text-gray-800">{{ currentAppt.phone }}</p>
              </div>
              <div>
                <p class="text-sm text-gray-500">预约医生</p>
                <p class="font-semibold text-gray-800">{{ currentAppt.doctorName }}</p>
              </div>
              <div>
                <p class="text-sm text-gray-500">预约时间</p>
                <p class="font-semibold text-gray-800">{{ currentAppt.date }} {{ currentAppt.timeSlot }}</p>
              </div>
            </div>
          </div>
          <div class="flex gap-3">
            <button @click="closeApptModal" class="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all">
              关闭
            </button>
            <button @click="cancelCurrentAppt" class="flex-1 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all">
              取消预约
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Add/Edit Schedule Modal -->
    <div v-if="addModalVisible" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-semibold text-gray-800">{{ editingMode ? '编辑排班' : '添加排班' }}</h3>
          <button @click="closeAddModal" class="text-gray-400 hover:text-gray-600">
            <X class="w-5 h-5" />
          </button>
        </div>
        <form @submit.prevent="submitAdd" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">医生</label>
            <select
              v-model="formFields.doctorId"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="">请选择医生</option>
              <option v-for="doc in doctorList" :key="doc._id" :value="doc._id">
                {{ doc.name }} - {{ doc.specialty }}
              </option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">选择日期</label>
            <div class="bg-gray-50 rounded-lg p-4 inline-block">
              <div class="flex items-center justify-between mb-3">
                <button type="button" @click="prevMonthAdd" class="p-2 hover:bg-gray-200 rounded-lg transition-colors">
                  <ChevronLeft class="w-5 h-5" />
                </button>
                <h4 class="text-base font-semibold">{{ addMonthLabel }}</h4>
                <button type="button" @click="nextMonthAdd" class="p-2 hover:bg-gray-200 rounded-lg transition-colors">
                  <ChevronRight class="w-5 h-5" />
                </button>
              </div>
              <div class="grid grid-cols-7 gap-1 mb-2">
                <div v-for="w in weekLabels" :key="w" class="text-center text-sm font-medium text-gray-600 py-1">
                  {{ w }}
                </div>
              </div>
              <div class="grid grid-cols-7 gap-1">
                <div
                  v-for="(cell, idx) in addCalendarCells"
                  :key="'add-cal-' + idx"
                  @click="cell.dayNum > 0 && (formFields.date = cell.dateStr)"
                  :class="getCellClass(cell)"
                >
                  <span>{{ cell.dayNum > 0 ? cell.dayNum : '' }}</span>
                </div>
              </div>
              <div class="mt-3 text-sm text-gray-500">
                已选: {{ formFields.date || '未选择' }}
              </div>
            </div>
          </div>

          <div>
            <div class="flex justify-between items-center mb-2">
              <label class="block text-sm font-medium text-gray-700">时间段</label>
              <button type="button" @click="toggleAllFormSlots" class="text-sm text-blue-500 hover:text-blue-600">
                {{ formFields.selectedSlots.length === timeSlotList.length ? '取消全选' : '全选' }}
              </button>
            </div>
            <div class="grid grid-cols-4 gap-2">
              <label v-for="slot in timeSlotList" :key="slot" class="flex items-center gap-2 p-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                <input type="checkbox" v-model="formFields.selectedSlots" :value="slot" class="rounded text-blue-500 focus:ring-blue-500" />
                <span class="text-sm">{{ slot }}</span>
              </label>
            </div>
          </div>

          <button type="submit" class="w-full py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-all">
            {{ editingMode ? '保存修改' : '添加排班' }}
          </button>
        </form>
      </div>
    </div>

    <!-- Batch Schedule Modal -->
    <div v-if="batchModalVisible" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-semibold text-gray-800">批量排班</h3>
          <button @click="closeBatchModal" class="text-gray-400 hover:text-gray-600">
            <X class="w-5 h-5" />
          </button>
        </div>
        <form @submit.prevent="submitBatch" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">医生</label>
            <select
              v-model="batchFields.doctorId"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="">请选择医生</option>
              <option v-for="doc in doctorList" :key="doc._id" :value="doc._id">
                {{ doc.name }} - {{ doc.specialty }}
              </option>
            </select>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">开始日期</label>
              <div class="bg-gray-50 rounded-lg p-4">
                <div class="flex items-center justify-between mb-3">
                  <button type="button" @click="prevMonthBatchStart" class="p-2 hover:bg-gray-200 rounded-lg transition-colors">
                    <ChevronLeft class="w-5 h-5" />
                  </button>
                  <h4 class="text-base font-semibold">{{ batchStartMonthLabel }}</h4>
                  <button type="button" @click="nextMonthBatchStart" class="p-2 hover:bg-gray-200 rounded-lg transition-colors">
                    <ChevronRight class="w-5 h-5" />
                  </button>
                </div>
                <div class="grid grid-cols-7 gap-1 mb-2">
                  <div v-for="w in weekLabels" :key="'bs-w-' + w" class="text-center text-xs font-medium text-gray-600 py-1">
                    {{ w }}
                  </div>
                </div>
                <div class="grid grid-cols-7 gap-1">
                  <div
                    v-for="(cell, idx) in batchStartCalendarCells"
                    :key="'bstart-cal-' + idx"
                    @click="cell.dayNum > 0 && (batchFields.startDate = cell.dateStr)"
                    :class="getCellClass(cell)"
                  >
                    <span>{{ cell.dayNum > 0 ? cell.dayNum : '' }}</span>
                  </div>
                </div>
                <div class="mt-2 text-xs text-gray-500">
                  已选: {{ batchFields.startDate || '未选择' }}
                </div>
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">结束日期</label>
              <div class="bg-gray-50 rounded-lg p-4">
                <div class="flex items-center justify-between mb-3">
                  <button type="button" @click="prevMonthBatchEnd" class="p-2 hover:bg-gray-200 rounded-lg transition-colors">
                    <ChevronLeft class="w-5 h-5" />
                  </button>
                  <h4 class="text-base font-semibold">{{ batchEndMonthLabel }}</h4>
                  <button type="button" @click="nextMonthBatchEnd" class="p-2 hover:bg-gray-200 rounded-lg transition-colors">
                    <ChevronRight class="w-5 h-5" />
                  </button>
                </div>
                <div class="grid grid-cols-7 gap-1 mb-2">
                  <div v-for="w in weekLabels" :key="'be-w-' + w" class="text-center text-xs font-medium text-gray-600 py-1">
                    {{ w }}
                  </div>
                </div>
                <div class="grid grid-cols-7 gap-1">
                  <div
                    v-for="(cell, idx) in batchEndCalendarCells"
                    :key="'bend-cal-' + idx"
                    @click="cell.dayNum > 0 && (batchFields.endDate = cell.dateStr)"
                    :class="getCellClass(cell)"
                  >
                    <span>{{ cell.dayNum > 0 ? cell.dayNum : '' }}</span>
                  </div>
                </div>
                <div class="mt-2 text-xs text-gray-500">
                  已选: {{ batchFields.endDate || '未选择' }}
                </div>
              </div>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">选择出诊星期</label>
            <div class="flex flex-wrap gap-2">
              <label
                v-for="day in weekdayOptions"
                :key="'wk-' + day.value"
                class="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  :checked="isWeekdayChecked(day.value)"
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
                {{ batchFields.selectedSlots.length === timeSlotList.length ? '取消全选' : '全选' }}
              </button>
            </div>
            <div class="grid grid-cols-4 gap-2">
              <label v-for="slot in timeSlotList" :key="'b-slot-' + slot" class="flex items-center gap-2 p-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                <input type="checkbox" v-model="batchFields.selectedSlots" :value="slot" class="rounded text-blue-500 focus:ring-blue-500" />
                <span class="text-sm">{{ slot }}</span>
              </label>
            </div>
          </div>

          <div class="p-3 bg-blue-50 rounded-lg">
            <p class="text-sm text-blue-700">
              <Info class="w-4 h-4 inline mr-1" />
              将为选中的医生在 <span class="font-semibold">{{ batchFields.startDate || '____' }}</span> 至 <span class="font-semibold">{{ batchFields.endDate || '____' }}</span> 期间，
              每周的 <span class="font-semibold">{{ selectedWeekdayLabel }}</span> 创建排班。
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

<script>
import { ref, reactive, computed, onMounted } from 'vue'
import { Plus, Calendar, X, List, Info, ChevronLeft, ChevronRight } from 'lucide-vue-next'
import AdminLayout from '../../components/AdminLayout.vue'
import { scheduleAPI, doctorAPI, appointmentAPI } from '../../utils/api.js'

export default {
  name: 'Schedules',
  components: { Plus, Calendar, X, List, Info, ChevronLeft, ChevronRight, AdminLayout },
  setup() {
    // ===== Constants =====
    const weekLabels = ['日', '一', '二', '三', '四', '五', '六']
    const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']
    const timeSlotList = [
      '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
      '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'
    ]
    const weekdayOptions = [
      { value: 0, label: '周日' },
      { value: 1, label: '周一' },
      { value: 2, label: '周二' },
      { value: 3, label: '周三' },
      { value: 4, label: '周四' },
      { value: 5, label: '周五' },
      { value: 6, label: '周六' }
    ]

    const padZero = (n) => String(n).padStart(2, '0')
    const formatDate = (y, m, d) => `${y}-${padZero(m + 1)}-${padZero(d)}`
    const todayStr = () => {
      const now = new Date()
      return formatDate(now.getFullYear(), now.getMonth(), now.getDate())
    }

    // Build 42 cells for a calendar month
    const buildCalendarCells = (year, month, selectedDate, scheduleDates) => {
      const firstDay = new Date(year, month, 1).getDay()
      const daysInMonth = new Date(year, month + 1, 0).getDate()
      const today = todayStr()
      const cells = []
      // Empty cells before first day
      for (let i = 0; i < firstDay; i++) {
        cells.push({ dayNum: 0, dateStr: '', isToday: false, isSelected: false, isDisabled: true })
      }
      // Day cells
      for (let d = 1; d <= daysInMonth; d++) {
        const ds = formatDate(year, month, d)
        cells.push({
          dayNum: d,
          dateStr: ds,
          isToday: ds === today,
          isSelected: ds === selectedDate,
          isDisabled: false
        })
      }
      // Fill to 42 cells (6 weeks)
      while (cells.length < 42) {
        cells.push({ dayNum: 0, dateStr: '', isToday: false, isSelected: false, isDisabled: true })
      }
      return cells
    }

    // ===== State =====
    const scheduleList = ref([])
    const doctorList = ref([])
    const appointmentList = ref([])
    const addModalVisible = ref(false)
    const batchModalVisible = ref(false)
    const apptModalVisible = ref(false)
    const editingMode = ref(false)
    const editingId = ref('')
    const currentAppt = ref(null)

    // Main table filter
    const filterDate = ref(todayStr())
    const filterDepartment = ref('')

    // Calendar navigation state (year/month index)
    const addMonthIdx = ref(todayYearMonthIdx())
    const batchStartMonthIdx = ref(todayYearMonthIdx())
    const batchEndMonthIdx = ref(todayYearMonthIdx() + 6) // Default 6 months later for end date

    function todayYearMonthIdx() {
      const now = new Date()
      return now.getFullYear() * 12 + now.getMonth()
    }

    function idxToYearMonth(idx) {
      const y = Math.floor(idx / 12)
      const m = idx - y * 12
      return { year: y, month: m }
    }

    // ===== Form state =====
    const formFields = reactive({
      doctorId: '',
      date: '',
      selectedSlots: []
    })

    const batchFields = reactive({
      doctorId: '',
      startDate: '',
      endDate: '',
      weekdays: [1, 2, 3, 4, 5],
      selectedSlots: []
    })

    // ===== Helper: build cell class =====
    const getCellClass = (cell) => {
      if (cell.dayNum === 0) return 'text-center py-2 text-gray-300'
      const classes = ['text-center py-2 cursor-pointer rounded-lg transition-all text-sm']
      if (cell.isToday) classes.push('bg-blue-100 font-bold')
      if (cell.isSelected) classes.push('bg-blue-500 text-white hover:bg-blue-600')
      else classes.push('hover:bg-gray-100')
      return classes.join(' ')
    }

    // ===== Computed for main table =====
    const deptList = computed(() => {
      const s = new Set()
      doctorList.value.forEach((d) => s.add(d.department || d.specialty || '未分类'))
      return [...s].sort()
    })

    const tableRows = computed(() =>
      scheduleList.value.filter((s) => {
        const d = new Date(s.date).toISOString().split('T')[0]
        return d === filterDate.value
      })
    )

    const docList = computed(() => {
      const ids = new Set(tableRows.value.map((s) => s.doctorId._id || s.doctorId))
      return doctorList.value.filter((d) => {
        if (!ids.has(d._id)) return false
        if (filterDepartment.value) {
          return (d.department || d.specialty || '未分类') === filterDepartment.value
        }
        return true
      })
    })

    // Appointment lookup table: key = doctorId-slot
    const apptMap = computed(() => {
      const map = {}
      appointmentList.value.forEach((a) => {
        const ad = new Date(a.date).toISOString().split('T')[0]
        if (ad !== filterDate.value || a.status === 'cancelled') return
        const key = (a.doctorId._id || a.doctorId) + '-' + a.timeSlot
        map[key] = {
          _id: a._id,
          patientName: a.patientName || (a.patientId && a.patientId.name) || '未知',
          phone: a.phone || (a.patientId && a.patientId.phone) || '-',
          doctorName: a.doctorName || (a.doctorId && a.doctorId.name) || '未知',
          date: ad,
          timeSlot: a.timeSlot
        }
      })
      return map
    })

    // Schedule lookup: map[doctorId] -> Set(slot)
    const scheduleMap = computed(() => {
      const map = {}
      tableRows.value.forEach((s) => {
        const id = s.doctorId._id || s.doctorId
        if (!map[id]) map[id] = new Set()
        if (s.timeSlots && Array.isArray(s.timeSlots)) {
          s.timeSlots.forEach((ts) => map[id].add(ts.time))
        }
      })
      return map
    })

    const lookupAppt = (doctorId, slot) => {
      const m = apptMap.value
      return m[doctorId + '-' + slot] || null
    }

    const hasSchedule = (doctorId, slot) => {
      const m = scheduleMap.value
      return !!(m[doctorId] && m[doctorId].has(slot))
    }

    // ===== Calendar computed labels =====
    const addMonthLabel = computed(() => {
      const ym = idxToYearMonth(addMonthIdx.value)
      return `${monthNames[ym.month]} ${ym.year}`
    })

    const batchStartMonthLabel = computed(() => {
      const ym = idxToYearMonth(batchStartMonthIdx.value)
      return `${monthNames[ym.month]} ${ym.year}`
    })

    const batchEndMonthLabel = computed(() => {
      const ym = idxToYearMonth(batchEndMonthIdx.value)
      return `${monthNames[ym.month]} ${ym.year}`
    })

    // Calendar cells (computed from state)
    const addCalendarCells = computed(() => {
      const ym = idxToYearMonth(addMonthIdx.value)
      return buildCalendarCells(ym.year, ym.month, formFields.date, new Set())
    })

    const batchStartCalendarCells = computed(() => {
      const ym = idxToYearMonth(batchStartMonthIdx.value)
      return buildCalendarCells(ym.year, ym.month, batchFields.startDate, new Set())
    })

    const batchEndCalendarCells = computed(() => {
      const ym = idxToYearMonth(batchEndMonthIdx.value)
      return buildCalendarCells(ym.year, ym.month, batchFields.endDate, new Set())
    })

    const selectedWeekdayLabel = computed(() => {
      const labels = batchFields.weekdays
        .slice()
        .sort((a, b) => a - b)
        .map((v) => {
          const opt = weekdayOptions.find((o) => o.value === v)
          return opt ? opt.label : ''
        })
        .filter(Boolean)
      return labels.length > 0 ? labels.join('、') : '未选择'
    })

    const isWeekdayChecked = (val) => batchFields.weekdays.includes(val)

    const toggleWeekday = (val) => {
      const idx = batchFields.weekdays.indexOf(val)
      if (idx >= 0) {
        batchFields.weekdays.splice(idx, 1)
      } else {
        batchFields.weekdays.push(val)
      }
    }

    // ===== Navigation =====
    const prevMonthAdd = () => { addMonthIdx.value-- }
    const nextMonthAdd = () => { addMonthIdx.value++ }
    const prevMonthBatchStart = () => { batchStartMonthIdx.value-- }
    const nextMonthBatchStart = () => { batchStartMonthIdx.value++ }
    const prevMonthBatchEnd = () => { batchEndMonthIdx.value-- }
    const nextMonthBatchEnd = () => { batchEndMonthIdx.value++ }

    // ===== Toggle all slots =====
    const toggleAllFormSlots = () => {
      if (formFields.selectedSlots.length === timeSlotList.length) {
        formFields.selectedSlots.splice(0, formFields.selectedSlots.length)
      } else {
        formFields.selectedSlots.splice(0, formFields.selectedSlots.length, ...timeSlotList)
      }
    }

    const toggleAllBatchSlots = () => {
      if (batchFields.selectedSlots.length === timeSlotList.length) {
        batchFields.selectedSlots.splice(0, batchFields.selectedSlots.length)
      } else {
        batchFields.selectedSlots.splice(0, batchFields.selectedSlots.length, ...timeSlotList)
      }
    }

    // ===== Modal controls =====
    const openAddModal = () => {
      addModalVisible.value = true
    }

    const closeAddModal = () => {
      addModalVisible.value = false
      editingMode.value = false
      editingId.value = ''
      formFields.doctorId = ''
      formFields.date = ''
      formFields.selectedSlots.splice(0, formFields.selectedSlots.length)
    }

    const openBatchModal = () => {
      batchModalVisible.value = true
    }

    const closeBatchModal = () => {
      batchModalVisible.value = false
      batchFields.doctorId = ''
      batchFields.startDate = ''
      batchFields.endDate = ''
      batchFields.weekdays.splice(0, batchFields.weekdays.length, 1, 2, 3, 4, 5)
      batchFields.selectedSlots.splice(0, batchFields.selectedSlots.length)
    }

    const showAppt = (appt) => {
      currentAppt.value = appt
      apptModalVisible.value = true
    }

    const closeApptModal = () => {
      apptModalVisible.value = false
      currentAppt.value = null
    }

    // ===== Data loading =====
    const loadAllData = async () => {
      try {
        const [sRes, dRes, aRes] = await Promise.all([
          scheduleAPI.getAll(),
          doctorAPI.getAll(),
          appointmentAPI.getAll()
        ])
        scheduleList.value = sRes.data || []
        doctorList.value = dRes.data || []
        appointmentList.value = aRes.data || []
      } catch (err) {
        console.error('Failed to load data', err)
      }
    }

    // ===== Submit handlers =====
    const submitAdd = async () => {
      if (!formFields.doctorId || !formFields.date) {
        alert('请选择医生和日期')
        return
      }
      try {
        const timeSlotsData = formFields.selectedSlots.map((time) => ({
          time: time,
          available: 1,
          maxCapacity: 1
        }))
        if (editingMode.value) {
          await scheduleAPI.update(editingId.value, { timeSlots: timeSlotsData })
        } else {
          await scheduleAPI.create({
            doctorId: formFields.doctorId,
            date: new Date(formFields.date).toISOString(),
            timeSlots: timeSlotsData
          })
        }
        alert(editingMode.value ? '修改成功' : '添加成功')
        loadAllData()
        closeAddModal()
      } catch (err) {
        const msg = (err.response && err.response.data && err.response.data.message) || '操作失败'
        alert(msg)
      }
    }

    const submitBatch = async () => {
      if (!batchFields.doctorId || !batchFields.startDate || !batchFields.endDate) {
        alert('请填写医生和日期范围')
        return
      }
      if (batchFields.selectedSlots.length === 0) {
        alert('请选择至少一个时间段')
        return
      }
      if (batchFields.weekdays.length === 0) {
        alert('请选择至少一个出诊星期')
        return
      }
      try {
        const payload = {
          doctorId: batchFields.doctorId,
          startDate: batchFields.startDate,
          endDate: batchFields.endDate,
          weekdays: batchFields.weekdays.slice().sort(),
          selectedSlots: batchFields.selectedSlots.slice(),
          timeSlots: batchFields.selectedSlots.slice().map((t) => ({ time: t, available: 1, maxCapacity: 1 }))
        }
        const response = await scheduleAPI.batchCreate(payload)
        loadAllData()
        closeBatchModal()
        const msg = response.data.message || '批量创建成功'
        if (response.data.errors && response.data.errors.length > 0) {
          alert(msg + '\n已跳过的日期：' + response.data.errors.slice(0, 10).join(', '))
        } else {
          alert(msg)
        }
      } catch (err) {
        const msg = (err.response && err.response.data && err.response.data.message) || '批量创建失败'
        alert(msg)
      }
    }

    const cancelCurrentAppt = async () => {
      if (!currentAppt.value || !currentAppt.value._id) return
      if (!confirm('确定要取消该预约吗？')) return
      try {
        await appointmentAPI.update(currentAppt.value._id, { status: 'cancelled' })
        alert('取消成功')
        loadAllData()
        closeApptModal()
      } catch (err) {
        alert('取消失败')
      }
    }

    onMounted(() => {
      loadAllData()
    })

    return {
      weekLabels,
      timeSlotList,
      weekdayOptions,
      scheduleList,
      doctorList,
      appointmentList,
      addModalVisible,
      batchModalVisible,
      apptModalVisible,
      editingMode,
      currentAppt,
      filterDate,
      filterDepartment,
      formFields,
      batchFields,
      deptList,
      tableRows,
      docList,
      lookupAppt,
      hasSchedule,
      addMonthLabel,
      batchStartMonthLabel,
      batchEndMonthLabel,
      addCalendarCells,
      batchStartCalendarCells,
      batchEndCalendarCells,
      selectedWeekdayLabel,
      isWeekdayChecked,
      toggleWeekday,
      prevMonthAdd,
      nextMonthAdd,
      prevMonthBatchStart,
      nextMonthBatchStart,
      prevMonthBatchEnd,
      nextMonthBatchEnd,
      toggleAllFormSlots,
      toggleAllBatchSlots,
      openAddModal,
      closeAddModal,
      openBatchModal,
      closeBatchModal,
      showAppt,
      closeApptModal,
      submitAdd,
      submitBatch,
      cancelCurrentAppt,
      getCellClass
    }
  }
}
</script>

<style scoped>
table { border-collapse: separate; border-spacing: 0; }
th, td { border: 1px solid #e5e7eb; }
</style>
