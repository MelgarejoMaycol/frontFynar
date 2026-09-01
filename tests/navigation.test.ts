import { describe, expect, it } from 'vitest'
import { getRouteTitle } from '@/layouts/navigation'

describe('getRouteTitle', () => {
  it.each([
    ['/app/accounts', 'Cuentas'],
    ['/app/accounts/123', 'Cuentas'],
    ['/app/transactions/123', 'Movimientos'],
    ['/app/commitments', 'Créditos y deudas'],
    ['/app/debts', 'Créditos y deudas'],
    ['/app/debts/cards/123', 'Créditos y deudas'],
    ['/app/lending', 'Créditos y deudas'],
    ['/app/personal-balances', 'Créditos y deudas'],
    ['/app/settings/profile', 'Configuración'],
    ['/app/accounting', 'Fynar'],
    ['/ruta-desconocida', 'Fynar'],
  ])('resuelve %s como %s', (pathname, expected) => {
    expect(getRouteTitle(pathname)).toBe(expected)
  })
})
