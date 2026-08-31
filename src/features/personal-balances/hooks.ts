import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { personalBalancesApi } from './api'
import type {
  CreatePersonalBalanceInput,
  PersonalBalanceEntryInput,
  UpdatePersonalBalanceInput,
  PersonInput,
} from './types'

export const personalBalanceKeys = {
  all: (workspaceId: string) => ['personal-balances', workspaceId] as const,
  list: (workspaceId: string, filters: object) =>
    ['personal-balances', workspaceId, 'list', filters] as const,
  summary: (workspaceId: string) =>
    ['personal-balances', workspaceId, 'summary'] as const,
  detail: (workspaceId: string, id: string) =>
    ['personal-balances', workspaceId, 'detail', id] as const,
  people: (workspaceId: string) => ['personal-balances', workspaceId, 'people'] as const,
}

export const usePersonalBalances = (
  workspaceId: string,
  filters: { direction?: string; status?: string; q?: string },
) =>
  useQuery({
    queryKey: personalBalanceKeys.list(workspaceId, filters),
    queryFn: async ({ signal }) =>
      (await personalBalancesApi.list(workspaceId, filters, signal)).data,
    enabled: Boolean(workspaceId),
  })

export const usePersonalBalancesSummary = (workspaceId: string) =>
  useQuery({
    queryKey: personalBalanceKeys.summary(workspaceId),
    queryFn: async ({ signal }) =>
      (await personalBalancesApi.summary(workspaceId, signal)).data,
    enabled: Boolean(workspaceId),
  })

export const usePersonalBalance = (workspaceId: string, id: string) =>
  useQuery({
    queryKey: personalBalanceKeys.detail(workspaceId, id),
    queryFn: async ({ signal }) =>
      (await personalBalancesApi.get(workspaceId, id, signal)).data,
    enabled: Boolean(workspaceId && id),
  })

const useRefresh = (workspaceId: string) => {
  const client = useQueryClient()
  return async () => {
    await Promise.all([
      client.invalidateQueries({ queryKey: personalBalanceKeys.all(workspaceId) }),
      client.invalidateQueries({ queryKey: ['dashboard', workspaceId] }),
      client.invalidateQueries({ queryKey: ['accounts', workspaceId] }),
      client.invalidateQueries({ queryKey: ['transactions', workspaceId] }),
    ])
  }
}

export const useCreatePersonalBalance = (workspaceId: string) => {
  const refresh = useRefresh(workspaceId)
  return useMutation({
    mutationFn: (input: CreatePersonalBalanceInput) =>
      personalBalancesApi.create(workspaceId, input),
    onSuccess: refresh,
  })
}

export const useUpdatePersonalBalance = (workspaceId: string, id: string) => {
  const refresh = useRefresh(workspaceId)
  return useMutation({
    mutationFn: (input: UpdatePersonalBalanceInput) =>
      personalBalancesApi.update(workspaceId, id, input),
    onSuccess: refresh,
  })
}

export const useAddPersonalBalanceEntry = (workspaceId: string, id: string) => {
  const refresh = useRefresh(workspaceId)
  return useMutation({
    mutationFn: (input: PersonalBalanceEntryInput) =>
      personalBalancesApi.addEntry(workspaceId, id, input),
    onSuccess: refresh,
  })
}

export const useSettlePersonalBalance = (workspaceId: string) => {
  const refresh = useRefresh(workspaceId)
  return useMutation({
    mutationFn: ({ id, accountId }: { id: string; accountId: string }) =>
      personalBalancesApi.settle(workspaceId, id, accountId),
    onSuccess: refresh,
  })
}

export const usePeople = (workspaceId: string) => useQuery({
  queryKey: personalBalanceKeys.people(workspaceId),
  queryFn: async ({ signal }) => (await personalBalancesApi.people(workspaceId, '', signal)).data,
  enabled: Boolean(workspaceId),
})

export const useCreatePerson = (workspaceId: string) => {
  const refresh = useRefresh(workspaceId)
  return useMutation({
    mutationFn: (input: PersonInput) => personalBalancesApi.createPerson(workspaceId, input),
    onSuccess: refresh,
  })
}

export const useUpdatePerson = (workspaceId: string) => {
  const refresh = useRefresh(workspaceId)
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<PersonInput> }) =>
      personalBalancesApi.updatePerson(workspaceId, id, input),
    onSuccess: refresh,
  })
}

export const useArchivePerson = (workspaceId: string) => {
  const refresh = useRefresh(workspaceId)
  return useMutation({
    mutationFn: (id: string) => personalBalancesApi.archivePerson(workspaceId, id),
    onSuccess: refresh,
  })
}

export const useReversePersonalBalanceEntry = (workspaceId: string, id: string) => {
  const refresh = useRefresh(workspaceId)
  return useMutation({
    mutationFn: (entryId: string) => personalBalancesApi.reverseEntry(workspaceId, id, entryId),
    onSuccess: refresh,
  })
}

export const useArchivePersonalBalance = (workspaceId: string) => {
  const refresh = useRefresh(workspaceId)
  return useMutation({
    mutationFn: (id: string) => personalBalancesApi.archive(workspaceId, id),
    onSuccess: refresh,
  })
}
