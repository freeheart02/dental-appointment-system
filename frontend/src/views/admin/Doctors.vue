<template>
  <AdminLayout title="医生管理">
    <div class="bg-white rounded-xl shadow-md">
      <div class="p-4 border-b border-gray-200 flex justify-between items-center">
        <div class="relative">
          <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="搜索医生姓名"
            class="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>
        <button @click="showAddModal = true" class="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all">
          <Plus class="w-5 h-5" />
          <span>添加医生</span>
        </button>
      </div>
      
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="bg-gray-50">
              <th @click="sortBy('name')" class="px-6 py-3 text-left text-sm font-medium text-gray-600 cursor-pointer hover:text-gray-800">
                姓名
                <span v-if="sortField === 'name'" class="text-xs text-gray-400 ml-1">{{ sortOrder === 'asc' ? '↑' : '↓' }}</span>
              </th>
              <th @click="sortBy('department')" class="px-6 py-3 text-left text-sm font-medium text-gray-600 cursor-pointer hover:text-gray-800">
                科室
                <span v-if="sortField === 'department'" class="text-xs text-gray-400 ml-1">{{ sortOrder === 'asc' ? '↑' : '↓' }}</span>
              </th>
              <th class="px-6 py-3 text-left text-sm font-medium text-gray-600">简介</th>
              <th class="px-6 py-3 text-left text-sm font-medium text-gray-600">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="doctor in filteredDoctors" :key="doctor._id" class="border-b border-gray-100 hover:bg-gray-50">
              <td class="px-6 py-4 text-sm text-gray-800 align-middle">{{ doctor.name }}</td>
              <td class="px-6 py-4 text-sm text-gray-600 align-middle">{{ doctor.department || doctor.specialty }}</td>
              <td class="px-6 py-4 text-sm text-gray-600 max-w-xs truncate align-middle">{{ doctor.description || '-' }}</td>
              <td class="px-6 py-4 align-middle">
                <div class="flex gap-2">
                  <button @click="editDoctor(doctor)" class="text-blue-500 hover:text-blue-600">
                    <Edit class="w-4 h-4" />
                  </button>
                  <button @click="deleteDoctor(doctor._id)" class="text-red-500 hover:text-red-600">
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <div v-if="doctors.length === 0" class="p-12 text-center">
        <User class="w-12 h-12 mx-auto mb-4 text-gray-300" />
        <p class="text-gray-500">暂无医生数据</p>
      </div>
    </div>

    <div v-if="showAddModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-xl p-6 w-full max-w-md">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-semibold text-gray-800">{{ isEditing ? '编辑医生' : '添加医生' }}</h3>
          <button @click="closeModal" class="text-gray-400 hover:text-gray-600">
            <X class="w-5 h-5" />
          </button>
        </div>
        
        <form @submit.prevent="saveDoctor" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">姓名</label>
            <input
              v-model="formData.name"
              type="text"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="请输入姓名"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">专业</label>
            <input
              v-model="formData.specialty"
              type="text"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="请输入专业领域"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">简介</label>
            <textarea
              v-model="formData.description"
              rows="3"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
              placeholder="请输入医生简介"
            ></textarea>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">出诊时间段间隔（分钟）</label>
            <select
              v-model="formData.slotInterval"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
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
            class="w-full py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-all"
          >
            {{ isEditing ? '保存修改' : '添加医生' }}
          </button>
        </form>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Search, Plus, Edit, Trash2, User, X } from 'lucide-vue-next'
import AdminLayout from '../../components/AdminLayout.vue'
import { doctorAPI } from '../../utils/api'

const doctors = ref([])
const searchQuery = ref('')
const showAddModal = ref(false)
const isEditing = ref(false)
const editingId = ref(null)
const sortField = ref('name')
const sortOrder = ref('asc')

const formData = ref({
  name: '',
  specialty: '',
  description: '',
  slotInterval: 30
})

const filteredDoctors = computed(() => {
  let result = doctors.value
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(d => d.name.toLowerCase().includes(query))
  }
  
  result = [...result].sort((a, b) => {
    const field = sortField.value
    let aVal = field === 'department' ? (a.department || a.specialty) : a[field]
    let bVal = field === 'department' ? (b.department || b.specialty) : b[field]
    
    // 使用 localeCompare 按汉语拼音排序
    const comparison = String(aVal || '').localeCompare(String(bVal || ''), 'zh-CN')
    return sortOrder.value === 'asc' ? comparison : -comparison
  })
  
  return result
})

const sortBy = (field) => {
  if (sortField.value === field) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortField.value = field
    sortOrder.value = 'asc'
  }
}

const formatDate = (dateStr) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN')
}

const loadDoctors = async () => {
  try {
    const response = await doctorAPI.getAll()
    doctors.value = response.data
  } catch (error) {
    console.error('Failed to load doctors')
  }
}

const addDoctor = async () => {
  try {
    await doctorAPI.create({
      ...formData.value,
      slotInterval: parseInt(formData.value.slotInterval)
    })
    loadDoctors()
    closeModal()
    alert('添加成功')
  } catch (error) {
    alert('添加失败')
  }
}

const editDoctor = (doctor) => {
  isEditing.value = true
  editingId.value = doctor._id
  formData.value = {
    name: doctor.name,
    specialty: doctor.specialty,
    description: doctor.description || '',
    slotInterval: doctor.slotInterval || 30
  }
  showAddModal.value = true
}

const updateDoctor = async () => {
  try {
    await doctorAPI.update(editingId.value, {
      ...formData.value,
      slotInterval: parseInt(formData.value.slotInterval)
    })
    loadDoctors()
    closeModal()
    alert('修改成功')
  } catch (error) {
    alert('修改失败')
  }
}

const saveDoctor = () => {
  if (isEditing.value) {
    updateDoctor()
  } else {
    addDoctor()
  }
}

const deleteDoctor = async (id) => {
  if (!confirm('确定要删除该医生吗？')) return
  try {
    await doctorAPI.delete(id)
    loadDoctors()
    alert('删除成功')
  } catch (error) {
    alert('删除失败')
  }
}

const closeModal = () => {
  showAddModal.value = false
  isEditing.value = false
  editingId.value = null
  formData.value = { name: '', specialty: '', description: '' }
}

onMounted(() => {
  loadDoctors()
})
</script>
