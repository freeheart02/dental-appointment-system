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
            <span class="text-sm text-gray-600">日期:</span>
            <input v-model="filterDate" type="date" class="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" @change="buildViewState" />
          </div>
          <div class="flex items-center gap-2">
            <span class="text-sm text-gray-600">科室:</span>
            <select v-model="filterDepartment" @change="buildViewState" class="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
              <option value="">全部</option>
              <option v-for="dept in deptList" :key="dept" :value="dept">{{ dept }}</option>
            </select>
          </div>
        </div>
      </div>

      <div class="p-4">
        <div v-if="visibleDoctors.length > 0" class="overflow-x-auto">
          <table class="w-full border-collapse text-sm">
            <thead>
              <tr class="bg-blue-50">
                <th class="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-700 min-w-[80px]">时间</th>
                <th v-for="doc in visibleDoctors" :key="doc._id" class="border border-gray-300 px-4 py-2 text-center font-semibold text-gray-700 min-w-[150px]">
                  <div class="flex flex-col items-center">
                    <span class="font-bold">{{ doc.name }}</span>
                    <span class="text-xs text-gray-500 font-normal">{{ doc.specialty }}</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="slot in timeSlotList" :key="'t-'+slot" class="hover:bg-gray-50">
                <td class="border border-gray-300 px-4 py-2 font-medium text-gray-700 bg-gray-50">{{ slot }}</td>
                <td v-for="doc in visibleDoctors" :key="'c-'+slot+'-'+doc._id" class="border border-gray-300 px-2 py-2 text-center">
                  <div v-if="getCellData(slot, doc._id) === 'appt'" @click="showApptFromCell(slot, doc._id)" class="p-2 bg-green-50 rounded-lg border border-green-200 cursor-pointer hover:bg-green-100 transition-all">
                    <div class="font-medium text-green-800 text-sm">{{ getCellName(slot, doc._id) }}</div>
                  </div>
                  <div v-else-if="getCellData(slot, doc._id) === 'sched'" class="p-2 bg-gray-100 rounded-lg border border-gray-200">
                    <span class="text-xs text-gray-500">空闲</span>
                  </div>
                  <div v-else class="p-2 bg-gray-50 rounded-lg border border-gray-100">
                    <span class="text-xs text-gray-300">-</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="p-12 text-center">
          <Calendar class="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p class="text-gray-500 mb-4">当天暂无排班数据</p>
          <button @click="openAddModal" class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all">添加排班</button>
        </div>
      </div>
    </div>

    <!-- 预约详情模态框 -->
    <div v-if="showApptModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-xl p-6 w-full max-w-md">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-semibold text-gray-800">预约详情</h3>
          <button @click="showApptModal=false" class="text-gray-400 hover:text-gray-600"><X class="w-5 h-5" /></button>
        </div>
        <div class="space-y-3">
          <div class="p-4 bg-blue-50 rounded-lg">
            <div class="space-y-2 text-sm">
              <div><span class="text-gray-500">患者姓名:</span> <span class="font-medium">{{ currentAppt.patientName }}</span></div>
              <div><span class="text-gray-500">联系电话:</span> <span class="font-medium">{{ currentAppt.phone }}</span></div>
              <div><span class="text-gray-500">预约医生:</span> <span class="font-medium">{{ currentAppt.doctorName }}</span></div>
              <div><span class="text-gray-500">预约时间:</span> <span class="font-medium">{{ currentAppt.date }} {{ currentAppt.timeSlot }}</span></div>
            </div>
          </div>
          <div class="flex gap-3">
            <button @click="showApptModal=false" class="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all">关闭</button>
            <button @click="handleCancelAppt" class="flex-1 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all">取消预约</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 添加排班模态框 -->
    <div v-if="showAddModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-xl p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-semibold text-gray-800">添加排班</h3>
          <button @click="showAddModal=false" class="text-gray-400 hover:text-gray-600"><X class="w-5 h-5" /></button>
        </div>
        <form @submit.prevent="submitAdd" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">医生</label>
            <select v-model="addFormDoctor" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
              <option value="">请选择医生</option>
              <option v-for="doc in doctorList" :key="doc._id" :value="doc._id">{{ doc.name }} - {{ doc.specialty }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">日期</label>
            <input v-model="addFormDate" type="date" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <div class="flex justify-between items-center mb-2">
              <label class="block text-sm font-medium text-gray-700">时间段</label>
              <button type="button" @click="toggleAddAllSlots" class="text-sm text-blue-500 hover:text-blue-600">{{ addAllSelected ? '取消全选' : '全选' }}</button>
            </div>
            <div class="grid grid-cols-4 gap-2">
              <label v-for="slot in timeSlotList" :key="'as-'+slot" class="flex items-center gap-2 p-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 text-sm">
                <input type="checkbox" :value="slot" :checked="addFormSlots.includes(slot)" @change="toggleAddSlot(slot)" class="rounded text-blue-500 focus:ring-blue-500" />
                <span>{{ slot }}</span>
              </label>
            </div>
          </div>
          <button type="submit" class="w-full py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-all">添加排班</button>
        </form>
      </div>
    </div>

    <!-- 批量排班模态框 -->
    <div v-if="showBatchModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-semibold text-gray-800">批量排班</h3>
          <button @click="showBatchModal=false" class="text-gray-400 hover:text-gray-600"><X class="w-5 h-5" /></button>
        </div>
        <form @submit.prevent="submitBatch" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">医生</label>
            <select v-model="batchFormDoctor" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
              <option value="">请选择医生</option>
              <option v-for="doc in doctorList" :key="doc._id" :value="doc._id">{{ doc.name }} - {{ doc.specialty }}</option>
            </select>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">开始日期</label>
              <input v-model="batchFormStart" type="date" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">结束日期</label>
              <input v-model="batchFormEnd" type="date" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">选择出诊星期</label>
            <div class="flex flex-wrap gap-2">
              <label v-for="day in weekdayOptions" :key="'bw-'+day.value" class="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 text-sm">
                <input type="checkbox" :value="day.value" :checked="batchFormWeekdays.includes(day.value)" @change="toggleBatchWeekday(day.value)" class="rounded text-blue-500 focus:ring-blue-500" />
                <span>{{ day.label }}</span>
              </label>
            </div>
          </div>
          <div>
            <div class="flex justify-between items-center mb-2">
              <label class="block text-sm font-medium text-gray-700">时间段</label>
              <button type="button" @click="toggleBatchAllSlots" class="text-sm text-blue-500 hover:text-blue-600">{{ batchAllSelected ? '取消全选' : '全选' }}</button>
            </div>
            <div class="grid grid-cols-4 gap-2">
              <label v-for="slot in timeSlotList" :key="'bs-'+slot" class="flex items-center gap-2 p-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 text-sm">
                <input type="checkbox" :value="slot" :checked="batchFormSlots.includes(slot)" @change="toggleBatchSlot(slot)" class="rounded text-blue-500 focus:ring-blue-500" />
                <span>{{ slot }}</span>
              </label>
            </div>
          </div>
          <button type="submit" class="w-full py-3 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-all">批量创建排班</button>
        </form>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Plus, Calendar, X, List } from 'lucide-vue-next'
