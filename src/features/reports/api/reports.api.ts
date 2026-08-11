import { httpClient, type ApiSuccess } from '@/services/http'
import type {
  AccountBalancesParams,
  AccountBalancesReport,
  CashFlowParams,
  CashFlowReport,
  ExpensesByCategoryReport,
  IncomeVsExpensesReport,
  ReportParams,
} from '../types/report.types'

const query = (params: object) => {
  const search = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') search.set(key, String(value))
  })
  return search.toString()
}
const base = (workspaceId: string) => `/workspaces/${workspaceId}/reports`
export const reportsApi = {
  incomeVsExpenses: (
    workspaceId: string,
    params: ReportParams,
    signal?: AbortSignal,
  ) =>
    httpClient.get<ApiSuccess<IncomeVsExpensesReport>>(
      `${base(workspaceId)}/income-vs-expenses?${query(params)}`,
      signal,
    ),
  expensesByCategory: (
    workspaceId: string,
    params: ReportParams,
    signal?: AbortSignal,
  ) =>
    httpClient.get<ApiSuccess<ExpensesByCategoryReport>>(
      `${base(workspaceId)}/expenses-by-category?${query({ ...params, limit: 100 })}`,
      signal,
    ),
  cashFlow: (
    workspaceId: string,
    params: CashFlowParams,
    signal?: AbortSignal,
  ) =>
    httpClient.get<ApiSuccess<CashFlowReport>>(
      `${base(workspaceId)}/cash-flow?${query(params)}`,
      signal,
    ),
  accountBalances: (
    workspaceId: string,
    params: AccountBalancesParams,
    signal?: AbortSignal,
  ) =>
    httpClient.get<ApiSuccess<AccountBalancesReport>>(
      `${base(workspaceId)}/account-balances?${query(params)}`,
      signal,
    ),
}
