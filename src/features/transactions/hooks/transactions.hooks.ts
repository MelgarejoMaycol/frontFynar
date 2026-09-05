import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { accountsKeys } from '@/features/accounts/hooks/accounts.hooks'
import { transactionsApi } from '../api/transactions.api'
import type {
  CreateTransactionInput,
  AdjustmentInput,
  TransactionFilters,
  UpdateTransactionInput,
} from '../types/transaction.types'
export const transactionKeys = {
  all: (workspaceId: string) => ['transactions', workspaceId] as const,
  list: (workspaceId: string, filters: TransactionFilters) =>
    ['transactions', workspaceId, 'list', filters] as const,
  detail: (workspaceId: string, transactionId: string) =>
    ['transactions', workspaceId, 'detail', transactionId] as const,
}
export const useTransactions = (
  workspaceId: string,
  filters: TransactionFilters,
  enabled = true,
) =>
  useQuery({
    queryKey: transactionKeys.list(workspaceId, filters),
    queryFn: async ({ signal }) =>
      (await transactionsApi.list(workspaceId, filters, signal)).data,
    enabled,
    staleTime: 60_000,
  })
export const useInfiniteTransactions = (
  workspaceId: string,
  filters: TransactionFilters,
  enabled = true,
) =>
  useInfiniteQuery({
    queryKey: transactionKeys.list(workspaceId, filters),
    queryFn: async ({ signal, pageParam }) =>
      (
        await transactionsApi.list(
          workspaceId,
          { ...filters, cursor: pageParam },
          signal,
        )
      ).data,
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    enabled,
    staleTime: 60_000,
  })
export const useTransaction = (workspaceId: string, id: string) =>
  useQuery({
    queryKey: transactionKeys.detail(workspaceId, id),
    queryFn: async ({ signal }) =>
      (await transactionsApi.get(workspaceId, id, signal)).data,
    enabled: Boolean(id),
    staleTime: 60_000,
  })
const useRefreshFinancialData = (workspaceId: string) => {
  const client = useQueryClient()
  return (id?: string) =>
    Promise.all([
      client.invalidateQueries({ queryKey: transactionKeys.all(workspaceId) }),
      client.invalidateQueries({ queryKey: accountsKeys.all(workspaceId) }),
      client.invalidateQueries({ queryKey: ['dashboard', workspaceId] }),
      client.invalidateQueries({ queryKey: ['budgets', workspaceId] }),
      client.invalidateQueries({ queryKey: ['reports', workspaceId] }),
      client.invalidateQueries({ queryKey: ['liabilities', workspaceId] }),
      client.invalidateQueries({ queryKey: ['lending', workspaceId] }),
      ...(id
        ? [
            client.invalidateQueries({
              queryKey: transactionKeys.detail(workspaceId, id),
            }),
          ]
        : []),
    ])
}
export const useCreateTransaction = (workspaceId: string) => {
  const refresh = useRefreshFinancialData(workspaceId)
  return useMutation({
    mutationFn: (input: CreateTransactionInput) =>
      transactionsApi.create(workspaceId, input),
    onSuccess: () => refresh(),
  })
}
export const useAdjustBalance = (workspaceId: string) => {
  const refresh = useRefreshFinancialData(workspaceId)
  return useMutation({
    mutationFn: (input: AdjustmentInput) =>
      transactionsApi.adjust(workspaceId, input),
    onSuccess: () => refresh(),
  })
}
export const useUpdateTransaction = (workspaceId: string, id: string) => {
  const refresh = useRefreshFinancialData(workspaceId)
  return useMutation({
    mutationFn: (input: UpdateTransactionInput) =>
      transactionsApi.update(workspaceId, id, input),
    onSuccess: () => refresh(id),
  })
}
export const useCancelTransaction = (workspaceId: string) => {
  const refresh = useRefreshFinancialData(workspaceId)
  return useMutation({
    mutationFn: ({ id, version }: { id: string; version: number }) =>
      transactionsApi.cancel(workspaceId, id, version),
    onSuccess: (_, { id }) => refresh(id),
  })
}
