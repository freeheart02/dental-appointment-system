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
            <span class="text-sm text-gray-600">当前日期:</span>
            <input v-model="filterDate" type="date" class="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" @change="refreshView" />
          </div>
          <div class="flex items-center gap-2">
            <span class="text-sm text-gray-600">科室:</span>
            <select v-model="filterDepartment" @change="refreshView" class="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
              <option value="">全部</option>
              <option v-for="dept in deptList" :key="dept" :value="dept">{{ dept }}</option>
            </select>
          </div>
        </div>
      </div>

      <div class="p-4">
        <div v-if="visibleDoctors.length > 0" class="overflow-x-auto">
          <table class="w-full border-collapse">
            <thead>
              <tr class="bg-gradient-to-r from-blue-50 to-blue-100">
                <th class="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700 bg-blue-50 sticky left-0 z-10 min-w-[100px]">时间</th>
                <th v-for="doc in visibleDoctors" :key="doc._id" class="border border-gray-300 px-4 py-3 text-center font-semibold text-gray-700 min-w-[180px]">
                  <div class="flex flex-col items-center">
                    <span class="font-bold">{{ doc.name }}</span>
                    <span class="text-xs text-gray-500 font-normal">{{ doc.specialty }}</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="slot in timeSlotList" :key="slot" class="hover:bg-gray-50">
                <td class="border border-gray-300 px-4 py-3 font-medium text-gray-700 bg-gray-50 sticky left-0 z-10">{{ slot }}</td>
                <td v-for="doc in visibleDoctors" :key="doc._id + '-' + slot" class="border border-gray-300 px-2 py-2 text-center">
                  <div v-if="viewApptCell(doc._id, slot)" @click="showAppt(viewApptCell(doc._id, slot))" class="p-2 bg-green-50 rounded-lg border border-green-200 cursor-pointer hover:bg-green-100 transition-all">
                    <div class="font-medium text-green-800 text-sm">{{ viewApptCell(doc._id, slot).patientName }}</div>
                    <div class="text-xs text-green-600">{{ viewApptCell(doc._id, slot).phone }}</div>
                  </div>
                  <div v-else-if="viewSchedCell(doc._id, slot)" class="p-2 bg-gray-100 rounded-lg border border-gray-200 opacity-50">
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
          <p class="text-gray-500 mb-4">当天暂无排班数据</p>
          <button @click="openAddModal" class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all">添加排班</button>
        </div>
      </div>
    </div>

    <!-- Appointment Detail Modal -->
    <div v-if="apptModalVisible" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-xl p-6 w-full max-w-md">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-semibold text-gray-800">预约详情</h3>
          <button @click="closeApptModal" class="text-gray-400 hover:text-gray-600"><X class="w-5 h-5" /></button>
        </div>
        <div class="space-y-4">
          <div class="p-4 bg-blue-50 rounded-lg">
            <div class="grid grid-cols-2 gap-4">
              <div><p class="text-sm text-gray-500">患者姓名</p><p class="font-semibold text-gray-800">{{ currentAppt.patientName }}</p></div>
              <div><p class="text-sm text-gray-500">联系电话</p><p class="font-semibold text-gray-800">{{ currentAppt.phone }}</p></div>
              <div><p class="text-sm text-gray-500">预约医生</p><p class="font-semibold text-gray-800">{{ currentAppt.doctorName }}</p></div>
              <div><p class="text-sm text-gray-500">预约时间</p><p class="font-semibold text-gray-800">{{ currentAppt.date }} {{ currentAppt.timeSlot }}</p></div>
            </div>
          </div>
          <div class="flex gap-3">
            <button @click="closeApptModal" class="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all">关闭</button>
            <button @click="cancelCurrentAppt" class="flex-1 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all">取消预约</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Schedule Modal -->
    <div v-if="addModalVisible" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-semibold text-gray-800">添加排班</h3>
          <button @click="closeAddModal" class="text-gray-400 hover:text-gray-600"><X class="w-5 h-5" /></button>
        </div>
        <form @submit.prevent="submitAdd" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">医生</label>
            <select v-model="addForm.doctorId" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
              <option value="">请选择医生</option>
              <option v-for="doc in doctorList" :key="doc._id" :value="doc._id">{{ doc.name }} - {{ doc.specialty }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">选择日期</label>
            <div class="bg-gray-50 rounded-lg p-4 inline-block">
              <div class="flex items-center justify-between mb-3">
                <button type="button" @click="navAddMonth(-1)" class="p-2 hover:bg-gray-200 rounded-lg"><ChevronLeft class="w-5 h-5" /></button>
                <h4 class="text-base font-semibold">{{ addMonthLabel }}</h4>
                <button type="button" @click="navAddMonth(1)" class="p-2 hover:bg-gray-200 rounded-lg"><ChevronRight class="w-5 h-5" /></button>
              </div>
              <div class="grid grid-cols-7 gap-1 mb-2">
                <div v-for="w in weekLabels" :key="'add-w-' + w" class="text-center text-xs font-medium text-gray-600 py-1">{{ w }}</div>
              </div>
              <div class="grid grid-cols-7 gap-1">
                <div
                  v-for="(cell, idx) in addCalCells"
                  :key="'add-cal-' + idx"
                  @click="cell.day && (addForm.date = cell.dateStr)"
                  :class="cellClass(cell)"
                >
                  <span>{{ cell.day || '' }}</span>
                </div>
              </div>
              <div class="mt-2 text-sm text-gray-600">已选: {{ addForm.date || '未选择' }}</div>
            </div>
          </div>
          <div>
            <div class="flex justify-between items-center mb-2">
              <label class="block text-sm font-medium text-gray-700">时间段</label>
              <button type="button" @click="toggleAllAddSlots" class="text-sm text-blue-500 hover:text-blue-600">{{ allAddSlotsSelected ? '取消全选' : '全选' }}</button>
            </div>
            <div class="grid grid-cols-4 gap-2">
              <label v-for="slot in timeSlotList" :key="'add-slot-' + slot" class="flex items-center gap-2 p-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                <input type="checkbox" :value="slot" :checked="addForm.slots.indexOf(slot) >= 0" @change="toggleAddSlot(slot)" class="rounded text-blue-500 focus:ring-blue-500" />
                <span class="text-sm">{{ slot }}</span>
              </label>
            </div>
          </div>
          <button type="submit" class="w-full py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-all">添加排班</button>
        </form>
      </div>
    </div>

    <!-- Batch Schedule Modal -->
    <div v-if="batchModalVisible" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-semibold text-gray-800">批量排班</h3>
          <button @click="closeBatchModal" class="text-gray-400 hover:text-gray-600"><X class="w-5 h-5" /></button>
        </div>
        <form @submit.prevent="submitBatch" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">医生</label>
            <select v-model="batchForm.doctorId" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
              <option value="">请选择医生</option>
              <option v-for="doc in doctorList" :key="doc._id" :value="doc._id">{{ doc.name }} - {{ doc.specialty }}</option>
            </select>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">开始日期</label>
              <div class="bg-gray-50 rounded-lg p-3">
                <div class="flex items-center justify-between mb-2">
                  <button type="button" @click="navBatchStart(-1)" class="p-1.5 hover:bg-gray-200 rounded-lg"><ChevronLeft class="w-4 h-4" /></button>
                  <h4 class="text-sm font-semibold">{{ batchStartLabel }}</h4>
                  <button type="button" @click="navBatchStart(1)" class="p-1.5 hover:bg-gray-200 rounded-lg"><ChevronRight class="w-4 h-4" /></button>
                </div>
                <div class="grid grid-cols-7 gap-1 mb-1">
                  <div v-for="w in weekLabels" :key="'bs-w-' + w" class="text-center text-xs text-gray-500 py-0.5">{{ w }}</div>
                </div>
                <div class="grid grid-cols-7 gap-1">
                  <div v-for="(cell, idx) in batchStartCells" :key="'bstart-' + idx" @click="cell.day && (batchForm.startDate = cell.dateStr)" :class="cellClass(cell)">
                    <span class="text-xs">{{ cell.day || '' }}</span>
                  </div>
                </div>
                <div class="mt-1 text-xs text-gray-500">已选: {{ batchForm.startDate || '未选择' }}</div>
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">结束日期</label>
              <div class="bg-gray-50 rounded-lg p-3">
                <div class="flex items-center justify-between mb-2">
                  <button type="button" @click="navBatchEnd(-1)" class="p-1.5 hover:bg-gray-200 rounded-lg"><ChevronLeft class="w-4 h-4" /></button>
                  <h4 class="text-sm font-semibold">{{ batchEndLabel }}</h4>
                  <button type="button" @click="navBatchEnd(1)" class="p-1.5 hover:bg-gray-200 rounded-lg"><ChevronRight class="w-4 h-4" /></button>
                </div>
                <div class="grid grid-cols-7 gap-1 mb-1">
                  <div v-for="w in weekLabels" :key="'be-w-' + w" class="text-center text-xs text-gray-500 py-0.5">{{ w }}</div>
                </div>
                <div class="grid grid-cols-7 gap-1">
                  <div v-for="(cell, idx) in batchEndCells" :key="'bend-' + idx" @click="cell.day && (batchForm.endDate = cell.dateStr)" :class="cellClass(cell)">
                    <span class="text-xs">{{ cell.day || '' }}</span>
                  </div>
                </div>
                <div class="mt-1 text-xs text-gray-500">已选: {{ batchForm.endDate || '未选择' }}</div>
              </div>
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">选择出诊星期</label>
            <div class="flex flex-wrap gap-2">
              <label v-for="day in weekdayOptions" :key="'wk-' + day.value" class="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                <input type="checkbox" :value="day.value" :checked="batchForm.weekdays.indexOf(day.value) >= 0" @change="toggleWeekday(day.value)" class="rounded text-blue-500 focus:ring-blue-500" />
                <span class="text-sm">{{ day.label }}</span>
              </label>
            </div>
          </div>
          <div>
            <div class="flex justify-between items-center mb-2">
              <label class="block text-sm font-medium text-gray-700">时间段</label>
              <button type="button" @click="toggleAllBatchSlots" class="text-sm text-blue-500 hover:text-blue-600">{{ allBatchSlotsSelected ? '取消全选' : '全选' }}</button>
            </div>
            <div class="grid grid-cols-4 gap-2">
              <label v-for="slot in timeSlotList" :key="'b-slot-' + slot" class="flex items-center gap-2 p-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                <input type="checkbox" :value="slot" :checked="batchForm.slots.indexOf(slot) >= 0" @change="toggleBatchSlot(slot)" class="rounded text-blue-500 focus:ring-blue-500" />
                <span class="text-sm">{{ slot }}</span>
              </label>
            </div>
          </div>
          <div class="p-3 bg-blue-50 rounded-lg">
            <p class="text-sm text-blue-700">
              <Info class="w-4 h-4 inline mr-1" />
              将为选中的医生在 {{ batchForm.startDate || '____' }} 至 {{ batchForm.endDate || '____' }} 期间，
              每周的 {{ selectedWeekdayText }} 创建排班。已存在排班的日期将被跳过。
            </p>
          </div>
          <button type="submit" class="w-full py-3 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-all">批量创建排班</button>
        </form>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Plus, Calendar, X, List, Info, ChevronLeft, ChevronRight } from 'lucide-vue-next'
