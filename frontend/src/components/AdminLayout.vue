<template>
  <div class="min-h-screen bg-gray-100 flex">
    <aside class="w-64 bg-gray-800 text-white min-h-screen">
      <div class="p-4 border-b border-gray-700">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-gradient-to-br from-blue-500 to-dental-500 rounded-full flex items-center justify-center">
            <Smile class="w-6 h-6 text-white" />
          </div>
          <span class="font-bold text-lg">管理后台</span>
        </div>
      </div>
      
      <nav class="p-4">
        <ul class="space-y-2">
          <li>
            <button
              @click="navigate('/admin/dashboard')"
              :class="[
                'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all',
                currentPath === '/admin/dashboard' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'
              ]"
            >
              <LayoutDashboard class="w-5 h-5" />
              <span>控制台</span>
            </button>
          </li>
          <li>
            <button
              @click="navigate('/admin/patients')"
              :class="[
                'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all',
                currentPath === '/admin/patients' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'
              ]"
            >
              <Users class="w-5 h-5" />
              <span>患者管理</span>
            </button>
          </li>
          <li>
            <button
              @click="navigate('/admin/doctors')"
              :class="[
                'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all',
                currentPath === '/admin/doctors' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'
              ]"
            >
              <User class="w-5 h-5" />
              <span>医生管理</span>
            </button>
          </li>
          <li>
            <button
              @click="navigate('/admin/schedules')"
              :class="[
                'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all',
                currentPath === '/admin/schedules' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'
              ]"
            >
              <Calendar class="w-5 h-5" />
              <span>排班管理</span>
            </button>
          </li>
          <li>
            <button
              @click="navigate('/admin/appointments')"
              :class="[
                'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all',
                currentPath === '/admin/appointments' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'
              ]"
            >
              <Clock class="w-5 h-5" />
              <span>预约管理</span>
            </button>
          </li>
          <li>
            <button
              @click="navigate('/admin/queue')"
              :class="[
                'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all',
                currentPath === '/admin/queue' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'
              ]"
            >
              <Megaphone class="w-5 h-5" />
              <span>叫号管理</span>
            </button>
          </li>
          <li>
            <button
              @click="navigate('/admin/statistics')"
              :class="[
                'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all',
                currentPath === '/admin/statistics' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'
              ]"
            >
              <BarChart class="w-5 h-5" />
              <span>统计报表</span>
            </button>
          </li>
        </ul>
      </nav>
    </aside>

    <main class="flex-1">
      <header class="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
        <h1 class="text-xl font-bold text-gray-800">{{ title }}</h1>
        <div class="flex items-center gap-4">
          <span class="text-gray-600">{{ user?.username || 'admin' }}</span>
          <button @click="logout" class="text-red-500 hover:text-red-600 flex items-center gap-2">
            <LogOut class="w-4 h-4" />
            <span>退出</span>
          </button>
        </div>
      </header>
      
      <div class="p-6">
        <slot></slot>
      </div>
    </main>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Smile, LayoutDashboard, Users, User, Calendar, Clock, Megaphone, BarChart, LogOut } from 'lucide-vue-next'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

defineProps({
  title: {
    type: String,
    default: ''
  }
})

const user = computed(() => authStore.user)
const currentPath = computed(() => route.path)

const navigate = (path) => {
  router.push(path)
}

const logout = () => {
  authStore.logout()
  router.push('/')
}
</script>
