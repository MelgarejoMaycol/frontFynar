import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { accountsKeys } from '@/features/accounts/hooks/accounts.hooks'
import { dashboardKeys } from '@/features/dashboard'
import { investmentsApi } from './api'
import type {
  CreateInvestmentPlanInput,
  InvestmentContributionInput,
  InvestmentValuationInput,
  InvestmentWithdrawalInput,
  UpdateInvestmentPlanInput,
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

function useInvestmentMutation<TInput>(
  workspaceId: string,
  mutationFn: (input: TInput) => Promise<unknown>,
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
      ])
    },
  })
}

export function useCreateInvestmentPlan(workspaceId: string) {
  return useInvestmentMutation<CreateInvestmentPlanInput>(workspaceId, (input) =>
    investmentsApi.create(workspaceId, input),
  )
}

export function useUpdateInvestmentPlan(workspaceId: string, planId: string) {
  return useInvestmentMutation<UpdateInvestmentPlanInput>(workspaceId, (input) =>
    investmentsApi.update(workspaceId, planId, input),
  )
}

export function useInvestmentAction(
  workspaceId: string,
  planId: string,
  action: 'start' | 'pause' | 'resume' | 'complete' | 'archive',
) {
  return useInvestmentMutation<{ startDate?: string } | undefined>(
    workspaceId,
    (input) => {
      if (action === 'start')
        return investmentsApi.start(workspaceId, planId, input?.startDate)
      if (action === 'pause') return investmentsApi.pause(workspaceId, planId)
      if (action === 'resume') return investmentsApi.resume(workspaceId, planId)
      if (action === 'complete')
        return investmentsApi.complete(workspaceId, planId)
      return investmentsApi.archive(workspaceId, planId)
    },
  )
}

export function useInvestmentContribution(
  workspaceId: string,
  planId: string,
) {
  return useInvestmentMutation<InvestmentContributionInput>(
    workspaceId,
    (input) => investmentsApi.contribute(workspaceId, planId, input),
  )
}

export function useInvestmentWithdrawal(workspaceId: string, planId: string) {
  return useInvestmentMutation<InvestmentWithdrawalInput>(
    workspaceId,
    (input) => investmentsApi.withdraw(workspaceId, planId, input),
  )
}

export function useInvestmentValuation(workspaceId: string, planId: string) {
  return useInvestmentMutation<InvestmentValuationInput>(
    workspaceId,
    (input) => investmentsApi.valuation(workspaceId, planId, input),
  )
}
