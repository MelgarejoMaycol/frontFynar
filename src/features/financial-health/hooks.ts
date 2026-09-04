import { useQuery } from '@tanstack/react-query'
import { financialHealthApi } from './api'

export const financialHealthKeys = {
  all: (workspaceId: string) => ['financial-health', workspaceId] as const,
  current: (workspaceId: string) =>
    ['financial-health', workspaceId, 'current'] as const,
  history: (workspaceId: string, limit: number) =>
    ['financial-health', workspaceId, 'history', limit] as const,
}

export const useFinancialHealth = (workspaceId: string, enabled = true) =>
  useQuery({
    queryKey: financialHealthKeys.current(workspaceId),
    queryFn: async ({ signal }) =>
      (await financialHealthApi.current(workspaceId, signal)).data,
    enabled: Boolean(workspaceId) && enabled,
    staleTime: 60_000,
  })

export const useFinancialHealthHistory = (
  workspaceId: string,
  limit = 12,
  enabled = true,
) =>
  useQuery({
    queryKey: financialHealthKeys.history(workspaceId, limit),
    queryFn: async ({ signal }) =>
      (await financialHealthApi.history(workspaceId, limit, signal)).data,
    enabled: Boolean(workspaceId) && enabled,
    staleTime: 5 * 60_000,
  })
