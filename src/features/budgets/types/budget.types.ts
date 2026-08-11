import type {
  AccountNature,
  AccountType,
} from '@/features/accounts/types/account.types'
export const budgetPeriods = ['WEEKLY', 'MONTHLY', 'YEARLY', 'CUSTOM'] as const
export type BudgetPeriod = (typeof budgetPeriods)[number]
export type BudgetStatus = 'SAFE' | 'WARNING' | 'EXCEEDED'
export interface BudgetCategory {
  id: string
  name: string
  type: 'EXPENSE'
  icon: string | null
  color: string | null
  isSystem: boolean
  isActive: boolean
}
export interface BudgetAccount {
  id: string
  name: string
  type: AccountType
  nature: AccountNature
  currency: string
  isActive: boolean
}
export interface BudgetProgress {
  spent: string
  remaining: string
  percentage: string
  status: BudgetStatus
}
export interface Budget {
  id: string
  name: string
  period: BudgetPeriod
  startsOn: string
  endsOn: string
  amount: string
  currency: string
  alertThreshold: string
  rolloverEnabled: boolean
  isActive: boolean
  categories: BudgetCategory[]
  accounts: BudgetAccount[]
  progress: BudgetProgress
  projection: {
    projectedSpend: string
    projectedRemaining: string
    projectedPercentage: string
    projectedStatus: BudgetStatus
  }
  createdAt: string
  updatedAt: string
}
export interface BudgetList {
  items: Budget[]
  page: number
  limit: number
  total: number
  totalPages: number
}
export interface BudgetFilters {
  status?: 'ACTIVE' | 'ARCHIVED' | 'ALL'
  includeArchived?: 'true' | 'false'
  period?: BudgetPeriod
  currency?: string
  dateFrom?: string
  dateTo?: string
  categoryId?: string
  accountId?: string
  search?: string
  page?: number
  limit?: number
}
export interface BudgetInput {
  name: string
  period: BudgetPeriod
  startsOn: string
  endsOn: string
  amount: string
  currency: string
  alertThreshold: string
  rolloverEnabled: boolean
  categoryIds: string[]
  accountIds: string[]
}
export type UpdateBudgetInput = Partial<BudgetInput>
