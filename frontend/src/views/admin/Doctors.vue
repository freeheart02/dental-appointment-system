<template>
  <AdminLayout title="医生管理">
    <div class="bg-white rounded-xl shadow-md">
      <div class="p-4 border-b border-gray-200 flex justify-between items-center">
        <div class="relative">
          <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            v-model="searchQuery"
            @input="onSearchInput"
            type="text"
            placeholder="搜索医生姓名或专业"
            class="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>
        <button @click="openAddModal" class="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all">
          <Plus class="w-5 h-5" />
          <span>添加医生</span>
        </button>
      </div>

      <div v-if="toastMessage" :class="['fixed top-4 right-4 z-[100] px-4 py-2 rounded-lg shadow-lg text-white text-sm', toastType === 'error' ? 'bg-red-500' : 'bg-green-500']">
        {{ toastMessage }}
      </div>

      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="bg-gray-50">
              <th @click="onSort('name')" class="px-6 py-3 text-left text-sm font-medium text-gray-600 cursor-pointer hover:text-gray-800">
                姓名
                <span v-if="sortField === 'name'" class="text-xs text-gray-400 ml-1">{{ sortOrder === 'asc' ? '↑' : '↓' }}</span>
              </th>
              <th @click="onSort('specialty')" class="px-6 py-3 text-left text-sm font-medium text-gray-600 cursor-pointer hover:text-gray-800">
                科室/专业
                <span v-if="sortField === 'specialty'" class="text-xs text-gray-400 ml-1">{{ sortOrder === 'asc' ? '↑' : '↓' }}</span>
              </th>
              <th class="px-6 py-3 text-left text-sm font-medium text-gray-600">简介</th>
              <th @click="onSort('slotInterval')" class="px-6 py-3 text-left text-sm font-medium text-gray-600 cursor-pointer hover:text-gray-800">
                出诊间隔
                <span v-if="sortField === 'slotInterval'" class="text-xs text-gray-400 ml-1">{{ sortOrder === 'asc' ? '↑' : '↓' }}</span>
              </th>
              <th class="px-6 py-3 text-left text-sm font-medium text-gray-600">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="doctor in displayList" :key="doctor._id" class="border-b border-gray-100 hover:bg-gray-50">
              <td class="px-6 py-4 text-sm text-gray-800 align-middle">{{ doctor.name }}</td>
              <td class="px-6 py-4 text-sm text-gray-600 align-middle">{{ doctor.specialty || doctor.department || '-' }}</td>
              <td class="px-6 py-4 text-sm text-gray-600 max-w-xs truncate align-middle">{{ doctor.description || '-' }}</td>
              <td class="px-6 py-4 text-sm text-gray-600 align-middle">{{ doctor.slotInterval }} 分钟</td>
              <td class="px-6 py-4 align-middle">
                <div class="flex gap-2">
                  <button @click="onEdit(doctor)" class="text-blue-500 hover:text-blue-600">
                    <Edit class="w-4 h-4" />
                  </button>
                  <button @click="onDelete(doctor._id)" class="text-red-500 hover:text-red-600">
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="rawList.length === 0 && !loading" class="p-12 text-center">
        <User class="w-12 h-12 mx-auto mb-4 text-gray-300" />
        <p class="text-gray-500">暂无医生数据</p>
      </div>
      <div v-if="loading" class="p-12 text-center text-gray-500 text-sm">加载中...</div>
    </div>

    <!-- 添加/编辑/删除确认 模态框 -->
    <div v-if="modalVisible" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-xl p-6 w-full max-w-md">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-semibold text-gray-800">{{ formName === '__DELETE_CONFIRM__' ? '确认删除' : (modalEditing ? '编辑医生' : '添加医生') }}</h3>
          <button @click="onCloseModal" class="text-gray-400 hover:text-gray-600">
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- 删除确认态 -->
        <div v-if="formName === '__DELETE_CONFIRM__'" class="space-y-4">
          <p class="text-gray-700 text-sm">确定要删除该医生吗？此操作不可撤销。</p>
          <div class="flex gap-2">
            <button
              type="button"
              @click="onCancelDelete"
              :disabled="saving"
              class="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-all disabled:opacity-50"
            >
              取消
            </button>
            <button
              type="button"
              @click="onConfirmDelete"
              :disabled="saving"
              class="flex-1 py-3 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition-all disabled:opacity-50"
            >
              {{ saving ? '删除中...' : '确认删除' }}
            </button>
          </div>
        </div>

        <!-- 添加/编辑表单态 -->
        <form v-else @submit.prevent="onSave" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">姓名</label>
            <input v-model="formName" type="text" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="请输入姓名" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">专业/科室</label>
            <input v-model="formSpecialty" type="text" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="如：牙周科" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">简介</label>
            <textarea v-model="formDescription" rows="3" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none" placeholder="请输入医生简介"></textarea>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">出诊时间段间隔（分钟）</label>
            <select v-model.number="formSlotInterval" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
              <option :value="15">15分钟</option>
              <option :value="20">20分钟</option>
              <option :value="30">30分钟</option>
              <option :value="40">40分钟</option>
              <option :value="45">45分钟</option>
              <option :value="60">60分钟</option>
            </select>
          </div>
          <button
            type="submit"
            :disabled="saving"
            class="w-full py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ saving ? '保存中...' : (modalEditing ? '保存修改' : '添加医生') }}
          </button>
        </form>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Search, Plus, Edit, Trash2, User, X } from 'lucide-vue-next'
