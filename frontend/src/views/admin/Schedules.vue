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
            <input v-model="viewDate" type="date" class="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" @change="rebuildDisplay" />
          </div>
          <div class="flex items-center gap-2">
            <span class="text-sm text-gray-600">科室:</span>
            <select v-model="viewDept" @change="rebuildDisplay" class="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
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
                  <div v-if="cellHasAppt(slot, doc._id)" @click="openApptDetail(slot, doc._id)" class="p-2 bg-green-50 rounded-lg border border-green-200 cursor-pointer hover:bg-green-100 transition-all">
                    <div class="font-medium text-green-800 text-sm">{{ cellApptName(slot, doc._id) }}</div>
                  </div>
                  <div v-else-if="cellHasSchedule(slot, doc._id)" @click="openAppointmentModal(doc, slot)" class="p-2 bg-blue-50 rounded-lg border border-blue-200 cursor-pointer hover:bg-blue-100 transition-all">
                    <span class="text-xs text-blue-600">可预约</span>
                  </div>
                  <div v-else class="p-2 bg-gray-50 rounded-lg border border-gray-100">
                    <span class="text-xs text-gray-400">未排班</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else-if="!loading" class="p-12 text-center">
          <Calendar class="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p class="text-gray-500 mb-4">当天暂无排班数据</p>
          <button @click="openAddModal" class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all">添加排班</button>
        </div>
        <div v-if="loading" class="p-12 text-center text-gray-500 text-sm">加载中...</div>
      </div>
    </div>

    <!-- Toast 提示 -->
    <div v-if="toastMessage" :class="['fixed top-4 right-4 z-[100] px-4 py-2 rounded-lg shadow-lg text-white text-sm', toastType === 'error' ? 'bg-red-500' : 'bg-green-500']">
      {{ toastMessage }}
    </div>

    <!-- 预约详情模态框 -->
    <div v-if="apptModalVisible" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-xl p-6 w-full max-w-md">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-semibold text-gray-800">预约详情</h3>
          <button @click="apptModalVisible = false" class="text-gray-400 hover:text-gray-600"><X class="w-5 h-5" /></button>
        </div>
        <div v-if="currentAppt" class="space-y-3">
          <div class="p-4 bg-blue-50 rounded-lg">
            <div class="space-y-2 text-sm">
              <div><span class="text-gray-500">患者姓名:</span> <span class="font-medium">{{ currentAppt.patientName }}</span></div>
              <div><span class="text-gray-500">联系电话:</span> <span class="font-medium">{{ currentAppt.phone }}</span></div>
              <div><span class="text-gray-500">预约医生:</span> <span class="font-medium">{{ currentAppt.doctorName }}</span></div>
              <div><span class="text-gray-500">预约时间:</span> <span class="font-medium">{{ currentAppt.date }} {{ currentAppt.timeSlot }}</span></div>
            </div>
          </div>
          <div class="flex gap-3">
            <button @click="apptModalVisible = false" class="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all">关闭</button>
            <button @click="onCancelAppt" :disabled="actionLoading" class="flex-1 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all disabled:opacity-50">取消预约</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 为患者预约模态框 -->
    <div v-if="appointmentModalVisible" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-xl p-6 w-full max-w-md">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-semibold text-gray-800">为患者预约</h3>
          <button @click="appointmentModalVisible = false" class="text-gray-400 hover:text-gray-600"><X class="w-5 h-5" /></button>
        </div>
        <div class="mb-4 p-3 bg-blue-50 rounded-lg">
          <div class="text-sm">
            <div><span class="text-gray-500">医生:</span> <span class="font-medium">{{ currentDoctor?.name }} - {{ currentDoctor?.specialty }}</span></div>
            <div><span class="text-gray-500">日期:</span> <span class="font-medium">{{ viewDate }}</span></div>
            <div><span class="text-gray-500">时间:</span> <span class="font-medium">{{ currentTimeSlot }}</span></div>
          </div>
        </div>
        <form @submit.prevent="onSubmitAppointment" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">患者手机号 *</label>
            <input v-model="patientPhone" type="tel" placeholder="输入手机号自动匹配已登记患者" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" @input="autoFillPatient" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">患者姓名 *</label>
            <input v-model="patientName" type="text" placeholder="输入姓名自动匹配已登记患者" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" @input="autoFillPatient" />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">性别</label>
              <select v-model="patientGender" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                <option value="male">男</option>
                <option value="female">女</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">年龄</label>
              <input v-model="patientAge" type="number" placeholder="年龄" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
          </div>
          <button type="submit" :disabled="actionLoading" class="w-full py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-all disabled:opacity-50">
            {{ actionLoading ? '预约中...' : '确认预约' }}
          </button>
        </form>
      </div>
    </div>

    <!-- 添加排班模态框 -->
    <div v-if="addModalVisible" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-xl p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-semibold text-gray-800">添加排班</h3>
          <button @click="addModalVisible = false" class="text-gray-400 hover:text-gray-600"><X class="w-5 h-5" /></button>
        </div>
        <form @submit.prevent="onSubmitAdd" class="space-y-4">
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
              <button type="button" @click="toggleAddAllSlots" class="text-sm text-blue-500 hover:text-blue-600">{{ addAllSlotsSelected ? '取消全选' : '全选' }}</button>
            </div>
            <div class="grid grid-cols-4 gap-2">
              <label v-for="slot in timeSlotList" :key="'as-'+slot" class="flex items-center gap-2 p-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 text-sm">
                <input type="checkbox" :checked="addFormSlots.includes(slot)" @change="toggleAddSlot(slot)" class="rounded text-blue-500 focus:ring-blue-500" />
                <span>{{ slot }}</span>
              </label>
            </div>
          </div>
          <button type="submit" :disabled="actionLoading" class="w-full py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-all disabled:opacity-50">
            {{ actionLoading ? '保存中...' : '添加排班' }}
          </button>
        </form>
      </div>
    </div>

    <!-- 批量排班模态框 -->
    <div v-if="batchModalVisible" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-semibold text-gray-800">批量排班</h3>
          <button @click="batchModalVisible = false" class="text-gray-400 hover:text-gray-600"><X class="w-5 h-5" /></button>
        </div>
        <form @submit.prevent="onSubmitBatch" class="space-y-4">
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
                <input type="checkbox" :checked="batchFormWeekdays.includes(day.value)" @change="toggleBatchWeekday(day.value)" class="rounded text-blue-500 focus:ring-blue-500" />
                <span>{{ day.label }}</span>
              </label>
            </div>
          </div>
          <div>
            <div class="flex justify-between items-center mb-2">
              <label class="block text-sm font-medium text-gray-700">时间段</label>
              <button type="button" @click="toggleBatchAllSlots" class="text-sm text-blue-500 hover:text-blue-600">{{ batchAllSlotsSelected ? '取消全选' : '全选' }}</button>
            </div>
            <div class="grid grid-cols-4 gap-2">
              <label v-for="slot in timeSlotList" :key="'bs-'+slot" class="flex items-center gap-2 p-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 text-sm">
                <input type="checkbox" :checked="batchFormSlots.includes(slot)" @change="toggleBatchSlot(slot)" class="rounded text-blue-500 focus:ring-blue-500" />
                <span>{{ slot }}</span>
              </label>
            </div>
          </div>
          <button type="submit" :disabled="actionLoading" class="w-full py-3 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-all disabled:opacity-50">
            {{ actionLoading ? '创建中...' : '批量创建排班' }}
          </button>
        </form>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Plus, Calendar, X, List } from 'lucide-vue-next'
