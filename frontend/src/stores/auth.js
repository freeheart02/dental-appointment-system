import { defineStore } from 'pinia'
import { ref } from 'vue'
import { authAPI } from '../utils/api'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const token = ref(localStorage.getItem('token') || '')

  const login = async (phone, code, name) => {
    try {
      const response = await authAPI.verifyCode({ phone, code, name })
      if (response.data.success) {
        token.value = response.data.token
        user.value = response.data.user
        localStorage.setItem('token', token.value)
        localStorage.setItem('user', JSON.stringify(user.value))
        return { success: true }
      }
      return { success: false, message: response.data.message }
    } catch (error) {
      return { success: false, message: '登录失败' }
    }
  }

  const adminLogin = async (username, password) => {
    try {
      console.log('Admin login request:', { username, password })
      const response = await authAPI.adminLogin({ username, password })
      console.log('Admin login response:', response.data)
      if (response.data.success) {
        console.log('Setting token and user...')
        token.value = response.data.token
        user.value = response.data.user
        console.log('Token set:', token.value ? 'yes' : 'no')
        console.log('User set:', user.value ? 'yes' : 'no')
        
        console.log('Saving to localStorage...')
        localStorage.setItem('token', token.value)
        localStorage.setItem('user', JSON.stringify(user.value))
        console.log('localStorage saved successfully')
        
        console.log('Returning success...')
        return { success: true }
      }
      console.log('Returning failure:', response.data.message)
      return { success: false, message: response.data.message }
    } catch (error) {
      console.error('Admin login error:', error)
      return { success: false, message: '登录失败' }
    }
  }

  const sendCode = async (phone) => {
    try {
      const response = await authAPI.sendCode(phone)
      return response.data
    } catch (error) {
      return { success: false, message: '发送失败' }
    }
  }

  const logout = () => {
    token.value = ''
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  const isAdmin = () => {
    return user.value?.role === 'admin'
  }

  const initUser = () => {
    const stored = localStorage.getItem('user')
    if (stored) {
      user.value = JSON.parse(stored)
    }
  }

  return {
    user,
    token,
    login,
    adminLogin,
    sendCode,
    logout,
    isAdmin,
    initUser
  }
})