import AdminLayout from '../../components/AdminLayout.vue'
import { scheduleAPI, doctorAPI, appointmentAPI } from '../../utils/api.js'

const timeSlotList = ['08:00','08:30','09:00','09:30','10:00','10:30','11:00','11:30','13:30','14:00','14:30','15:00','15:30','16:00','16:30','17:00']
const weekdayOptions = [{value:0,label:'周日'},{value:1,label:'周一'},{value:2,label:'周二'},{value:3,label:'周三'},{value:4,label:'周四'},{value:5,label:'周五'},{value:6,label:'周六'}]

function todayStr() {
  const d = new Date()
  return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0')
}

// 主列表数据（只在 onMounted 加载一次）
const scheduleList = ref([])
const doctorList = ref([])
const appointmentList = ref([])
const deptList = ref([])
const filterDate = ref(todayStr())
const filterDepartment = ref('')

// 预计算的展示数据（buildViewState 中更新）
const visibleDoctors = ref([])
const apptMap = ref({})
const schedMap = ref({})

// 预约详情
const showApptModal = ref(false)
const currentAppt = ref(null)

// 添加排班
const showAddModal = ref(false)
const addFormDoctor = ref('')
const addFormDate = ref('')
const addFormSlots = ref([])
const addAllSelected = ref(false)

