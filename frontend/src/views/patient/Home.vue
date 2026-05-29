<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-dental-100">
    <header class="bg-white shadow-sm">
      <div class="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-gradient-to-br from-blue-500 to-dental-500 rounded-full flex items-center justify-center">
            <Smile class="w-6 h-6 text-white" />
          </div>
          <span class="text-xl font-bold text-gray-800">口腔诊所预约系统</span>
        </div>
        <div class="flex items-center gap-4">
          <button v-if="!isLoggedIn" @click="goToLogin" class="px-4 py-2 text-blue-600 hover:text-blue-700 font-medium">
            登录
          </button>
          <button v-else class="px-4 py-2 text-gray-600 hover:text-gray-700 font-medium">
            {{ user?.name || '用户' }}
          </button>
          <button v-if="isLoggedIn" @click="logout" class="px-4 py-2 text-red-500 hover:text-red-600 font-medium">
            退出
          </button>
          <button @click="goToAdmin" class="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 font-medium">
            管理后台
          </button>
        </div>
      </div>
    </header>

    <main class="max-w-6xl mx-auto px-4 py-12">
      <div class="text-center mb-12">
        <h1 class="text-4xl font-bold text-gray-800 mb-4">欢迎来到口腔诊所</h1>
        <p class="text-gray-600 text-lg">专业的口腔护理服务，为您的健康保驾护航</p>
      </div>

      <div class="grid md:grid-cols-3 gap-6 mb-12">
        <div class="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
          <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Calendar class="w-6 h-6 text-blue-600" />
          </div>
          <h3 class="text-lg font-semibold text-gray-800 mb-2">在线预约</h3>
          <p class="text-gray-600">便捷的预约系统，随时随地预约就诊时间</p>
        </div>
        <div class="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
          <div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <Heart class="w-6 h-6 text-green-600" />
          </div>
          <h3 class="text-lg font-semibold text-gray-800 mb-2">专业医生</h3>
          <p class="text-gray-600">经验丰富的口腔专家团队，为您提供优质服务</p>
        </div>
        <div class="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
          <div class="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
            <Clock class="w-6 h-6 text-purple-600" />
          </div>
          <h3 class="text-lg font-semibold text-gray-800 mb-2">准时服务</h3>
          <p class="text-gray-600">严格遵守预约时间，减少您的等待时间</p>
        </div>
      </div>

      <div class="bg-white rounded-xl p-8 shadow-md text-center">
        <h2 class="text-2xl font-bold text-gray-800 mb-4">立即预约就诊</h2>
        <p class="text-gray-600 mb-6">只需简单几步，即可完成预约登记</p>
        <button 
          @click="goToAppointment"
          class="px-8 py-3 bg-gradient-to-r from-blue-500 to-dental-500 text-white rounded-full font-semibold text-lg hover:from-blue-600 hover:to-dental-600 transition-all shadow-lg hover:shadow-xl"
        >
          开始预约
        </button>
      </div>

      <div class="mt-12 grid md:grid-cols-2 gap-6">
        <div class="bg-white rounded-xl p-6 shadow-md">
          <h3 class="text-lg font-semibold text-gray-800 mb-4">就诊须知</h3>
          <ul class="space-y-3 text-gray-600">
            <li class="flex items-start gap-2">
              <CheckCircle class="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
              <span>请提前10分钟到达诊所</span>
            </li>
            <li class="flex items-start gap-2">
              <CheckCircle class="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
              <span>携带身份证和医保卡</span>
            </li>
            <li class="flex items-start gap-2">
              <CheckCircle class="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
              <span>如有特殊情况请提前取消预约</span>
            </li>
          </ul>
        </div>
        <div class="bg-white rounded-xl p-6 shadow-md">
          <h3 class="text-lg font-semibold text-gray-800 mb-4">联系方式</h3>
          <ul class="space-y-3 text-gray-600">
            <li class="flex items-center gap-2">
              <Phone class="w-5 h-5 text-blue-500" />
              <span>咨询电话：400-888-8888</span>
            </li>
            <li class="flex items-center gap-2">
              <MapPin class="w-5 h-5 text-red-500" />
              <span>诊所地址：北京市朝阳区口腔路123号</span>
            </li>
            <li class="flex items-center gap-2">
              <Clock class="w-5 h-5 text-green-500" />
              <span>营业时间：周一至周日 9:00-18:00</span>
            </li>
          </ul>
        </div>
      </div>
    </main>

    <footer class="bg-gray-800 text-white py-8 mt-12">
      <div class="max-w-6xl mx-auto px-4 text-center">
        <p class="text-gray-400">口腔诊所患者预约登记系统 © 2024</p>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Smile, Calendar, Heart, Clock, CheckCircle, Phone, MapPin } from 'lucide-vue-next'
import { useAuthStore } from '../../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const isLoggedIn = computed(() => !!authStore.token)
const user = computed(() => authStore.user)

const goToLogin = () => {
  router.push('/login')
}

const goToAppointment = () => {
  if (!isLoggedIn.value) {
    router.push('/login')
  } else {
    router.push('/appointment')
  }
}

const goToAdmin = () => {
  router.push('/admin/login')
}

const logout = () => {
  authStore.logout()
}

onMounted(() => {
  authStore.initUser()
})
</script>
