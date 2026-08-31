import { httpClient } from '@/services/http'
import type { ApiSuccess } from '@/services/http/httpTypes'
import type {
  CreateLoanInput,
  LendingSummary,
  LoanDetail,
  LoanListItem,
  LoanPaymentInput,
  SimulationInput,
  SimulationResult,
} from './types'

const base = (workspaceId: string) => `/workspaces/${workspaceId}/lending`

export const lendingApi = {
  summary: (workspaceId: string, signal?: AbortSignal) =>
    httpClient.get<ApiSuccess<LendingSummary>>(`${base(workspaceId)}/summary`, signal),
  list: (workspaceId: string, q = '', signal?: AbortSignal) =>
    httpClient.get<ApiSuccess<LoanListItem[]>>(
      `${base(workspaceId)}/loans${q ? `?q=${encodeURIComponent(q)}` : ''}`,
      signal,
    ),
  get: (workspaceId: string, loanId: string, signal?: AbortSignal) =>
    httpClient.get<ApiSuccess<LoanDetail>>(
      `${base(workspaceId)}/loans/${loanId}`,
      signal,
    ),
  simulate: (workspaceId: string, input: SimulationInput) =>
    httpClient.post<ApiSuccess<SimulationResult>, SimulationInput>(
      `${base(workspaceId)}/simulate`,
      input,
    ),
  create: (workspaceId: string, input: CreateLoanInput) =>
    httpClient.post<ApiSuccess<LoanDetail>, CreateLoanInput>(
      `${base(workspaceId)}/loans`,
      input,
    ),
  pay: (
    workspaceId: string,
    loanId: string,
    installmentId: string,
    input: LoanPaymentInput,
  ) =>
    httpClient.post<ApiSuccess<LoanDetail>, LoanPaymentInput>(
      `${base(workspaceId)}/loans/${loanId}/installments/${installmentId}/payments`,
      input,
    ),
}
