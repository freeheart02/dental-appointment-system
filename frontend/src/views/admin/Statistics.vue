<template>
  <AdminLayout title="统计报表">
    <div class="grid grid-cols-2 gap-6 mb-8">
      <div class="bg-white rounded-xl p-6 shadow-md">
        <h3 class="text-lg font-semibold text-gray-800 mb-4">爽约率统计</h3>
        <div class="flex items-center justify-center">
          <div class="relative w-40 h-40">
            <svg class="w-full h-full transform -rotate-90">
              <circle
                cx="80"
                cy="80"
                r="70"
                fill="none"
                stroke="#e5e7eb"
                stroke-width="12"
              />
              <circle
                cx="80"
                cy="80"
                r="70"
                fill="none"
                stroke="#ef4444"
                stroke-width="12"
                stroke-linecap="round"
                :stroke-dasharray="`${noShowRate * 4.4} 440`"
              />
            </svg>
            <div class="absolute inset-0 flex items-center justify-center">
              <div class="text-center">
                <p class="text-3xl font-bold text-red-500">{{ noShowRate }}%</p>
                <p class="text-sm text-gray-500">爽约率</p>
              </div>
            </div>
          </div>
        </div>
        <div class="mt-4 grid grid-cols-2 gap-4 text-center">
          <div>
            <p class="text-2xl font-bold text-gray-800">{{ noShowStats.noShow }}</p>
            <p class="text-sm text-gray-500">爽约人数</p>
          </div>
          <div>
            <p class="text-2xl font-bold text-gray-800">{{ noShowStats.total }}</p>
            <p class="text-sm text-gray-500">就诊总人数</p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl p-6 shadow-md">
        <h3 class="text-lg font-semibold text-gray-800 mb-4">医生工作量统计</h3>
        <div class="space-y-4">
          <div v-for="(item, index) in workloadData" :key="index" class="flex items-center gap-4">
            <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
              {{ index + 1 }}
            </div>
            <div class="flex-1">
              <div class="flex justify-between mb-1">
                <span class="text-sm font-medium text-gray-700">{{ item.doctorName }}</span>
                <span class="text-sm text-gray-500">{{ item.count }}次</span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-3">
                <div
                  class="bg-gradient-to-r from-blue-500 to-dental-500 h-3 rounded-full"
                  :style="{ width: `${(item.count / maxWorkload) * 100}%` }"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-xl p-6 shadow-md">
      <h3 class="text-lg font-semibold text-gray-800 mb-4">预约趋势图</h3>
      <div class="flex gap-2 mb-4">
        <button
          v-for="period in periods"
          :key="period.value"
          @click="selectedPeriod = period.value"
          :class="[
            'px-4 py-2 rounded-lg text-sm font-medium transition-all',
            selectedPeriod === period.value
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          ]"
        >
          {{ period.label }}
        </button>
      </div>
      <div class="h-80 flex items-end gap-2">
        <div
          v-for="(item, index) in trendData"
          :key="index"
          class="flex-1 flex flex-col items-center gap-1"
        >
          <div
            class="w-full bg-gradient-to-t from-blue-500 to-blue-300 rounded-t hover:from-blue-600 hover:to-blue-400 transition-colors cursor-pointer"
            :style="{ height: `${(item.count / maxCount) * 100}%` }"
            :title="`${item.date}: ${item.count}次`"
          ></div>
          <span class="text-xs text-gray-500" :class="index % 3 !== 0 ? 'hidden' : ''">{{ formatChartDate(item.date) }}</span>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import AdminLayout from '../../components/AdminLayout.vue'
import { statisticsAPI } from '../../utils/api'

const noShowStats = ref({ total: 0, noShow: 0, rate: 0 })
const trendData = ref([])
const workloadData = ref([])
const selectedPeriod = ref('month')

const periods = [
  { value: 'week', label: '近7天' },
  { value: 'month', label: '近30天' },
  { value: 'year', label: '近一年' }
]

const noShowRate = computed(() => noShowStats.value.rate)

const maxCount = computed(() => {
  return Math.max(...trendData.value.map(t => t.count), 1)
})

const maxWorkload = computed(() => {
  return Math.max(...workloadData.value.map(w => w.count), 1)
})

const formatChartDate = (dateStr) => {
  const date = new Date(dateStr)
  return `${date.getMonth() + 1}/${date.getDate()}`
}

const loadNoShowRate = async () => {
  try {
    const response = await statisticsAPI.getNoShowRate()
    noShowStats.value = response.data
  } catch (error) {
    console.error('Failed to load no show rate')
  }
}

const loadTrend = async () => {
  try {
    const response = await statisticsAPI.getAppointmentTrend({ period: selectedPeriod.value })
    trendData.value = response.data
  } catch (error) {
    console.error('Failed to load trend data')
  }
}

const loadWorkload = async () => {
  try {
    const response = await statisticsAPI.getDoctorWorkload()
    workloadData.value = response.data.sort((a, b) => b.count - a.count)
  } catch (error) {
    console.error('Failed to load workload data')
  }
}

watch(selectedPeriod, () => {
  loadTrend()
})

onMounted(() => {
  loadNoShowRate()
  loadTrend()
  loadWorkload()
})
</script>
