import {
  act,
  fireEvent,
  render,
  renderHook,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  CardDetailPage,
  DebtDetailPage,
} from '@/features/liabilities/DetailPages'

const mocks = vi.hoisted(() => ({
  canWrite: true,
  reverse: vi.fn(),
  debt: vi.fn(),
  cards: vi.fn(),
  statements: vi.fn(),
  purchases: vi.fn(),
}))

vi.mock('@/features/workspace', () => ({
  useActiveWorkspace: () => ({
    activeWorkspace: { id: 'workspace-1', timezone: 'America/Bogota' },
  }),
  usePermission: () => mocks.canWrite,
}))
vi.mock('@/features/accounts/hooks/accounts.hooks', () => ({
  useAccounts: () => ({ data: [] }),
}))
vi.mock('@/features/categories/hooks/categories.hooks', () => ({
  useCategories: () => ({ data: [] }),
}))
vi.mock('@/features/liabilities/api', () => ({
  liabilitiesApi: {
    reverseDebtPayment: (...args: unknown[]) => mocks.reverse(...args),
  },
}))
vi.mock('@/features/liabilities/hooks', () => ({
  liabilityKeys: {
    debt: (w: string, id: string) => ['liabilities', w, 'debt', id],
  },
  useDebt: (...args: unknown[]) => mocks.debt(...args),
  useCards: (...args: unknown[]) => mocks.cards(...args),
  useStatements: (...args: unknown[]) => mocks.statements(...args),
  usePurchases: (...args: unknown[]) => mocks.purchases(...args),
  useCardActivity: () => query([]),
  useObligations: () => ({ data: [] }),
  useLiabilityMutation: (
    _w: string,
    fn: (input: unknown) => Promise<unknown>,
  ) => ({
    mutate: (input: unknown, options?: { onSuccess?: () => void }) =>
      void fn(input).then(() => options?.onSuccess?.()),
    isPending: false,
    isError: false,
    error: null,
  }),
}))

const query = (data: unknown) => ({
  data,
  isPending: false,
  isError: false,
  error: null,
  refetch: vi.fn(),
})
const payment = {
  id: 'payment-1',
  installmentId: 'installment-1',
  installmentNumber: 2,
  paidAt: '2026-08-12T12:00:00Z',
  totalAmount: '1000.00',
  principalAmount: '700.00',
  interestAmount: '200.00',
  insuranceAmount: '50.00',
  feeAmount: '50.00',
  extraPaymentAmount: '0.00',
  reversedAt: null,
  account: { id: 'account-1', name: 'Cuenta principal' },
}
const debt = {
  id: 'debt-1',
  name: 'Crédito',
  lenderName: 'Banco',
  type: 'BANK_LOAN',
  status: 'ACTIVE',
  currency: 'COP',
  originalAmount: '10000.00',
  currentBalance: '9000.00',
  interestRate: '1',
  interestRateBasis: 'EFFECTIVE_MONTHLY',
  interestType: 'FIXED',
  termMonths: 10,
  installmentAmount: '1000.00',
  disbursementDate: null,
  firstPaymentDate: null,
  estimatedEndDate: null,
  nextDueDate: null,
  paymentDay: null,
  liabilityAccountId: null,
  notes: null,
  createdAt: '2026-08-01',
  updatedAt: '2026-08-01',
  debtInstallments: [],
  debtPayments: [payment],
}

