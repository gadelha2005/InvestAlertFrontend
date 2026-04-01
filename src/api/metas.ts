import api from './axios'
import type {
  MetaMovimentacaoRequest,
  MetaMovimentacaoResponse,
  MetaRequest,
  MetaResponse,
} from '@/types'

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

  listarMovimentacoes: async (id: number): Promise<MetaMovimentacaoResponse[]> => {
    const response = await api.get<MetaMovimentacaoResponse[]>(`/metas/${id}/movimentacoes`)
    return response.data
  },

  criarMovimentacao: async (
    id: number,
    data: MetaMovimentacaoRequest
  ): Promise<MetaMovimentacaoResponse> => {
    const response = await api.post<MetaMovimentacaoResponse>(
      `/metas/${id}/movimentacoes`,
      data
    )
    return response.data
  },

  deletarMovimentacao: async (metaId: number, movimentacaoId: number): Promise<void> => {
    await api.delete(`/metas/${metaId}/movimentacoes/${movimentacaoId}`)
  },
}
