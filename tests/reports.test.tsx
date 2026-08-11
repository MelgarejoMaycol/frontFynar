import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  fireEvent,
  render,
  renderHook,
  screen,
  waitFor,
} from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ApiError, httpClient } from '@/services/http'
import { reportsApi } from '@/features/reports/api/reports.api'
import { IncomeVsExpensesReport } from '@/features/reports/components/IncomeVsExpensesReport'
import { ReportsPeriodFilter } from '@/features/reports/components/ReportsPeriodFilter'
import {
  reportKeys,
  useIncomeVsExpenses,
} from '@/features/reports/hooks/reports.hooks'
import { getReportErrorMessage } from '@/features/reports/reports.errors'
import {
  calendarRangeDays,
  customRangeError,
} from '@/features/reports/reports.validation'

const provider = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={new QueryClient()}>
    {children}
  </QueryClientProvider>
)
describe('reports', () => {
  it('aísla keys por workspace, periodo y agrupación', () => {
    expect(reportKeys.all('a')).not.toEqual(reportKeys.all('b'))
    expect(reportKeys.income('a', { period: 'CURRENT_MONTH' })).not.toEqual(
      reportKeys.income('a', { period: 'PREVIOUS_MONTH' }),
    )
    expect(
      reportKeys.cashFlow('a', { period: 'CURRENT_YEAR', groupBy: 'WEEK' }),
    ).not.toEqual(
      reportKeys.cashFlow('a', { period: 'CURRENT_YEAR', groupBy: 'MONTH' }),
    )
  })
  it('usa endpoints reales y envía CUSTOM con DAY, WEEK y MONTH', async () => {
    const get = vi
      .spyOn(httpClient, 'get')
      .mockResolvedValue({ success: true, data: {} })
    const params = {
      period: 'CUSTOM',
      dateFrom: '2026-08-01',
      dateTo: '2026-08-31',
      currency: 'COP',
    } as const
    await reportsApi.incomeVsExpenses('w', params)
    await reportsApi.expensesByCategory('w', params)
    await reportsApi.cashFlow('w', { ...params, groupBy: 'DAY' })
    await reportsApi.cashFlow('w', { ...params, groupBy: 'WEEK' })
    await reportsApi.cashFlow('w', { ...params, groupBy: 'MONTH' })
    await reportsApi.accountBalances('w', { currency: 'COP' })
    const paths = get.mock.calls.map((call) => call[0])
    expect(paths).toEqual(
      expect.arrayContaining([
        expect.stringContaining('/workspaces/w/reports/income-vs-expenses?'),
        expect.stringContaining('/workspaces/w/reports/expenses-by-category?'),
        expect.stringContaining('groupBy=DAY'),
        expect.stringContaining('groupBy=WEEK'),
        expect.stringContaining('groupBy=MONTH'),
        expect.stringContaining(
          '/workspaces/w/reports/account-balances?currency=COP',
        ),
      ]),
    )
    expect(paths[0]).toContain('dateFrom=2026-08-01')
  })
  it('no ejecuta la query si está deshabilitada', async () => {
    const api = vi.spyOn(reportsApi, 'incomeVsExpenses')
    renderHook(
      () => useIncomeVsExpenses('w', { period: 'CURRENT_MONTH' }, false),
      { wrapper: provider },
    )
    await waitFor(() => expect(api).not.toHaveBeenCalled())
  })
  it('expone errores seguros', () => {
    expect(
      getReportErrorMessage(new ApiError('SELECT secret', 500, 'INTERNAL')),
    ).not.toContain('SELECT')
  })
  it('muestra monedas en secciones separadas', () => {
    const row = {
      totalIncome: '100',
      totalExpenses: '20',
      netCashFlow: '80',
      incomeTransactionCount: 1,
      expenseTransactionCount: 1,
      averageIncome: '100',
      averageExpense: '20',
      comparisonWithPreviousPeriod: {},
    }
    render(
      <IncomeVsExpensesReport
        data={{
          period: {
            type: 'CURRENT_MONTH',
            dateFrom: 'x',
            dateTo: 'x',
            timezone: 'America/Bogota',
          },
          summariesByCurrency: [
            { ...row, currency: 'COP' },
            { ...row, currency: 'USD' },
          ],
        }}
      />,
    )
    expect(screen.getByLabelText('Resumen COP')).toBeVisible()
    expect(screen.getByLabelText('Resumen USD')).toBeVisible()
  })
  it('cambia periodo y muestra fechas para CUSTOM', () => {
    const change = vi.fn()
    render(
      <ReportsPeriodFilter
        value={{ period: 'CURRENT_MONTH' }}
        onChange={change}
        groupBy="DAY"
        onGroupChange={vi.fn()}
      />,
    )
    fireEvent.change(screen.getByLabelText('Periodo'), {
      target: { value: 'CUSTOM' },
    })
    expect(change).toHaveBeenCalledWith(
      expect.objectContaining({ period: 'CUSTOM', dateFrom: '', dateTo: '' }),
    )
  })
  it('acepta 366 días y rechaza un rango mayor', () => {
    expect(calendarRangeDays('2024-01-01', '2024-12-31')).toBe(366)
    expect(
      customRangeError({
        period: 'CUSTOM',
        dateFrom: '2024-01-01',
        dateTo: '2024-12-31',
      }),
    ).toBeNull()
    expect(
      customRangeError({
        period: 'CUSTOM',
        dateFrom: '2024-01-01',
        dateTo: '2025-01-01',
      }),
    ).toBe('El rango personalizado no puede superar 366 días.')
  })
})