import AdminLayout from '../../components/AdminLayout.vue'
import { scheduleAPI, doctorAPI, appointmentAPI, patientAPI } from '../../utils/api.js'

// ========== 常量 ==========
const timeSlotList = ['08:00','08:30','09:00','09:30','10:00','10:30','11:00','11:30','13:30','14:00','14:30','15:00','15:30','16:00','16:30','17:00']
const weekdayOptions = [{value:0,label:'周日'},{value:1,label:'周一'},{value:2,label:'周二'},{value:3,label:'周三'},{value:4,label:'周四'},{value:5,label:'周五'},{value:6,label:'周六'}]

function todayStr() {
  const d = new Date()
  return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0')
}

// ========== 原始数据 ==========
const scheduleList = ref([])
const doctorList = ref([])
const appointmentList = ref([])
const patientList = ref([])
const deptList = ref([])
const loading = ref(false)

// ========== 视图筛选 ==========
const viewDate = ref(todayStr())
const viewDept = ref('')

// ========== 预计算显示数据 ==========
const visibleDoctors = ref([])
const apptMap = ref({})   // doctorId-slot -> { patientName, phone, doctorName, date, timeSlot, _id }
const schedMap = ref({})  // doctorId-slot -> true

// ========== Toast ==========
const toastMessage = ref('')
const toastType = ref('success')
let toastTimer = null
function showToast(msg, type) {
  toastMessage.value = msg
  toastType.value = type || 'success'
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toastMessage.value = '' }, 2500)
}

const actionLoading = ref(false)

// ========== 预约患者模态框 ==========
const appointmentModalVisible = ref(false)
const currentDoctor = ref(null)
const currentTimeSlot = ref('')
const patientPhone = ref('')
const patientName = ref('')
const patientGender = ref('male')
const patientAge = ref('')

