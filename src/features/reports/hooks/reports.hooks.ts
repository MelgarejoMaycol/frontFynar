import { useQuery } from '@tanstack/react-query'
import { reportsApi } from '../api/reports.api'
import type {
  AccountBalancesParams,
  CashFlowParams,
  ReportParams,
} from '../types/report.types'
export const reportKeys = {
  all: (workspaceId: string) => ['reports', workspaceId] as const,
  income: (workspaceId: string, params: ReportParams) =>
    ['reports', workspaceId, 'income-vs-expenses', params] as const,
  categories: (workspaceId: string, params: ReportParams) =>
    ['reports', workspaceId, 'expenses-by-category', params] as const,
  cashFlow: (workspaceId: string, params: CashFlowParams) =>
    ['reports', workspaceId, 'cash-flow', params] as const,
  balances: (workspaceId: string, params: AccountBalancesParams) =>
    ['reports', workspaceId, 'account-balances', params] as const,
}
export const useIncomeVsExpenses = (
  workspaceId: string,
  params: ReportParams,
  enabled: boolean,
) =>
  useQuery({
    queryKey: reportKeys.income(workspaceId, params),
    queryFn: async ({ signal }) =>
      (await reportsApi.incomeVsExpenses(workspaceId, params, signal)).data,
    enabled,
  })
export const useExpensesByCategory = (
  workspaceId: string,
  params: ReportParams,
  enabled: boolean,
) =>
  useQuery({
    queryKey: reportKeys.categories(workspaceId, params),
    queryFn: async ({ signal }) =>
      (await reportsApi.expensesByCategory(workspaceId, params, signal)).data,
    enabled,
  })
export const useCashFlow = (
  workspaceId: string,
  params: CashFlowParams,
  enabled: boolean,
) =>
  useQuery({
    queryKey: reportKeys.cashFlow(workspaceId, params),
    queryFn: async ({ signal }) =>
      (await reportsApi.cashFlow(workspaceId, params, signal)).data,
    enabled,
  })
export const useAccountBalancesReport = (
  workspaceId: string,
  params: AccountBalancesParams,
  enabled: boolean,
) =>
  useQuery({
    queryKey: reportKeys.balances(workspaceId, params),
    queryFn: async ({ signal }) =>
      (await reportsApi.accountBalances(workspaceId, params, signal)).data,
    enabled,
  })
