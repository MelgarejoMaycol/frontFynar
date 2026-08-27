import { httpClient } from '@/services/http'
import type { ApiSuccess } from '@/services/http/httpTypes'
import type {
  Budget,
  BudgetFilters,
  BudgetInput,
  BudgetList,
  UpdateBudgetInput,
} from '../types/budget.types'
const base = (w: string) => `/workspaces/${w}/budgets`
const query = (filters: BudgetFilters) => {
  const q = new URLSearchParams()
  for (const [k, v] of Object.entries(filters))
    if (v !== undefined && v !== '') q.set(k, String(v))
  const text = q.toString()
  return text ? `?${text}` : ''
}
export const budgetsApi = {
  cycleRange: (w: string, signal?: AbortSignal) =>
    httpClient.get<ApiSuccess<{ startsOn: string; endsOn: string; financialCycleStartDay: number }>>(`${base(w)}/cycle-range`, signal),
  list: (w: string, filters: BudgetFilters, signal?: AbortSignal) =>
    httpClient.get<ApiSuccess<BudgetList>>(
      `${base(w)}${query(filters)}`,
      signal,
    ),
  get: (w: string, id: string, signal?: AbortSignal) =>
    httpClient.get<ApiSuccess<Budget>>(`${base(w)}/${id}`, signal),
  create: (w: string, input: BudgetInput) =>
    httpClient.post<ApiSuccess<Budget>, BudgetInput>(base(w), input),
  update: (w: string, id: string, input: UpdateBudgetInput) =>
    httpClient.patch<ApiSuccess<Budget>, UpdateBudgetInput>(
      `${base(w)}/${id}`,
      input,
    ),
  archive: (w: string, id: string) =>
    httpClient.delete<void>(`${base(w)}/${id}`),
  restore: (w: string, id: string) =>
    httpClient.post<ApiSuccess<Budget>, undefined>(
      `${base(w)}/${id}/restore`,
      undefined,
    ),
}
