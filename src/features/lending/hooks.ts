import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { accountsApi } from '@/features/accounts'
import { lendingApi } from './api'
import type { CreateLoanInput, LoanPaymentInput, SimulationInput } from './types'

export const lendingKeys = {
  all: (workspaceId: string) => ['lending', workspaceId] as const,
  summary: (workspaceId: string) => ['lending', workspaceId, 'summary'] as const,
  list: (workspaceId: string, q: string) => ['lending', workspaceId, 'list', q] as const,
  detail: (workspaceId: string, id: string) => ['lending', workspaceId, 'detail', id] as const,
}

export const useLendingSummary = (workspaceId: string) =>
  useQuery({
    queryKey: lendingKeys.summary(workspaceId),
    queryFn: async ({ signal }) => (await lendingApi.summary(workspaceId, signal)).data,
    enabled: Boolean(workspaceId),
  })

export const useLoans = (workspaceId: string, q: string) =>
  useQuery({
    queryKey: lendingKeys.list(workspaceId, q),
    queryFn: async ({ signal }) => (await lendingApi.list(workspaceId, q, signal)).data,
    enabled: Boolean(workspaceId),
  })

export const useLoan = (workspaceId: string, id: string) =>
  useQuery({
    queryKey: lendingKeys.detail(workspaceId, id),
    queryFn: async ({ signal }) => (await lendingApi.get(workspaceId, id, signal)).data,
    enabled: Boolean(workspaceId && id),
  })

export const useAssetAccounts = (workspaceId: string) =>
  useQuery({
    queryKey: ['accounts', workspaceId, 'lending-assets'],
    queryFn: async ({ signal }) =>
      (await accountsApi.list(workspaceId, false, undefined, true, signal)).data.filter(
        (account) => account.nature === 'ASSET' && account.type !== 'LOAN',
      ),
    enabled: Boolean(workspaceId),
  })

const useRefresh = (workspaceId: string) => {
  const client = useQueryClient()
  return async () => {
    await Promise.all([
      client.invalidateQueries({ queryKey: lendingKeys.all(workspaceId) }),
      client.invalidateQueries({ queryKey: ['accounts', workspaceId] }),
      client.invalidateQueries({ queryKey: ['dashboard', workspaceId] }),
      client.invalidateQueries({ queryKey: ['transactions', workspaceId] }),
    ])
  }
}

export const useSimulation = (workspaceId: string) =>
  useMutation({ mutationFn: (input: SimulationInput) => lendingApi.simulate(workspaceId, input) })

export const useCreateLoan = (workspaceId: string) => {
  const refresh = useRefresh(workspaceId)
  return useMutation({
    mutationFn: (input: CreateLoanInput) => lendingApi.create(workspaceId, input),
    onSuccess: refresh,
  })
}

export const usePayLoan = (workspaceId: string, loanId: string, installmentId: string) => {
  const refresh = useRefresh(workspaceId)
  return useMutation({
    mutationFn: (input: LoanPaymentInput) => lendingApi.pay(workspaceId, loanId, installmentId, input),
    onSuccess: refresh,
  })
}
