<template>
  <AdminLayout title="患者管理">
    <div class="bg-white rounded-xl shadow-md">
      <div class="p-4 border-b border-gray-200 flex justify-between items-center">
        <div class="relative">
          <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="搜索患者姓名或手机号"
            class="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>
        <button @click="showAddModal = true" class="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all">
          <Plus class="w-5 h-5" />
          <span>添加患者</span>
        </button>
      </div>
      
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="bg-gray-50">
              <th class="px-6 py-3 text-left text-sm font-medium text-gray-600 cursor-pointer hover:text-gray-800" @click="sortBy('name')">
                姓名
                <span v-if="sortField === 'name'" class="text-xs text-gray-400 ml-1">{{ sortOrder === 'asc' ? '↑' : '↓' }}</span>
              </th>
              <th class="px-6 py-3 text-left text-sm font-medium text-gray-600 cursor-pointer hover:text-gray-800" @click="sortBy('phone')">
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
            <tr v-for="patient in filteredPatients" :key="patient._id" class="border-b border-gray-100 hover:bg-gray-50">
              <td class="px-6 py-4 text-sm text-gray-800">{{ patient.name }}</td>
              <td class="px-6 py-4 text-sm text-gray-600">{{ patient.phone }}</td>
              <td class="px-6 py-4 text-sm text-gray-600">{{ getGenderText(patient.gender) }}</td>
              <td class="px-6 py-4 text-sm text-gray-600">{{ patient.age || '-' }}</td>
              <td class="px-6 py-4">
                <div class="flex items-center gap-2">
                  <span :class="[
                    'text-sm font-medium',
                    (patient.noShowCount || 0) >= 3 ? 'text-red-600' : 'text-gray-600'
                  ]">
                    {{ patient.noShowCount || 0 }} 次
                  </span>
                  <button
                    v-if="(patient.noShowCount || 0) < 3"
                    @click="addNoShow(patient._id)"
                    class="px-2 py-0.5 bg-red-50 text-red-600 rounded text-xs hover:bg-red-100 transition-all"
                  >
                    +1
                  </button>
                  <button
                    v-if="(patient.noShowCount || 0) >= 3"
                    @click="resetNoShow(patient._id)"
                    class="px-2 py-0.5 bg-green-50 text-green-600 rounded text-xs hover:bg-green-100 transition-all"
                  >
                    解除限制
                  </button>
                </div>
              </td>
              <td class="px-6 py-4 text-sm text-gray-500">{{ patient.lastAppointmentDate ? formatDate(patient.lastAppointmentDate) : '-' }}</td>
              <td class="px-6 py-4">
                <div class="flex gap-2">
                  <button @click="editPatient(patient)" class="text-blue-500 hover:text-blue-600">
                    <Edit class="w-4 h-4" />
                  </button>
                  <button @click="deletePatient(patient._id)" class="text-red-500 hover:text-red-600">
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <div v-if="patients.length === 0" class="p-12 text-center">
        <Users class="w-12 h-12 mx-auto mb-4 text-gray-300" />
        <p class="text-gray-500">暂无患者数据</p>
      </div>
    </div>

    <div v-if="showAddModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-xl p-6 w-full max-w-md">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-semibold text-gray-800">{{ isEditing ? '编辑患者' : '添加患者' }}</h3>
          <button @click="closeModal" class="text-gray-400 hover:text-gray-600">
            <X class="w-5 h-5" />
          </button>
        </div>
        
        <form @submit.prevent="savePatient" class="space-y-4">
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
            <label class="block text-sm font-medium text-gray-700 mb-1">手机号</label>
            <input
              v-model="formData.phone"
              type="tel"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="请输入手机号"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">性别</label>
            <select
              v-model="formData.gender"
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
              v-model="formData.age"
              type="number"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="请输入年龄"
            />
          </div>
          
          <button
            type="submit"
            class="w-full py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-all"
          >
            {{ isEditing ? '保存修改' : '添加患者' }}
          </button>
        </form>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Search, Plus, Edit, Trash2, Users, X } from 'lucide-vue-next'
import AdminLayout from '../../components/AdminLayout.vue'
import { patientAPI } from '../../utils/api'

const patients = ref([])
const searchQuery = ref('')
const showAddModal = ref(false)
const isEditing = ref(false)
const editingId = ref(null)
const sortField = ref('name')
const sortOrder = ref('asc')

const formData = ref({
  name: '',
  phone: '',
  gender: '',
  age: ''
})

const sortBy = (field) => {
  if (sortField.value === field) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortField.value = field
    sortOrder.value = 'asc'
  }
}

const filteredPatients = computed(() => {
  let result = patients.value
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(p => 
      p.name.toLowerCase().includes(query) || 
      p.phone.includes(query)
    )
  }
  
  result = [...result].sort((a, b) => {
    const field = sortField.value
    let aVal = a[field]
    let bVal = b[field]
    
    const comparison = String(aVal || '').localeCompare(String(bVal || ''), 'zh-CN')
    return sortOrder.value === 'asc' ? comparison : -comparison
  })
  
  return result
})

const getGenderText = (gender) => {
  const map = { male: '男', female: '女', other: '其他' }
  return map[gender] || '-'
}

const formatDate = (dateStr) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN')
}

const loadPatients = async () => {
  try {
    const response = await patientAPI.getAll()
    patients.value = response.data
  } catch (error) {
    console.error('Failed to load patients')
  }
}

const addPatient = async () => {
  try {
    await patientAPI.create(formData.value)
    loadPatients()
    closeModal()
    alert('添加成功')
  } catch (error) {
    alert('添加失败')
  }
}

const editPatient = (patient) => {
  isEditing.value = true
  editingId.value = patient._id
  formData.value = {
    name: patient.name,
    phone: patient.phone,
    gender: patient.gender || '',
    age: patient.age?.toString() || ''
  }
  showAddModal.value = true
}

const updatePatient = async () => {
  try {
    await patientAPI.update(editingId.value, {
      name: formData.value.name,
      gender: formData.value.gender,
      age: formData.value.age ? parseInt(formData.value.age) : undefined
    })
    loadPatients()
    closeModal()
    alert('修改成功')
  } catch (error) {
    alert('修改失败')
  }
}

const savePatient = () => {
  if (isEditing.value) {
    updatePatient()
  } else {
    addPatient()
  }
}

const addNoShow = async (patientId) => {
  try {
    await patientAPI.update(patientId, { incrementNoShow: true })
    loadPatients()
    alert('爽约次数已更新')
  } catch (error) {
    alert('更新失败')
  }
}

const resetNoShow = async (patientId) => {
  try {
    await patientAPI.update(patientId, { resetNoShow: true })
    loadPatients()
    alert('爽约次数已重置')
  } catch (error) {
    alert('重置失败')
  }
}

const deletePatient = async (id) => {
  if (!confirm('确定要删除该患者吗？')) return
  try {
    await patientAPI.delete(id)
    loadPatients()
    alert('删除成功')
  } catch (error) {
    alert('删除失败')
  }
}

const closeModal = () => {
  showAddModal.value = false
  isEditing.value = false
  editingId.value = null
  formData.value = { name: '', phone: '', gender: '', age: '' }
}

onMounted(() => {
  loadPatients()
})
</script>
