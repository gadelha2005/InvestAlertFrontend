import api from './axios'
import type { AtivoRequest, AtivoResponse, HistoricoAtivoResponse } from '@/types'

export const ativosApi = {
  listar: async (): Promise<AtivoResponse[]> => {
    const response = await api.get<AtivoResponse[]>('/ativos')
    return response.data
  },

  buscarPorTicker: async (ticker: string): Promise<AtivoResponse> => {
    const response = await api.get<AtivoResponse>(`/ativos/${ticker}`)
    return response.data
  },

  cadastrar: async (data: AtivoRequest): Promise<AtivoResponse> => {
    const response = await api.post<AtivoResponse>('/ativos', data)
    return response.data
  },

  buscarHistorico: async (ticker: string, periodo: string = '1m'): Promise<HistoricoAtivoResponse> => {
    const response = await api.get<HistoricoAtivoResponse>(`/ativos/${ticker}/historico`, {
      params: { periodo },
    })
    return response.data
  },
}