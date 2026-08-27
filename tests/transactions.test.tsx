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
import { accountsApi } from '@/features/accounts/api/accounts.api'
import { categoriesApi } from '@/features/categories/api/categories.api'
import { liabilitiesApi } from '@/features/liabilities/api'
import { TransactionFilters } from '@/features/transactions/components/TransactionFilters'
import { TransactionForm } from '@/features/transactions/components/TransactionForm'
import { TransactionList } from '@/features/transactions/components/TransactionList'
import { getTransactionFormContext } from '@/features/transactions/components/transaction-form.context'
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
import type { Debt } from '@/features/liabilities/types'
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
const expenseCategory: Category = {
  ...category,
  id: '44444444-4444-4444-8444-444444444444',
  name: 'Alimentación',
  type: 'EXPENSE',
}
const transferCategory: Category = {
  ...category,
  id: '55555555-5555-4555-8555-555555555555',
  name: 'Transferencia entre cuentas',
  type: 'TRANSFER',
  scope: 'SYSTEM',
  isSystem: true,
}
const debt: Debt = {
  id: '66666666-6666-4666-8666-666666666666',
  name: 'Crédito semanal prueba',
  institutionName: null,
  lenderName: null,
  type: 'PERSONAL_LOAN',
  status: 'ACTIVE',
  currency: 'COP',
  originalAmount: '1000000.00',
  currentBalance: '800000.00',
  interestRate: null,
  interestRateBasis: 'EFFECTIVE_MONTHLY',
  interestType: 'NONE',
  termMonths: null,
  installmentCount: 10,
  paymentFrequency: 'WEEKLY',
  installmentAmount: '100000.00',
  disbursementDate: null,
  firstPaymentDate: null,
  estimatedEndDate: null,
  nextDueDate: '2026-09-01',
  paymentDay: null,
  liabilityAccountId: null,
  notes: null,
  debtInstallments: [
    {
      id: '77777777-7777-4777-8777-777777777777',
      debtId: '66666666-6666-4666-8666-666666666666',
      installmentNumber: 3,
      dueDate: '2026-09-01',
      openingBalance: '800000.00',
      principalAmount: '90000.00',
      interestAmount: '10000.00',
      insuranceAmount: '0.00',
      feeAmount: '0.00',
      totalAmount: '100000.00',
      paidAmount: '20000.00',
      closingBalance: '710000.00',
      status: 'PARTIAL',
    },
  ],
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
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
  const mockDebtFormResources = () => {
    const nequi = {
      ...account,
      id: '88888888-8888-4888-8888-888888888888',
      name: 'Nequi',
      currentBalance: '500000.00',
    }
    const bancolombia = {
      ...account,
      id: '99999999-9999-4999-8999-999999999999',
      name: 'Bancolombia corriente',
    }
    vi.spyOn(accountsApi, 'list').mockResolvedValue({
      success: true,
      data: [nequi, bancolombia],
    })
    vi.spyOn(categoriesApi, 'list').mockResolvedValue({
      success: true,
      data: [category, expenseCategory, transferCategory],
    })
    vi.spyOn(liabilitiesApi, 'debts').mockResolvedValue({
      success: true,
      data: { items: [debt], page: 1, limit: 100, total: 1, totalPages: 1 },
    })
    vi.spyOn(liabilitiesApi, 'debt').mockResolvedValue({
      success: true,
      data: debt,
    })
    return { nequi, bancolombia }
  }
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
  it('envía Adelanto al motor especializado de tarjetas', async () => {
    const post = vi
      .spyOn(httpClient, 'post')
      .mockResolvedValue({ success: true, data: { transactionId: 't' } })
    await transactionsApi.create('workspace', {
      type: 'ADVANCE',
      accountId: 'card-id',
      destinationAccountId: 'asset-id',
      amount: '200000.00',
      occurredAt: transaction.occurredAt,
    })
    expect(post.mock.calls.at(-1)?.[0]).toBe(
      '/workspaces/workspace/cards/card-id/cash-advances',
    )
    expect(post.mock.calls.at(-1)?.[1]).toEqual(
      expect.objectContaining({
        destinationAccountId: 'asset-id',
        amount: '200000.00',
        feeAmount: '0',
      }),
    )
  })
  it('envía pagos y abonos al motor especializado de créditos', async () => {
    const post = vi
      .spyOn(httpClient, 'post')
      .mockResolvedValue({ success: true, data: { id: 'payment' } })
    await transactionsApi.create('workspace', {
      type: 'DEBT_PAYMENT',
      debtId: 'debt-id',
      installmentId: 'installment-id',
      operation: 'INSTALLMENT_PAYMENT',
      strategy: 'REDUCE_TERM',
      accountId: account.id,
      amount: '100000.00',
      occurredAt: transaction.occurredAt,
      idempotencyKey: 'debt-payment-1',
    })
    expect(post.mock.calls.at(-1)?.[0]).toBe(
      '/workspaces/workspace/debts/debt-id/installments/installment-id/payments',
    )
    await transactionsApi.create('workspace', {
      type: 'DEBT_PAYMENT',
      debtId: 'debt-id',
      operation: 'EXTRA_PAYMENT',
      strategy: 'REDUCE_PAYMENT',
      amount: '300000.00',
      occurredAt: transaction.occurredAt,
      idempotencyKey: 'external-payment-1',
    })
    expect(post.mock.calls.at(-1)?.[0]).toBe(
      '/workspaces/workspace/debts/debt-id/prepayments',
    )
    expect(post.mock.calls.at(-1)?.[1]).not.toHaveProperty('accountId')
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
      installmentCount: 1,
      periodicRate: '',
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
  it('clasifica contextos especializados sin arrastrar campos genéricos', () => {
    const card = {
      ...account,
      type: 'CREDIT_CARD' as const,
      nature: 'LIABILITY' as const,
    }
    expect(
      getTransactionFormContext({
        type: 'INCOME',
        source: card,
        hasDebt: false,
      }),
    ).toBe('CARD_PAYMENT')
    expect(
      getTransactionFormContext({
        type: 'EXPENSE',
        source: card,
        hasDebt: false,
      }),
    ).toBe('CARD_PURCHASE')
    expect(
      getTransactionFormContext({
        type: 'TRANSFER',
        destination: card,
        hasDebt: false,
      }),
    ).toBe('CARD_PAYMENT')
    expect(
      getTransactionFormContext({
        type: 'TRANSFER',
        hasDebt: true,
        debtOperation: 'EXTRA_PAYMENT',
      }),
    ).toBe('DEBT_EXTRA_PAYMENT')
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
  it('identifica visualmente un adelanto persistido como transferencia especializada', () => {
    render(
      <TransactionList
        items={[
          {
            ...transaction,
            type: 'TRANSFER',
            metadata: { cardCashAdvance: true },
            destinationAccountId: 'other',
          },
        ]}
        accounts={[account]}
        categories={[category]}
        timezone="America/Bogota"
        onOpen={vi.fn()}
      />,
    )
    expect(screen.getByText('Adelanto')).toBeVisible()
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
      expect.objectContaining({
        search: 'mercado',
        page: undefined,
        cursor: undefined,
      }),
    )
    fireEvent.change(screen.getByLabelText('Categoría'), {
      target: { value: category.id },
    })
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        categoryId: category.id,
        page: undefined,
        cursor: undefined,
      }),
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
  it('sincroniza y envía la categoría técnica real al pagar una tarjeta', async () => {
    const nequi = {
      ...account,
      id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      name: 'Nequi',
      currentBalance: '264000.00',
    }
    const card = {
      ...account,
      id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      name: 'Credi Tarjeta',
      type: 'CREDIT_CARD' as const,
      nature: 'LIABILITY' as const,
      currentBalance: '824543.22',
      creditLimit: '1500000.00',
    }
    const transferCategory = {
      ...category,
      id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
      name: 'Transferencia entre cuentas',
      type: 'TRANSFER' as const,
      scope: 'SYSTEM' as const,
      isSystem: true,
    }
    vi.spyOn(accountsApi, 'list').mockResolvedValue({
      success: true,
      data: [nequi, card],
    })
    vi.spyOn(categoriesApi, 'list').mockResolvedValue({
      success: true,
      data: [category, transferCategory],
    })
    const onSubmit = vi.fn()
    render(
      <TransactionForm
        workspaceId="workspace-transfer"
        timezone="America/Bogota"
        pending={false}
        error={null}
        onSubmit={onSubmit}
        onCancel={vi.fn()}
      />,
      { wrapper: provider() },
    )
    fireEvent.change(screen.getByRole('combobox', { name: /Tipo/ }), {
      target: { value: 'INCOME' },
    })
    await screen.findByRole('option', { name: /Nequi/ })
    expect(
      screen.queryByRole('option', { name: /Credi Tarjeta/ }),
    ).toBeInTheDocument()
    fireEvent.change(screen.getByRole('combobox', { name: /Tipo/ }), {
      target: { value: 'TRANSFER' },
    })
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Registrar movimiento' }),
      ).toBeEnabled(),
    )
    fireEvent.change(screen.getByRole('textbox', { name: /Monto/ }), {
      target: { value: '25000000' },
    })
    fireEvent.change(screen.getByRole('combobox', { name: /Cuenta origen/ }), {
      target: { value: nequi.id },
    })
    fireEvent.change(screen.getByRole('combobox', { name: /^Destino/ }), {
      target: { value: card.id },
    })
    fireEvent.click(
      screen.getByRole('button', { name: 'Registrar movimiento' }),
    )
    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'TRANSFER',
          accountId: nequi.id,
          destinationAccountId: card.id,
          categoryId: transferCategory.id,
          amount: '250000.00',
        }),
      ),
    )
    expect(screen.queryByLabelText('Categoría')).not.toBeInTheDocument()
    expect(screen.getByText(/reducirá el saldo pendiente/)).toBeVisible()
  })
  it('aplica centavos progresivos al mismo monto en los cuatro tipos', async () => {
    const user = userEvent.setup()
    const card = {
      ...account,
      id: 'card',
      name: 'Credi Tarjeta',
      type: 'CREDIT_CARD' as const,
      nature: 'LIABILITY' as const,
      currentBalance: '300000.00',
      creditLimit: '1500000.00',
    }
    const transferCategory = {
      ...category,
      id: 'transfer-category',
      type: 'TRANSFER' as const,
      isSystem: true,
      scope: 'SYSTEM' as const,
    }
    vi.spyOn(accountsApi, 'list').mockResolvedValue({
      success: true,
      data: [account, card],
    })
    vi.spyOn(categoriesApi, 'list').mockResolvedValue({
      success: true,
      data: [category, transferCategory],
    })
    render(
      <TransactionForm
        workspaceId="money-types"
        timezone="America/Bogota"
        pending={false}
        error={null}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />,
      { wrapper: provider() },
    )
    const type = screen.getByRole('combobox', { name: /Tipo/ })
    const amount = screen.getByRole('textbox', { name: /Monto/ })
    for (const movementType of ['INCOME', 'EXPENSE', 'TRANSFER', 'ADVANCE']) {
      await user.selectOptions(type, movementType)
      await user.clear(amount)
      await user.type(amount, movementType === 'INCOME' ? '987654321' : '98765')
      expect(amount).toHaveValue(
        movementType === 'INCOME' ? '9.876.543,21' : '987,65',
      )
    }
  })
  it('permite un Ingreso a tarjeta, muestra deuda y normaliza el payload', async () => {
    const user = userEvent.setup()
    const card = {
      ...account,
      id: 'card-income',
      name: 'Credi Tarjeta',
      type: 'CREDIT_CARD' as const,
      nature: 'LIABILITY' as const,
      currentBalance: '300000.00',
      creditLimit: '1500000.00',
    }
    vi.spyOn(accountsApi, 'list').mockResolvedValue({
      success: true,
      data: [account, card],
    })
    vi.spyOn(categoriesApi, 'list').mockResolvedValue({
      success: true,
      data: [category],
    })
    const onSubmit = vi.fn()
    render(
      <TransactionForm
        workspaceId="income-card"
        timezone="America/Bogota"
        pending={false}
        error={null}
        onSubmit={onSubmit}
        onCancel={vi.fn()}
      />,
      { wrapper: provider() },
    )
    await user.selectOptions(
      screen.getByRole('combobox', { name: /Tipo/ }),
      'INCOME',
    )
    const destination = await screen.findByRole('combobox', { name: /Destino/ })
    expect(
      screen.getByRole('option', {
        name: /Credi Tarjeta · Deuda pendiente:.*300\.000,00/,
      }),
    ).toBeVisible()
    expect(
      screen.getByRole('option', { name: /Bancolombia · Saldo actual/ }),
    ).toBeVisible()
    await user.selectOptions(destination, card.id)
    const amount = screen.getByRole('textbox', { name: /Monto/ })
    await user.type(amount, '10000000')
    expect(amount).toHaveValue('100.000,00')
    expect(screen.queryByLabelText(/Categor/)).not.toBeInTheDocument()
    await user.click(
      screen.getByRole('button', { name: 'Registrar movimiento' }),
    )
    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'INCOME',
          accountId: card.id,
          amount: '100000.00',
        }),
      ),
    )
    expect(onSubmit.mock.calls[0]?.[0]).not.toHaveProperty('categoryId')
  })
  it('Crédito → Gasto elimina inmediatamente la UI y el payload de deuda', async () => {
    const user = userEvent.setup()
    const { nequi } = mockDebtFormResources()
    const onSubmit = vi.fn()
    render(
      <TransactionForm
        workspaceId="debt-to-expense"
        timezone="America/Bogota"
        pending={false}
        error={null}
        onSubmit={onSubmit}
        onCancel={vi.fn()}
      />,
      { wrapper: provider() },
    )
    const type = screen.getByRole('combobox', { name: /Tipo/ })
    await user.selectOptions(type, 'TRANSFER')
    await user.selectOptions(
      await screen.findByRole('combobox', { name: /Cuenta origen/ }),
      nequi.id,
    )
    await user.selectOptions(
      screen.getByRole('combobox', { name: /^Destino/ }),
      `debt:${debt.id}`,
    )
    expect(await screen.findByText('Registrar pago del crédito')).toBeVisible()
    await user.selectOptions(
      screen.getByRole('combobox', { name: /Aplicar como/ }),
      'EXTRA_PAYMENT',
    )
    expect(screen.getByText('Registrar abono extraordinario')).toBeVisible()
    await user.selectOptions(type, 'EXPENSE')
    expect(
      screen.queryByText('Registrar abono extraordinario'),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('combobox', { name: /Estrategia/ }),
    ).not.toBeInTheDocument()
    expect(screen.getByLabelText(/Comercio o establecimiento/)).toBeVisible()
    expect(screen.getByRole('textbox', { name: /Monto/ })).toHaveValue('')
    await user.type(screen.getByRole('textbox', { name: /Monto/ }), '10000')
    await user.click(screen.getByRole('button', { name: 'Categoría' }))
    await user.click(screen.getByRole('option', { name: expenseCategory.name }))
    await user.click(
      screen.getByRole('button', { name: 'Registrar movimiento' }),
    )
    await waitFor(() => expect(onSubmit).toHaveBeenCalled())
    expect(onSubmit.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({ type: 'EXPENSE', accountId: nequi.id }),
    )
    expect(JSON.stringify(onSubmit.mock.calls[0]?.[0])).not.toMatch(
      /debt|DEBT|66666666/,
    )
  })
  it('Crédito → Cuenta normal vuelve inmediatamente a transferencia normal', async () => {
    const user = userEvent.setup()
    const { nequi, bancolombia } = mockDebtFormResources()
    render(
      <TransactionForm
        workspaceId="debt-to-account"
        timezone="America/Bogota"
        pending={false}
        error={null}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />,
      { wrapper: provider() },
    )
    await user.selectOptions(
      screen.getByRole('combobox', { name: /Tipo/ }),
      'TRANSFER',
    )
    await user.selectOptions(
      await screen.findByRole('combobox', { name: /Cuenta origen/ }),
      nequi.id,
    )
    const destination = screen.getByRole('combobox', { name: /^Destino/ })
    await user.selectOptions(destination, `debt:${debt.id}`)
    expect(await screen.findByText('Registrar pago del crédito')).toBeVisible()
    await user.selectOptions(destination, bancolombia.id)
    expect(
      screen.queryByText('Registrar pago del crédito'),
    ).not.toBeInTheDocument()
    expect(screen.getByText('Transferencia entre cuentas.')).toBeVisible()
  })
  it('Ingreso a crédito → Cuenta normal restaura categoría y origen', async () => {
    const user = userEvent.setup()
    const { nequi } = mockDebtFormResources()
    render(
      <TransactionForm
        workspaceId="income-debt-to-account"
        timezone="America/Bogota"
        pending={false}
        error={null}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />,
      { wrapper: provider() },
    )
    await user.selectOptions(
      screen.getByRole('combobox', { name: /Tipo/ }),
      'INCOME',
    )
    const destination = await screen.findByRole('combobox', {
      name: /^Destino/,
    })
    await user.selectOptions(destination, `debt:${debt.id}`)
    expect(await screen.findByText('Registrar pago del crédito')).toBeVisible()
    await user.selectOptions(destination, nequi.id)
    expect(
      screen.queryByText('Registrar pago del crédito'),
    ).not.toBeInTheDocument()
    expect(screen.getByLabelText('Origen del ingreso')).toBeVisible()
    expect(screen.getByRole('button', { name: 'Categoría' })).toBeVisible()
    expect(
      screen.getByPlaceholderText('Ej. Pago de nómina de agosto'),
    ).toBeVisible()
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
