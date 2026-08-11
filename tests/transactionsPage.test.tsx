import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TransactionsPage } from '@/features/transactions/pages/TransactionsPage'

const mocks = vi.hoisted(() => ({
  permissions: { read: true, write: true },
  transactions: vi.fn(),
  accounts: vi.fn(),
  categories: vi.fn(),
  detail: vi.fn(),
  createMutate: vi.fn(),
  updateMutate: vi.fn(),
  cancelMutate: vi.fn(),
  transactionRefetch: vi.fn(),
  accountRefetch: vi.fn(),
  categoryRefetch: vi.fn(),
}))
const account = {
  id: 'a',
  name: 'Bancolombia',
  currency: 'COP',
  isActive: true,
}
const category = { id: 'c', name: 'Salario', type: 'INCOME', isActive: true }
const transaction = {
  id: 't',
  type: 'INCOME',
  status: 'CONFIRMED',
  amount: '10.00',
  currency: 'COP',
  accountId: 'a',
  destinationAccountId: null,
  categoryId: 'c',
  occurredAt: '2026-08-11T01:30:00.000Z',
  description: 'Nómina',
  notes: null,
  merchantName: null,
  version: 4,
  createdAt: 'x',
  updatedAt: 'x',
}
const successMutation = (mutate: ReturnType<typeof vi.fn>) => ({
  mutate,
  isPending: false,
  error: null,
  reset: vi.fn(),
})

vi.mock('@/features/workspace', () => ({
  useActiveWorkspace: () => ({
    activeWorkspace: { id: 'w', name: 'Personal', timezone: 'America/Bogota' },
  }),
  usePermission: (permission: string) =>
    permission === 'transactions.read'
      ? mocks.permissions.read
      : mocks.permissions.write,
}))
vi.mock('@/features/accounts/hooks/accounts.hooks', () => ({
  useAccounts: (...args: unknown[]) => mocks.accounts(...args),
}))
vi.mock('@/features/categories/hooks/categories.hooks', () => ({
  useCategories: (...args: unknown[]) => mocks.categories(...args),
}))
vi.mock('@/features/transactions/hooks/transactions.hooks', () => ({
  useTransactions: (...args: unknown[]) => mocks.transactions(...args),
  useTransaction: (...args: unknown[]) => mocks.detail(...args),
  useCreateTransaction: () => successMutation(mocks.createMutate),
  useUpdateTransaction: () => successMutation(mocks.updateMutate),
  useCancelTransaction: () => successMutation(mocks.cancelMutate),
}))
vi.mock('@/features/transactions/components/TransactionForm', () => ({
  TransactionForm: ({
    transaction: current,
    onSubmit,
  }: {
    transaction?: typeof transaction
    onSubmit: (value: unknown) => void
  }) => (
    <button
      onClick={() =>
        onSubmit(
          current
            ? { amount: '20.00', version: current.version }
            : { type: 'INCOME' },
        )
      }
    >
      {current ? 'Enviar edición' : 'Enviar creación'}
    </button>
  ),
}))

describe('TransactionsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.permissions.read = true
    mocks.permissions.write = true
    mocks.transactions.mockReturnValue({
      isPending: false,
      isError: false,
      data: {
        items: [transaction],
        page: 1,
        limit: 25,
        total: 1,
        totalPages: 1,
      },
      error: null,
      refetch: mocks.transactionRefetch,
    })
    mocks.accounts.mockReturnValue({
      isPending: false,
      isError: false,
      data: [account],
      error: null,
      refetch: mocks.accountRefetch,
    })
    mocks.categories.mockReturnValue({
      isPending: false,
      isError: false,
      data: [category],
      error: null,
      refetch: mocks.categoryRefetch,
    })
    mocks.detail.mockReturnValue({
      isPending: false,
      isError: false,
      data: transaction,
      error: null,
    })
    for (const mutate of [
      mocks.createMutate,
      mocks.updateMutate,
      mocks.cancelMutate,
    ])
      mutate.mockImplementation((_value, options) => options?.onSuccess?.())
  })
  it('restringe acceso y desactiva las tres queries sin transactions.read', () => {
    mocks.permissions.read = false
    render(<TransactionsPage />)
    expect(screen.getByText('Acceso restringido')).toBeVisible()
    expect(mocks.transactions).toHaveBeenCalledWith(
      'w',
      expect.anything(),
      false,
    )
    expect(mocks.accounts).toHaveBeenCalledWith('w', false)
    expect(mocks.categories).toHaveBeenCalledWith('w', false)
  })
  it('permite lectura sin mostrar acciones de escritura', () => {
    mocks.permissions.write = false
    render(<TransactionsPage />)
    expect(screen.getAllByText('Nómina').length).toBeGreaterThan(0)
    expect(
      screen.queryByRole('button', { name: 'Registrar movimiento' }),
    ).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Ver detalle' }))
    expect(
      screen.queryByRole('button', { name: 'Editar' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Cancelar movimiento' }),
    ).not.toBeInTheDocument()
  })
  it('muestra loading y empty state', () => {
    mocks.transactions.mockReturnValueOnce({ isPending: true })
    const { rerender } = render(<TransactionsPage />)
    expect(screen.getByRole('status')).toBeInTheDocument()
    mocks.transactions.mockReturnValue({
      isPending: false,
      isError: false,
      data: { items: [], page: 1, limit: 25, total: 0, totalPages: 0 },
      refetch: mocks.transactionRefetch,
    })
    rerender(<TransactionsPage />)
    expect(screen.getByText('No hay movimientos')).toBeVisible()
  })
  it('retry recupera transactions, accounts y categories', () => {
    mocks.accounts.mockReturnValue({
      isPending: false,
      isError: true,
      error: new Error('falló'),
      data: [],
      refetch: mocks.accountRefetch,
    })
    render(<TransactionsPage />)
    fireEvent.click(screen.getByRole('button', { name: /reintentar/i }))
    expect(mocks.transactionRefetch).toHaveBeenCalled()
    expect(mocks.accountRefetch).toHaveBeenCalled()
    expect(mocks.categoryRefetch).toHaveBeenCalled()
  })
  it('crea, edita y cancela usando la versión del detalle', () => {
    render(<TransactionsPage />)
    fireEvent.click(
      screen.getByRole('button', { name: 'Registrar movimiento' }),
    )
    fireEvent.click(screen.getByRole('button', { name: 'Enviar creación' }))
    expect(mocks.createMutate).toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Ver detalle' }))
    fireEvent.click(screen.getByRole('button', { name: 'Editar' }))
    fireEvent.click(screen.getByRole('button', { name: 'Enviar edición' }))
    expect(mocks.updateMutate).toHaveBeenCalledWith(
      expect.objectContaining({ version: 4 }),
      expect.anything(),
    )
    fireEvent.click(screen.getByRole('button', { name: 'Ver detalle' }))
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar movimiento' }))
    fireEvent.click(
      screen.getByRole('button', { name: 'Confirmar cancelación' }),
    )
    expect(mocks.cancelMutate).toHaveBeenCalledWith(
      { id: 't', version: 4 },
      expect.anything(),
    )
  })
})
