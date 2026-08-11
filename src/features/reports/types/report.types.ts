import type {
  AccountNature,
  AccountType,
} from '@/features/accounts/types/account.types'

export const reportPeriods = [
  'CURRENT_MONTH',
  'PREVIOUS_MONTH',
  'LAST_7_DAYS',
  'LAST_30_DAYS',
  'CURRENT_YEAR',
  'PREVIOUS_YEAR',
  'CUSTOM',
] as const
export type ReportPeriod = (typeof reportPeriods)[number]
export type ReportGroup = 'DAY' | 'WEEK' | 'MONTH'
export interface ReportParams {
  period: ReportPeriod
  dateFrom?: string
  dateTo?: string
  currency?: string
  accountId?: string
  categoryId?: string
}
export interface CashFlowParams extends ReportParams {
  groupBy: ReportGroup
}
export interface ReportPeriodResponse {
  type: ReportPeriod
  dateFrom: string
  dateTo: string
  timezone: string
}
export interface CurrencySummary {
  currency: string
  totalIncome: string
  totalExpenses: string
  netCashFlow: string
  incomeTransactionCount: number
  expenseTransactionCount: number
  averageIncome: string
  averageExpense: string
  comparisonWithPreviousPeriod: Record<string, string | null>
}
export interface IncomeVsExpensesReport {
  period: ReportPeriodResponse
  summariesByCurrency: CurrencySummary[]
}
export interface CategoryExpense {
  categoryId: string | null
  categoryName: string
  icon: string | null
  color: string | null
  amount: string
  percentage: string
  transactionCount: number
}
export interface ExpensesByCategoryReport {
  period: ReportPeriodResponse
  groupsByCurrency: Array<{
    currency: string
    totalExpenses: string
    categories: CategoryExpense[]
  }>
}
export interface CashFlowPoint {
  periodStart: string
  periodEnd: string
  totalIncome: string
  totalExpenses: string
  netCashFlow: string
  incomeCount: number
  expenseCount: number
}
export interface CashFlowReport {
  period: ReportPeriodResponse
  groupBy: ReportGroup
  seriesByCurrency: Array<{ currency: string; points: CashFlowPoint[] }>
}
export interface AccountBalancesParams {
  currency?: string
  nature?: AccountNature
  type?: AccountType
  includeArchived?: 'true' | 'false'
  search?: string
  page?: number
  limit?: number
}
export interface ReportAccount {
  id: string
  name: string
  type: AccountType
  nature: AccountNature
  currency: string
  currentBalance: string
  isFavorite: boolean
  includeInNetWorth: boolean
  isActive: boolean
}
export interface AccountBalancesReport {
  summariesByCurrency: Array<{
    currency: string
    assetBalance: string
    liabilityBalance: string
    netWorth: string
    availableMoney: string
    accountCount: number
  }>
  accounts: ReportAccount[]
  pagination: { page: number; limit: number; total: number; totalPages: number }
}
