<template>
  <AdminLayout title="预约管理">
    <div class="bg-white rounded-xl shadow-md">
      <div class="p-4 border-b border-gray-200">
        <div class="flex flex-wrap gap-4 items-center mb-4">
          <div class="relative flex-1 min-w-[250px]">
            <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              v-model="searchQuery"
              @input="rebuildDisplay"
              type="text"
              placeholder="搜索患者姓名或手机号"
              class="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none w-full"
            />
          </div>
          <select
            v-model="filterStatus"
            @change="rebuildDisplay"
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
          <!-- 左侧月历 -->
          <div class="w-80 flex-shrink-0">
            <div class="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
              <div class="flex items-center justify-between mb-4">
                <button @click="prevMonth" class="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <ChevronLeft class="w-5 h-5" />
                </button>
                <h3 class="text-lg font-semibold">{{ monthLabel }}</h3>
                <button @click="nextMonth" class="p-2 hover:bg-gray-100 rounded-lg transition-colors">
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
                  v-for="(cell, idx) in calendarCells"
                  :key="'cal-' + idx"
                  @click="cell.date && (filterDate = cell.date); rebuildDisplay()"
                  :class="[
                    'text-center py-2 cursor-pointer rounded-lg transition-all text-sm',
                    cell.isToday ? 'bg-blue-100 font-bold' : '',
                    cell.isSelected ? 'bg-blue-500 text-white hover:bg-blue-600' : 'hover:bg-gray-100',
                    !cell.date ? 'text-gray-300 cursor-default' : 'text-gray-700'
                  ]"
                >
                  {{ cell.day }}
                  <div v-if="cell.hasAppointment || cell.hasSchedule" class="flex justify-center mt-1 gap-1">
                    <span v-if="cell.hasSchedule" class="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                    <span v-if="cell.hasAppointment" class="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                  </div>
                </div>
              </div>
              <div class="mt-4 flex gap-2">
                <button @click="filterDate = ''; rebuildDisplay()" class="flex-1 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all text-sm">
                  清除日期
                </button>
                <button @click="filterDate = todayStr; rebuildDisplay()" class="flex-1 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all text-sm">
                  回到今天
                </button>
              </div>
            </div>
          </div>

          <!-- 右侧预约列表 -->
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
                  v-for="appt in displayList"
                  :key="appt._id"
                  class="border-b border-gray-100 hover:bg-gray-50"
                >
                  <td class="px-6 py-4 text-sm">
                    <div>
                      <span class="text-gray-800">{{ patientName(appt) }}</span>
                      <p class="text-gray-500 text-xs">{{ patientPhone(appt) }}</p>
                    </div>
                  </td>
                  <td class="px-6 py-4 text-sm text-gray-600">{{ doctorName(appt) }}</td>
                  <td class="px-6 py-4 text-sm text-gray-600">{{ formatDate(appt.date) }}</td>
                  <td class="px-6 py-4 text-sm text-gray-600">{{ appt.timeSlot }}</td>
                  <td class="px-6 py-4 text-sm text-gray-600">{{ appt.type || '-' }}</td>
                  <td class="px-6 py-4">
                    <span :class="statusClass(appt.status)" class="px-3 py-1 rounded-full text-sm font-medium">
                      {{ statusText(appt.status) }}
                    </span>
                    <p v-if="appt.checkedInAt" class="text-xs text-green-600 mt-1">
                      签到: {{ formatTime(appt.checkedInAt) }}
                    </p>
                  </td>
                  <td class="px-6 py-4">
                    <div v-if="appt.status === 'pending'">
                      <button
                        @click="onCheckIn(appt._id)"
                        :disabled="loadingAction"
                        class="px-3 py-1 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600 transition-all disabled:opacity-50"
                      >
                        签到
                      </button>
                    </div>
                    <div v-else-if="appt.status === 'checked_in'" class="flex flex-col gap-1">
                      <span class="text-green-600 text-sm font-medium">✓ 已签到</span>
                      <button
                        @click="onUndoCheckIn(appt._id)"
                        :disabled="loadingAction"
                        class="px-2 py-0.5 bg-red-50 text-red-600 rounded text-xs hover:bg-red-100 transition-all disabled:opacity-50"
                      >
                        取消签到
                      </button>
                    </div>
                    <span v-else class="text-gray-400 text-sm">-</span>
                  </td>
                  <td class="px-6 py-4">
                    <div class="flex gap-2">
                      <button @click="openStatusModal(appt)" class="text-blue-500 hover:text-blue-600">
                        <Edit class="w-4 h-4" />
                      </button>
                      <button @click="onDelete(appt._id)" class="text-red-500 hover:text-red-600">
                        <Trash2 class="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
            <div v-if="displayList.length === 0 && !loading" class="p-12 text-center text-gray-500 text-sm">
              暂无符合条件的预约
            </div>
            <div v-if="loading" class="p-12 text-center text-gray-500 text-sm">加载中...</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Toast 提示 -->
    <div v-if="toastMessage" :class="['fixed top-4 right-4 z-[100] px-4 py-2 rounded-lg shadow-lg text-white text-sm', toastType === 'error' ? 'bg-red-500' : 'bg-green-500']">
      {{ toastMessage }}
    </div>

    <!-- 修改状态 模态框 -->
    <div v-if="statusModalVisible" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-xl p-6 w-full max-w-sm">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-semibold text-gray-800">修改预约状态</h3>
          <button @click="statusModalVisible = false" class="text-gray-400 hover:text-gray-600">
            <X class="w-5 h-5" />
          </button>
        </div>
        <div class="space-y-3">
          <button
            v-for="opt in statusOptions"
            :key="opt.value"
            @click="onUpdateStatus(opt.value)"
            :disabled="loadingAction"
            :class="[
              'w-full px-4 py-3 rounded-lg border-2 transition-all',
              selectedStatus === opt.value
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            ]"
          >
            <span :class="opt.class">{{ opt.label }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 删除确认 模态框 -->
    <div v-if="deleteModalVisible" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-xl p-6 w-full max-w-sm">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-semibold text-gray-800">确认删除</h3>
          <button @click="deleteModalVisible = false" class="text-gray-400 hover:text-gray-600">
            <X class="w-5 h-5" />
          </button>
        </div>
        <p class="text-gray-700 text-sm mb-4">确定要删除该预约吗？此操作不可撤销。</p>
        <div class="flex gap-2">
          <button
            type="button"
            @click="deleteModalVisible = false"
            :disabled="loadingAction"
            class="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-all disabled:opacity-50"
          >
            取消
          </button>
          <button
            type="button"
            @click="confirmDelete"
            :disabled="loadingAction"
            class="flex-1 py-3 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition-all disabled:opacity-50"
          >
            {{ loadingAction ? '删除中...' : '确认删除' }}
          </button>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Search, Edit, Trash2, X, ChevronRight, ChevronLeft } from 'lucide-vue-next'
