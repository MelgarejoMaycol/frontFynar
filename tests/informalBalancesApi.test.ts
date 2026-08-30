import { afterEach, describe, expect, it, vi } from 'vitest'
import { informalBalancesApi } from '@/features/liabilities/informal-balances.api'
import { httpClient } from '@/services/http/httpClient'

afterEach(() => vi.restoreAllMocks())

describe('API de Debo y me deben', () => {
  it('construye las rutas del workspace y los filtros correctamente', () => {
    const get = vi.spyOn(httpClient, 'get').mockResolvedValue(undefined)

    void informalBalancesApi.list(
      'workspace-1',
      { direction: 'PAYABLE', search: 'gasolina moto' },
      undefined,
    )
    void informalBalancesApi.summary('workspace-1')

    expect(get.mock.calls[0]?.[0]).toBe(
      '/workspaces/workspace-1/informal-balances?direction=PAYABLE&search=gasolina+%20moto'.replace('+%20', '+'),
    )
    expect(get.mock.calls[1]?.[0]).toBe(
      '/workspaces/workspace-1/informal-balances/summary',
    )
  })

  it('envía creación, pago y archivo a los endpoints esperados', () => {
    const post = vi.spyOn(httpClient, 'post').mockResolvedValue(undefined)
    const remove = vi.spyOn(httpClient, 'delete').mockResolvedValue(undefined)

    void informalBalancesApi.create('workspace-1', {
      direction: 'PAYABLE',
      counterpartyName: 'Carlos',
      description: 'Gasolina de la moto',
      amount: '30000.00',
      currency: 'COP',
      occurredOn: '2026-08-30',
    })
    void informalBalancesApi.pay('workspace-1', 'pending-1', {
      amount: '10000.00',
      paidAt: '2026-08-30T18:00:00.000Z',
      accountId: null,
      idempotencyKey: 'test-key',
    })
    void informalBalancesApi.archive('workspace-1', 'pending-1')

    expect(post.mock.calls[0]?.[0]).toBe(
      '/workspaces/workspace-1/informal-balances',
    )
    expect(post.mock.calls[1]?.[0]).toBe(
      '/workspaces/workspace-1/informal-balances/pending-1/payments',
    )
    expect(remove).toHaveBeenCalledWith(
      '/workspaces/workspace-1/informal-balances/pending-1',
    )
  })
})
