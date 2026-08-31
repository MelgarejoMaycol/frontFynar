import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { AccountCard } from '@/features/accounts/components/AccountCard'
import { AccountForm } from '@/features/accounts/components/AccountForm'
import { BalanceAdjustmentDialog } from '@/features/accounts/components/BalanceAdjustmentDialog'
import { accountsApi } from '@/features/accounts/api/accounts.api'
import { transactionsApi } from '@/features/transactions/api/transactions.api'
import { accountErrorMessage } from '@/features/accounts/accounts.errors'
import { accountsKeys } from '@/features/accounts/hooks/accounts.hooks'
import {
  formatCurrency,
  isMoneyString,
} from '@/features/accounts/accounts.format'
import { accountFormSchema } from '@/features/accounts/schemas/account.schemas'
import type { Account } from '@/features/accounts/types/account.types'
import { ApiError } from '@/services/http'
import { httpClient } from '@/services/http'

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
  it('omite favorite en Todas y solo envía true en Solo favoritas', async () => {
    const get = vi.spyOn(httpClient, 'get').mockResolvedValue({ data: [] } as never)
    await accountsApi.list('workspace-a', false, undefined, true)
    expect(get.mock.calls[0]![0]).toContain('archived=false')
    expect(get.mock.calls[0]![0]).toContain('excludeCreditCards=true')
    expect(get.mock.calls[0]![0]).not.toContain('favorite=')
    await accountsApi.list('workspace-a', false, true, true)
    expect(get.mock.calls[1]![0]).toContain('favorite=true')
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
  it('presenta cuenta, favorita y modo solo lectura sin repetir la institución', () => {
    render(
      wrapper(
        <AccountCard
          account={account}
          canWrite={false}
          busy={false}
          onEdit={vi.fn()}
          onAdjust={vi.fn()}
          onFavorite={vi.fn()}
          onArchive={vi.fn()}
          onDelete={vi.fn()}
          onRestore={vi.fn()}
        />,
      ),
    )
    expect(screen.getByRole('heading', { name: 'Ahorros' })).toBeVisible()
    expect(screen.queryByText('Banco')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Cuenta favorita')).toBeVisible()
    expect(screen.getByRole('link', { name: 'Ver detalle' })).toBeVisible()
    expect(
      screen.queryByRole('button', { name: 'Editar' }),
    ).not.toBeInTheDocument()
  })
  it('abre el menú completo de acciones de una cuenta', async () => {
    const user = userEvent.setup()
    render(
      wrapper(
        <AccountCard
          account={account}
          canWrite
          busy={false}
          onEdit={vi.fn()}
          onAdjust={vi.fn()}
          onFavorite={vi.fn()}
          onArchive={vi.fn()}
          onDelete={vi.fn()}
          onRestore={vi.fn()}
        />,
      ),
    )
    const trigger = screen.getByLabelText('Acciones de Ahorros')
    await user.click(trigger)
    expect(trigger.closest('details')).toHaveAttribute('open')
    expect(screen.getByRole('button', { name: 'Editar' })).toBeVisible()
    expect(screen.getByRole('button', { name: 'Ajustar saldo' })).toBeVisible()
    expect(screen.getByRole('button', { name: 'Archivar' })).toBeVisible()
    expect(screen.getByRole('button', { name: 'Eliminar' })).toBeVisible()
  })
  it('crea cuentas con centavos progresivos y sin ofrecer tarjetas', async () => {
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
    expect(screen.queryByRole('option', { name: 'Tarjeta de crédito' })).not.toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: /Nombre/ })).toHaveAttribute('placeholder', 'Ej: Efectivo personal')
    await user.selectOptions(screen.getByRole('combobox', { name: /Tipo/ }), 'E_WALLET')
    expect(screen.getByRole('textbox', { name: /Nombre/ })).toHaveAttribute('placeholder', 'Ej: Nequi')
    await user.type(screen.getByRole('textbox', { name: /Nombre/ }), 'Nequi')
    const opening = screen.getByRole('textbox', { name: /Saldo inicial/ })
    await user.clear(opening)
    await user.type(opening, '9876543')
    expect(opening).toHaveValue('98.765,43')
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }))
    expect(submit).toHaveBeenCalledWith(expect.objectContaining({ openingBalance: '98765.43' }))
  })
  it('no permite editar el saldo inicial ni lo incluye en el PATCH', async () => {
    const submit = vi.fn()
    const user = userEvent.setup()
    render(wrapper(<AccountForm currency="COP" account={account} pending={false} error={null} onSubmit={submit} onCancel={vi.fn()} />))
    expect(screen.queryByLabelText(/Saldo inicial/)).not.toBeInTheDocument()
    await user.clear(screen.getByRole('textbox', { name: /Nombre/ }))
    await user.type(screen.getByRole('textbox', { name: /Nombre/ }), 'Ahorros editada')
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))
    expect(submit).toHaveBeenCalled()
    expect(submit.mock.calls[0]![0]).not.toHaveProperty('openingBalance')
  })
  it('ajusta saldo con centavos progresivos y envía el decimal normalizado', async () => {
    const adjust = vi.spyOn(transactionsApi, 'adjust').mockResolvedValue({} as never)
    const user = userEvent.setup()
    render(
      wrapper(
        <BalanceAdjustmentDialog
          workspaceId="workspace-a"
          account={account}
          open
          onClose={vi.fn()}
        />,
      ),
    )
    const input = screen.getByRole('textbox', { name: 'Saldo real actual' })
    await user.clear(input)
    await user.type(input, '9876543')
    expect(input).toHaveValue('98.765,43')
    expect(screen.getByText(/1\.401\.234,82/)).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Registrar ajuste' }))
    await waitFor(() =>
      expect(adjust).toHaveBeenCalledWith(
        'workspace-a',
        expect.objectContaining({ accountId: account.id, actualBalance: '98765.43' }),
      ),
    )
  })
  it('traduce conflicto 409 sin filtrar detalles', () => {
    expect(
      accountErrorMessage(new ApiError('P2002', 409, 'CONFLICT')),
    ).toContain('Ya existe una cuenta')
  })
})
