import api from './axios'
import type { DashboardResponse } from '@/types'

export const dashboardApi = {
  get: async (): Promise<DashboardResponse> => {
    const response = await api.get<DashboardResponse>('/dashboard')
    return response.data
  },
}