import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ActionableOverview } from '@/features/dashboard/components/ActionableOverview'

const mocks = vi.hoisted(() => ({
  upcoming: vi.fn(),
  budgets: vi.fn(),
}))

vi.mock('@/features/liabilities/hooks', () => ({
  useUpcoming: (...args: unknown[]) => mocks.upcoming(...args),
}))

vi.mock('@/features/budgets/hooks/budgets.hooks', () => ({
  useBudgets: (...args: unknown[]) => mocks.budgets(...args),
}))

const summaries = [
  {
    currency: 'COP',
    totalMoney: '1000000.00',
    reservedForGoals: '200000.00',
    availableMoney: '800000.00',
    totalIncome: '1500000.00',
    totalExpenses: '900000.00',
    netCashFlow: '600000.00',
    netWorth: '1000000.00',
  },
]

const accounts = [
  {
    id: 'account-1',
    name: 'Ahorros',
    type: 'SAVINGS' as const,
    nature: 'ASSET' as const,
    currency: 'COP',
    currentBalance: '1000000.00',
    reservedForGoals: '200000.00',
    availableBalance: '800000.00',
    isFavorite: true,
    includeInNetWorth: true,
  },
]

const comparisons = [
  {
    currency: 'COP',
    currentIncome: '1500000.00',
    previousIncome: '1400000.00',
    incomeChangeAmount: '100000.00',
    incomeChangePercentage: '7.14',
    currentExpenses: '900000.00',
    previousExpenses: '600000.00',
    expenseChangeAmount: '300000.00',
    expenseChangePercentage: '50.00',
    currentNetCashFlow: '600000.00',
    previousNetCashFlow: '800000.00',
  },
]

const renderOverview = () =>
  render(
    <MemoryRouter>
      <ActionableOverview
        summaries={summaries}
        accounts={accounts}
        comparisons={comparisons}
        workspaceId="workspace-1"
        timezone="America/Bogota"
      />
    </MemoryRouter>,
  )

describe('ActionableOverview', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.upcoming.mockReturnValue({
      isError: false,
      data: [
        {
          type: 'OBLIGATION',
          id: 'payment-1',
          resourceId: 'obligation-1',
          name: 'Internet',
          date: '2026-09-06',
          amount: '100000.00',
          currency: 'COP',
          status: 'PENDING',
          daysRemaining: 3,
          source: 'SCHEDULED',
          amountLabel: 'Pago esperado',
        },
        {
          type: 'DEBT_INSTALLMENT',
          id: 'payment-2',
          resourceId: 'debt-1',
          name: 'Cuota moto',
          date: '2026-09-20',
          amount: '300000.00',
          currency: 'COP',
          status: 'PENDING',
          daysRemaining: 17,
          source: 'SCHEDULED',
          amountLabel: 'Cuota',
        },
      ],
    })
    mocks.budgets.mockReturnValue({
      isError: false,
      data: {
        items: [
          {
            id: 'budget-1',
            name: 'Restaurantes',
            period: 'MONTHLY',
            startsOn: '2026-09-01',
            endsOn: '2026-09-30',
            amount: '300000.00',
            currency: 'COP',
            alertThreshold: '80.00',
            rolloverEnabled: false,
            isActive: true,
            categories: [],
            accounts: [],
            progress: {
              spent: '255000.00',
              remaining: '45000.00',
              percentage: '85.00',
              status: 'WARNING',
            },
            projection: {
              projectedSpend: '390000.00',
              projectedRemaining: '-90000.00',
              projectedPercentage: '130.00',
              projectedStatus: 'EXCEEDED',
            },
            createdAt: '2026-09-01T00:00:00.000Z',
            updatedAt: '2026-09-01T00:00:00.000Z',
          },
        ],
      },
    })
  })

  it('separa saldo, reservas, compromisos y disponibilidad estimada', () => {
    renderOverview()
    expect(screen.getByText('Tu situación hoy')).toBeVisible()
    expect(screen.getByText('Disponible para usar')).toBeVisible()
    expect(screen.getByText('Saldo total')).toBeVisible()
    expect(screen.getByText('En metas')).toBeVisible()
    expect(screen.getByText('Compromisos · 30 días')).toBeVisible()
    expect(screen.getByText('Después de compromisos quedarían')).toBeVisible()
    expect(
      screen.getByText(/los pagos próximos todavía no se descuentan/i),
    ).toBeVisible()
    expect(screen.getAllByText(/400\.000/)).toHaveLength(2)
  })

  it('prioriza vencimientos cercanos, presupuestos en riesgo y comparación', () => {
    renderOverview()
    expect(screen.getByText('Internet vence en 3 días')).toBeVisible()
    expect(screen.getByText('Restaurantes necesita atención')).toBeVisible()
    expect(screen.getByText('Estás gastando más')).toBeVisible()
    expect(screen.getByText(/50 % por encima/)).toBeVisible()
  })

  it('degrada sin romper el inicio cuando una fuente secundaria falla', () => {
    mocks.upcoming.mockReturnValue({ isError: true, data: undefined })
    mocks.budgets.mockReturnValue({ isError: true, data: undefined })
    renderOverview()
    expect(
      screen.getByText('Algunos avisos no pudieron actualizarse.'),
    ).toBeVisible()
    expect(screen.getByText('Tu situación hoy')).toBeVisible()
  })
})