// ========== 单元格查询 ==========
function cellHasAppt(slot, docId) { return !!apptMap.value[docId + '-' + slot] }
function cellHasSchedule(slot, docId) { return !!schedMap.value[docId + '-' + slot] }
function cellApptName(slot, docId) {
  const a = apptMap.value[docId + '-' + slot]
  return a ? a.patientName : ''
}

// ========== 预约患者方法 ==========
function openAppointmentModal(doctor, slot) {
  currentDoctor.value = doctor
  currentTimeSlot.value = slot
  patientPhone.value = ''
  patientName.value = ''
  patientGender.value = 'male'
  patientAge.value = ''
  appointmentModalVisible.value = true
}

function autoFillPatient() {
  const phone = patientPhone.value.trim()
  const name = patientName.value.trim()
  
  if (!phone && !name) return
  
  let matched = null
  
  // 优先精确匹配姓名
  if (name) {
    matched = patientList.value.find(p => p.name === name)
  }
  
  // 如果没有精确匹配，尝试模糊匹配姓名
  if (!matched && name) {
    matched = patientList.value.find(p => p.name && p.name.includes(name))
  }
  
  // 如果没有姓名匹配，尝试电话匹配
  if (!matched && phone) {
    matched = patientList.value.find(p => p.phone && p.phone.includes(phone))
  }
  
  if (matched) {
    patientPhone.value = patientPhone.value || matched.phone || ''
    patientName.value = patientName.value || matched.name || ''
    patientAge.value = patientAge.value || matched.age || ''
    patientGender.value = patientGender.value || matched.gender || 'male'
  }
}

async function onSubmitAppointment() {
  if (!patientPhone.value.trim()) {
    showToast('请输入患者手机号', 'error')
    return
  }
  if (!patientName.value.trim()) {
    showToast('请输入患者姓名', 'error')
    return
  }
  actionLoading.value = true
  try {
    await appointmentAPI.create({
      patientPhone: patientPhone.value,
      patientName: patientName.value,
      patientGender: patientGender.value,
      patientAge: patientAge.value,
      doctorId: currentDoctor.value._id,
      date: viewDate.value,
      timeSlot: currentTimeSlot.value,
      type: '门诊'
    })
    showToast('预约成功', 'success')
    appointmentModalVisible.value = false
    await loadAll()
  } catch (e) {
    const msg = (e.response && e.response.data && e.response.data.message) || '预约失败'
    showToast(msg, 'error')
  } finally {
    actionLoading.value = false
  }
}

// ========== 添加排班 表单 ==========
const addModalVisible = ref(false)
const addFormDoctor = ref('')
const addFormDate = ref('')
const addFormSlots = ref([])
const addAllSlotsSelected = ref(false)

function openAddModal() {
  addFormDoctor.value = doctorList.value[0]?._id || ''
  addFormDate.value = viewDate.value
  addFormSlots.value = []
  addAllSlotsSelected.value = false
  addModalVisible.value = true
}
function toggleAddSlot(slot) {
  const idx = addFormSlots.value.indexOf(slot)
  if (idx >= 0) addFormSlots.value = addFormSlots.value.filter(s => s !== slot)
  else addFormSlots.value = [...addFormSlots.value, slot]
  addAllSlotsSelected.value = addFormSlots.value.length === timeSlotList.length
}
function toggleAddAllSlots() {
  if (addAllSlotsSelected.value) {
    addFormSlots.value = []
    addAllSlotsSelected.value = false
  } else {
    addFormSlots.value = timeSlotList.slice()
    addAllSlotsSelected.value = true
  }
}

async function onSubmitAdd() {
  if (!addFormDoctor.value || !addFormDate.value) { showToast('请选择医生和日期', 'error'); return }
  if (addFormSlots.value.length === 0) { showToast('请选择至少一个时间段', 'error'); return }
  actionLoading.value = true
  try {
    const slots = addFormSlots.value.map(s => ({ time: s, available: 1, maxCapacity: 1 }))
    const res = await scheduleAPI.create({
      doctorId: addFormDoctor.value,
      date: addFormDate.value,
      timeSlots: slots
    })
    const msg = (res.data && res.data.message) || '添加成功'
    showToast(msg, 'success')
    addModalVisible.value = false
    await loadAll()
  } catch (e) {
    const msg = (e.response && e.response.data && e.response.data.message) || (e.message || '添加失败')
    showToast(msg, 'error')
  } finally {
    actionLoading.value = false
  }
}

// ========== 批量排班 ==========
const batchModalVisible = ref(false)
const batchFormDoctor = ref('')
const batchFormStart = ref('')
const batchFormEnd = ref('')
const batchFormWeekdays = ref([1,2,3,4,5])
const batchFormSlots = ref([])
const batchAllSlotsSelected = ref(false)

