import { httpClient } from '@/services/http'
import type { ApiSuccess } from '@/services/http/httpTypes'
import type { FinancialHealthHistory, FinancialHealthResult } from './types'

const base = (workspaceId: string) => `/workspaces/${workspaceId}/financial-health`

export const financialHealthApi = {
  current: (workspaceId: string, signal?: AbortSignal) =>
    httpClient.get<ApiSuccess<FinancialHealthResult>>(base(workspaceId), signal),
  history: (workspaceId: string, limit = 12, signal?: AbortSignal) =>
    httpClient.get<ApiSuccess<FinancialHealthHistory>>(
      `${base(workspaceId)}/history?limit=${limit}`,
      signal,
    ),
}
