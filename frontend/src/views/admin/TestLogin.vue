<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center p-4">
    <div class="bg-gray-800 border border-gray-700 rounded-2xl shadow-xl w-full max-w-md p-8">
      <div class="text-center mb-8">
        <h1 class="text-2xl font-bold text-white">API 测试页面</h1>
        <p class="text-gray-400 mt-2">直接测试登录 API</p>
      </div>

      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">用户名</label>
          <input v-model="username" type="text" placeholder="admin" class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white" />
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">密码</label>
          <input v-model="password" type="password" placeholder="admin123" class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white" />
        </div>

        <button @click="testLogin" class="w-full py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600">
          测试登录
        </button>

        <div v-if="result" class="mt-4 p-4 bg-gray-700 rounded-lg text-white text-sm">
          <pre>{{ JSON.stringify(result, null, 2) }}</pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const username = ref('admin')
const password = ref('admin123')
const result = ref(null)

const testLogin = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/auth/admin/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: username.value,
        password: password.value
      })
    })
    
    const data = await response.json()
    result.value = {
      status: response.status,
      data
    }
    
    console.log('Test result:', result.value)
  } catch (error) {
    result.value = {
      error: error.message
    }
    console.error('Test error:', error)
  }
}
</script>
