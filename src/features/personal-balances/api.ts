import { httpClient } from '@/services/http'
import type { ApiSuccess } from '@/services/http/httpTypes'
import type {
  CreatePersonalBalanceInput,
  PersonalBalance,
  PersonalBalanceEntryInput,
  PersonalBalanceSummary,
  UpdatePersonalBalanceInput,
} from './types'

const base = (workspaceId: string) =>
  `/workspaces/${workspaceId}/personal-balances`

export const personalBalancesApi = {
  list: (
    workspaceId: string,
    filters: { direction?: string; status?: string; q?: string },
    signal?: AbortSignal,
  ) => {
    const params = new URLSearchParams()
    if (filters.direction) params.set('direction', filters.direction)
    if (filters.status) params.set('status', filters.status)
    if (filters.q) params.set('q', filters.q)
    const query = params.toString()
    return httpClient.get<ApiSuccess<PersonalBalance[]>>(
      `${base(workspaceId)}${query ? `?${query}` : ''}`,
      signal,
    )
  },
  summary: (workspaceId: string, signal?: AbortSignal) =>
    httpClient.get<ApiSuccess<PersonalBalanceSummary>>(
      `${base(workspaceId)}/summary`,
      signal,
    ),
  get: (workspaceId: string, id: string, signal?: AbortSignal) =>
    httpClient.get<ApiSuccess<PersonalBalance>>(
      `${base(workspaceId)}/${id}`,
      signal,
    ),
  create: (workspaceId: string, input: CreatePersonalBalanceInput) =>
    httpClient.post<ApiSuccess<PersonalBalance>, CreatePersonalBalanceInput>(
      base(workspaceId),
      input,
    ),
  update: (
    workspaceId: string,
    id: string,
    input: UpdatePersonalBalanceInput,
  ) =>
    httpClient.patch<ApiSuccess<PersonalBalance>, UpdatePersonalBalanceInput>(
      `${base(workspaceId)}/${id}`,
      input,
    ),
  addEntry: (
    workspaceId: string,
    id: string,
    input: PersonalBalanceEntryInput,
  ) =>
    httpClient.post<ApiSuccess<PersonalBalance>, PersonalBalanceEntryInput>(
      `${base(workspaceId)}/${id}/entries`,
      input,
    ),
  settle: (workspaceId: string, id: string) =>
    httpClient.post<ApiSuccess<PersonalBalance>, Record<string, never>>(
      `${base(workspaceId)}/${id}/settle`,
      {},
    ),
  archive: (workspaceId: string, id: string) =>
    httpClient.delete<ApiSuccess<{ id: string }>>(`${base(workspaceId)}/${id}`),
}
