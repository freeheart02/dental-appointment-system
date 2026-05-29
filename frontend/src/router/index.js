import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/patient/Home.vue')
  },
  {
    path: '/login',
    name: 'PatientLogin',
    component: () => import('../views/patient/Login.vue')
  },
  {
    path: '/appointment',
    name: 'Appointment',
    component: () => import('../views/patient/Appointment.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/my-appointments',
    name: 'MyAppointments',
    component: () => import('../views/patient/MyAppointments.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/admin/login',
    name: 'AdminLogin',
    component: () => import('../views/admin/Login.vue')
  },
  {
    path: '/admin/dashboard',
    name: 'Dashboard',
    component: () => import('../views/admin/Dashboard.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/patients',
    name: 'AdminPatients',
    component: () => import('../views/admin/Patients.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/doctors',
    name: 'AdminDoctors',
    component: () => import('../views/admin/Doctors.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/schedules',
    name: 'AdminSchedules',
    component: () => import('../views/admin/Schedules.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/appointments',
    name: 'AdminAppointments',
    component: () => import('../views/admin/Appointments.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/statistics',
    name: 'AdminStatistics',
    component: () => import('../views/admin/Statistics.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  authStore.initUser()
  
  console.log('Route:', to.path)
  console.log('Requires auth:', to.meta.requiresAuth)
  console.log('Requires admin:', to.meta.requiresAdmin)
  console.log('Token exists:', authStore.token ? 'yes' : 'no')
  console.log('User:', authStore.user)
  console.log('Is admin:', authStore.isAdmin())
  
  if (to.meta.requiresAuth) {
    if (!authStore.token) {
      console.log('Redirecting to /login')
      return next('/login')
    }
    if (to.meta.requiresAdmin && !authStore.isAdmin()) {
      console.log('Redirecting to / because not admin')
      return next('/')
    }
  }
  next()
})

export default router
