import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { accountsApi } from '@/features/accounts/api/accounts.api'
import type { Account } from '@/features/accounts/types/account.types'
import { lendingApi } from '@/features/lending/api'
import type { LoanDetail, LoanListItem } from '@/features/lending/types'
import { LoanCollectionForm } from '@/features/transactions/components/LoanCollectionForm'

const account: Account = {
  id: '11111111-1111-4111-8111-111111111111',
  name: 'Nequi',
  type: 'DIGITAL_WALLET',
  nature: 'ASSET',
  institutionName: null,
  currency: 'COP',
  openingBalance: '200000.00',
  currentBalance: '200000.00',
  creditLimit: null,
  billingDay: null,
  paymentDueDay: null,
  color: null,
  icon: null,
  isFavorite: true,
  isActive: true,
  includeInNetWorth: true,
  createdAt: '2026-09-01T00:00:00.000Z',
  updatedAt: '2026-09-01T00:00:00.000Z',
}

const loan: LoanListItem = {
  id: '22222222-2222-4222-8222-222222222222',
  personId: '33333333-3333-4333-8333-333333333333',
  personName: 'David',
  currency: 'COP',
  originalPrincipal: '200000.00',
  currentPrincipal: '180000.00',
  ratePercent: '2.00',
  method: 'FIXED_PAYMENT',
  frequency: 'MONTHLY',
  termCount: 2,
  installmentAmount: '102000.00',
  expectedInterest: '4000.00',
  expectedTotal: '204000.00',
  interestReceived: '2000.00',
  principalReceived: '20000.00',
  nextDueDate: '2026-10-01',
  estimatedEndDate: '2026-11-01',
  status: 'ACTIVE',
}

const detail: LoanDetail = {
  ...loan,
  relationship: 'Amigo',
  receivableAccountId: '44444444-4444-4444-8444-444444444444',
  receivableAccountName: 'Préstamo a David',
  sourceAccountId: account.id,
  sourceAccountName: account.name,
  disbursementDate: '2026-09-01',
  firstPaymentDate: '2026-10-01',
  notes: null,
  installments: [
    {
      id: '55555555-5555-4555-8555-555555555555',
      installmentNumber: 1,
      dueDate: '2026-10-01',
      openingPrincipal: '200000.00',
      principalAmount: '100000.00',
      interestAmount: '2000.00',
      totalAmount: '102000.00',
      principalPaid: '20000.00',
      interestPaid: '2000.00',
      totalPaid: '22000.00',
      closingPrincipal: '100000.00',
      status: 'PARTIAL',
      paidAt: null,
    },
    {
      id: '66666666-6666-4666-8666-666666666666',
      installmentNumber: 2,
      dueDate: '2026-11-01',
      openingPrincipal: '100000.00',
      principalAmount: '100000.00',
      interestAmount: '2000.00',
      totalAmount: '102000.00',
      principalPaid: '0.00',
      interestPaid: '0.00',
      totalPaid: '0.00',
      closingPrincipal: '0.00',
      status: 'PENDING',
      paidAt: null,
    },
  ],
  payments: [],
}

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

const mockResources = () => {
  vi.spyOn(accountsApi, 'list').mockResolvedValue({ success: true, data: [account] })
  vi.spyOn(lendingApi, 'list').mockResolvedValue({ success: true, data: [loan] })
  vi.spyOn(lendingApi, 'get').mockResolvedValue({ success: true, data: detail })
  return vi
    .spyOn(lendingApi, 'collect')
    .mockResolvedValue({ success: true, data: detail })
}

afterEach(() => vi.restoreAllMocks())

describe('cobro de préstamos desde movimientos', () => {
  it('propone la cuota pendiente y la registra en la cuenta receptora', async () => {
    const collect = mockResources()
    const user = userEvent.setup()
    const onSuccess = vi.fn()

    render(
      <LoanCollectionForm
        workspaceId="workspace"
        timezone="America/Bogota"
        onSuccess={onSuccess}
        onCancel={vi.fn()}
      />,
      { wrapper },
    )

    await user.selectOptions(
      await screen.findByRole('combobox', { name: /Préstamo que te pagaron/ }),
      loan.id,
    )

    const amount = await screen.findByRole('textbox', { name: /Monto recibido/ })
    await waitFor(() => expect(amount).toHaveValue('80.000,00'))
    expect(
      screen.getByRole('combobox', { name: /Cuenta donde recibiste/ }),
    ).toHaveValue(account.id)

    await user.click(screen.getByRole('button', { name: 'Registrar cobro' }))

    await waitFor(() => expect(collect).toHaveBeenCalledTimes(1))
    expect(collect).toHaveBeenCalledWith(
      'workspace',
      loan.id,
      expect.objectContaining({
        receivingAccountId: account.id,
        amount: '80000.00',
        idempotencyKey: expect.any(String),
      }),
    )
    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1))
  })

  it('permite registrar otro abono distinto de la cuota', async () => {
    const collect = mockResources()
    const user = userEvent.setup()

    render(
      <LoanCollectionForm
        workspaceId="workspace"
        timezone="America/Bogota"
        onSuccess={vi.fn()}
        onCancel={vi.fn()}
      />,
      { wrapper },
    )

    await user.selectOptions(
      await screen.findByRole('combobox', { name: /Préstamo que te pagaron/ }),
      loan.id,
    )
    await user.selectOptions(
      await screen.findByRole('combobox', { name: /Qué pago recibiste/ }),
      'CUSTOM',
    )

    const amount = screen.getByRole('textbox', { name: /Monto recibido/ })
    await user.type(amount, '2500000')
    expect(amount).toHaveValue('25.000,00')

    await user.click(screen.getByRole('button', { name: 'Registrar cobro' }))

    await waitFor(() => expect(collect).toHaveBeenCalledTimes(1))
    expect(collect.mock.calls[0]?.[2]).toEqual(
      expect.objectContaining({ amount: '25000.00' }),
    )
  })
})