import AdminLayout from '../../components/AdminLayout.vue'
import { appointmentAPI, scheduleAPI } from '../../utils/api'

// ========== 列表数据 ==========
const rawList = ref([])
const displayList = ref([])
const scheduleList = ref([])
const searchQuery = ref('')
const filterStatus = ref('')
const filterDate = ref('')
const loading = ref(false)
const loadingAction = ref(false)

// ========== 月历数据 ==========
// currentMonthIdx = year * 12 + month
const currentMonthIdx = ref((new Date()).getFullYear() * 12 + (new Date()).getMonth())
const calendarCells = ref([])
const monthLabel = ref('')
const todayStr = new Date().toISOString().split('T')[0]
const weekDays = ['日', '一', '二', '三', '四', '五', '六']

// ========== 状态选项 ==========
const statusOptions = [
  { value: 'pending', label: '未就诊', class: 'text-yellow-700' },
  { value: 'checked_in', label: '待就诊', class: 'text-green-700' },
  { value: 'visited', label: '已就诊', class: 'text-blue-700' },
  { value: 'no_show', label: '爽约', class: 'text-red-700' },
  { value: 'canceled', label: '已取消', class: 'text-gray-500' }
]

// ========== 模态框状态 ==========
const statusModalVisible = ref(false)
const deleteModalVisible = ref(false)
const editingApptId = ref(null)
const selectedStatus = ref('')
const pendingDeleteId = ref(null)

// ========== Toast ==========
const toastMessage = ref('')
const toastType = ref('success')
let toastTimer = null
function showToast(msg, type) {
  toastMessage.value = msg
  toastType.value = type || 'success'
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toastMessage.value = '' }, 2000)
}

