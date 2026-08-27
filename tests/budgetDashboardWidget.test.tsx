import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { BudgetDashboardWidget } from '@/features/dashboard/components/BudgetDashboardWidget'

const mocks = vi.hoisted(() => ({ budgets: vi.fn() }))
vi.mock('@/features/workspace', () => ({
  useActiveWorkspace: () => ({ activeWorkspace: { id: 'w', timezone: 'America/Bogota' } }),
  usePermission: () => true,
}))
vi.mock('@/features/budgets/hooks/budgets.hooks', () => ({
  useBudgets: (...args: unknown[]) => mocks.budgets(...args),
}))
const budget = (id: string, percentage: number) => ({
  id, name: `Presupuesto ${id}`, period: 'MONTHLY', startsOn: '2026-08-01', endsOn: '2026-08-31',
  amount: '100000.00', currency: 'COP', alertThreshold: '80.00', rolloverEnabled: false, isActive: true,
  categories: [], accounts: [], createdAt: 'x', updatedAt: 'x',
  progress: { spent: `${percentage * 1000}.00`, remaining: `${(100 - percentage) * 1000}.00`, percentage: `${percentage}.00`, status: percentage > 100 ? 'EXCEEDED' : 'SAFE' },
  projection: { projectedSpend: '0', projectedRemaining: '0', projectedPercentage: '0', projectedStatus: 'SAFE' },
})
describe('widget de presupuestos', () => {
  it('muestra como máximo tres, prioriza mayor consumo y enlaza al detalle', () => {
    mocks.budgets.mockReturnValue({ isPending: false, isError: false, data: { items: [budget('a', 20), budget('b', 80), budget('c', 50), budget('d', 90)] } })
    render(<MemoryRouter><BudgetDashboardWidget /></MemoryRouter>)
    const links = screen.getAllByRole('link').filter((link) => link.getAttribute('href')?.includes('budgetId='))
    expect(links).toHaveLength(3)
    expect(links[0]).toHaveAttribute('href', '/app/budgets?budgetId=d')
    expect(screen.getByRole('progressbar', { name: /Presupuesto d/ })).toHaveAttribute('aria-valuenow', '90')
    expect(screen.getByRole('link', { name: 'Ver todos' })).toBeVisible()
  })
})