// 批量排班
const showBatchModal = ref(false)
const batchFormDoctor = ref('')
const batchFormStart = ref('')
const batchFormEnd = ref('')
const batchFormWeekdays = ref([1,2,3,4,5])
const batchFormSlots = ref([])
const batchAllSelected = ref(false)

// ==== 单元格查询（基于预计算的 map）====
function getCellData(slot, doctorId) {
  const key = doctorId + '-' + slot
  if (apptMap.value[key]) return 'appt'
  if (schedMap.value[key]) return 'sched'
  return 'none'
}
function getCellName(slot, doctorId) {
  const a = apptMap.value[doctorId + '-' + slot]
  return a ? a.patientName : ''
}

// ==== 添加排班：复选框管理 ====
function openAddModal() {
  addFormDoctor.value = doctorList.value[0]?._id || ''
  addFormDate.value = filterDate.value
  addFormSlots.value = []
  addAllSelected.value = false
  showAddModal.value = true
}

function toggleAddSlot(slot) {
  const idx = addFormSlots.value.indexOf(slot)
  if (idx >= 0) {
    addFormSlots.value = addFormSlots.value.filter(s => s !== slot)
  } else {
    addFormSlots.value = [...addFormSlots.value, slot]
  }
  addAllSelected.value = addFormSlots.value.length === timeSlotList.length
}

function toggleAddAllSlots() {
  if (addAllSelected.value) {
    addFormSlots.value = []
    addAllSelected.value = false
  } else {
    addFormSlots.value = timeSlotList.slice()
    addAllSelected.value = true
  }
}

async function submitAdd() {
  if (!addFormDoctor.value || !addFormDate.value) {
    alert('请选择医生和日期')
    return
  }
  if (addFormSlots.value.length === 0) {
    alert('请选择至少一个时间段')
    return
  }
  try {
    const slots = addFormSlots.value.map(s => ({ time: s, available: 1, maxCapacity: 1 }))
    await scheduleAPI.create({
      doctorId: addFormDoctor.value,
      date: addFormDate.value,
      timeSlots: slots
    })
    alert('添加成功')
    // 刷新页面，避免响应式循环
    window.location.href = window.location.href
  } catch (e) {
    const msg = (e.response && e.response.data && e.response.data.message) || '添加失败'
    alert(msg)
  }
}

// ==== 批量排班：复选框管理 ====
function openBatchModal() {
  batchFormDoctor.value = doctorList.value[0]?._id || ''
  batchFormStart.value = ''
  batchFormEnd.value = ''
  batchFormWeekdays.value = [1,2,3,4,5]
  batchFormSlots.value = []
  batchAllSelected.value = false
  showBatchModal.value = true
}

function toggleBatchSlot(slot) {
  const idx = batchFormSlots.value.indexOf(slot)
  if (idx >= 0) {
    batchFormSlots.value = batchFormSlots.value.filter(s => s !== slot)
  } else {
    batchFormSlots.value = [...batchFormSlots.value, slot]
  }
  batchAllSelected.value = batchFormSlots.value.length === timeSlotList.length
}

function toggleBatchAllSlots() {
  if (batchAllSelected.value) {
    batchFormSlots.value = []
    batchAllSelected.value = false
  } else {
    batchFormSlots.value = timeSlotList.slice()
    batchAllSelected.value = true
  }
}

function toggleBatchWeekday(val) {
  const idx = batchFormWeekdays.value.indexOf(val)
  if (idx >= 0) {
    batchFormWeekdays.value = batchFormWeekdays.value.filter(d => d !== val)
  } else {
    batchFormWeekdays.value = [...batchFormWeekdays.value, val]
  }
}

