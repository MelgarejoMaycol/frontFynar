import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { AccountCard } from '@/features/accounts/components/AccountCard'
import { AccountForm } from '@/features/accounts/components/AccountForm'
import { accountErrorMessage } from '@/features/accounts/accounts.errors'
import { accountsKeys } from '@/features/accounts/hooks/accounts.hooks'
import {
  formatCurrency,
  isMoneyString,
} from '@/features/accounts/accounts.format'
import { accountFormSchema } from '@/features/accounts/schemas/account.schemas'
import type { Account } from '@/features/accounts/types/account.types'
import { ApiError } from '@/services/http'

const account: Account = {
  id: 'account-1',
  name: 'Ahorros',
  type: 'SAVINGS',
  nature: 'ASSET',
  institutionName: 'Banco',
  currency: 'COP',
  openingBalance: '1500000.25',
  currentBalance: '1500000.25',
  creditLimit: null,
  billingDay: null,
  paymentDueDay: null,
  color: null,
  icon: null,
  isFavorite: true,
  isActive: true,
  includeInNetWorth: true,
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
}
const wrapper = (children: React.ReactNode) => (
  <QueryClientProvider client={new QueryClient()}>
    <MemoryRouter>{children}</MemoryRouter>
  </QueryClientProvider>
)

describe('cuentas financieras', () => {
  it('valida contrato, coherencia y campos de tarjeta', () => {
    const base = {
      name: 'Efectivo',
      type: 'CASH',
      nature: 'ASSET',
      institutionName: '',
      currency: 'cop',
      openingBalance: '10.25',
      creditLimit: '',
      billingDay: '',
      paymentDueDay: '',
      includeInNetWorth: true,
      isFavorite: false,
    }
    expect(accountFormSchema.parse(base).currency).toBe('COP')
    expect(
      accountFormSchema.safeParse({ ...base, nature: 'LIABILITY' }).success,
    ).toBe(false)
    expect(
      accountFormSchema.safeParse({
        ...base,
        type: 'CREDIT_CARD',
        nature: 'LIABILITY',
        billingDay: '32',
      }).success,
    ).toBe(false)
  })
  it('formatea decimales y rechaza valores inconsistentes', () => {
    expect(isMoneyString('1500000.25')).toBe(true)
    expect(isMoneyString('NaN')).toBe(false)
    expect(formatCurrency('10.50', 'USD')).toContain('10')
    expect(formatCurrency('Infinity', 'COP')).toBe('Monto no disponible')
  })
  it('aísla listado y detalle por workspace', () => {
    expect(accountsKeys.all('workspace-a')).toEqual(['accounts', 'workspace-a'])
    expect(accountsKeys.all('workspace-b')).not.toEqual(
      accountsKeys.all('workspace-a'),
    )
    expect(accountsKeys.detail('workspace-a', 'account-1')).toEqual([
      'accounts',
      'workspace-a',
      'account-1',
    ])
  })
  it('presenta cuenta, favorita y modo solo lectura', () => {
    render(
      wrapper(
        <AccountCard
          account={account}
          canWrite={false}
          busy={false}
          onEdit={vi.fn()}
          onFavorite={vi.fn()}
          onArchive={vi.fn()}
          onRestore={vi.fn()}
        />,
      ),
    )
    expect(screen.getByRole('heading', { name: 'Ahorros' })).toBeVisible()
    expect(screen.getByLabelText('Cuenta favorita')).toBeVisible()
    expect(screen.getByRole('link', { name: 'Ver detalle' })).toBeVisible()
    expect(
      screen.queryByRole('button', { name: 'Editar' }),
    ).not.toBeInTheDocument()
  })
  it('muestra campos de tarjeta y envía sin currentBalance', async () => {
    const submit = vi.fn()
    const user = userEvent.setup()
    render(
      wrapper(
        <AccountForm
          currency="COP"
          pending={false}
          error={null}
          onSubmit={submit}
          onCancel={vi.fn()}
        />,
      ),
    )
    await user.selectOptions(
      screen.getByRole('combobox', { name: /Tipo/ }),
      'CREDIT_CARD',
    )
    expect(screen.getByLabelText('Cupo')).toBeVisible()
    await user.type(screen.getByRole('textbox', { name: /Nombre/ }), 'Tarjeta')
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }))
    expect(submit).toHaveBeenCalled()
    expect(submit.mock.calls[0]![0]).not.toHaveProperty('currentBalance')
  })
  it('traduce conflicto 409 sin filtrar detalles', () => {
    expect(
      accountErrorMessage(new ApiError('P2002', 409, 'CONFLICT')),
    ).toContain('Ya existe una cuenta')
  })
})
