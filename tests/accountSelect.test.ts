import { render, screen } from '@testing-library/react'
import { createElement } from 'react'
import { describe, expect, it } from 'vitest'
import { accountOptionLabel } from '../src/features/accounts/accounts.format'
import { TransactionAccountSelect } from '../src/features/transactions/components/TransactionAccountSelect'
import type { Account } from '../src/features/accounts/types/account.types'

const account = (input: Partial<Account>): Account => ({
  id: 'account-id',
  name: 'Bancolombia',
  type: 'SAVINGS',
  nature: 'ASSET',
  institutionName: null,
  currency: 'COP',
  openingBalance: '0.00',
  currentBalance: '1500000.00',
  creditLimit: null,
  billingDay: null,
  paymentDueDay: null,
  color: null,
  icon: null,
  isFavorite: false,
  isActive: true,
  includeInNetWorth: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  ...input,
})

describe('selector reutilizable de cuentas', () => {
  it('muestra saldo positivo de un activo', () => {
    expect(accountOptionLabel(account({}))).toBe(
      'Bancolombia · + $ 1.500.000,00',
    )
  })

  it('muestra deuda utilizada y no cupo total para una tarjeta', () => {
    expect(
      accountOptionLabel(
        account({
          name: 'Credi Tarjeta',
          type: 'CREDIT_CARD',
          nature: 'LIABILITY',
          currentBalance: '845658.00',
          creditLimit: '1500000.00',
        }),
      ),
    ).toBe('Credi Tarjeta · - $ 845.658,00')
  })

  it('muestra cupo disponible y deuda cuando una tarjeta origina una compra', () => {
    render(
      createElement(TransactionAccountSelect, {
        'aria-label': 'Cuenta origen',
        context: 'SOURCE',
        accounts: [
          account({
            name: 'Tarjeta Bancolombia',
            type: 'CREDIT_CARD',
            nature: 'LIABILITY',
            currentBalance: '800000.00',
            creditLimit: '1000000.00',
          }),
        ],
      }),
    )
    expect(screen.getByRole('option', { name: /Tarjeta Bancolombia/ })).toHaveTextContent(
      'Disponible: $ 200.000,00 · Deuda actual: $ 800.000,00',
    )
  })
})
