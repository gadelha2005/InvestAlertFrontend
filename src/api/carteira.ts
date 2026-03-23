import api from './axios'
import type {
  CarteiraRequest,
  CarteiraResponse,
  CarteiraAtivoRequest,
  CarteiraAtivoResponse,
} from '@/types'

export const carteiraApi = {
  listar: async (): Promise<CarteiraResponse[]> => {
    const response = await api.get<CarteiraResponse[]>('/carteiras')
    return response.data
  },

  buscarPorId: async (id: number): Promise<CarteiraResponse> => {
    const response = await api.get<CarteiraResponse>(`/carteiras/${id}`)
    return response.data
  },

  criar: async (data: CarteiraRequest): Promise<CarteiraResponse> => {
    const response = await api.post<CarteiraResponse>('/carteiras', data)
    return response.data
  },

  adicionarAtivo: async (
    carteiraId: number,
    data: CarteiraAtivoRequest
  ): Promise<CarteiraAtivoResponse> => {
    const response = await api.post<CarteiraAtivoResponse>(
      `/carteiras/${carteiraId}/ativos`,
      data
    )
    return response.data
  },

  removerAtivo: async (carteiraId: number, carteiraAtivoId: number): Promise<void> => {
    await api.delete(`/carteiras/${carteiraId}/ativos/${carteiraAtivoId}`)
  },
}