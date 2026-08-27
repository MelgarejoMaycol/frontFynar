import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  fireEvent,
  render,
  renderHook,
  screen,
  waitFor,
} from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import userEvent from '@testing-library/user-event'
import { ApiError, httpClient } from '@/services/http'
import { budgetsApi } from '@/features/budgets/api/budgets.api'
import { getBudgetErrorMessage } from '@/features/budgets/budgets.errors'
import {
  budgetKeys,
  useArchiveBudget,
  useCreateBudget,
  useUpdateBudget,
} from '@/features/budgets/hooks/budgets.hooks'
import { budgetFormSchema } from '@/features/budgets/schemas/budget.schemas'
import { BudgetProgress } from '@/features/budgets/components/BudgetProgress'
import { BudgetForm } from '@/features/budgets/components/BudgetForm'
import { accountsApi } from '@/features/accounts/api/accounts.api'
import { categoriesApi } from '@/features/categories/api/categories.api'
import type { Budget, BudgetInput } from '@/features/budgets/types/budget.types'
const input: BudgetInput = {
  name: 'Comida',
  period: 'MONTHLY',
  startsOn: '2026-08-01',
  endsOn: '2026-08-31',
  amount: '600000',
  currency: 'COP',
  alertThreshold: '80',
  rolloverEnabled: false,
  categoryIds: [],
  accountIds: [],
}
const budget: Budget = {
  id: 'b',
  ...input,
  isActive: true,
  categories: [],
  accounts: [],
  progress: {
    spent: '0.00',
    remaining: '600000.00',
    percentage: '0.00',
    status: 'SAFE',
  },
  projection: {
    projectedSpend: '0.00',
    projectedRemaining: '600000.00',
    projectedPercentage: '0.00',
    projectedStatus: 'SAFE',
  },
  createdAt: 'x',
  updatedAt: 'x',
}
const provider =
  (client: QueryClient) =>
  ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