function openBatchModal() {
  batchFormDoctor.value = doctorList.value[0]?._id || ''
  batchFormStart.value = ''
  batchFormEnd.value = ''
  batchFormWeekdays.value = [1,2,3,4,5]
  batchFormSlots.value = []
  batchAllSlotsSelected.value = false
  batchModalVisible.value = true
}
function toggleBatchSlot(slot) {
  const idx = batchFormSlots.value.indexOf(slot)
  if (idx >= 0) batchFormSlots.value = batchFormSlots.value.filter(s => s !== slot)
  else batchFormSlots.value = [...batchFormSlots.value, slot]
  batchAllSlotsSelected.value = batchFormSlots.value.length === timeSlotList.length
}
function toggleBatchAllSlots() {
  if (batchAllSlotsSelected.value) {
    batchFormSlots.value = []
    batchAllSlotsSelected.value = false
  } else {
    batchFormSlots.value = timeSlotList.slice()
    batchAllSlotsSelected.value = true
  }
}
function toggleBatchWeekday(val) {
  const idx = batchFormWeekdays.value.indexOf(val)
  if (idx >= 0) batchFormWeekdays.value = batchFormWeekdays.value.filter(d => d !== val)
  else batchFormWeekdays.value = [...batchFormWeekdays.value, val]
}

async function onSubmitBatch() {
  if (!batchFormDoctor.value || !batchFormStart.value || !batchFormEnd.value) {
    showToast('请填写医生和日期范围', 'error'); return
  }
  if (batchFormSlots.value.length === 0) { showToast('请选择至少一个时间段', 'error'); return }
  if (batchFormWeekdays.value.length === 0) { showToast('请选择至少一个出诊星期', 'error'); return }
  actionLoading.value = true
  try {
    const res = await scheduleAPI.batchCreate({
      doctorId: batchFormDoctor.value,
      startDate: batchFormStart.value,
      endDate: batchFormEnd.value,
      weekdays: batchFormWeekdays.value.slice().sort(),
      timeSlots: batchFormSlots.value.slice()
    })
    const msg = (res.data && res.data.message) || '批量创建成功'
    showToast(msg, 'success')
    batchModalVisible.value = false
    await loadAll()
  } catch (e) {
    const msg = (e.response && e.response.data && e.response.data.message) || '批量创建失败'
    showToast(msg, 'error')
  } finally {
    actionLoading.value = false
  }
}

// ========== 预约详情与取消 ==========
const apptModalVisible = ref(false)
const currentAppt = ref(null)

function openApptDetail(slot, docId) {
  const a = apptMap.value[docId + '-' + slot]
  if (a) {
    currentAppt.value = a
    apptModalVisible.value = true
  }
}

async function onCancelAppt() {
  if (!currentAppt.value || !currentAppt.value._id) return
  actionLoading.value = true
  try {
    await appointmentAPI.update(currentAppt.value._id, { status: 'cancelled' })
    showToast('取消成功', 'success')
    apptModalVisible.value = false
    currentAppt.value = null
    await loadAll()
  } catch (e) {
    showToast('取消失败', 'error')
  } finally {
    actionLoading.value = false
  }
}

// ========== 视图状态重建 ==========
function rebuildDisplay() {
  const vd = viewDate.value
  const dept = viewDept.value

  const todaySchedules = scheduleList.value.filter(s => {
    const d = typeof s.date === 'string' ? s.date : new Date(s.date).toISOString().split('T')[0]
    return d === vd
  })

  // 有排班的医生
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

  // 预约 map
  const al = {}
  appointmentList.value.forEach(a => {
    const ad = new Date(a.date).toISOString().split('T')[0]
    if (ad !== vd) return
    if (a.status === 'cancelled') return
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

  // 排班 slot map
  const sl = {}
  todaySchedules.forEach(s => {
    const id = (s.doctorId && s.doctorId._id) || s.doctorId
    if (s.timeSlots && Array.isArray(s.timeSlots)) {
      s.timeSlots.forEach(ts => { sl[id + '-' + ts.time] = true })
    }
  })
  schedMap.value = sl
}

// ========== 加载 ==========
async function loadAll() {
  loading.value = true
  try {
    const [s, d, a, p] = await Promise.all([
      scheduleAPI.getAll(),
      doctorAPI.getAll(),
      appointmentAPI.getAll(),
      patientAPI.getAll()
    ])
    scheduleList.value = s.data || []
    doctorList.value = d.data || []
    appointmentList.value = a.data || []
    patientList.value = p.data || []

    const set = new Set()
    doctorList.value.forEach(doc => { if (doc.specialty) set.add(doc.specialty) })
    deptList.value = [...set].sort()

    rebuildDisplay()
  } catch (e) {
    showToast('加载失败', 'error')
  } finally {
    loading.value = false
  }
}

onMounted(() => { loadAll() })
</script>

<style scoped>
table { border-collapse: separate; border-spacing: 0; }
</style>
