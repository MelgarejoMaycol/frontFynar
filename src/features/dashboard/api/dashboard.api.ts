import { httpClient } from '@/services/http'
import type { ApiSuccess } from '@/services/http/httpTypes'
import type { DashboardData, DashboardParams } from '../types/dashboard.types'
const path = (workspaceId: string, params: DashboardParams) => {
  const query = new URLSearchParams({ period: params.period })
  if (params.dateFrom) query.set('dateFrom', params.dateFrom)
  if (params.dateTo) query.set('dateTo', params.dateTo)
  if (params.recentLimit) query.set('recentLimit', String(params.recentLimit))
  return `/workspaces/${workspaceId}/dashboard?${query}`
}
export const dashboardApi = {
  get: (workspaceId: string, params: DashboardParams, signal?: AbortSignal) =>
    httpClient.get<ApiSuccess<DashboardData>>(
      path(workspaceId, params),
      signal,
    ),
}
