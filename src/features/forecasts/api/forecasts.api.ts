import { httpClient } from '@/services/http'
import type { ApiSuccess } from '@/services/http/httpTypes'
import type { MonthEndForecastData } from '../types/forecast.types'

export const forecastsApi = {
  monthEnd: (workspaceId: string, signal?: AbortSignal) =>
    httpClient.get<ApiSuccess<MonthEndForecastData>>(
      `/workspaces/${workspaceId}/forecasts/month-end`,
      signal,
    ),
}
