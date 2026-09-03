import { useQuery } from '@tanstack/react-query'
import { forecastsApi } from '../api/forecasts.api'

export const forecastKeys = {
  all: (workspaceId: string) => ['forecasts', workspaceId] as const,
  monthEnd: (workspaceId: string) =>
    ['forecasts', workspaceId, 'month-end'] as const,
}

export const useMonthEndForecast = (workspaceId: string, enabled = true) =>
  useQuery({
    queryKey: forecastKeys.monthEnd(workspaceId),
    queryFn: async ({ signal }) =>
      (await forecastsApi.monthEnd(workspaceId, signal)).data,
    enabled,
    staleTime: 60_000,
  })
