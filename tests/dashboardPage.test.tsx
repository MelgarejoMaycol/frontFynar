import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router'
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage'

vi.mock('@/features/dashboard/components/BudgetDashboardWidget', () => ({
  BudgetDashboardWidget: () => <section>Widget de presupuestos</section>,
}))
vi.mock('@/features/transactions/components/TransactionForm', () => ({
  TransactionForm: () => <form aria-label="Formulario de movimiento" />,
}))
import { ApiError } from '@/services/http'
const mocks = vi.hoisted(() => ({
  permission: true,
  dashboard: vi.fn(),
  refetch: vi.fn(),
  cycleStartDay: null as number | null,
}))
vi.mock('@/features/workspace', () => ({
  useActiveWorkspace: () => ({
    activeWorkspace: { id: 'w', timezone: 'America/Bogota' },
  }),
  usePermission: () => mocks.permission,
  usePreferences: () => ({
    data: { financialCycleStartDay: mocks.cycleStartDay },
    isSuccess: true,
  }),
}))
vi.mock('@/features/dashboard/hooks/dashboard.hooks', () => ({
  useDashboard: (...args: unknown[]) => mocks.dashboard(...args),
}))
vi.mock('@/features/transactions/hooks/transactions.hooks', () => ({
  useCreateTransaction: () => ({
    isPending: false,
    error: null,
    mutate: vi.fn(),
    reset: vi.fn(),
  }),
}))
vi.mock('@/features/accounts/hooks/accounts.hooks', () => ({
  useCreateAccount: () => ({
    isPending: false,
    error: null,
    mutate: vi.fn(),
    reset: vi.fn(),
  }),
}))
vi.mock('@/features/categories/hooks/categories.hooks', () => ({
  useCategories: () => ({
    data: [
      {
        id: 'c',
        name: 'Salario',
        type: 'INCOME',
        isActive: true,
      },
    ],
  }),
}))
vi.mock('@/features/liabilities/LiabilitiesDashboardWidget', () => ({
  LiabilitiesDashboardWidget: () => null,
}))
const transaction = {
  id: 't',
  type: 'INCOME',
  status: 'CONFIRMED',
  amount: '10.00',
  currency: 'COP',
  accountId: 'a',
  destinationAccountId: null,
  categoryId: 'c',
  occurredAt: '2026-08-11T01:30:00.000Z',
  description: 'Nómina',
  notes: null,
  merchantName: null,
  version: 1,
  createdAt: 'x',
  updatedAt: 'x',
}
const data = {
  period: {
    type: 'CURRENT_MONTH',
    dateFrom: 'x',
    dateTo: 'x',
    timezone: 'America/Bogota',
  },
  baseCurrency: 'COP',
  summariesByCurrency: [
    {
      currency: 'COP',
      availableMoney: '1000.00',
      totalIncome: '500.00',
      totalExpenses: '100.00',
      netCashFlow: '400.00',
      netWorth: '900.00',
    },
    {
      currency: 'USD',
      availableMoney: '20.00',
      totalIncome: '10.00',
      totalExpenses: '2.00',
      netCashFlow: '8.00',
      netWorth: '20.00',
    },
  ],
  accountBalances: [
    {
      id: 'a',
      name: 'Bancolombia',
      type: 'SAVINGS',
      nature: 'ASSET',
      currency: 'COP',
      currentBalance: '1000.00',
      isFavorite: true,
      includeInNetWorth: true,
    },
  ],
  recentTransactions: [transaction],
  budgetProgress: [],
  expensesByCategory: [],
  accountsByType: [],
  comparisonByCurrency: [],
}
const view = () =>
  render(
    <MemoryRouter>
      <DashboardPage />
    </MemoryRouter>,
  )
describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.permission = true
    mocks.cycleStartDay = null
    mocks.dashboard.mockReturnValue({
      isPending: false,
      isError: false,
      data,
      refetch: mocks.refetch,
    })
  })
  it('usa Mi ciclo como período inicial cuando está configurado', () => {
    mocks.cycleStartDay = 25
    view()
    expect(mocks.dashboard).toHaveBeenLastCalledWith(
      'w',
      expect.objectContaining({ period: 'MY_CYCLE' }),
      true,
    )
    expect(screen.getByLabelText('Periodo')).toHaveValue('MY_CYCLE')
    expect(screen.queryByText('Configurar Mi ciclo')).not.toBeInTheDocument()
  })
  it('ofrece configurar Mi ciclo cuando falta la preferencia', () => {
    view()
    expect(screen.getByRole('button', { name: 'Configurar Mi ciclo' })).toBeInTheDocument()
  })
  it('restringe acceso sin consultar datos financieros', () => {
    mocks.permission = false
    view()
    expect(screen.getByText('Acceso restringido')).toBeVisible()
    expect(mocks.dashboard).toHaveBeenCalledWith('w', expect.anything(), false)
  })
  it('muestra loading, error con retry y empty', () => {
    mocks.dashboard.mockReturnValueOnce({ isPending: true })
    const rendered = view()
    expect(screen.getByRole('status')).toBeInTheDocument()
    mocks.dashboard.mockReturnValue({
      isPending: false,
      isError: true,
      error: new ApiError('falló', 500, 'INTERNAL'),
      refetch: mocks.refetch,
    })
    rendered.rerender(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    )
    fireEvent.click(screen.getByRole('button', { name: /reintentar/i }))
    expect(mocks.refetch).toHaveBeenCalled()
    mocks.dashboard.mockReturnValue({
      isPending: false,
      isError: false,
      data: { ...data, accountBalances: [], recentTransactions: [] },
      refetch: mocks.refetch,
    })
    rendered.rerender(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    )
    expect(screen.getByText('Empieza a organizar tus finanzas')).toBeVisible()
  })
  it('presenta monedas separadas, cuentas, recientes y acción de navegación', () => {
    view()
    expect(screen.getByText('Valores en COP')).toBeVisible()
    expect(screen.getByText('Valores en USD')).toBeVisible()
    expect(screen.getByText('Bancolombia')).toBeVisible()
    expect(screen.getByText('Nómina')).toBeVisible()
    expect(
      screen.getByRole('button', { name: 'Nuevo movimiento' }),
    ).toBeVisible()
    expect(screen.getByText('Cuenta de ahorros')).toBeVisible()
    expect(
      screen.getByRole('link', { name: /Bancolombia\s*Cuenta favorita/i }),
    ).toHaveAttribute('href', '/app/accounts/a')
    expect(screen.getByRole('link', { name: /Nómina/i })).toHaveAttribute(
      'href',
      '/app/transactions?transactionId=t',
    )
  })
  it('limita los movimientos recientes a cinco', () => {
    mocks.dashboard.mockReturnValue({
      isPending: false,
      isError: false,
      data: {
        ...data,
        recentTransactions: Array.from({ length: 6 }, (_, index) => ({
          ...transaction,
          id: `t-${index}`,
          description: `Movimiento ${index + 1}`,
        })),
      },
      refetch: mocks.refetch,
    })
    view()
    expect(screen.getByText('Movimiento 5')).toBeVisible()
    expect(screen.queryByText('Movimiento 6')).not.toBeInTheDocument()
  })
  it('cambia periodo y valida CUSTOM antes de consultar', () => {
    view()
    fireEvent.click(screen.getAllByText('Periodo')[0]!)
    fireEvent.change(screen.getByLabelText('Periodo'), {
      target: { value: 'LAST_7_DAYS' },
    })
    expect(mocks.dashboard).toHaveBeenLastCalledWith(
      'w',
      expect.objectContaining({ period: 'LAST_7_DAYS' }),
      true,
    )
    fireEvent.change(screen.getByLabelText('Periodo'), {
      target: { value: 'CUSTOM' },
    })
    expect(
      screen.getByText('Selecciona las fechas desde y hasta.'),
    ).toBeVisible()
    expect(mocks.dashboard).toHaveBeenLastCalledWith(
      'w',
      expect.objectContaining({ period: 'CUSTOM' }),
      false,
    )
    fireEvent.change(screen.getByLabelText('Desde'), {
      target: { value: '2026-08-01' },
    })
    fireEvent.change(screen.getByLabelText('Hasta'), {
      target: { value: '2026-08-10' },
    })
    expect(mocks.dashboard).toHaveBeenLastCalledWith(
      'w',
      expect.objectContaining({
        period: 'CUSTOM',
        dateFrom: '2026-08-01',
        dateTo: '2026-08-10',
      }),
      true,
    )
  })
})
