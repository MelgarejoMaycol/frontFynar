import { httpClient } from '@/services/http'
import type { ApiSuccess } from '@/services/http/httpTypes'
import type {
  CreateTransactionInput,
  Transaction,
  TransactionFilters,
  TransactionList,
  UpdateTransactionInput,
  AdjustmentInput,
} from '../types/transaction.types'
const base = (workspaceId: string) => `/workspaces/${workspaceId}/transactions`
const query = (filters: TransactionFilters) => {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(filters))
    if (value !== undefined && value !== '') params.set(key, String(value))
  const value = params.toString()
  return value ? `?${value}` : ''
}
export const transactionsApi = {
  list: (
    workspaceId: string,
    filters: TransactionFilters,
    signal?: AbortSignal,
  ) =>
    httpClient.get<ApiSuccess<TransactionList>>(
      `${base(workspaceId)}${query(filters)}`,
      signal,
    ),
  get: (workspaceId: string, transactionId: string, signal?: AbortSignal) =>
    httpClient.get<ApiSuccess<Transaction>>(
      `${base(workspaceId)}/${transactionId}`,
      signal,
    ),
  create: (workspaceId: string, input: CreateTransactionInput) => {
    const { type, ...body } = input
    return httpClient.post<ApiSuccess<Transaction>, typeof body>(
      `${base(workspaceId)}/${type.toLowerCase()}`,
      body,
    )
  },
  adjust: (workspaceId: string, input: AdjustmentInput) =>
    httpClient.post<ApiSuccess<Transaction>, AdjustmentInput>(
      `${base(workspaceId)}/adjustment`,
      input,
    ),
  update: (
    workspaceId: string,
    transactionId: string,
    input: UpdateTransactionInput,
  ) =>
    httpClient.patch<ApiSuccess<Transaction>, UpdateTransactionInput>(
      `${base(workspaceId)}/${transactionId}`,
      input,
    ),
  cancel: (workspaceId: string, transactionId: string, version: number) =>
    httpClient.delete<void, { version: number }>(
      `${base(workspaceId)}/${transactionId}`,
      { version },
    ),
}
