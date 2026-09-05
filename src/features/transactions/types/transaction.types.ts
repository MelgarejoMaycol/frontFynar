export const transactionTypes = ['INCOME', 'EXPENSE', 'TRANSFER'] as const
export type TransactionType =
  (typeof transactionTypes)[number] | 'ADJUSTMENT' | 'DEBT_PAYMENT'
export type TransactionStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED'
export interface Transaction {
  id: string
  type: TransactionType
  status: TransactionStatus
  amount: string
  currency: string
  accountId: string | null
  destinationAccountId: string | null
  categoryId: string | null
  occurredAt: string
  description: string | null
  notes: string | null
  merchantName: string | null
  metadata?: Record<string, unknown>
  version: number
  createdAt: string
  updatedAt: string
}
export interface TransactionList {
  items: Transaction[]
  page: number
  limit: number
  total: number
  totalPages: number
  nextCursor: string | null
}
export interface TransactionFilters {
  cursor?: string
  page?: number
  limit?: number
  type?: TransactionType
  status?: TransactionStatus
  accountId?: string
  categoryId?: string
  dateFrom?: string
  dateTo?: string
  search?: string
}
export interface MovementInput {
  accountId: string
  categoryId?: string
  amount: string
  occurredAt: string
  description?: string | null
  notes?: string | null
  merchantName?: string | null
  cardPurchase?: {
    installmentCount: number
    periodicRate?: string
  }
}
export interface TransferInput extends MovementInput {
  categoryId: string
  destinationAccountId: string
}
export type CreateTransactionInput =
  | ({ type: 'INCOME' | 'EXPENSE' } & MovementInput)
  | ({ type: 'TRANSFER' } & TransferInput)
  | ({ type: 'ADVANCE' } & Omit<TransferInput, 'categoryId'>)
  | {
      type: 'LOAN_COLLECTION'
      loanId: string
      receivingAccountId: string
      amount: string
      occurredAt: string
      notes?: string | null
      idempotencyKey: string
    }
  | {
      type: 'DEBT_PAYMENT'
      debtId: string
      installmentId?: string
      operation: 'INSTALLMENT_PAYMENT' | 'EXTRA_PAYMENT'
      strategy: 'REDUCE_TERM' | 'REDUCE_PAYMENT'
      accountId?: string
      amount: string
      occurredAt: string
      idempotencyKey: string
    }
export type UpdateTransactionInput = Omit<
  Partial<TransferInput>,
  'cardPurchase'
> & {
  version: number
  cardPurchase?: MovementInput['cardPurchase'] | null
}
export interface AdjustmentInput {
  accountId: string
  actualBalance: string
  occurredAt: string
  description?: string | null
}
