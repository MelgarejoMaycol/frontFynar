import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { LiabilitiesDashboardWidget } from '@/features/liabilities/LiabilitiesDashboardWidget'

const mocks = vi.hoisted(() => ({
  permission: true,
  summary: vi.fn(),
  upcoming: vi.fn(),
}))

vi.mock('@/features/workspace', () => ({
  useActiveWorkspace: () => ({ activeWorkspace: { id: 'workspace-1' } }),
  usePermission: () => mocks.permission,
}))
vi.mock('@/features/liabilities/hooks', () => ({
  useSummary: (...args: unknown[]) => mocks.summary(...args),
  useUpcoming: (...args: unknown[]) => mocks.upcoming(...args),
}))

const query = (data: unknown) => ({
  data,
  isPending: false,
  isError: false,
  isSuccess: true,
  refetch: vi.fn(),
})

describe('LiabilitiesDashboardWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.permission = true
    mocks.summary.mockReturnValue(
      query({
        nextPayment: {
          type: 'DEBT_INSTALLMENT',
          id: 'installment-1',
          resourceId: 'debt-1',
          name: 'Crédito moto',
          amount: '420000.00',
          currency: 'COP',
          date: '2026-09-03',
        },
        summariesByCurrency: [
          { currency: 'COP', overdueAmount: '180000.00' },
          { currency: 'USD', overdueAmount: '45.00' },
        ],
        upcoming: [
          { status: 'OVERDUE', currency: 'COP', type: 'DEBT_INSTALLMENT', resourceId: 'debt-overdue' },
          { status: 'OVERDUE', currency: 'COP' },
          { status: 'OVERDUE', currency: 'USD' },
        ],
      }),
    )
    mocks.upcoming.mockReturnValue(query([
      {
        type: 'DEBT_INSTALLMENT', id: 'installment-overdue', resourceId: 'debt-overdue',
        name: 'Crédito vencido', amount: '180000.00', currency: 'COP',
        date: '2026-08-01', status: 'OVERDUE', daysRemaining: -10,
      },
      {
        type: 'DEBT_INSTALLMENT', id: 'installment-1', resourceId: 'debt-1',
        name: 'Crédito moto', amount: '420000.00', currency: 'COP',
        date: '2026-09-03', status: 'PENDING', daysRemaining: 13,
      },
    ]))
  })

  it('muestra vencidos primero y enlaces directos', () => {
    render(
      <MemoryRouter>
        <LiabilitiesDashboardWidget />
      </MemoryRouter>,
    )
    expect(screen.getByText('Crédito moto')).toBeVisible()
    expect(screen.getByRole('link', { name: /Abrir Crédito moto/ })).toHaveAttribute(
      'href',
      '/app/debts/debt-1',
    )
    expect(screen.getByText(/Vencido/)).toBeVisible()
    expect(screen.getByRole('link', { name: 'Ver todos' })).toHaveAttribute(
      'href',
      '/app/debts#upcoming',
    )
  })

  it('sin debts.read no consulta ni muestra datos financieros', () => {
    mocks.permission = false
    render(
      <MemoryRouter>
        <LiabilitiesDashboardWidget />
      </MemoryRouter>,
    )
    expect(mocks.summary).not.toHaveBeenCalled()
    expect(mocks.upcoming).not.toHaveBeenCalled()
    expect(screen.queryByText('Créditos y pagos')).not.toBeInTheDocument()
  })

  it('distingue loading, error y vacío exitoso', () => {
    mocks.upcoming.mockReturnValueOnce({ isPending: true })
    const rendered = render(<MemoryRouter><LiabilitiesDashboardWidget /></MemoryRouter>)
    expect(screen.getByText('Cargando créditos y pagos…')).toBeVisible()

    mocks.upcoming.mockReturnValueOnce({
      isPending: false,
      isError: true,
      refetch: vi.fn(),
    })
    rendered.rerender(<MemoryRouter><LiabilitiesDashboardWidget /></MemoryRouter>)
    expect(screen.getByText('No pudimos cargar créditos y pagos')).toBeVisible()

    mocks.upcoming.mockReturnValue({
      data: [],
      isPending: false,
      isError: false,
      isSuccess: true,
      refetch: vi.fn(),
    })
    rendered.rerender(<MemoryRouter><LiabilitiesDashboardWidget /></MemoryRouter>)
    expect(screen.getByText('No tienes pagos pendientes.')).toBeVisible()
  })
})
