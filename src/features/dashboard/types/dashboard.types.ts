import type {
  AccountNature,
  AccountType,
} from '@/features/accounts/types/account.types'
import type { Transaction } from '@/features/transactions/types/transaction.types'

export const dashboardPeriods = [
  'CURRENT_MONTH',
  'MY_CYCLE',
  'PREVIOUS_MONTH',
  'LAST_7_DAYS',
  'LAST_30_DAYS',
  'CUSTOM',
] as const
export type DashboardPeriod = (typeof dashboardPeriods)[number]
export interface DashboardParams {
  period: DashboardPeriod
  dateFrom?: string
  dateTo?: string
  recentLimit?: number
}
export interface CurrencySummary {
  currency: string
  availableMoney: string
  totalMoney?: string
  reservedForGoals?: string
  totalIncome: string
  totalExpenses: string
  netCashFlow: string
  netWorth: string
}
export interface DashboardAccount {
  id: string
  name: string
  type: AccountType
  nature: AccountNature
  currency: string
  currentBalance: string
  reservedForGoals?: string
  availableBalance?: string
  isFavorite: boolean
  includeInNetWorth: boolean
}
export interface DashboardComparison {
  currency: string
  currentIncome: string
  previousIncome: string
  incomeChangeAmount: string
  incomeChangePercentage: string | null
  currentExpenses: string
  previousExpenses: string
  expenseChangeAmount: string
  expenseChangePercentage: string | null
  currentNetCashFlow: string
  previousNetCashFlow: string
}
export interface DashboardData {
  period: {
    type: DashboardPeriod
    dateFrom: string
    dateTo: string
    timezone: string
  }
  baseCurrency: string
  summariesByCurrency: CurrencySummary[]
  accountBalances: DashboardAccount[]
  recentTransactions: Transaction[]
  budgetProgress: unknown[]
  expensesByCategory: Array<{
    categoryId: string | null
    categoryName: string
    icon: string | null
    color: string | null
    currency: string
    amount: string
    percentage: string
  }>
  accountsByType: Array<{
    type: string
    nature: string
    currency: string
    accountCount: number
    totalBalance: string
  }>
  comparisonByCurrency: DashboardComparison[]
}
