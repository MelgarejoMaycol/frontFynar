import { httpClient } from '@/services/http'
import type { ApiSuccess } from '@/services/http/httpTypes'
import type { CreateLoanInput, LendingStatus, LendingSummary, LoanDetail, LoanListItem, LoanPaymentInput, SimulationInput, SimulationResult } from './types'
const base = (workspaceId: string) => `/workspaces/${workspaceId}/lending`
export const lendingApi = {
  summary: (workspaceId: string, signal?: AbortSignal) => httpClient.get<ApiSuccess<LendingSummary>>(`${base(workspaceId)}/summary`, signal),
  list: (workspaceId: string, filters: { q?: string; status?: LendingStatus | 'ALL' }, signal?: AbortSignal) => { const query = new URLSearchParams(); if (filters.q) query.set('q', filters.q); if (filters.status) query.set('status', filters.status); return httpClient.get<ApiSuccess<LoanListItem[]>>(`${base(workspaceId)}/loans?${query}`, signal) },
  get: (workspaceId: string, id: string, signal?: AbortSignal) => httpClient.get<ApiSuccess<LoanDetail>>(`${base(workspaceId)}/loans/${id}`, signal),
  simulate: (workspaceId: string, input: SimulationInput) => httpClient.post<ApiSuccess<SimulationResult>, SimulationInput>(`${base(workspaceId)}/simulate`, input),
  create: (workspaceId: string, input: CreateLoanInput) => httpClient.post<ApiSuccess<LoanDetail>, CreateLoanInput>(`${base(workspaceId)}/loans`, input),
  pay: (workspaceId: string, loanId: string, installmentId: string, input: LoanPaymentInput) => httpClient.post<ApiSuccess<LoanDetail>, LoanPaymentInput>(`${base(workspaceId)}/loans/${loanId}/installments/${installmentId}/payments`, input),
  reverse: (workspaceId: string, loanId: string, paymentId: string, reason: string) => httpClient.post<ApiSuccess<LoanDetail>, { reason: string }>(`${base(workspaceId)}/loans/${loanId}/payments/${paymentId}/reverse`, { reason }),
  archive: (workspaceId: string, loanId: string) => httpClient.delete<ApiSuccess<{ id: string; archived: boolean }>>(`${base(workspaceId)}/loans/${loanId}`),
}
