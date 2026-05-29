<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-dental-100 flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
      <div class="text-center mb-8">
        <div class="w-16 h-16 bg-gradient-to-br from-blue-500 to-dental-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <Smile class="w-8 h-8 text-white" />
        </div>
        <h1 class="text-2xl font-bold text-gray-800">患者预约登录</h1>
        <p class="text-gray-500 mt-2">请使用手机号进行实名认证</p>
      </div>

      <form @submit.prevent="handleSubmit" class="space-y-6">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">手机号码</label>
          <div class="relative">
            <Phone class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              v-model="phone"
              type="tel"
              placeholder="请输入手机号码"
              class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              maxlength="11"
            />
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">姓名</label>
          <div class="relative">
            <User class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              v-model="name"
              type="text"
              placeholder="请输入您的姓名"
              class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            />
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">验证码</label>
          <div class="relative">
            <Lock class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              v-model="code"
              type="text"
              placeholder="请输入验证码"
              class="w-full pl-10 pr-32 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              maxlength="6"
            />
            <button
              type="button"
              @click="sendCode"
              :disabled="countdown > 0"
              class="absolute right-2 top-1/2 transform -translate-y-1/2 px-4 py-1.5 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all"
            >
              {{ countdown > 0 ? `${countdown}s` : '获取验证码' }}
            </button>
          </div>
        </div>

        <button
          type="submit"
          :disabled="isLoading"
          class="w-full py-3 bg-gradient-to-r from-blue-500 to-dental-500 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-dental-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {{ isLoading ? '登录中...' : '登录' }}
        </button>
      </form>

      <p v-if="errorMessage" class="mt-4 text-center text-red-500 text-sm">{{ errorMessage }}</p>

      <div class="mt-6 text-center">
        <span class="text-gray-500 text-sm">诊所管理员？</span>
        <button @click="goToAdmin" class="ml-2 text-blue-500 hover:text-blue-600 text-sm">
          点击登录管理后台
        </button>
      </div>

      <div class="mt-6 text-center">
        <button @click="goBack" class="text-gray-500 hover:text-gray-600 text-sm">
          返回首页
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Smile, Phone, User, Lock } from 'lucide-vue-next'
import { useAuthStore } from '../../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const phone = ref('')
const name = ref('')
const code = ref('')
const countdown = ref(0)
const isLoading = ref(false)
const errorMessage = ref('')

const sendCode = async () => {
  if (!phone.value || !/^1[3-9]\d{9}$/.test(phone.value)) {
    errorMessage.value = '请输入正确的手机号码'
    return
  }
  
  errorMessage.value = ''
  const result = await authStore.sendCode(phone.value)
  
  if (result.success) {
    countdown.value = 60
    const timer = setInterval(() => {
      countdown.value--
      if (countdown.value <= 0) {
        clearInterval(timer)
      }
    }, 1000)
  } else {
    errorMessage.value = result.message
  }
}

const handleSubmit = async () => {
  if (!phone.value || !name.value || !code.value) {
    errorMessage.value = '请填写完整信息'
    return
  }
  
  if (!/^1[3-9]\d{9}$/.test(phone.value)) {
    errorMessage.value = '请输入正确的手机号码'
    return
  }
  
  isLoading.value = true
  errorMessage.value = ''
  
  const result = await authStore.login(phone.value, code.value, name.value)
  
  if (result.success) {
    router.push('/appointment')
  } else {
    errorMessage.value = result.message
  }
  
  isLoading.value = false
}

const goToAdmin = () => {
  router.push('/admin/login')
}

const goBack = () => {
  router.push('/')
}
</script>
