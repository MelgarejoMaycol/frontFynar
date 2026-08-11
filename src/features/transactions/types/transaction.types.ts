export const transactionTypes = ['INCOME', 'EXPENSE', 'TRANSFER'] as const
export type TransactionType = (typeof transactionTypes)[number] | 'ADJUSTMENT'
export type TransactionStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED'
export interface Transaction {
  id: string
  type: TransactionType
  status: TransactionStatus
  amount: string
  currency: string
  accountId: string
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
}
export interface TransactionFilters {
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
  categoryId: string
  amount: string
  occurredAt: string
  description?: string | null
  notes?: string | null
  merchantName?: string | null
}
export interface TransferInput extends MovementInput {
  destinationAccountId: string
}
export type CreateTransactionInput =
  | ({ type: 'INCOME' | 'EXPENSE' } & MovementInput)
  | ({ type: 'TRANSFER' } & TransferInput)
export type UpdateTransactionInput = Partial<TransferInput> & {
  version: number
}
export interface AdjustmentInput {
  accountId: string
  actualBalance: string
  occurredAt: string
  description?: string | null
}