describe('budgets', () => {
  it('aísla query keys por workspace y filtros', () => {
    expect(budgetKeys.all('a')).not.toEqual(budgetKeys.all('b'))
    expect(budgetKeys.list('a', { currency: 'COP' })).not.toEqual(
      budgetKeys.list('a', { currency: 'USD' }),
    )
  })
  it('usa endpoints reales tipados para list/create/update/delete', async () => {
    const get = vi
        .spyOn(httpClient, 'get')
        .mockResolvedValue({ success: true, data: { items: [] } }),
      post = vi
        .spyOn(httpClient, 'post')
        .mockResolvedValue({ success: true, data: budget }),
      patch = vi
        .spyOn(httpClient, 'patch')
        .mockResolvedValue({ success: true, data: budget }),
      del = vi.spyOn(httpClient, 'delete').mockResolvedValue(undefined)
    await budgetsApi.list('w', { period: 'MONTHLY' })
    await budgetsApi.create('w', input)
    await budgetsApi.update('w', 'b', { amount: '1.00' })
    await budgetsApi.archive('w', 'b')
    expect(get.mock.calls[0]?.[0]).toContain(
      '/workspaces/w/budgets?period=MONTHLY',
    )
    expect(post).toHaveBeenCalled()
    expect(patch).toHaveBeenCalled()
    expect(del).toHaveBeenCalledWith('/workspaces/w/budgets/b')
  })
  it('valida monto, moneda, fechas y threshold', () => {
    expect(budgetFormSchema.safeParse(input).success).toBe(true)
    expect(budgetFormSchema.safeParse({ ...input, amount: '0' }).success).toBe(
      false,
    )
    expect(
      budgetFormSchema.safeParse({ ...input, currency: 'CO' }).success,
    ).toBe(false)
    expect(
      budgetFormSchema.safeParse({ ...input, startsOn: '2026-09-01' }).success,
    ).toBe(false)
    expect(
      budgetFormSchema.safeParse({ ...input, alertThreshold: '101' }).success,
    ).toBe(false)
  })
  it('oculta errores internos', () => {
    expect(
      getBudgetErrorMessage(new ApiError('Prisma secret', 500, 'INTERNAL')),
    ).not.toContain('Prisma')
  })
  it('limita aria-valuenow pero conserva el porcentaje real accesible', () => {
    render(
      <BudgetProgress
        progress={{
          spent: '130',
          remaining: '-30',
          percentage: '130',
          status: 'EXCEEDED',
        }}
      />,
    )
    expect(screen.getByRole('progressbar')).toHaveAttribute(
      'aria-valuenow',
      '100',
    )
    expect(
      screen.getByLabelText('130 % utilizado, estado Excedido'),
    ).toBeVisible()
  })
  it('elimina cuentas incompatibles del payload al cambiar moneda', async () => {
    vi.spyOn(accountsApi, 'list').mockResolvedValue({
      success: true,
      data: [
        {
          id: '11111111-1111-4111-8111-111111111111',
          name: 'Cuenta COP',
          type: 'SAVINGS',
          nature: 'ASSET',
          institutionName: null,
          currency: 'COP',
          openingBalance: '0',
          currentBalance: '0',
          creditLimit: null,
          billingDay: null,
          paymentDueDay: null,
          color: null,
          icon: null,
          isFavorite: false,
          isActive: true,
          includeInNetWorth: true,
          createdAt: 'x',
          updatedAt: 'x',
        },
      ],
    })
    vi.spyOn(categoriesApi, 'list').mockResolvedValue({
      success: true,
      data: [],
    })
    const submit = vi.fn()
    render(
      <BudgetForm
        workspaceId="w"
        baseCurrency="COP"
        timezone="America/Bogota"
        pending={false}
        error={null}
        onSubmit={submit}
        onCancel={vi.fn()}
      />,
      { wrapper: provider(new QueryClient()) },
    )
    await screen.findByLabelText('Cuenta COP · COP')
    fireEvent.click(screen.getByLabelText('Cuenta COP · COP'))
    fireEvent.change(screen.getByLabelText(/^Moneda/), {
      target: { value: 'USD' },
    })
    expect(screen.queryByLabelText('Cuenta COP · COP')).not.toBeInTheDocument()
    fireEvent.change(screen.getByLabelText(/^Nombre/), {
      target: { value: 'USD mensual' },
    })
    fireEvent.change(screen.getByLabelText(/^Monto/), {
      target: { value: '100' },
    })
    fireEvent.click(document.querySelector('button[type="submit"]')!)
    await waitFor(() =>
      expect(submit).toHaveBeenCalledWith(
        expect.objectContaining({ currency: 'USD', accountIds: [] }),
      ),
    )
  })
  it('usa MoneyInput progresivo y muestra el porcentaje con sufijo', async () => {
    const user = userEvent.setup()
    vi.spyOn(accountsApi, 'list').mockResolvedValue({ success: true, data: [] })
    vi.spyOn(categoriesApi, 'list').mockResolvedValue({ success: true, data: [] })
    const submit = vi.fn()
    render(<BudgetForm workspaceId="money-budget" baseCurrency="COP" timezone="America/Bogota" pending={false} error={null} onSubmit={submit} onCancel={vi.fn()} />, { wrapper: provider(new QueryClient()) })
    await user.type(screen.getByLabelText(/^Nombre/), 'Salidas')
    const amount = screen.getByLabelText(/^Monto/)
    await user.type(amount, '9876543')
    expect(amount).toHaveValue('98.765,43')
    expect(screen.getByText('%')).toBeVisible()
    expect(screen.getByLabelText(/Avisarme/)).toHaveValue(80)
    await user.click(screen.getByRole('button', { name: 'Crear presupuesto' }))
    await waitFor(() => expect(submit).toHaveBeenCalledWith(expect.objectContaining({ amount: '98765.43', alertThreshold: '80' })))
  })
  it.each(['1', '50', '80', '100'])('acepta umbral %s', (alertThreshold) => {
    expect(budgetFormSchema.safeParse({ ...input, alertThreshold }).success).toBe(true)
  })
  const expectInvalidation = (client: QueryClient) => {
    const invalidate = vi.mocked(client.invalidateQueries)
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['budgets', 'w'] })
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['dashboard', 'w'] })
  }
  it('invalida budgets y dashboard al crear', async () => {
    vi.spyOn(budgetsApi, 'create').mockResolvedValue({
      success: true,
      data: budget,
    })
    const client = new QueryClient()
    vi.spyOn(client, 'invalidateQueries')
    const { result } = renderHook(() => useCreateBudget('w'), {
      wrapper: provider(client),
    })
    await result.current.mutateAsync(input)
    expectInvalidation(client)
  })
  it('invalida budgets y dashboard al actualizar', async () => {
    vi.spyOn(budgetsApi, 'update').mockResolvedValue({
      success: true,
      data: budget,
    })
    const client = new QueryClient()
    vi.spyOn(client, 'invalidateQueries')
    const { result } = renderHook(() => useUpdateBudget('w', 'b'), {
      wrapper: provider(client),
    })
    await result.current.mutateAsync({ amount: '1.00' })
    expectInvalidation(client)
  })
  it('invalida budgets y dashboard al archivar', async () => {
    vi.spyOn(budgetsApi, 'archive').mockResolvedValue(undefined)
    const client = new QueryClient()
    vi.spyOn(client, 'invalidateQueries')
    const { result } = renderHook(() => useArchiveBudget('w'), {
      wrapper: provider(client),
    })
    await result.current.mutateAsync('b')
    expectInvalidation(client)
  })
})
