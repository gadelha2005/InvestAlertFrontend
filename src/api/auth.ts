import api from './axios'
import type { LoginRequest, LoginResponse, UsuarioRequest, UsuarioResponse } from '@/types'

export const authApi = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/auth/login', data)
    return response.data
  },

  cadastrar: async (data: UsuarioRequest): Promise<UsuarioResponse> => {
    const response = await api.post<UsuarioResponse>('/usuarios', data)
    return response.data
  },

  me: async (): Promise<UsuarioResponse> => {
    const response = await api.get<UsuarioResponse>('/usuarios/me')
    return response.data
  },
}