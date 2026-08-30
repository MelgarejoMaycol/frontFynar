import { httpClient } from '@/services/http'
import type { ApiSuccess } from '@/services/http/httpTypes'

export type InformalDirection = 'PAYABLE' | 'RECEIVABLE'
export type InformalStatus = 'OPEN' | 'PARTIAL' | 'SETTLED' | 'CANCELLED'

export interface InformalBalance {
  id: string
  direction: InformalDirection
  counterpartyName: string
  description: string
  originalAmount: string
  currentBalance: string
  paidAmount: string
  currency: string
  occurredOn: string
  dueOn: string | null
  status: InformalStatus
  notes: string | null
  createdAt: string
  updatedAt: string
}

export interface InformalSummary {
  currency: string
  totalPayable: string
  totalReceivable: string
  net: string
  overdueCount: number
}

export interface CreateInformalBalanceInput {
  direction: InformalDirection
  counterpartyName: string
  description: string
  amount: string
  currency: string
  occurredOn: string
  dueOn?: string | null
  notes?: string | null
}

export interface InformalPaymentInput {
  amount: string
  paidAt: string
  accountId?: string | null
  notes?: string | null
  idempotencyKey: string
}

const base = (workspaceId: string) =>
  `/workspaces/${workspaceId}/informal-balances`

export const informalBalancesApi = {
  list: (
    workspaceId: string,
    filters: { direction?: InformalDirection; search?: string },
    signal?: AbortSignal,
  ) => {
    const query = new URLSearchParams()
    if (filters.direction) query.set('direction', filters.direction)
    if (filters.search) query.set('search', filters.search)
    const suffix = query.size ? `?${query.toString()}` : ''
    return httpClient.get<ApiSuccess<InformalBalance[]>>(
      `${base(workspaceId)}${suffix}`,
      signal,
    )
  },
  summary: (workspaceId: string, signal?: AbortSignal) =>
    httpClient.get<ApiSuccess<InformalSummary[]>>(
      `${base(workspaceId)}/summary`,
      signal,
    ),
  create: (workspaceId: string, input: CreateInformalBalanceInput) =>
    httpClient.post<ApiSuccess<InformalBalance>, CreateInformalBalanceInput>(
      base(workspaceId),
      input,
    ),
  pay: (workspaceId: string, id: string, input: InformalPaymentInput) =>
    httpClient.post<ApiSuccess<unknown>, InformalPaymentInput>(
      `${base(workspaceId)}/${id}/payments`,
      input,
    ),
  archive: (workspaceId: string, id: string) =>
    httpClient.delete<ApiSuccess<{ mode: 'LOGICAL' }>>(
      `${base(workspaceId)}/${id}`,
    ),
}
