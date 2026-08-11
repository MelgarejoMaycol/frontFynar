import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, renderHook, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ApiError, httpClient } from '@/services/http'
import { accountsApi } from '@/features/accounts/api/accounts.api'
import { categoriesApi } from '@/features/categories/api/categories.api'
import { TransactionFilters } from '@/features/transactions/components/TransactionFilters'
import { TransactionForm } from '@/features/transactions/components/TransactionForm'
import { TransactionList } from '@/features/transactions/components/TransactionList'
import { transactionsApi } from '@/features/transactions/api/transactions.api'
import {
  transactionKeys,
  useCancelTransaction,
  useCreateTransaction,
  useUpdateTransaction,
} from '@/features/transactions/hooks/transactions.hooks'
import { transactionFormSchema } from '@/features/transactions/schemas/transaction.schemas'
import { getTransactionErrorMessage } from '@/features/transactions/transactions.errors'
import {
  isoToWorkspaceDateTimeValue,
  workspaceDateEndToIso,
  workspaceDateStartToIso,
  workspaceDateTimeToIso,
} from '@/features/transactions/transactions.format'
import type { Account } from '@/features/accounts/types/account.types'
import type { Category } from '@/features/categories/types/category.types'
import type { Transaction } from '@/features/transactions/types/transaction.types'

const account: Account = {
  id: '11111111-1111-4111-8111-111111111111',
  name: 'Bancolombia',
  type: 'SAVINGS',
  nature: 'ASSET',
  institutionName: null,
  currency: 'COP',
  openingBalance: '0.00',
  currentBalance: '100.00',
  creditLimit: null,
  billingDay: null,
  paymentDueDay: null,
  color: null,
  icon: null,
  isFavorite: false,
  isActive: true,
  includeInNetWorth: true,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
}
const category: Category = {
  id: '22222222-2222-4222-8222-222222222222',
  parentId: null,
  name: 'Salario',
  type: 'INCOME',
  icon: null,
  color: null,
  scope: 'CUSTOM',
  isSystem: false,
  isActive: true,
  createdAt: 'x',
  updatedAt: 'x',
}
const transaction: Transaction = {
  id: '33333333-3333-4333-8333-333333333333',
  type: 'INCOME',
  status: 'CONFIRMED',
  amount: '2400000.00',
  currency: 'COP',
  accountId: account.id,
  destinationAccountId: null,
  categoryId: category.id,
  occurredAt: '2026-08-10T12:00:00.000Z',
  description: 'Nómina',
  notes: null,
  merchantName: null,
  version: 1,
  createdAt: '2026-08-10T12:00:00.000Z',
  updatedAt: '2026-08-10T12:00:00.000Z',
}
const provider =
  (
    client = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    }),
  ) =>
  ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )

