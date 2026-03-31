import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { LoginResponse } from '@/types'

export const AUTH_STORAGE_KEY = 'investalert-auth'

export const clearAuthStorage = () => {
  localStorage.removeItem('token')
  localStorage.removeItem(AUTH_STORAGE_KEY)
}

interface AuthState {
  token: string | null
  usuario: Omit<LoginResponse, 'token' | 'tipo'> | null
  isAuthenticated: boolean
  login: (data: LoginResponse) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      usuario: null,
      isAuthenticated: false,

      login: (data: LoginResponse) => {
        localStorage.setItem('token', data.token)
        set({
          token: data.token,
          usuario: {
            usuarioId: data.usuarioId,
            nome: data.nome,
            email: data.email,
          },
          isAuthenticated: true,
        })
      },

      logout: () => {
        clearAuthStorage()
        set({
          token: null,
          usuario: null,
          isAuthenticated: false,
        })
      },
    }),
    {
      name: AUTH_STORAGE_KEY,
    }
  )
)
