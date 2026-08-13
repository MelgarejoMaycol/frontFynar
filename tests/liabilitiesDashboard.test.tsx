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
  refetch: vi.fn(),
})

describe('LiabilitiesDashboardWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.permission = true
    mocks.summary.mockReturnValue(
      query({
        nextPayment: {
          name: 'Crédito moto',
          amount: '420000.00',
          currency: 'COP',
          date: '2026-09-03',
        },
        summariesByCurrency: [
          { currency: 'COP', overdueAmount: '180000.00' },
          { currency: 'USD', overdueAmount: '45.00' },
        ],
      }),
    )
    mocks.upcoming.mockReturnValue(
      query([
        { status: 'OVERDUE', currency: 'COP' },
        { status: 'OVERDUE', currency: 'COP' },
        { status: 'OVERDUE', currency: 'USD' },
      ]),
    )
  })

  it('muestra próximo pago y vencidos separados por moneda', () => {
    render(
      <MemoryRouter>
        <LiabilitiesDashboardWidget />
      </MemoryRouter>,
    )
    expect(screen.getByText('Crédito moto')).toBeVisible()
    expect(screen.getByText('2 pagos · COP')).toBeVisible()
    expect(screen.getByText('1 pagos · USD')).toBeVisible()
    expect(screen.getByRole('link', { name: 'Ver pagos' })).toHaveAttribute(
      'href',
      '/app/debts?tab=upcoming',
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
})
