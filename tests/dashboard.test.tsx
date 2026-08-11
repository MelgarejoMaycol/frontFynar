import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ApiError, httpClient } from '@/services/http'
import { dashboardApi } from '@/features/dashboard/api/dashboard.api'
import { getDashboardErrorMessage } from '@/features/dashboard/dashboard.errors'
import {
  dashboardKeys,
  useDashboard,
} from '@/features/dashboard/hooks/dashboard.hooks'

describe('dashboard API y caché', () => {
  it('aísla claves por workspace y periodo', () => {
    expect(dashboardKeys.all('a')).not.toEqual(dashboardKeys.all('b'))
    expect(dashboardKeys.summary('a', { period: 'CURRENT_MONTH' })).not.toEqual(
      dashboardKeys.summary('a', { period: 'LAST_7_DAYS' }),
    )
  })
  it('envía periodos CUSTOM, fechas y recentLimit al backend', async () => {
    const get = vi
      .spyOn(httpClient, 'get')
      .mockResolvedValue({ success: true, data: {} })
    await dashboardApi.get('w', {
      period: 'CUSTOM',
      dateFrom: '2026-08-01',
      dateTo: '2026-08-10',
      recentLimit: 8,
    })
    const url = String(get.mock.calls[0]?.[0])
    expect(url).toContain('period=CUSTOM')
    expect(url).toContain('dateFrom=2026-08-01')
    expect(url).toContain('dateTo=2026-08-10')
    expect(url).toContain('recentLimit=8')
  })
  it('no ejecuta la query cuando está deshabilitada', async () => {
    const get = vi.spyOn(dashboardApi, 'get')
    const client = new QueryClient()
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    )
    const { result } = renderHook(
      () => useDashboard('w', { period: 'CURRENT_MONTH' }, false),
      { wrapper },
    )
    await waitFor(() => expect(result.current.fetchStatus).toBe('idle'))
    expect(get).not.toHaveBeenCalled()
  })
  it('convierte errores a mensajes públicos seguros', () => {
    expect(
      getDashboardErrorMessage(new ApiError('Prisma secret', 500, 'INTERNAL')),
    ).not.toContain('Prisma')
    expect(
      getDashboardErrorMessage(new ApiError('socket', 0, 'NETWORK_ERROR')),
    ).not.toContain('socket')
  })
})
