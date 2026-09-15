import { httpClient } from '@/services/http/httpClient'
import type { ApiSuccess } from '@/services/http/httpTypes'
import type {
  CreateInvestmentPlanInput,
  InvestmentContributionInput,
  InvestmentPlan,
  InvestmentValuationInput,
  InvestmentWithdrawalInput,
  UpdateInvestmentContributionInput,
  UpdateInvestmentPlanInput,
  UpdateInvestmentValuationInput,
  UpdateInvestmentWithdrawalInput,
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
  updateContribution: (
    workspaceId: string,
    planId: string,
    contributionId: string,
    input: UpdateInvestmentContributionInput,
  ) =>
    httpClient.patch<ApiSuccess<InvestmentPlan>, UpdateInvestmentContributionInput>(
      `${base(workspaceId)}/${planId}/contributions/${contributionId}`,
      input,
    ),
  deleteContribution: (
    workspaceId: string,
    planId: string,
    contributionId: string,
  ) =>
    httpClient.delete<ApiSuccess<InvestmentPlan>>(
      `${base(workspaceId)}/${planId}/contributions/${contributionId}`,
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
  updateWithdrawal: (
    workspaceId: string,
    planId: string,
    withdrawalId: string,
    input: UpdateInvestmentWithdrawalInput,
  ) =>
    httpClient.patch<ApiSuccess<InvestmentPlan>, UpdateInvestmentWithdrawalInput>(
      `${base(workspaceId)}/${planId}/withdrawals/${withdrawalId}`,
      input,
    ),
  deleteWithdrawal: (
    workspaceId: string,
    planId: string,
    withdrawalId: string,
  ) =>
    httpClient.delete<ApiSuccess<InvestmentPlan>>(
      `${base(workspaceId)}/${planId}/withdrawals/${withdrawalId}`,
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
  updateValuation: (
    workspaceId: string,
    planId: string,
    valuationId: string,
    input: UpdateInvestmentValuationInput,
  ) =>
    httpClient.patch<ApiSuccess<InvestmentPlan>, UpdateInvestmentValuationInput>(
      `${base(workspaceId)}/${planId}/valuations/${valuationId}`,
      input,
    ),
  deleteValuation: (
    workspaceId: string,
    planId: string,
    valuationId: string,
  ) =>
    httpClient.delete<ApiSuccess<InvestmentPlan>>(
      `${base(workspaceId)}/${planId}/valuations/${valuationId}`,
    ),
}