describe('cambios recientes de créditos y tarjetas', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.canWrite = true
    mocks.reverse.mockResolvedValue({ data: {} })
    mocks.debt.mockReturnValue(query(debt))
    mocks.cards.mockReturnValue(query([]))
    mocks.statements.mockReturnValue(query([]))
    mocks.purchases.mockReturnValue(query([]))
  })

  it('muestra desglose y exige motivo antes de llamar la reversión correcta', async () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter initialEntries={['/app/debts/debt-1']}>
          <Routes>
            <Route path="/app/debts/:debtId" element={<DebtDetailPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Revertir pago' }))
    const dialog = screen.getByRole('dialog', {
      name: 'Confirmar reversión del pago',
    })
    expect(within(dialog).getByText('Cuenta principal')).toBeVisible()
    expect(within(dialog).getByText(/700,00/)).toBeVisible()
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar reversión' }))
    expect(mocks.reverse).not.toHaveBeenCalled()
    fireEvent.change(screen.getByLabelText('Motivo de la reversión'), {
      target: { value: 'Pago duplicado' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar reversión' }))
    await waitFor(() =>
      expect(mocks.reverse).toHaveBeenCalledWith(
        'workspace-1',
        'debt-1',
        'payment-1',
        'Pago duplicado',
      ),
    )
  })

  it('oculta reversión sin permiso y para pagos revertidos', () => {
    mocks.canWrite = false
    mocks.debt.mockReturnValue(
      query({
        ...debt,
        debtPayments: [{ ...payment, reversedAt: '2026-08-13T00:00:00Z' }],
      }),
    )
    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter initialEntries={['/app/debts/debt-1']}>
          <Routes>
            <Route path="/app/debts/:debtId" element={<DebtDetailPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    )
    expect(
      screen.queryByRole('button', { name: 'Revertir pago' }),
    ).not.toBeInTheDocument()
    expect(screen.getByText('Revertido')).toBeVisible()
  })

  it('comunica que compra, saldo y cuota son estimados', () => {
    mocks.cards.mockReturnValue(
      query([
        {
          id: 'card-1',
          name: 'Tarjeta',
          currency: 'COP',
          currentBalance: '900.00',
          creditLimit: '5000.00',
          billingDay: 10,
          paymentDueDay: 25,
          usedCredit: '900.00',
          availableCredit: '4100.00',
          utilization: '18',
        },
      ]),
    )
    mocks.purchases.mockReturnValue(
      query([
        {
          id: 'purchase-1',
          installmentCount: 3,
          periodicRate: '0',
          outstandingBalance: '900.00',
          trackingStatus: 'ESTIMATED',
          transaction: {
            description: 'Computador',
            amount: '900.00',
            occurredAt: '2026-08-01',
          },
          installments: [
            {
              id: 'i-1',
              installmentNumber: 1,
              dueDate: '2026-09-01',
              principalAmount: '300.00',
              interestAmount: '0',
              totalAmount: '300.00',
              status: 'PENDING',
              trackingStatus: 'ESTIMATED',
            },
          ],
        },
      ]),
    )
    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter initialEntries={['/app/cards/card-1']}>
          <Routes>
            <Route path="/app/cards/:cardId" element={<CardDetailPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    )
    expect(screen.getByText('Estimado')).toBeVisible()
    expect(screen.getByText(/Saldo estimado/)).toBeVisible()
    expect(screen.getByText(/Cuota estimada 1\/3/)).toBeVisible()
    expect(screen.queryByText('Pagado')).not.toBeInTheDocument()
  })
})

describe('invalidaciones de pasivos', () => {
  it('refresca resumen, detalle, próximos pagos, cuentas, dashboard y reportes', async () => {
    vi.doUnmock('@/features/liabilities/hooks')
    const client = new QueryClient()
    const invalidate = vi.spyOn(client, 'invalidateQueries').mockResolvedValue()
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    )
    const hooks = await vi.importActual<
      typeof import('@/features/liabilities/hooks')
    >('@/features/liabilities/hooks')
    const { result } = renderHook(
      () => hooks.useLiabilityMutation('workspace-1', async () => undefined),
      { wrapper },
    )
    await act(async () => result.current.mutateAsync(undefined))
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: ['liabilities', 'workspace-1'],
    })
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: ['accounts', 'workspace-1'],
    })
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: ['dashboard', 'workspace-1'],
    })
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: ['reports', 'workspace-1'],
    })
  })
})
