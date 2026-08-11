import { useQuery } from '@tanstack/react-query'
import { dashboardApi } from '../api/dashboard.api'
import type { DashboardParams } from '../types/dashboard.types'
export const dashboardKeys = {
  all: (workspaceId: string) => ['dashboard', workspaceId] as const,
  summary: (workspaceId: string, params: DashboardParams) =>
    ['dashboard', workspaceId, params] as const,
}
export const useDashboard = (
  workspaceId: string,
  params: DashboardParams,
  enabled = true,
) =>
  useQuery({
    queryKey: dashboardKeys.summary(workspaceId, params),
    queryFn: async ({ signal }) =>
      (await dashboardApi.get(workspaceId, params, signal)).data,
    enabled,
  })
