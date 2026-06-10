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
            placeholder="搜索医生姓名"
            class="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>
        <button @click="openAddModal" class="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all">
          <Plus class="w-5 h-5" />
          <span>添加医生</span>
        </button>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="bg-gray-50">
              <th @click="toggleSort('name')" class="px-6 py-3 text-left text-sm font-medium text-gray-600 cursor-pointer hover:text-gray-800">
                姓名 <span class="text-xs text-gray-400">{{ sortField === 'name' ? (sortAsc ? '↑' : '↓') : '' }}</span>
              </th>
              <th @click="toggleSort('specialty')" class="px-6 py-3 text-left text-sm font-medium text-gray-600 cursor-pointer hover:text-gray-800">
                科室/专业 <span class="text-xs text-gray-400">{{ sortField === 'specialty' ? (sortAsc ? '↑' : '↓') : '' }}</span>
              </th>
              <th class="px-6 py-3 text-left text-sm font-medium text-gray-600">简介</th>
              <th class="px-6 py-3 text-left text-sm font-medium text-gray-600">出诊间隔</th>
              <th class="px-6 py-3 text-left text-sm font-medium text-gray-600">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="doctor in displayList" :key="doctor._id" class="border-b border-gray-100 hover:bg-gray-50">
              <td class="px-6 py-4 text-sm text-gray-800 align-middle">{{ doctor.name }}</td>
              <td class="px-6 py-4 text-sm text-gray-600 align-middle">{{ doctor.specialty }}</td>
              <td class="px-6 py-4 text-sm text-gray-600 max-w-xs truncate align-middle">{{ doctor.description || '-' }}</td>
              <td class="px-6 py-4 text-sm text-gray-600 align-middle">{{ doctor.slotInterval }} 分钟</td>
              <td class="px-6 py-4 align-middle">
                <div class="flex gap-2">
                  <button @click="openEditModal(doctor)" class="text-blue-500 hover:text-blue-600">
                    <Edit class="w-4 h-4" />
                  </button>
                  <button @click="handleDelete(doctor)" class="text-red-500 hover:text-red-600">
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="displayList.length === 0" class="p-12 text-center">
        <User class="w-12 h-12 mx-auto mb-4 text-gray-300" />
        <p class="text-gray-500">暂无医生数据</p>
      </div>
    </div>

    <!-- 添加/编辑 模态框 -->
    <div v-if="modalVisible" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-xl p-6 w-full max-w-md">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-semibold text-gray-800">{{ modalEditing ? '编辑医生' : '添加医生' }}</h3>
          <button @click="closeModal" class="text-gray-400 hover:text-gray-600">
            <X class="w-5 h-5" />
          </button>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">姓名</label>
            <input v-model="formName" type="text" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="请输入姓名" required />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">专业/科室</label>
            <input v-model="formSpecialty" type="text" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="如：牙周科" required />
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
          <button type="submit" class="w-full py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-all">
            {{ modalEditing ? '保存修改' : '添加医生' }}
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

// ==== 列表数据 ====
const doctors = ref([])
const searchQuery = ref('')
const sortField = ref('name')
const sortAsc = ref(true)

// ==== 模态框状态 ====
const modalVisible = ref(false)
const modalEditing = ref(false)
const modalId = ref('')
const formName = ref('')
const formSpecialty = ref('')
const formDescription = ref('')
const formSlotInterval = ref(30)

// ==== 计算显示列表（纯函数 + ref，避免 computed 带来的潜在循环更新）====
const displayList = ref([])

function rebuildDisplayList() {
  const q = searchQuery.value.trim().toLowerCase()
  let list = doctors.value.slice()
  if (q) {
    list = list.filter(d => String(d.name).toLowerCase().includes(q))
  }
  const field = sortField.value
  list.sort((a, b) => {
    const av = String(a[field] || (field === 'specialty' ? a.department : '') || '')
    const bv = String(b[field] || (field === 'specialty' ? b.department : '') || '')
    const cmp = av.localeCompare(bv, 'zh-CN')
    return sortAsc.value ? cmp : -cmp
  })
  displayList.value = list
}

function toggleSort(field) {
  if (sortField.value === field) {
    sortAsc.value = !sortAsc.value
  } else {
    sortField.value = field
    sortAsc.value = true
  }
  rebuildDisplayList()
}

// ==== 数据加载（只在 onMounted 调用一次）====
async function loadDoctors() {
  try {
    const response = await doctorAPI.getAll()
    doctors.value = response.data || []
    rebuildDisplayList()
  } catch (error) {
    console.error('Failed to load doctors')
  }
}

// 搜索框变化时刷新列表
function onSearchInput() {
  rebuildDisplayList()
}

// ==== 模态框操作 ====
function openAddModal() {
  modalEditing.value = false
  modalId.value = ''
  formName.value = ''
  formSpecialty.value = ''
  formDescription.value = ''
  formSlotInterval.value = 30
  modalVisible.value = true
}

function openEditModal(doctor) {
  modalEditing.value = true
  modalId.value = doctor._id
  formName.value = doctor.name || ''
  formSpecialty.value = doctor.specialty || doctor.department || ''
  formDescription.value = doctor.description || ''
  formSlotInterval.value = doctor.slotInterval || 30
  modalVisible.value = true
}

function closeModal() {
  modalVisible.value = false
}

// ==== 关键：提交后刷新页面，避免响应式循环 ====
async function handleSubmit() {
  try {
    const payload = {
      name: formName.value,
      specialty: formSpecialty.value,
      description: formDescription.value,
      slotInterval: Number(formSlotInterval.value)
    }
    if (modalEditing.value) {
      await doctorAPI.update(modalId.value, payload)
      alert('修改成功')
    } else {
      await doctorAPI.create(payload)
      alert('添加成功')
    }
    // 成功后刷新页面，而不是更新响应式数据
    window.location.href = window.location.href
  } catch (error) {
    alert('操作失败，请重试')
  }
}

async function handleDelete(doctor) {
  if (!confirm('确定要删除该医生吗？')) return
  try {
    await doctorAPI.delete(doctor._id)
    alert('删除成功')
    // 成功后刷新页面
    window.location.href = window.location.href
  } catch (error) {
    alert('删除失败')
  }
}

onMounted(() => {
  loadDoctors()
})
</script>
