import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { accountsKeys } from '@/features/accounts/hooks/accounts.hooks'
import { dashboardKeys } from '@/features/dashboard'
import { investmentsApi } from './api'
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

export const investmentKeys = {
  all: (workspaceId: string) => ['investments', workspaceId] as const,
  list: (workspaceId: string) => ['investments', workspaceId, 'list'] as const,
  detail: (workspaceId: string, planId: string) =>
    ['investments', workspaceId, planId] as const,
}

export function useInvestmentPlans(workspaceId: string, enabled = true) {
  return useQuery({
    queryKey: investmentKeys.list(workspaceId),
    queryFn: ({ signal }) =>
      investmentsApi.list(workspaceId, signal).then((response) => response.data),
    enabled: Boolean(workspaceId) && enabled,
    staleTime: 30_000,
  })
}

export function useInvestmentPlan(
  workspaceId: string,
  planId: string,
  enabled = true,
) {
  return useQuery({
    queryKey: investmentKeys.detail(workspaceId, planId),
    queryFn: ({ signal }) =>
      investmentsApi
        .get(workspaceId, planId, signal)
        .then((response) => response.data),
    enabled: Boolean(workspaceId && planId) && enabled,
  })
}

function useInvestmentMutation<TInput, TResult>(
  workspaceId: string,
  mutationFn: (input: TInput) => Promise<TResult>,
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: investmentKeys.all(workspaceId),
        }),
        queryClient.invalidateQueries({
          queryKey: dashboardKeys.all(workspaceId),
        }),
        queryClient.invalidateQueries({
          queryKey: accountsKeys.all(workspaceId),
        }),
        queryClient.invalidateQueries({
          queryKey: ['transactions', workspaceId],
        }),
        queryClient.invalidateQueries({
          queryKey: ['forecasts', workspaceId],
        }),
        queryClient.invalidateQueries({
          queryKey: ['reports', workspaceId],
        }),
      ])
    },
  })
}

export function useCreateInvestmentPlan(workspaceId: string) {
  return useInvestmentMutation<CreateInvestmentPlanInput, InvestmentPlan>(
    workspaceId,
    (input) =>
      investmentsApi.create(workspaceId, input).then((response) => response.data),
  )
}

export function useUpdateInvestmentPlan(workspaceId: string, planId: string) {
  return useInvestmentMutation<UpdateInvestmentPlanInput, InvestmentPlan>(
    workspaceId,
    (input) =>
      investmentsApi
        .update(workspaceId, planId, input)
        .then((response) => response.data),
  )
}

export function useInvestmentAction(
  workspaceId: string,
  planId: string,
  action: 'start' | 'pause' | 'resume' | 'complete' | 'archive',
) {
  return useInvestmentMutation<
    { startDate?: string } | undefined,
    InvestmentPlan | { id: string; archived: boolean }
  >(workspaceId, async (input) => {
    if (action === 'start')
      return investmentsApi
        .start(workspaceId, planId, input?.startDate)
        .then((response) => response.data)
    if (action === 'pause')
      return investmentsApi
        .pause(workspaceId, planId)
        .then((response) => response.data)
    if (action === 'resume')
      return investmentsApi
        .resume(workspaceId, planId)
        .then((response) => response.data)
    if (action === 'complete')
      return investmentsApi
        .complete(workspaceId, planId)
        .then((response) => response.data)
    return investmentsApi
      .archive(workspaceId, planId)
      .then((response) => response.data)
  })
}

export function useInvestmentContribution(
  workspaceId: string,
  planId: string,
) {
  return useInvestmentMutation<InvestmentContributionInput, InvestmentPlan>(
    workspaceId,
    (input) =>
      investmentsApi
        .contribute(workspaceId, planId, input)
        .then((response) => response.data),
  )
}

export function useInvestmentWithdrawal(workspaceId: string, planId: string) {
  return useInvestmentMutation<InvestmentWithdrawalInput, InvestmentPlan>(
    workspaceId,
    (input) =>
      investmentsApi
        .withdraw(workspaceId, planId, input)
        .then((response) => response.data),
  )
}

export function useInvestmentValuation(workspaceId: string, planId: string) {
  return useInvestmentMutation<InvestmentValuationInput, InvestmentPlan>(
    workspaceId,
    (input) =>
      investmentsApi
        .valuation(workspaceId, planId, input)
        .then((response) => response.data),
  )
}


export function useUpdateInvestmentContribution(
  workspaceId: string,
  planId: string,
) {
  return useInvestmentMutation<
    { contributionId: string; input: UpdateInvestmentContributionInput },
    InvestmentPlan
  >(workspaceId, ({ contributionId, input }) =>
    investmentsApi
      .updateContribution(workspaceId, planId, contributionId, input)
      .then((response) => response.data),
  )
}

export function useDeleteInvestmentContribution(
  workspaceId: string,
  planId: string,
) {
  return useInvestmentMutation<string, InvestmentPlan>(
    workspaceId,
    (contributionId) =>
      investmentsApi
        .deleteContribution(workspaceId, planId, contributionId)
        .then((response) => response.data),
  )
}

export function useUpdateInvestmentWithdrawal(
  workspaceId: string,
  planId: string,
) {
  return useInvestmentMutation<
    { withdrawalId: string; input: UpdateInvestmentWithdrawalInput },
    InvestmentPlan
  >(workspaceId, ({ withdrawalId, input }) =>
    investmentsApi
      .updateWithdrawal(workspaceId, planId, withdrawalId, input)
      .then((response) => response.data),
  )
}

export function useDeleteInvestmentWithdrawal(
  workspaceId: string,
  planId: string,
) {
  return useInvestmentMutation<string, InvestmentPlan>(
    workspaceId,
    (withdrawalId) =>
      investmentsApi
        .deleteWithdrawal(workspaceId, planId, withdrawalId)
        .then((response) => response.data),
  )
}

export function useUpdateInvestmentValuation(
  workspaceId: string,
  planId: string,
) {
  return useInvestmentMutation<
    { valuationId: string; input: UpdateInvestmentValuationInput },
    InvestmentPlan
  >(workspaceId, ({ valuationId, input }) =>
    investmentsApi
      .updateValuation(workspaceId, planId, valuationId, input)
      .then((response) => response.data),
  )
}

export function useDeleteInvestmentValuation(
  workspaceId: string,
  planId: string,
) {
  return useInvestmentMutation<string, InvestmentPlan>(
    workspaceId,
    (valuationId) =>
      investmentsApi
        .deleteValuation(workspaceId, planId, valuationId)
        .then((response) => response.data),
  )
}
