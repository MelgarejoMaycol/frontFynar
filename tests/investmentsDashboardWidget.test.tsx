import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, useLocation } from 'react-router'
import { InvestmentsDashboardWidget } from '@/features/investments/InvestmentsDashboardWidget'

const mocks = vi.hoisted(() => ({
  plans: vi.fn(),
}))

vi.mock('@/features/investments/hooks', () => ({
  useInvestmentPlans: (...args: unknown[]) => mocks.plans(...args),
}))

function LocationDisplay() {
  return <span data-testid="location">{useLocation().pathname}</span>
}

const plan = {
  id: 'plan-1',
  name: 'Plan activo',
  description: null,
  currency: 'COP',
  status: 'ACTIVE',
  plannedInitialAmount: '500000.00',
  recurringContribution: '100000.00',
  contributionFrequency: 'MONTHLY',
  horizonYears: 5,
  annualReturn: '0.08000000',
  annualFee: '0.00000000',
  inflationRate: '0.04000000',
  startDate: '2026-09-14',
  includeInNetWorth: true,
  notes: null,
  createdAt: '2026-09-14T12:00:00.000Z',
  updatedAt: '2026-09-14T13:00:00.000Z',
  progress: {
    status: 'ACTIVE',
    actual: {
      totalContributed: '500000.00',
      totalWithdrawn: '0.00',
      netContributed: '500000.00',
      currentValue: '525000.00',
      valuationBasis: 'MANUAL_PLUS_FLOWS',
      latestValuationAt: '2026-09-14T13:00:00.000Z',
    },
    plan: {
      expectedContributedToDate: '500000.00',
      projectedValueToday: '510000.00',
      projectedValueAtHorizon: '10000000.00',
      projectedProfitAtHorizon: '2500000.00',
      varianceCurrentVsProjected: '15000.00',
    },
    pace: {
      status: 'ON_TRACK',
      ratio: '100.00',
      headline: 'Vas cerca del ritmo que elegiste',
      explanation: 'Tus aportes están próximos a la referencia.',
    },
    nextSuggestion: {
      date: '2026-10-14',
      amount: '100000.00',
      message: 'Referencia voluntaria',
    },
  },
  recentContributions: [],
  recentWithdrawals: [],
  recentValuations: [],
}

describe('InvestmentsDashboardWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('muestra solo inversiones activas y permite abrir su detalle', () => {
    mocks.plans.mockReturnValue({
      isPending: false,
      isError: false,
      data: [
        { ...plan, status: 'PAUSED', id: 'paused', name: 'Plan pausado' },
        plan,
      ],
    })

    render(
      <MemoryRouter>
        <InvestmentsDashboardWidget workspaceId="workspace-1" />
        <LocationDisplay />
      </MemoryRouter>,
    )

    expect(screen.getByLabelText('Inversiones activas')).toBeVisible()
    expect(
      screen.getByRole('heading', { name: /^Plan activo$/ }),
    ).toBeVisible()
    expect(screen.queryByText('Plan pausado')).not.toBeInTheDocument()

    fireEvent.click(
      screen.getByRole('button', { name: 'Abrir inversión Plan activo' }),
    )

    expect(screen.getByTestId('location')).toHaveTextContent(
      '/app/investments/plan-1',
    )
  })

  it('no ocupa espacio en Inicio cuando no hay inversiones activas', () => {
    mocks.plans.mockReturnValue({
      isPending: false,
      isError: false,
      data: [
        { ...plan, status: 'DRAFT', id: 'draft' },
        { ...plan, status: 'PAUSED', id: 'paused' },
        { ...plan, status: 'COMPLETED', id: 'completed' },
      ],
    })

    render(
      <MemoryRouter>
        <InvestmentsDashboardWidget workspaceId="workspace-1" />
      </MemoryRouter>,
    )

    expect(screen.queryByLabelText('Inversiones activas')).not.toBeInTheDocument()
  })
})
