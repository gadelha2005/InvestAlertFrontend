import api from './axios'
import type { NotificacaoResponse } from '@/types'

export const notificacoesApi = {
  listar: async (): Promise<NotificacaoResponse[]> => {
    const response = await api.get<NotificacaoResponse[]>('/notificacoes')
    return response.data
  },

  listarNaoLidas: async (): Promise<NotificacaoResponse[]> => {
    const response = await api.get<NotificacaoResponse[]>('/notificacoes/nao-lidas')
    return response.data
  },

  contarNaoLidas: async (): Promise<number> => {
    const response = await api.get<number>('/notificacoes/nao-lidas/count')
    return response.data
  },

  marcarComoLida: async (id: number): Promise<NotificacaoResponse> => {
    const response = await api.patch<NotificacaoResponse>(`/notificacoes/${id}/lida`)
    return response.data
  },

  marcarTodasComoLidas: async (): Promise<void> => {
    await api.patch('/notificacoes/lidas')
  },

  deletarTodas: async (): Promise<void> => {
    await api.delete('/notificacoes')
  },
}
