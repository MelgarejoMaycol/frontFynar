import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router'
import { ReportsPage } from '@/features/reports/pages/ReportsPage'
const mocks = vi.hoisted(() => ({
  read: true,
  enabled: [] as boolean[],
  retry: vi.fn(),
  mode: 'data',
  cashParams: [] as Array<{ groupBy?: string }>,
}))
vi.mock('@/features/workspace', () => ({
  useActiveWorkspace: () => ({
    activeWorkspace: { id: 'w', timezone: 'America/Bogota' },
  }),
  usePermission: () => mocks.read,
}))
const period = {
  type: 'CURRENT_MONTH',
  dateFrom: '2026-08-01T05:00:00Z',
  dateTo: '2026-09-01T04:59:59Z',
  timezone: 'America/Bogota',
}
const state = (data: unknown, enabled: boolean) => {
  mocks.enabled.push(enabled)
  return mocks.mode === 'loading'
    ? { isPending: true, isError: false, refetch: mocks.retry }
    : mocks.mode === 'error'
      ? {
          isPending: false,
          isError: true,
          error: new Error('secret'),
          refetch: mocks.retry,
        }
      : { isPending: false, isError: false, data, refetch: mocks.retry }
}
vi.mock('@/features/reports/hooks/reports.hooks', () => ({
  useIncomeVsExpenses: (_w: string, _p: unknown, e: boolean) =>
    state(
      {
        period,
        summariesByCurrency:
          mocks.mode === 'empty'
            ? []
            : [
                {
                  currency: 'COP',
                  totalIncome: '100',
                  totalExpenses: '40',
                  netCashFlow: '60',
                  incomeTransactionCount: 1,
                  expenseTransactionCount: 1,
                  averageIncome: '100',
                  averageExpense: '40',
                  comparisonWithPreviousPeriod: {},
                },
                {
                  currency: 'USD',
                  totalIncome: '10',
                  totalExpenses: '2',
                  netCashFlow: '8',
                  incomeTransactionCount: 1,
                  expenseTransactionCount: 1,
                  averageIncome: '10',
                  averageExpense: '2',
                  comparisonWithPreviousPeriod: {},
                },
              ],
      },
      e,
    ),
  useExpensesByCategory: (_w: string, _p: unknown, e: boolean) =>
    state(
      {
        period,
        groupsByCurrency:
          mocks.mode === 'empty'
            ? []
            : [
                {
                  currency: 'COP',
                  totalExpenses: '40',
                  categories: [
                    {
                      categoryId: 'c',
                      categoryName: 'Alimentación',
                      icon: null,
                      color: '#123456',
                      amount: '40',
                      percentage: '100',
                      transactionCount: 1,
                    },
                  ],
                },
              ],
      },
      e,
    ),
  useCashFlow: (_w: string, p: { groupBy?: string }, e: boolean) => {
    mocks.cashParams.push(p)
    return state(
      {
        period,
        groupBy: p.groupBy ?? 'DAY',
        seriesByCurrency:
          mocks.mode === 'empty'
            ? []
            : [
                {
                  currency: 'COP',
                  points: [
                    {
                      periodStart: '2026-08-01T05:00:00Z',
                      periodEnd: '2026-08-02T04:59:59Z',
                      totalIncome: '100',
                      totalExpenses: '40',
                      netCashFlow: '60',
                      incomeCount: 1,
                      expenseCount: 1,
                    },
                  ],
                },
              ],
      },
      e,
    )
  },
  useAccountBalancesReport: (_w: string, _p: unknown, e: boolean) =>
    state(
      {
        summariesByCurrency: [],
        accounts:
          mocks.mode === 'empty'
            ? []
            : [
                {
                  id: 'a',
                  name: 'Bancolombia',
                  type: 'SAVINGS',
                  nature: 'ASSET',
                  currency: 'COP',
                  currentBalance: '500',
                  isFavorite: true,
                  includeInNetWorth: true,
                  isActive: true,
                },
              ],
        pagination: { page: 1, limit: 100, total: 1, totalPages: 1 },
      },
      e,
    ),
}))
describe('ReportsPage', () => {
  const renderPage = () =>
    render(
      <MemoryRouter>
        <ReportsPage />
      </MemoryRouter>,
    )
  beforeEach(() => {
    mocks.read = true
    mocks.mode = 'data'
    mocks.enabled = []
    mocks.cashParams = []
    mocks.retry.mockClear()
  })
  it('restringe acceso y deshabilita todas las queries', () => {
    mocks.read = false
    renderPage()
    expect(screen.getByText('Acceso restringido')).toBeVisible()
    expect(mocks.enabled.every((value) => !value)).toBe(true)
  })
  it('muestra loading por secciones', () => {
    mocks.mode = 'loading'
    renderPage()
    expect(screen.getAllByRole('status')).toHaveLength(4)
  })
  it('permite reintentar errores por sección', () => {
    mocks.mode = 'error'
    renderPage()
    fireEvent.click(screen.getAllByRole('button', { name: 'Reintentar' })[0]!)
    expect(mocks.retry).toHaveBeenCalled()
  })
  it('muestra empty states independientes', () => {
    mocks.mode = 'empty'
    renderPage()
    expect(
      screen.getByText('No hay ingresos ni gastos en este periodo.'),
    ).toBeVisible()
    expect(
      screen.getByText('No hay cuentas activas para mostrar.'),
    ).toBeVisible()
  })
  it('renderiza todos los reportes y mantiene monedas separadas', () => {
    renderPage()
    expect(screen.getByText('Ingresos frente a gastos')).toBeVisible()
    expect(screen.getByLabelText('Resumen COP')).toBeVisible()
    expect(screen.getByLabelText('Resumen USD')).toBeVisible()
    expect(screen.getByText('Alimentación')).toBeVisible()
    expect(screen.getByLabelText('Flujo COP')).toBeVisible()
    expect(screen.getByText('Bancolombia')).toBeVisible()
    expect(screen.getByRole('link', { name: 'Ver cuenta' })).toHaveAttribute(
      'href',
      '/app/accounts',
    )
  })
  it('CUSTOM exige fechas antes de consultar', () => {
    renderPage()
    fireEvent.change(screen.getByLabelText('Periodo'), {
      target: { value: 'CUSTOM' },
    })
    expect(
      screen.getByText('Selecciona un rango de fechas válido.'),
    ).toBeVisible()
    expect(mocks.enabled.slice(-4, -1).every((value) => !value)).toBe(true)
    fireEvent.change(screen.getByLabelText('Desde'), {
      target: { value: '2026-08-01' },
    })
    fireEvent.change(screen.getByLabelText('Hasta'), {
      target: { value: '2026-08-31' },
    })
    expect(
      screen.queryByText('Selecciona un rango de fechas válido.'),
    ).not.toBeInTheDocument()
  })
  it('envía y muestra DAY, WEEK y MONTH según el selector real', () => {
    renderPage()
    expect(mocks.cashParams.at(-1)?.groupBy).toBe('DAY')
    fireEvent.change(screen.getByLabelText('Agrupar por'), {
      target: { value: 'WEEK' },
    })
    expect(mocks.cashParams.at(-1)?.groupBy).toBe('WEEK')
    expect(screen.getByText(/agrupación week/)).toBeVisible()
    fireEvent.change(screen.getByLabelText('Periodo'), {
      target: { value: 'CURRENT_YEAR' },
    })
    expect(mocks.cashParams.at(-1)?.groupBy).toBe('MONTH')
    expect(screen.getByText(/agrupación month/)).toBeVisible()
  })
  it('navega por meses completos usando el periodo personalizado', () => {
    renderPage()
    expect(screen.getByText('agosto de 2026')).toBeVisible()
    fireEvent.click(screen.getByRole('button', { name: 'Mes anterior' }))
    expect(screen.getByText(/julio de 2026/i)).toBeVisible()
    expect(screen.getByLabelText('Desde')).toHaveValue('2026-07-01')
    expect(screen.getByLabelText('Hasta')).toHaveValue('2026-07-31')
    fireEvent.click(screen.getByRole('button', { name: 'Mes siguiente' }))
    expect(screen.getByText('agosto de 2026')).toBeVisible()
  })
  it('no consulta reportes financieros si CUSTOM supera 366 días', () => {
    renderPage()
    fireEvent.change(screen.getByLabelText('Periodo'), {
      target: { value: 'CUSTOM' },
    })
    fireEvent.change(screen.getByLabelText('Desde'), {
      target: { value: '2024-01-01' },
    })
    fireEvent.change(screen.getByLabelText('Hasta'), {
      target: { value: '2025-01-01' },
    })
    expect(
      screen.getByText('El rango personalizado no puede superar 366 días.'),
    ).toBeVisible()
    expect(mocks.enabled.slice(-4, -1).every((value) => !value)).toBe(true)
  })
})
