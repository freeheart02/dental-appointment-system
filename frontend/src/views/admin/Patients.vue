<template>
  <AdminLayout title="患者管理">
    <div class="bg-white rounded-xl shadow-md">
      <div class="p-4 border-b border-gray-200 flex justify-between items-center">
        <div class="relative">
          <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            v-model="searchQuery"
            @input="onSearchInput"
            type="text"
            placeholder="搜索患者姓名或手机号"
            class="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>
        <button @click="openAddModal" class="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all">
          <Plus class="w-5 h-5" />
          <span>添加患者</span>
        </button>
      </div>

      <div v-if="toastMessage" :class="['fixed top-4 right-4 z-[100] px-4 py-2 rounded-lg shadow-lg text-white text-sm', toastType === 'error' ? 'bg-red-500' : 'bg-green-500']">
        {{ toastMessage }}
      </div>

      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="bg-gray-50">
              <th class="px-6 py-3 text-left text-sm font-medium text-gray-600 cursor-pointer hover:text-gray-800" @click="onSort('name')">
                姓名
                <span v-if="sortField === 'name'" class="text-xs text-gray-400 ml-1">{{ sortOrder === 'asc' ? '↑' : '↓' }}</span>
              </th>
              <th class="px-6 py-3 text-left text-sm font-medium text-gray-600 cursor-pointer hover:text-gray-800" @click="onSort('phone')">
                手机号
                <span v-if="sortField === 'phone'" class="text-xs text-gray-400 ml-1">{{ sortOrder === 'asc' ? '↑' : '↓' }}</span>
              </th>
              <th class="px-6 py-3 text-left text-sm font-medium text-gray-600">性别</th>
              <th class="px-6 py-3 text-left text-sm font-medium text-gray-600">年龄</th>
              <th class="px-6 py-3 text-left text-sm font-medium text-gray-600">爽约次数</th>
              <th class="px-6 py-3 text-left text-sm font-medium text-gray-600">最新预约</th>
              <th class="px-6 py-3 text-left text-sm font-medium text-gray-600">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="patient in displayList" :key="patient._id" class="border-b border-gray-100 hover:bg-gray-50">
              <td class="px-6 py-4 text-sm text-gray-800">{{ patient.name }}</td>
              <td class="px-6 py-4 text-sm text-gray-600">{{ patient.phone }}</td>
              <td class="px-6 py-4 text-sm text-gray-600">{{ genderText(patient.gender) }}</td>
              <td class="px-6 py-4 text-sm text-gray-600">{{ patient.age || '-' }}</td>
              <td class="px-6 py-4">
                <div class="flex items-center gap-2">
                  <span :class="['text-sm font-medium', (patient.noShowCount || 0) >= 3 ? 'text-red-600' : 'text-gray-600']">
                    {{ patient.noShowCount || 0 }} 次
                  </span>
                  <button
                    v-if="(patient.noShowCount || 0) < 3"
                    @click="onAddNoShow(patient._id)"
                    class="px-2 py-0.5 bg-red-50 text-red-600 rounded text-xs hover:bg-red-100 transition-all"
                  >
                    +1
                  </button>
                  <button
                    v-if="(patient.noShowCount || 0) >= 3"
                    @click="onResetNoShow(patient._id)"
                    class="px-2 py-0.5 bg-green-50 text-green-600 rounded text-xs hover:bg-green-100 transition-all"
                  >
                    解除限制
                  </button>
                </div>
              </td>
              <td class="px-6 py-4 text-sm text-gray-500">{{ patient.lastAppointmentDate ? formatDateStr(patient.lastAppointmentDate) : '-' }}</td>
              <td class="px-6 py-4">
                <div class="flex gap-2">
                  <button @click="onEdit(patient)" class="text-blue-500 hover:text-blue-600">
                    <Edit class="w-4 h-4" />
                  </button>
                  <button @click="onDelete(patient._id)" class="text-red-500 hover:text-red-600">
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="rawList.length === 0 && !loading" class="p-12 text-center">
        <Users class="w-12 h-12 mx-auto mb-4 text-gray-300" />
        <p class="text-gray-500">暂无患者数据</p>
      </div>
      <div v-if="loading" class="p-12 text-center text-gray-500 text-sm">加载中...</div>
    </div>

    <div v-if="modalVisible" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-xl p-6 w-full max-w-md">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-semibold text-gray-800">{{ formName === '__DELETE_CONFIRM__' ? '确认删除' : (modalEditing ? '编辑患者' : '添加患者') }}</h3>
          <button @click="onCloseModal" class="text-gray-400 hover:text-gray-600">
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- 删除确认态 -->
        <div v-if="formName === '__DELETE_CONFIRM__'" class="space-y-4">
          <p class="text-gray-700 text-sm">确定要删除该患者吗？此操作不可撤销。</p>
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
            <input
              v-model="formName"
              type="text"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="请输入姓名"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">手机号</label>
            <input
              v-model="formPhone"
              type="tel"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="请输入手机号"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">性别</label>
            <select
              v-model="formGender"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="">请选择</option>
              <option value="male">男</option>
              <option value="female">女</option>
              <option value="other">其他</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">年龄</label>
            <input
              v-model="formAge"
              type="number"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="请输入年龄"
            />
          </div>

          <button
            type="submit"
            :disabled="saving"
            class="w-full py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ saving ? '保存中...' : (modalEditing ? '保存修改' : '添加患者') }}
          </button>
        </form>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Search, Plus, Edit, Trash2, Users, X } from 'lucide-vue-next'
