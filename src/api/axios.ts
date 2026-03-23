import axios from 'axios'
import type { ErrorResponse } from '@/types'

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Interceptor de request — adiciona o token JWT em toda requisição
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Interceptor de response — trata erros globalmente
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const errorData: ErrorResponse = error.response?.data

    // Token expirado ou inválido — redireciona para login
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('usuario')
      window.location.href = '/login'
    }

    return Promise.reject(errorData ?? error)
  }
)

export default api