import AdminLayout from '../../components/AdminLayout.vue'
import { scheduleAPI, doctorAPI, appointmentAPI } from '../../utils/api.js'

// ===== Constants =====
const timeSlotList = ['08:00','08:30','09:00','09:30','10:00','10:30','11:00','11:30','13:30','14:00','14:30','15:00','15:30','16:00','16:30','17:00']
const weekLabels = ['日','一','二','三','四','五','六']
const weekdayOptions = [{value:0,label:'周日'},{value:1,label:'周一'},{value:2,label:'周二'},{value:3,label:'周三'},{value:4,label:'周四'},{value:5,label:'周五'},{value:6,label:'周六'}]
const monthNames = ['一月','二月','三月','四月','五月','六月','七月','八月','九月','十月','十一月','十二月']

// ===== Helper pure functions =====
function pad(n) { return String(n).padStart(2, '0') }
function today() { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}` }
function buildCells(year, month, selectedDate) {
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const td = today()
  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push({ day: 0, dateStr: '', isToday: false, isSelected: false })
  for (let d = 1; d <= daysInMonth; d++) {
    const ds = `${year}-${pad(month + 1)}-${pad(d)}`
    cells.push({ day: d, dateStr: ds, isToday: ds === td, isSelected: ds === selectedDate })
  }
  while (cells.length < 42) cells.push({ day: 0, dateStr: '', isToday: false, isSelected: false })
  return cells
}
function cellClass(cell) {
  if (!cell.day) return 'text-center py-2 text-transparent'
  const base = 'text-center py-2 cursor-pointer rounded-lg'
  if (cell.isSelected) return base + ' bg-blue-500 text-white hover:bg-blue-600'
  if (cell.isToday) return base + ' bg-blue-100 font-bold hover:bg-blue-200'
  return base + ' hover:bg-gray-100'
}

// ===== Data refs =====
const scheduleList = ref([])
const doctorList = ref([])
const appointmentList = ref([])
const deptList = ref([])
const filterDate = ref(today())
const filterDepartment = ref('')
const visibleDoctors = ref([])
const apptLookup = ref({})  // key: doctorId-slot -> { patientName, phone, doctorName, date, timeSlot }
const schedLookup = ref({}) // key: doctorId-slot -> true

// ===== Add form =====
const addModalVisible = ref(false)
const addForm = ref({ doctorId: '', date: '', slots: [] })
const addCalIdx = ref(todayIdx())
const addCalCells = ref([])
const addMonthLabel = ref('')

function todayIdx() { const d = new Date(); return d.getFullYear() * 12 + d.getMonth() }
function refreshAddCal() {
  const ym = { y: Math.floor(addCalIdx.value / 12), m: addCalIdx.value - Math.floor(addCalIdx.value / 12) * 12 }
  addCalCells.value = buildCells(ym.y, ym.m, addForm.value.date)
  addMonthLabel.value = `${monthNames[ym.m]} ${ym.y}`
}
const allAddSlotsSelected = ref(false)
function navAddMonth(delta) { addCalIdx.value += delta; refreshAddCal() }
function toggleAddSlot(slot) {
  const idx = addForm.value.slots.indexOf(slot)
  if (idx >= 0) addForm.value.slots.splice(idx, 1)
  else addForm.value.slots.push(slot)
  allAddSlotsSelected.value = addForm.value.slots.length === timeSlotList.length
}
function toggleAllAddSlots() {
  if (allAddSlotsSelected.value) { addForm.value.slots.splice(0); allAddSlotsSelected.value = false }
  else { addForm.value.slots.splice(0, addForm.value.slots.length, ...timeSlotList); allAddSlotsSelected.value = true }
}
function openAddModal() {
  addForm.value = { doctorId: doctorList.value[0]?._id || '', date: filterDate.value, slots: [] }
  allAddSlotsSelected.value = false
  const d = new Date()
  addCalIdx.value = d.getFullYear() * 12 + d.getMonth()
  refreshAddCal()
  addModalVisible.value = true
}
function closeAddModal() { addModalVisible.value = false }
async function submitAdd() {
  if (!addForm.value.doctorId || !addForm.value.date) { alert('请选择医生和日期'); return }
  if (addForm.value.slots.length === 0) { alert('请选择至少一个时间段'); return }
  try {
    const slots = addForm.value.slots.map(s => ({ time: s, available: 1, maxCapacity: 1 }))
    await scheduleAPI.create({ doctorId: addForm.value.doctorId, date: new Date(addForm.value.date).toISOString(), timeSlots: slots })
    alert('添加成功')
    closeAddModal()
    loadAll()
  } catch (e) { alert('添加失败') }
}

// ===== Batch form =====
const batchModalVisible = ref(false)
const batchForm = ref({ doctorId: '', startDate: '', endDate: '', weekdays: [1,2,3,4,5], slots: [] })
const batchStartIdx = ref(todayIdx())
const batchEndIdx = ref(todayIdx() + 6)
const batchStartCells = ref([])
const batchEndCells = ref([])
const batchStartLabel = ref('')
const batchEndLabel = ref('')
const allBatchSlotsSelected = ref(false)

function refreshBatchStart() {
  const ym = { y: Math.floor(batchStartIdx.value / 12), m: batchStartIdx.value - Math.floor(batchStartIdx.value / 12) * 12 }
  batchStartCells.value = buildCells(ym.y, ym.m, batchForm.value.startDate)
  batchStartLabel.value = `${monthNames[ym.m]} ${ym.y}`
}
function refreshBatchEnd() {
  const ym = { y: Math.floor(batchEndIdx.value / 12), m: batchEndIdx.value - Math.floor(batchEndIdx.value / 12) * 12 }
  batchEndCells.value = buildCells(ym.y, ym.m, batchForm.value.endDate)
  batchEndLabel.value = `${monthNames[ym.m]} ${ym.y}`
}
function navBatchStart(delta) { batchStartIdx.value += delta; refreshBatchStart() }
function navBatchEnd(delta) { batchEndIdx.value += delta; refreshBatchEnd() }
function toggleWeekday(val) {
  const idx = batchForm.value.weekdays.indexOf(val)
  if (idx >= 0) batchForm.value.weekdays.splice(idx, 1)
  else batchForm.value.weekdays.push(val)
}
function toggleBatchSlot(slot) {
  const idx = batchForm.value.slots.indexOf(slot)
  if (idx >= 0) batchForm.value.slots.splice(idx, 1)
  else batchForm.value.slots.push(slot)
  allBatchSlotsSelected.value = batchForm.value.slots.length === timeSlotList.length
}
function toggleAllBatchSlots() {
  if (allBatchSlotsSelected.value) { batchForm.value.slots.splice(0); allBatchSlotsSelected.value = false }
  else { batchForm.value.slots.splice(0, batchForm.value.slots.length, ...timeSlotList); allBatchSlotsSelected.value = true }
}
const selectedWeekdayText = ref('未选择')
function refreshSelectedWeekdayText() {
  const set = new Set(batchForm.value.weekdays)
  const labels = weekdayOptions.filter(o => set.has(o.value)).map(o => o.label)
  selectedWeekdayText.value = labels.length > 0 ? labels.join('、') : '未选择'
}
function openBatchModal() {
  batchForm.value = { doctorId: doctorList.value[0]?._id || '', startDate: '', endDate: '', weekdays: [1,2,3,4,5], slots: [] }
  allBatchSlotsSelected.value = false
  const d = new Date()
  batchStartIdx.value = d.getFullYear() * 12 + d.getMonth()
  batchEndIdx.value = batchStartIdx.value + 6
  refreshBatchStart()
  refreshBatchEnd()
  refreshSelectedWeekdayText()
  batchModalVisible.value = true
}
function closeBatchModal() { batchModalVisible.value = false }
async function submitBatch() {
  if (!batchForm.value.doctorId || !batchForm.value.startDate || !batchForm.value.endDate) { alert('请填写医生和日期范围'); return }
  if (batchForm.value.slots.length === 0) { alert('请选择至少一个时间段'); return }
  if (batchForm.value.weekdays.length === 0) { alert('请选择至少一个出诊星期'); return }
  try {
    const slots = batchForm.value.slots.map(s => ({ time: s, available: 1, maxCapacity: 1 }))
    const payload = {
      doctorId: batchForm.value.doctorId,
      startDate: batchForm.value.startDate,
      endDate: batchForm.value.endDate,
      weekdays: batchForm.value.weekdays.slice().sort(),
      selectedSlots: batchForm.value.slots.slice(),
      timeSlots: slots
    }
    const res = await scheduleAPI.batchCreate(payload)
    const msg = res.data.message || '批量创建成功'
    if (res.data.errors && res.data.errors.length > 0) alert(msg + '\n已跳过的日期：' + res.data.errors.slice(0, 10).join(', '))
    else alert(msg)
    closeBatchModal()
    loadAll()
  } catch (e) {
    const msg = (e.response && e.response.data && e.response.data.message) || '批量创建失败'
    alert(msg)
  }
}

// ===== Appointment modal =====
const apptModalVisible = ref(false)
const currentAppt = ref(null)
function showAppt(appt) { currentAppt.value = appt; apptModalVisible.value = true }
function closeApptModal() { apptModalVisible.value = false; currentAppt.value = null }
async function cancelCurrentAppt() {
  if (!currentAppt.value || !currentAppt.value._id) return
  if (!confirm('确定要取消该预约吗？')) return
  try {
    await appointmentAPI.update(currentAppt.value._id, { status: 'cancelled' })
    alert('取消成功')
    closeApptModal()
    loadAll()
  } catch (e) { alert('取消失败') }
}

// ===== View helpers (pure lookups, no reactivity) =====
function viewApptCell(doctorId, slot) {
  const m = apptLookup.value
  return m[doctorId + '-' + slot] || null
}
function viewSchedCell(doctorId, slot) {
  const m = schedLookup.value
  return !!m[doctorId + '-' + slot]
}

// ===== Data loading (explicit, no watch) =====
function refreshView() {
  buildViewState()
  // Also refresh calendars to reflect selected dates
  refreshAddCal()
  refreshBatchStart()
  refreshBatchEnd()
}

function buildViewState() {
  const fd = filterDate.value
  const dept = filterDepartment.value

  // Filter schedules for current date
  const todaySchedules = scheduleList.value.filter(s => {
    const d = new Date(s.date).toISOString().split('T')[0]
    return d === fd
  })

  // Compute visible doctors (those with schedules today, filtered by department)
  const docIdSet = new Set()
  todaySchedules.forEach(s => {
    const id = (s.doctorId && s.doctorId._id) || s.doctorId
    if (id) docIdSet.add(id)
  })
  visibleDoctors.value = doctorList.value.filter(d => {
    if (!docIdSet.has(d._id)) return false
    if (dept && (d.specialty !== dept)) return false
    return true
  })

  // Build appointment lookup for this date
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
  apptLookup.value = al

  // Build schedule lookup
  const sl = {}
  todaySchedules.forEach(s => {
    const id = (s.doctorId && s.doctorId._id) || s.doctorId
    if (s.timeSlots && Array.isArray(s.timeSlots)) {
      s.timeSlots.forEach(ts => { sl[id + '-' + ts.time] = true })
    }
  })
  schedLookup.value = sl
}

async function loadAll() {
  try {
    const [s, d, a] = await Promise.all([scheduleAPI.getAll(), doctorAPI.getAll(), appointmentAPI.getAll()])
    scheduleList.value = s.data || []
    doctorList.value = d.data || []
    appointmentList.value = a.data || []

    // Build dept list
    const set = new Set()
    doctorList.value.forEach(doc => { if (doc.specialty) set.add(doc.specialty) })
    deptList.value = [...set].sort()

    buildViewState()
  } catch (e) {
    console.error('load failed', e)
  }
}

onMounted(() => { loadAll() })
</script>

<style scoped>
table { border-collapse: separate; border-spacing: 0; }
</style>
