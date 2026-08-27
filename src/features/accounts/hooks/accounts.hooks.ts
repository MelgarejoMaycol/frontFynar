import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { accountsApi } from '../api/accounts.api'
import type { AccountInput, UpdateAccountInput } from '../types/account.types'
import type { Account } from '../types/account.types'

export const accountsKeys = {
  all: (workspaceId: string) => ['accounts', workspaceId] as const,
  list: (workspaceId: string, archived: boolean, favorite: 'all' | 'favorites' = 'all', excludeCreditCards = false) =>
    ['accounts', workspaceId, 'list', { archived, favorite, excludeCreditCards }] as const,
  detail: (workspaceId: string, accountId: string) =>
    ['accounts', workspaceId, accountId] as const,
}
export const useAccounts = (
  workspaceId: string,
  enabled = true,
  archived = false,
  favorite: 'all' | 'favorites' = 'all',
  excludeCreditCards = false,
) =>
  useQuery({
    queryKey: accountsKeys.list(workspaceId, archived, favorite, excludeCreditCards),
    queryFn: async ({ signal }) =>
      (await accountsApi.list(workspaceId, archived, favorite === 'favorites' ? true : undefined, excludeCreditCards, signal)).data,
    enabled,
    staleTime: 60_000,
  })
export const useAccount = (workspaceId: string, accountId: string) =>
  useQuery({
    queryKey: accountsKeys.detail(workspaceId, accountId),
    queryFn: async ({ signal }) =>
      (await accountsApi.get(workspaceId, accountId, signal)).data,
    staleTime: 60_000,
  })
const useRefreshAccounts = (workspaceId: string) => {
  const client = useQueryClient()
  return async (accountId?: string): Promise<void> => {
    await Promise.all([
      client.invalidateQueries({ queryKey: accountsKeys.all(workspaceId) }),
      client.invalidateQueries({ queryKey: ['dashboard', workspaceId] }),
      ...(accountId
        ? [
            client.invalidateQueries({
              queryKey: accountsKeys.detail(workspaceId, accountId),
            }),
          ]
        : []),
    ])
  }
}
export const useCreateAccount = (workspaceId: string) => {
  const refresh = useRefreshAccounts(workspaceId)
  return useMutation({
    mutationFn: (input: AccountInput) => accountsApi.create(workspaceId, input),
    onSuccess: () => refresh(),
  })
}
export const useUpdateAccount = (workspaceId: string, accountId: string) => {
  const refresh = useRefreshAccounts(workspaceId)
  return useMutation({
    mutationFn: (input: UpdateAccountInput) =>
      accountsApi.update(workspaceId, accountId, input),
    onSuccess: () => refresh(accountId),
  })
}
export const useFavoriteAccount = (workspaceId: string) => {
  const client = useQueryClient()
  const refresh = useRefreshAccounts(workspaceId)
  return useMutation({
    mutationFn: ({
      accountId,
      isFavorite,
    }: {
      accountId: string
      isFavorite: boolean
    }) => accountsApi.favorite(workspaceId, accountId, isFavorite),
    onMutate: async ({ accountId, isFavorite }) => {
      await client.cancelQueries({ queryKey: accountsKeys.all(workspaceId) })
      const previous = client.getQueriesData<Account[]>({
        queryKey: accountsKeys.all(workspaceId),
      })
      previous.forEach(([key, data]) => {
        if (!Array.isArray(data)) return
        const updated = data.map((account) =>
          account.id === accountId ? { ...account, isFavorite } : account,
        )
        const filter = key[3] as { favorite?: 'all' | 'favorites' } | undefined
        client.setQueryData<Account[]>(
          key,
          filter?.favorite === 'favorites'
            ? updated.filter((account) => account.isFavorite)
            : updated,
        )
      })
      const detailKey = accountsKeys.detail(workspaceId, accountId)
      const previousDetail = client.getQueryData<Account>(detailKey)
      client.setQueryData<Account>(detailKey, (current) =>
        current ? { ...current, isFavorite } : current,
      )
      return { previous, previousDetail, detailKey }
    },
    onError: (_error, _variables, context) => {
      context?.previous.forEach(([key, data]) => client.setQueryData(key, data))
      if (context?.previousDetail)
        client.setQueryData(context.detailKey, context.previousDetail)
    },
    onSettled: (result) => refresh(result?.data.id),
  })
}
export const useArchiveAccount = (workspaceId: string) => {
  const refresh = useRefreshAccounts(workspaceId)
  return useMutation({
    mutationFn: (accountId: string) =>
      accountsApi.archive(workspaceId, accountId),
    onSuccess: ({ data }) => refresh(data.id),
  })
}
export const useRestoreAccount = (workspaceId: string) => {
  const refresh = useRefreshAccounts(workspaceId)
  return useMutation({
    mutationFn: (accountId: string) =>
      accountsApi.restore(workspaceId, accountId),
    onSuccess: ({ data }) => refresh(data.id),
  })
}
export const useDeleteAccount = (workspaceId: string) => {
  const refresh = useRefreshAccounts(workspaceId)
  return useMutation({
    mutationFn: (accountId: string) =>
      accountsApi.remove(workspaceId, accountId),
    onSuccess: () => refresh(),
  })
}
