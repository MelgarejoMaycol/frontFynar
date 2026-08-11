import { describe, expect, it } from 'vitest'
import { getRouteTitle } from '@/layouts/navigation'

describe('getRouteTitle', () => {
  it.each([
    ['/app/accounts', 'Cuentas'],
    ['/app/accounts/123', 'Cuentas'],
    ['/app/transactions/123', 'Movimientos'],
    ['/app/settings/profile', 'Configuración'],
    ['/app/accounting', 'Fynar'],
    ['/ruta-desconocida', 'Fynar'],
  ])('resuelve %s como %s', (pathname, expected) => {
    expect(getRouteTitle(pathname)).toBe(expected)
  })
})
