import { fireEvent, render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { BudgetsPage } from '@/features/budgets/pages/BudgetsPage'
const mocks = vi.hoisted(() => ({
  read: true,
  write: true,
  list: vi.fn(),
  detail: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  archive: vi.fn(),
  restore: vi.fn(),
  refetch: vi.fn(),
}))
const budget = {
  id: 'b',
  name: 'Alimentación Agosto',
  period: 'MONTHLY',
  startsOn: '2026-08-01',
  endsOn: '2026-08-31',
  amount: '600000.00',
  currency: 'COP',
  alertThreshold: '80.00',
  rolloverEnabled: false,
  isActive: true,
  categories: [{ id: 'c', name: 'Alimentación' }],
  accounts: [{ id: 'a', name: 'Bancolombia' }],
  progress: {
    spent: '35000.00',
    remaining: '565000.00',
    percentage: '5.83',
    status: 'SAFE',
  },
  projection: {
    projectedSpend: '700000.00',
    projectedRemaining: '-100000.00',
    projectedPercentage: '116.67',
    projectedStatus: 'EXCEEDED',
  },
  createdAt: 'x',
  updatedAt: 'x',
}
vi.mock('@/features/workspace', () => ({
  useActiveWorkspace: () => ({
    activeWorkspace: {
      id: 'w',
      baseCurrency: 'COP',
      timezone: 'America/Bogota',
    },
  }),
  usePermission: (p: string) =>
    p === 'budgets.read' ? mocks.read : mocks.write,
}))
vi.mock('@/components/feedback/toast-context', () => ({
  useToast: () => ({ showToast: vi.fn() }),
}))
vi.mock('@/features/budgets/hooks/budgets.hooks', () => ({
  useBudgets: (...a: unknown[]) => mocks.list(...a),
  useBudget: (...a: unknown[]) => mocks.detail(...a),
  useCreateBudget: () => ({
    mutate: mocks.create,
    isPending: false,
    error: null,
    reset: vi.fn(),
  }),
  useUpdateBudget: () => ({
    mutate: mocks.update,
    isPending: false,
    error: null,
    reset: vi.fn(),
  }),
  useArchiveBudget: () => ({
    mutate: mocks.archive,
    isPending: false,
    error: null,
    reset: vi.fn(),
  }),
  useRestoreBudget: () => ({
    mutate: mocks.restore,
    isPending: false,
    error: null,
    reset: vi.fn(),
  }),
}))
vi.mock('@/features/budgets/components/BudgetForm', () => ({
  BudgetForm: ({
    budget: onBudget,
    onSubmit,
  }: {
    budget?: unknown
    onSubmit: (x: unknown) => void
  }) => (
    <button
      onClick={() =>
        onSubmit(onBudget ? { amount: '700000' } : { name: 'Nuevo' })
      }
    >
      {onBudget ? 'Enviar edición' : 'Enviar creación'}
    </button>
  ),
}))
describe('BudgetsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.read = true
    mocks.write = true
    mocks.list.mockReturnValue({
      isPending: false,
      isError: false,
      data: { items: [budget], page: 1, limit: 25, total: 1, totalPages: 1 },
      refetch: mocks.refetch,
    })
    mocks.detail.mockReturnValue({ isPending: false, data: budget })
    for (const m of [mocks.create, mocks.update, mocks.archive])
      m.mockImplementation((_x, o) => o?.onSuccess?.())
  })
  it('restringe sin read y deshabilita query', () => {
    mocks.read = false
    render(<BudgetsPage />)
    expect(screen.getByText('Acceso restringido')).toBeVisible()
    expect(mocks.list).toHaveBeenCalledWith('w', expect.anything(), false)
  })
  it('read sin write muestra progreso pero no acciones', () => {
    mocks.write = false
    render(<BudgetsPage />)
    expect(screen.getByText('5.83 % utilizado')).toBeVisible()
    expect(
      screen.queryByRole('button', { name: 'Crear presupuesto' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Editar' }),
    ).not.toBeInTheDocument()
  })
  it('muestra loading, error/retry y empty', () => {
    mocks.list.mockReturnValueOnce({ isPending: true })
    const r = render(<BudgetsPage />)
    expect(screen.getByRole('status')).toBeInTheDocument()
    mocks.list.mockReturnValue({
      isPending: false,
      isError: true,
      error: new Error(),
      refetch: mocks.refetch,
    })
    r.rerender(<BudgetsPage />)
    fireEvent.click(screen.getByRole('button', { name: /reintentar/i }))
    expect(mocks.refetch).toHaveBeenCalled()
    mocks.list.mockReturnValue({
      isPending: false,
      isError: false,
      data: { items: [], page: 1, totalPages: 0 },
    })
    r.rerender(<BudgetsPage />)
    expect(screen.getByText('Aún no tienes presupuestos')).toBeVisible()
  })
  it('abre detalle, crea, edita y archiva', () => {
    render(<BudgetsPage />)
    fireEvent.click(screen.getByRole('button', { name: 'Ver detalle' }))
    const detailDialog = screen.getByRole('dialog')
    expect(within(detailDialog).getByText('Disponible')).toBeVisible()
    expect(screen.getByText('Proyección al final del periodo')).toBeVisible()
    expect(screen.getByText('Excedido')).toBeVisible()
    fireEvent.click(within(detailDialog).getByLabelText('Cerrar diálogo'))
    fireEvent.click(screen.getByRole('button', { name: 'Crear presupuesto' }))
    fireEvent.click(screen.getByRole('button', { name: 'Enviar creación' }))
    expect(mocks.create).toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Editar' }))
    fireEvent.click(screen.getByRole('button', { name: 'Enviar edición' }))
    expect(mocks.update).toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Archivar' }))
    fireEvent.click(screen.getAllByRole('button', { name: 'Archivar' }).at(-1)!)
    expect(mocks.archive).toHaveBeenCalledWith('b', expect.anything())
  })
})