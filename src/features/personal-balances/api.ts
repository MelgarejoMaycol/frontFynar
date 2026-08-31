import { httpClient } from '@/services/http'
import type { ApiSuccess } from '@/services/http/httpTypes'
import type {
  CreatePersonalBalanceInput,
  PersonalBalance,
  PersonalBalanceEntryInput,
  PersonalBalanceSummary,
  UpdatePersonalBalanceInput,
  FinancialPerson,
  PersonInput,
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
  settle: (workspaceId: string, id: string, accountId: string) =>
    httpClient.post<ApiSuccess<PersonalBalance>, { accountId: string }>(
      `${base(workspaceId)}/${id}/settle`,
      { accountId },
    ),
  archive: (workspaceId: string, id: string) =>
    httpClient.delete<ApiSuccess<{ id: string }>>(`${base(workspaceId)}/${id}`),
  reverseEntry: (workspaceId: string, id: string, entryId: string) =>
    httpClient.post<ApiSuccess<PersonalBalance>, Record<string, never>>(
      `${base(workspaceId)}/${id}/entries/${entryId}/reverse`, {},
    ),
  people: (workspaceId: string, q = '', signal?: AbortSignal) =>
    httpClient.get<ApiSuccess<FinancialPerson[]>>(
      `${base(workspaceId)}/people${q ? `?q=${encodeURIComponent(q)}` : ''}`, signal,
    ),
  createPerson: (workspaceId: string, input: PersonInput) =>
    httpClient.post<ApiSuccess<FinancialPerson>, PersonInput>(`${base(workspaceId)}/people`, input),
  updatePerson: (workspaceId: string, id: string, input: Partial<PersonInput>) =>
    httpClient.patch<ApiSuccess<FinancialPerson>, Partial<PersonInput>>(`${base(workspaceId)}/people/${id}`, input),
  archivePerson: (workspaceId: string, id: string) =>
    httpClient.delete<ApiSuccess<{ id: string }>>(`${base(workspaceId)}/people/${id}`),
}