import AdminLayout from '../../components/AdminLayout.vue'
import { doctorAPI } from '../../utils/api'

// ========== 列表数据（单一真相来源：rawList） ==========
const rawList = ref([])          // 从接口加载的原始数据
const displayList = ref([])       // 经过筛选/排序后的显示数据
const searchQuery = ref('')       // 搜索关键词
const sortField = ref('name')     // 排序字段
const sortOrder = ref('asc')      // 排序方向
const loading = ref(false)

// ========== 模态框状态 ==========
const modalVisible = ref(false)
const modalEditing = ref(false)
const editingId = ref(null)
const saving = ref(false)
const formName = ref('')
const formSpecialty = ref('')
const formDescription = ref('')
const formSlotInterval = ref(30)

// ========== Toast 提示 ==========
const toastMessage = ref('')
const toastType = ref('success')
let toastTimer = null
function showToast(msg, type) {
  toastMessage.value = msg
  toastType.value = type || 'success'
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toastMessage.value = ''
  }, 2000)
}

// ========== 构建显示列表（只依赖 ref 取值，不触发响应式更新） ==========
function rebuildDisplay() {
  let list = rawList.value.slice()
  // 搜索
  const q = searchQuery.value.trim().toLowerCase()
  if (q) {
    list = list.filter(d => {
      const name = (d.name || '').toLowerCase()
      const specialty = (d.specialty || d.department || '').toLowerCase()
      return name.includes(q) || specialty.includes(q)
    })
  }
  // 排序
  const field = sortField.value
  const asc = sortOrder.value === 'asc'
  list.sort((a, b) => {
    const av = String(a[field] || (field === 'specialty' ? a.department : '') || '')
    const bv = String(b[field] || (field === 'specialty' ? b.department : '') || '')
    if (field === 'slotInterval') {
      return asc ? (Number(av) - Number(bv)) : (Number(bv) - Number(av))
    }
    const cmp = av.localeCompare(bv, 'zh-CN')
    return asc ? cmp : -cmp
  })
  displayList.value = list
}

function onSearchInput() { rebuildDisplay() }
function onSort(field) {
  if (sortField.value === field) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortField.value = field
    sortOrder.value = 'asc'
  }
  rebuildDisplay()
}

// ========== 数据加载 ==========
async function loadDoctors() {
  loading.value = true
  try {
    const response = await doctorAPI.getAll()
    rawList.value = Array.isArray(response.data) ? response.data : []
    rebuildDisplay()
  } catch (e) {
    rawList.value = []
    showToast('加载失败', 'error')
  } finally {
    loading.value = false
  }
}

// ========== 模态框操作 ==========
function openAddModal() {
  modalEditing.value = false
  editingId.value = null
  formName.value = ''
  formSpecialty.value = ''
  formDescription.value = ''
  formSlotInterval.value = 30
  modalVisible.value = true
}

function onEdit(doctor) {
  modalEditing.value = true
  editingId.value = doctor._id
  formName.value = doctor.name || ''
  formSpecialty.value = doctor.specialty || doctor.department || ''
  formDescription.value = doctor.description || ''
  formSlotInterval.value = doctor.slotInterval || 30
  modalVisible.value = true
}

function onCloseModal() {
  modalVisible.value = false
  modalEditing.value = false
  editingId.value = null
  saving.value = false
}

async function onSave() {
  if (saving.value) return
  saving.value = true
  try {
    const payload = {
      name: formName.value,
      specialty: formSpecialty.value,
      description: formDescription.value,
      slotInterval: Number(formSlotInterval.value)
    }
    if (modalEditing.value) {
      await doctorAPI.update(editingId.value, payload)
      showToast('修改成功', 'success')
    } else {
      await doctorAPI.create(payload)
      showToast('添加成功', 'success')
    }
    await loadDoctors()
    modalVisible.value = false
  } catch (e) {
    showToast(modalEditing.value ? '修改失败' : '添加失败', 'error')
  } finally {
    saving.value = false
  }
}

async function onDelete(id) {
  // 使用自定义二次确认弹窗（不调用 confirm/alert）
  modalEditing.value = false
  editingId.value = id
  // 设置标记值，模板中检测到即显示确认态
  formName.value = '__DELETE_CONFIRM__'
  formSpecialty.value = ''
  formDescription.value = ''
  formSlotInterval.value = 30
  modalVisible.value = true
}

async function onConfirmDelete() {
  const id = editingId.value
  if (!id) return
  saving.value = true
  try {
    await doctorAPI.delete(id)
    showToast('删除成功', 'success')
    await loadDoctors()
    modalVisible.value = false
  } catch (e) {
    showToast('删除失败', 'error')
  } finally {
    saving.value = false
  }
}

function onCancelDelete() {
  modalVisible.value = false
  editingId.value = null
  formName.value = ''
}

onMounted(() => { loadDoctors() })
</script>