import AdminLayout from '../../components/AdminLayout.vue'
import { patientAPI } from '../../utils/api'

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
const formPhone = ref('')
const formGender = ref('')
const formAge = ref('')

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

// ========== 辅助函数（纯函数，无副作用） ==========
function genderText(g) {
  const map = { male: '男', female: '女', other: '其他' }
  return map[g] || '-'
}
function formatDateStr(s) {
  const d = new Date(s)
  return d.toLocaleDateString('zh-CN')
}

// ========== 构建显示列表（只依赖 ref 取值，不触发响应式更新） ==========
function rebuildDisplay() {
  let list = rawList.value.slice()
  // 搜索
  const q = searchQuery.value.trim().toLowerCase()
  if (q) {
    list = list.filter(p => {
      const name = (p.name || '').toLowerCase()
      const phone = (p.phone || '').toLowerCase()
      return name.includes(q) || phone.includes(q)
    })
  }
  // 排序
  const field = sortField.value
  const asc = sortOrder.value === 'asc'
  list.sort((a, b) => {
    const av = String(a[field] || '')
    const bv = String(b[field] || '')
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
async function loadPatients() {
  loading.value = true
  try {
    const response = await patientAPI.getAll()
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
  formPhone.value = ''
  formGender.value = ''
  formAge.value = ''
  modalVisible.value = true
}

function onEdit(patient) {
  modalEditing.value = true
  editingId.value = patient._id
  formName.value = patient.name || ''
  formPhone.value = patient.phone || ''
  formGender.value = patient.gender || ''
  formAge.value = (patient.age !== undefined && patient.age !== null) ? String(patient.age) : ''
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
    if (modalEditing.value) {
      const payload = {
        name: formName.value,
        gender: formGender.value
      }
      if (formAge.value && !isNaN(parseInt(formAge.value))) {
        payload.age = parseInt(formAge.value)
      }
      await patientAPI.update(editingId.value, payload)
      showToast('修改成功', 'success')
    } else {
      const payload = {
        name: formName.value,
        phone: formPhone.value,
        gender: formGender.value
      }
      if (formAge.value && !isNaN(parseInt(formAge.value))) {
        payload.age = parseInt(formAge.value)
      }
      await patientAPI.create(payload)
      showToast('添加成功', 'success')
    }
    // 正常重载数据 —— 不跳转、不刷新页面
    await loadPatients()
    modalVisible.value = false
  } catch (e) {
    showToast(modalEditing.value ? '修改失败' : '添加失败', 'error')
  } finally {
    saving.value = false
  }
}

async function onAddNoShow(patientId) {
  try {
    await patientAPI.update(patientId, { incrementNoShow: true })
    showToast('已更新', 'success')
    await loadPatients()
  } catch (e) {
    showToast('更新失败', 'error')
  }
}

async function onResetNoShow(patientId) {
  try {
    await patientAPI.update(patientId, { resetNoShow: true })
    showToast('已重置', 'success')
    await loadPatients()
  } catch (e) {
    showToast('重置失败', 'error')
  }
}

async function onDelete(id) {
  // 使用自定义二次确认弹窗（不调用 confirm/alert），避免触发宿主容器崩溃
  modalEditing.value = false
  editingId.value = id
  // 设置标记值，模板中检测到即显示确认态
  formName.value = '__DELETE_CONFIRM__'
  formPhone.value = ''
  formGender.value = ''
  formAge.value = ''
  modalVisible.value = true
}

async function onConfirmDelete() {
  const id = editingId.value
  if (!id) return
  saving.value = true
  try {
    await patientAPI.delete(id)
    showToast('删除成功', 'success')
    await loadPatients()
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

onMounted(() => { loadPatients() })
</script>