// ========== 纯函数工具 ==========
function pad2(n) { return String(n).padStart(2, '0') }
function patientName(a) {
  if (a.patientId && typeof a.patientId === 'object') return a.patientId.name || a.patientName || ''
  return a.patientName || ''
}
function patientPhone(a) {
  if (a.patientId && typeof a.patientId === 'object') return a.patientId.phone || ''
  return a.phone || ''
}
function doctorName(a) {
  if (a.doctorId && typeof a.doctorId === 'object') return a.doctorId.name || ''
  return a.doctorName || ''
}
function statusText(s) {
  const map = { pending: '未就诊', checked_in: '待就诊', visited: '已就诊', no_show: '爽约', canceled: '已取消' }
  return map[s] || s
}
function statusClass(s) {
  const map = {
    pending: 'bg-yellow-100 text-yellow-700',
    checked_in: 'bg-green-100 text-green-700',
    visited: 'bg-indigo-100 text-indigo-700',
    no_show: 'bg-red-100 text-red-700',
    canceled: 'bg-gray-100 text-gray-500'
  }
  return map[s] || 'bg-gray-100 text-gray-700'
}
function formatDate(d) {
  const dt = new Date(d)
  return dt.toLocaleDateString('zh-CN')
}
function formatTime(t) {
  if (!t) return ''
  const dt = new Date(t)
  return dt.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

// ========== 月历重建 ==========
function rebuildCalendar() {
  const ym = currentMonthIdx.value
  const year = Math.floor(ym / 12)
  const month = ym - year * 12
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const datesWithAppt = new Set()
  rawList.value.forEach(a => {
    const d = new Date(a.date)
    datesWithAppt.add(d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()))
  })

  const datesWithSchedule = new Set()
  scheduleList.value.forEach(s => {
    const d = new Date(s.date)
    datesWithSchedule.add(d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()))
  })

  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push({ day: '', date: null, isToday: false, isSelected: false, hasAppointment: false, hasSchedule: false })
  for (let i = 1; i <= daysInMonth; i++) {
    const ds = year + '-' + pad2(month + 1) + '-' + pad2(i)
    cells.push({
      day: i,
      date: ds,
      isToday: ds === todayStr,
      isSelected: ds === filterDate.value,
      hasAppointment: datesWithAppt.has(ds),
      hasSchedule: datesWithSchedule.has(ds)
    })
  }
  calendarCells.value = cells
  const names = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']
  monthLabel.value = names[month] + ' ' + year
}

function prevMonth() { currentMonthIdx.value -= 1; rebuildCalendar() }
function nextMonth() { currentMonthIdx.value += 1; rebuildCalendar() }

// ========== 显示列表重建 ==========
function rebuildDisplay() {
  let list = rawList.value.slice()
  const q = searchQuery.value.trim().toLowerCase()
  if (q) {
    list = list.filter(a => {
      const name = patientName(a).toLowerCase()
      const phone = patientPhone(a)
      return name.includes(q) || phone.includes(q)
    })
  }
  if (filterDate.value) {
    list = list.filter(a => a.date === filterDate.value)
  }
  if (filterStatus.value) {
    list = list.filter(a => a.status === filterStatus.value)
  }
  // 按日期排序
  list.sort((a, b) => {
    const da = new Date(a.date).getTime()
    const db = new Date(b.date).getTime()
    if (da !== db) return da - db
    return (a.timeSlot || '').localeCompare(b.timeSlot || '')
  })
  displayList.value = list
  rebuildCalendar()
}

// ========== 数据加载 ==========
async function loadAll() {
  loading.value = true
  try {
    const [apptRes, schedRes] = await Promise.all([
      appointmentAPI.getAll(),
      scheduleAPI.getAll()
    ])
    rawList.value = Array.isArray(apptRes.data) ? apptRes.data : []
    scheduleList.value = Array.isArray(schedRes.data) ? schedRes.data : []
    rebuildDisplay()
  } catch (e) {
    rawList.value = []
    displayList.value = []
    scheduleList.value = []
    showToast('加载失败', 'error')
  } finally {
    loading.value = false
  }
}

// ========== 操作 ==========
async function onCheckIn(id) {
  loadingAction.value = true
  try {
    await appointmentAPI.update(id, { status: 'checked_in', checkedInAt: new Date().toISOString() })
    showToast('签到成功', 'success')
    await loadAll()
  } catch (e) {
    showToast('签到失败', 'error')
  } finally {
    loadingAction.value = false
  }
}

async function onUndoCheckIn(id) {
  loadingAction.value = true
  try {
    await appointmentAPI.update(id, { status: 'pending', checkedInAt: null })
    showToast('已取消签到', 'success')
    await loadAll()
  } catch (e) {
    showToast('取消签到失败', 'error')
  } finally {
    loadingAction.value = false
  }
}

function openStatusModal(appt) {
  editingApptId.value = appt._id
  selectedStatus.value = appt.status
  statusModalVisible.value = true
}

async function onUpdateStatus(newStatus) {
  if (!editingApptId.value) return
  loadingAction.value = true
  try {
    const payload = { status: newStatus }
    if (newStatus === 'checked_in') payload.checkedInAt = new Date().toISOString()
    await appointmentAPI.update(editingApptId.value, payload)
    showToast('状态更新成功', 'success')
    statusModalVisible.value = false
    await loadAll()
  } catch (e) {
    showToast('更新失败', 'error')
  } finally {
    loadingAction.value = false
  }
}

function onDelete(id) {
  pendingDeleteId.value = id
  deleteModalVisible.value = true
}

async function confirmDelete() {
  if (!pendingDeleteId.value) return
  loadingAction.value = true
  try {
    await appointmentAPI.delete(pendingDeleteId.value)
    showToast('删除成功', 'success')
    deleteModalVisible.value = false
    pendingDeleteId.value = null
    await loadAll()
  } catch (e) {
    showToast('删除失败', 'error')
  } finally {
    loadingAction.value = false
  }
}

onMounted(() => { loadAll() })
</script>
