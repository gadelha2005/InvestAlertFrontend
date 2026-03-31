import axios from 'axios'
import { clearAuthStorage } from '@/store/authStore'
import type { ErrorResponse } from '@/types'

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const errorData: ErrorResponse = error.response?.data

    if (error.response?.status === 401 || error.response?.status === 403) {
      clearAuthStorage()
      window.location.href = '/login'
    }

    return Promise.reject(errorData ?? error)
  }
)

export default api
