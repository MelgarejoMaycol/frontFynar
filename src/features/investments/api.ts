import { httpClient } from '@/services/http/httpClient'
import type { ApiSuccess } from '@/services/http/httpTypes'
import type {
  CreateInvestmentPlanInput,
  InvestmentContributionInput,
  InvestmentPlan,
  InvestmentValuationInput,
  InvestmentWithdrawalInput,
  UpdateInvestmentPlanInput,
} from './types'

const base = (workspaceId: string) => `/workspaces/${workspaceId}/investments`

export const investmentsApi = {
  list: (workspaceId: string, signal?: AbortSignal) =>
    httpClient.get<ApiSuccess<InvestmentPlan[]>>(base(workspaceId), signal),
  get: (workspaceId: string, planId: string, signal?: AbortSignal) =>
    httpClient.get<ApiSuccess<InvestmentPlan>>(
      `${base(workspaceId)}/${planId}`,
      signal,
    ),
  create: (workspaceId: string, input: CreateInvestmentPlanInput) =>
    httpClient.post<ApiSuccess<InvestmentPlan>, CreateInvestmentPlanInput>(
      base(workspaceId),
      input,
    ),
  update: (
    workspaceId: string,
    planId: string,
    input: UpdateInvestmentPlanInput,
  ) =>
    httpClient.patch<ApiSuccess<InvestmentPlan>, UpdateInvestmentPlanInput>(
      `${base(workspaceId)}/${planId}`,
      input,
    ),
  start: (workspaceId: string, planId: string, startDate?: string) =>
    httpClient.post<ApiSuccess<InvestmentPlan>, { startDate?: string }>(
      `${base(workspaceId)}/${planId}/start`,
      startDate ? { startDate } : {},
    ),
  pause: (workspaceId: string, planId: string) =>
    httpClient.post<ApiSuccess<InvestmentPlan>, Record<string, never>>(
      `${base(workspaceId)}/${planId}/pause`,
      {},
    ),
  resume: (workspaceId: string, planId: string) =>
    httpClient.post<ApiSuccess<InvestmentPlan>, Record<string, never>>(
      `${base(workspaceId)}/${planId}/resume`,
      {},
    ),
  complete: (workspaceId: string, planId: string) =>
    httpClient.post<ApiSuccess<InvestmentPlan>, Record<string, never>>(
      `${base(workspaceId)}/${planId}/complete`,
      {},
    ),
  archive: (workspaceId: string, planId: string) =>
    httpClient.post<ApiSuccess<{ id: string; archived: boolean }>, Record<string, never>>(
      `${base(workspaceId)}/${planId}/archive`,
      {},
    ),
  contribute: (
    workspaceId: string,
    planId: string,
    input: InvestmentContributionInput,
  ) =>
    httpClient.post<ApiSuccess<InvestmentPlan>, InvestmentContributionInput>(
      `${base(workspaceId)}/${planId}/contributions`,
      input,
    ),
  withdraw: (
    workspaceId: string,
    planId: string,
    input: InvestmentWithdrawalInput,
  ) =>
    httpClient.post<ApiSuccess<InvestmentPlan>, InvestmentWithdrawalInput>(
      `${base(workspaceId)}/${planId}/withdrawals`,
      input,
    ),
  valuation: (
    workspaceId: string,
    planId: string,
    input: InvestmentValuationInput,
  ) =>
    httpClient.post<ApiSuccess<InvestmentPlan>, InvestmentValuationInput>(
      `${base(workspaceId)}/${planId}/valuations`,
      input,
    ),
}
