<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center p-4">
    <div class="bg-gray-800 border border-gray-700 rounded-2xl shadow-xl w-full max-w-md p-8">
      <div class="text-center mb-8">
        <div class="w-16 h-16 bg-gradient-to-br from-blue-500 to-dental-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <Shield class="w-8 h-8 text-white" />
        </div>
        <h1 class="text-2xl font-bold text-white">管理后台登录</h1>
        <p class="text-gray-400 mt-2">请输入管理员账号和密码</p>
      </div>

      <form @submit.prevent="handleSubmit" class="space-y-6">
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">用户名</label>
          <div class="relative">
            <User class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              v-model="username"
              type="text"
              placeholder="请输入用户名"
              class="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            />
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">密码</label>
          <div class="relative">
            <Lock class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              v-model="password"
              type="password"
              placeholder="请输入密码"
              class="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            />
          </div>
        </div>

        <button
          type="submit"
          :disabled="isLoading"
          class="w-full py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all"
        >
          {{ isLoading ? '登录中...' : '登录' }}
        </button>
      </form>

      <p v-if="errorMessage" class="mt-4 text-center text-red-400 text-sm">{{ errorMessage }}</p>

      <div class="mt-6 text-center">
        <button @click="goBack" class="text-gray-400 hover:text-gray-300 text-sm">
          返回患者端
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Shield, User, Lock } from 'lucide-vue-next'
import { useAuthStore } from '../../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const username = ref('')
const password = ref('')
const isLoading = ref(false)
const errorMessage = ref('')

const handleSubmit = async () => {
  console.log('handleSubmit called')
  console.log('username:', username.value)
  console.log('password:', password.value)
  
  if (!username.value || !password.value) {
    errorMessage.value = '请填写完整信息'
    console.log('Validation failed: empty fields')
    return
  }
  
  isLoading.value = true
  errorMessage.value = ''
  
  console.log('Calling authStore.adminLogin...')
  const result = await authStore.adminLogin(username.value, password.value)
  console.log('adminLogin result:', result)
  
  if (result.success) {
    console.log('Login success, redirecting to dashboard...')
    router.push('/admin/dashboard')
  } else {
    errorMessage.value = result.message
    console.log('Login failed:', result.message)
  }
  
  isLoading.value = false
}

const goBack = () => {
  router.push('/')
}
</script>