describe('movimientos', () => {
  it('aísla query keys por workspace y filtros', () => {
    expect(transactionKeys.all('a')).not.toEqual(transactionKeys.all('b'))
    expect(transactionKeys.list('a', { type: 'INCOME' })).not.toEqual(
      transactionKeys.list('a', { type: 'EXPENSE' }),
    )
  })
  it('envía filtros al listado y usa el endpoint según el tipo', async () => {
    const get = vi.spyOn(httpClient, 'get').mockResolvedValue({
      success: true,
      data: { items: [], page: 2, limit: 25, total: 0, totalPages: 0 },
    })
    const post = vi
      .spyOn(httpClient, 'post')
      .mockResolvedValue({ success: true, data: transaction })
    await transactionsApi.list('workspace', {
      type: 'INCOME',
      search: 'nómina',
      page: 2,
    })
    await transactionsApi.create('workspace', {
      type: 'INCOME',
      accountId: account.id,
      categoryId: category.id,
      amount: '10.00',
      occurredAt: transaction.occurredAt,
    })
    expect(get).toHaveBeenCalledWith(
      expect.stringContaining('type=INCOME'),
      undefined,
    )
    expect(get).toHaveBeenCalledWith(
      expect.stringContaining('search=n%C3%B3mina'),
      undefined,
    )
    expect(post.mock.calls[0]?.[0]).toBe(
      '/workspaces/workspace/transactions/income',
    )
    expect(post.mock.calls[0]?.[1]).not.toHaveProperty('type')
  })
  const mutationClient = () => {
    const client = new QueryClient({
      defaultOptions: { mutations: { retry: false } },
    })
    return { client, invalidate: vi.spyOn(client, 'invalidateQueries') }
  }
  const expectFinancialInvalidation = (
    invalidate: ReturnType<typeof vi.spyOn>,
  ) => {
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: ['transactions', 'workspace'],
    })
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: ['accounts', 'workspace'],
    })
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: ['dashboard', 'workspace'],
    })
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: ['budgets', 'workspace'],
    })
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: ['reports', 'workspace'],
    })
  }
  it('invalida transactions y accounts al crear', async () => {
    vi.spyOn(transactionsApi, 'create').mockResolvedValue({
      success: true,
      data: transaction,
    })
    const { client, invalidate } = mutationClient()
    const { result } = renderHook(() => useCreateTransaction('workspace'), {
      wrapper: provider(client),
    })
    await result.current.mutateAsync({
      type: 'INCOME',
      accountId: account.id,
      categoryId: category.id,
      amount: '10.00',
      occurredAt: transaction.occurredAt,
    })
    expectFinancialInvalidation(invalidate)
  })
  it('invalida transactions y accounts al editar', async () => {
    vi.spyOn(transactionsApi, 'update').mockResolvedValue({
      success: true,
      data: transaction,
    })
    const { client, invalidate } = mutationClient()
    const { result } = renderHook(
      () => useUpdateTransaction('workspace', transaction.id),
      { wrapper: provider(client) },
    )
    await result.current.mutateAsync({ version: 1, amount: '20.00' })
    expectFinancialInvalidation(invalidate)
  })
  it('invalida transactions y accounts al cancelar', async () => {
    vi.spyOn(transactionsApi, 'cancel').mockResolvedValue(undefined)
    const { client, invalidate } = mutationClient()
    const { result } = renderHook(() => useCancelTransaction('workspace'), {
      wrapper: provider(client),
    })
    await result.current.mutateAsync({ id: transaction.id, version: 1 })
    expectFinancialInvalidation(invalidate)
  })
  it('valida ingresos, gastos y transferencias con cuentas distintas', () => {
    const base = {
      amount: '10.00',
      accountId: account.id,
      destinationAccountId: '',
      categoryId: category.id,
      occurredAt: '2026-08-10T08:00',
      description: '',
      notes: '',
      merchantName: '',
    }
    expect(
      transactionFormSchema.safeParse({ ...base, type: 'INCOME' }).success,
    ).toBe(true)
    expect(
      transactionFormSchema.safeParse({ ...base, type: 'EXPENSE' }).success,
    ).toBe(true)
    expect(
      transactionFormSchema.safeParse({
        ...base,
        type: 'TRANSFER',
        destinationAccountId: account.id,
      }).success,
    ).toBe(false)
  })
  it('muestra errores públicos seguros, incluido conflicto de versión', () => {
    expect(
      getTransactionErrorMessage(
        new ApiError('Versión de movimiento obsoleta', 409, 'CONFLICT'),
      ),
    ).toContain('modificado desde otra sesión')
    expect(
      getTransactionErrorMessage(new ApiError('socket', 0, 'NETWORK_ERROR')),
    ).not.toContain('socket')
  })
  it('renderiza historial y distingue una transferencia de un gasto', () => {
    render(
      <TransactionList
        items={[
          transaction,
          {
            ...transaction,
            id: 'transfer',
            type: 'TRANSFER',
            destinationAccountId: 'other',
          },
        ]}
        accounts={[account]}
        categories={[category]}
        timezone="America/Bogota"
        onOpen={vi.fn()}
      />,
    )
    expect(screen.getByText('Ingreso')).toBeVisible()
    expect(screen.getByText('Transferencia')).toBeVisible()
    expect(screen.getAllByRole('button', { name: 'Ver detalle' })).toHaveLength(
      2,
    )
  })
  it('envía búsqueda y reinicia la página al filtrar', () => {
    const onChange = vi.fn()
    render(
      <TransactionFilters
        value={{ page: 4, limit: 25 }}
        accounts={[account]}
        categories={[category]}
        timezone="America/Bogota"
        onChange={onChange}
      />,
    )
    fireEvent.change(
      screen.getByPlaceholderText('Descripción, notas o comercio'),
      { target: { value: 'mercado' } },
    )
    fireEvent.click(screen.getByRole('button', { name: 'Buscar' }))
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ search: 'mercado', page: 1 }),
    )
    fireEvent.change(screen.getByLabelText('Categoría'), {
      target: { value: category.id },
    })
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ categoryId: category.id, page: 1 }),
    )
  })
  it('bloquea doble envío mientras guarda', async () => {
    vi.spyOn(accountsApi, 'list').mockResolvedValue({
      success: true,
      data: [account],
    })
    vi.spyOn(categoriesApi, 'list').mockResolvedValue({
      success: true,
      data: [category],
    })
    render(
      <TransactionForm
        workspaceId="workspace"
        timezone="America/Bogota"
        pending
        error={null}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />,
      { wrapper: provider() },
    )
    expect(document.querySelector('button[type="submit"]')).toBeDisabled()
  })
  it('interpreta fechas usando el timezone del workspace', () => {
    expect(workspaceDateTimeToIso('2026-08-10T20:30', 'America/Bogota')).toBe(
      '2026-08-11T01:30:00.000Z',
    )
    expect(workspaceDateTimeToIso('2026-08-10T20:30', 'America/New_York')).toBe(
      '2026-08-11T00:30:00.000Z',
    )
    expect(
      isoToWorkspaceDateTimeValue('2026-08-11T01:30:00.000Z', 'America/Bogota'),
    ).toBe('2026-08-10T20:30')
    expect(workspaceDateStartToIso('2026-08-10', 'America/Bogota')).toBe(
      '2026-08-10T05:00:00.000Z',
    )
    expect(workspaceDateEndToIso('2026-08-10', 'America/Bogota')).toBe(
      '2026-08-11T04:59:59.999Z',
    )
  })
})
