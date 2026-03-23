import api from './axios'
import type { AlertaRequest, AlertaResponse } from '@/types'

export const alertasApi = {
  listar: async (): Promise<AlertaResponse[]> => {
    const response = await api.get<AlertaResponse[]>('/alertas')
    return response.data
  },

  criar: async (data: AlertaRequest): Promise<AlertaResponse> => {
    const response = await api.post<AlertaResponse>('/alertas', data)
    return response.data
  },

  deletar: async (id: number): Promise<void> => {
    await api.delete(`/alertas/${id}`)
  },

  alterarStatus: async (id: number, ativado: boolean): Promise<AlertaResponse> => {
    const response = await api.patch<AlertaResponse>(
      `/alertas/${id}/status?ativado=${ativado}`
    )
    return response.data
  },
}