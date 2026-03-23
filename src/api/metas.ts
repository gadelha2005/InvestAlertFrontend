import api from './axios'
import type { MetaRequest, MetaResponse } from '@/types'

export const metasApi = {
  listar: async (): Promise<MetaResponse[]> => {
    const response = await api.get<MetaResponse[]>('/metas')
    return response.data
  },

  criar: async (data: MetaRequest): Promise<MetaResponse> => {
    const response = await api.post<MetaResponse>('/metas', data)
    return response.data
  },

  atualizar: async (id: number, data: MetaRequest): Promise<MetaResponse> => {
    const response = await api.put<MetaResponse>(`/metas/${id}`, data)
    return response.data
  },

  deletar: async (id: number): Promise<void> => {
    await api.delete(`/metas/${id}`)
  },
}