async function submitBatch() {
  if (!batchFormDoctor.value || !batchFormStart.value || !batchFormEnd.value) {
    alert('请填写医生和日期范围')
    return
  }
  if (batchFormSlots.value.length === 0) {
    alert('请选择至少一个时间段')
    return
  }
  if (batchFormWeekdays.value.length === 0) {
    alert('请选择至少一个出诊星期')
    return
  }
  try {
    const res = await scheduleAPI.batchCreate({
      doctorId: batchFormDoctor.value,
      startDate: batchFormStart.value,
      endDate: batchFormEnd.value,
      weekdays: batchFormWeekdays.value.slice().sort(),
      timeSlots: batchFormSlots.value.slice()
    })
    const msg = res.data.message || '批量创建成功'
    if (res.data.errors && res.data.errors.length > 0) {
      alert(msg + '\n已跳过的日期：' + res.data.errors.slice(0, 10).join(', '))
    } else {
      alert(msg)
    }
    // 刷新页面，避免响应式循环
    window.location.href = window.location.href
  } catch (e) {
    const msg = (e.response && e.response.data && e.response.data.message) || '批量创建失败'
    alert(msg)
  }
}

// ==== 预约详情与取消 ====
function showApptFromCell(slot, doctorId) {
  const a = apptMap.value[doctorId + '-' + slot]
  if (a) {
    currentAppt.value = a
    showApptModal.value = true
  }
}

async function handleCancelAppt() {
  if (!currentAppt.value || !currentAppt.value._id) return
  if (!confirm('确定要取消该预约吗？')) return
  try {
    await appointmentAPI.update(currentAppt.value._id, { status: 'cancelled' })
    alert('取消成功')
    // 刷新页面，避免响应式循环
    window.location.href = window.location.href
  } catch (e) {
    alert('取消失败')
  }
}

// ==== 构建视图状态（显式更新，不依赖 computed/watch）====
function buildViewState() {
  const fd = filterDate.value
  const dept = filterDepartment.value

  // 过滤当前日期的排班
  const todaySchedules = scheduleList.value.filter(s => {
    const d = new Date(s.date).toISOString().split('T')[0]
    return d === fd
  })

  // 有排班的医生 ID 集
  const docIdSet = {}
  todaySchedules.forEach(s => {
    const id = (s.doctorId && s.doctorId._id) || s.doctorId
    if (id) docIdSet[id] = true
  })

  // 可见医生列表（按科室过滤）
  visibleDoctors.value = doctorList.value.filter(d => {
    if (!docIdSet[d._id]) return false
    if (dept && d.specialty !== dept) return false
    return true
  })

  // 构建预约 map (doctorId-slot -> {patientName, phone, doctorName, date, timeSlot, _id})
  const al = {}
  appointmentList.value.forEach(a => {
    const ad = new Date(a.date).toISOString().split('T')[0]
    if (ad !== fd || a.status === 'cancelled') return
    const key = (a.doctorId && a.doctorId._id) || a.doctorId
    al[key + '-' + a.timeSlot] = {
      _id: a._id,
      patientName: a.patientName || (a.patientId && a.patientId.name) || '未知',
      phone: a.phone || (a.patientId && a.patientId.phone) || '-',
      doctorName: a.doctorName || (a.doctorId && a.doctorId.name) || '未知',
      date: ad,
      timeSlot: a.timeSlot
    }
  })
  apptMap.value = al

  // 构建排班 slot map (doctorId-slot -> true)
  const sl = {}
  todaySchedules.forEach(s => {
    const id = (s.doctorId && s.doctorId._id) || s.doctorId
    if (s.timeSlots && Array.isArray(s.timeSlots)) {
      s.timeSlots.forEach(ts => { sl[id + '-' + ts.time] = true })
    }
  })
  schedMap.value = sl
}

// ==== 初始数据加载 ====
async function loadAll() {
  try {
    const [s, d, a] = await Promise.all([
      scheduleAPI.getAll(),
      doctorAPI.getAll(),
      appointmentAPI.getAll()
    ])
    scheduleList.value = s.data || []
    doctorList.value = d.data || []
    appointmentList.value = a.data || []

    // 构建科室列表
    const set = new Set()
    doctorList.value.forEach(doc => {
      if (doc.specialty) set.add(doc.specialty)
    })
    deptList.value = [...set].sort()

    // 构建初始视图
    buildViewState()
  } catch (e) {
    console.error('load failed', e)
  }
}

onMounted(() => {
  loadAll()
})
</script>

<style scoped>
table { border-collapse: separate; border-spacing: 0; }
</style>
