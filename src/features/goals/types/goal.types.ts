export const goalStatuses = [
  'ACTIVE',
  'COMPLETED',
  'PAUSED',
  'CANCELLED',
] as const

export type GoalStatus = (typeof goalStatuses)[number]

export type GoalEstimationReason =
  | 'COMPLETED'
  | 'INSUFFICIENT_HISTORY'
  | 'NON_POSITIVE_PACE'
  | 'ESTIMATED'

export interface GoalAccount {
  id: string
  name: string
  type: string
  nature: string
  currency: string
  isActive: boolean
}

export interface GoalContributionAccount {
  id: string
  name: string
  currency: string
}

export interface GoalProjection {
  savedAmount: string
  targetAmount: string
  remainingAmount: string
  surplusAmount: string
  percentage: string
  suggestedMonthlyAmount: string | null
  averageMonthlyContribution: string | null
  estimatedCompletionDate: string | null
  estimationReason: GoalEstimationReason
}

export interface GoalContribution {
  id: string
  transactionId: string | null
  accountId?: string | null
  account?: GoalContributionAccount | null
  amount: string
  direction: 'IN' | 'OUT'
  contributedAt: string
  createdAt: string
}

export interface Goal {
  id: string
  name: string
  targetAmount: string
  savedAmount: string
  targetDate: string | null
  status: GoalStatus
  icon: string | null
  color: string | null
  account: GoalAccount | null
  progress: GoalProjection
  contributions: GoalContribution[]
  archivedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface GoalList {
  items: Goal[]
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface GoalFilters {
  status?: GoalStatus
  includeArchived?: 'true' | 'false'
  search?: string
  page?: number
  limit?: number
}

export interface GoalInput {
  name: string
  targetAmount: string
  targetDate?: string | null
  accountId?: string | null
  icon?: string | null
  color?: string | null
}

export type UpdateGoalInput = Partial<GoalInput>

export interface GoalContributionInput {
  amount: string
  contributedAt?: string
  accountId: string
}
