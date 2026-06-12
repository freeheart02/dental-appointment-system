<template>
  <div>
    <div class="mb-6 flex justify-between items-center">
      <h2 class="text-2xl font-bold text-gray-800">数据备份管理</h2>
      <button
        @click="createBackup"
        :disabled="loading"
        class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 flex items-center gap-2"
      >
        <Download class="w-4 h-4" />
        立即备份
      </button>
    </div>

    <!-- 说明 -->
    <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
      <div class="flex items-start gap-3">
        <Info class="w-5 h-5 text-blue-600 mt-0.5" />
        <div class="text-sm text-blue-800">
          <p class="font-semibold mb-1">自动备份说明</p>
          <p>系统每 1 小时自动创建一次备份，最多保留最近 10 份备份文件。</p>
          <p class="mt-1">您可以随时点击"立即备份"手动创建备份，或下载备份文件保存到本地。</p>
        </div>
      </div>
    </div>

    <!-- 操作结果 -->
    <div v-if="message" :class="[
      'mb-6 p-4 rounded-lg',
      message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
    ]">
      {{ message.text }}
    </div>

    <!-- 备份列表 -->
    <div class="bg-white rounded-lg shadow">
      <div class="px-6 py-4 border-b border-gray-200">
        <h3 class="text-lg font-semibold text-gray-800">备份列表</h3>
      </div>
      <div class="divide-y divide-gray-200">
        <div v-if="backups.length === 0" class="p-6 text-center text-gray-500">
          暂无备份记录
        </div>
        <div v-for="backup in backups" :key="backup.filename" class="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
          <div class="flex items-center gap-4">
            <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText class="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p class="font-medium text-gray-800">{{ backup.filename }}</p>
              <p class="text-sm text-gray-500">
                {{ formatDate(backup.createdAt) }} · {{ formatSize(backup.size) }}
              </p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button
              @click="downloadBackup(backup.filename)"
              class="px-3 py-1.5 text-blue-600 hover:bg-blue-50 rounded-lg flex items-center gap-1 text-sm"
            >
              <Download class="w-4 h-4" />
              下载
            </button>
            <button
              @click="restoreBackup(backup.filename)"
              class="px-3 py-1.5 text-green-600 hover:bg-green-50 rounded-lg flex items-center gap-1 text-sm"
            >
              <RotateCcw class="w-4 h-4" />
              恢复
            </button>
            <button
              @click="deleteBackup(backup.filename)"
              class="px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-1 text-sm"
            >
              <Trash2 class="w-4 h-4" />
              删除
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Download, FileText, Info, RotateCcw, Trash2 } from 'lucide-vue-next'
import axios from 'axios'

const backups = ref([])
const loading = ref(false)
const message = ref(null)

const api = axios.create({
  baseURL: '/api'
})

const showMessage = (text, type = 'success') => {
  message.value = { text, type }
  setTimeout(() => {
    message.value = null
  }, 3000)
}

const loadBackups = async () => {
  try {
    const res = await api.get('/backup/list')
    if (res.data.success) {
      backups.value = res.data.backups
    }
  } catch (err) {
    showMessage('加载备份列表失败', 'error')
  }
}

const createBackup = async () => {
  loading.value = true
  try {
    const res = await api.post('/backup/create')
    if (res.data.success) {
      showMessage(`备份成功：${res.data.filename}`)
      loadBackups()
    } else {
      showMessage(res.data.message || '备份失败', 'error')
    }
  } catch (err) {
    showMessage('备份请求失败', 'error')
  }
  loading.value = false
}

const downloadBackup = (filename) => {
  window.open(`/api/backup/download/${filename}`, '_blank')
}

const restoreBackup = async (filename) => {
  if (!confirm(`确定要恢复备份 "${filename}" 吗？当前数据将被覆盖。`)) {
    return
  }
  try {
    const res = await api.post(`/backup/restore/${filename}`)
    if (res.data.success) {
      showMessage('数据恢复成功')
    } else {
      showMessage(res.data.message || '恢复失败', 'error')
    }
  } catch (err) {
    showMessage('恢复请求失败', 'error')
  }
}

const deleteBackup = async (filename) => {
  if (!confirm(`确定要删除备份 "${filename}" 吗？此操作不可撤销。`)) {
    return
  }
  try {
    const res = await api.delete(`/backup/${filename}`)
    if (res.data.success) {
      showMessage('删除成功')
      loadBackups()
    } else {
      showMessage(res.data.message || '删除失败', 'error')
    }
  } catch (err) {
    showMessage('删除请求失败', 'error')
  }
}

const formatDate = (dateStr) => {
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN')
}

const formatSize = (bytes) => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

onMounted(() => {
  loadBackups()
})
</script>
