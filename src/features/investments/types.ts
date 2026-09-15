import type { InvestmentContributionFrequency } from '@/features/simulations/types'

export type InvestmentPlanStatus =
  | 'DRAFT'
  | 'ACTIVE'
  | 'PAUSED'
  | 'COMPLETED'
  | 'ARCHIVED'

export type InvestmentPaceStatus =
  | 'NOT_STARTED'
  | 'AHEAD'
  | 'ON_TRACK'
  | 'BELOW_PREFERRED_PACE'

export interface InvestmentPlanProgress {
  status: InvestmentPlanStatus
  actual: {
    totalContributed: string
    totalWithdrawn: string
    netContributed: string
    currentValue: string
    valuationBasis: 'CASH_FLOWS_ONLY' | 'MANUAL_PLUS_FLOWS'
    latestValuationAt: string | null
  }
  plan: {
    expectedContributedToDate: string
    projectedValueToday: string
    projectedValueAtHorizon: string
    projectedProfitAtHorizon: string
    varianceCurrentVsProjected?: string
  }
  pace: {
    status: InvestmentPaceStatus
    ratio: string | null
    headline: string
    explanation: string
  }
  nextSuggestion: null | {
    date: string | null
    amount: string
    message: string
  }
}

export interface InvestmentPlan {
  id: string
  name: string
  description: string | null
  currency: string
  status: InvestmentPlanStatus
  plannedInitialAmount: string
  recurringContribution: string
  contributionFrequency: InvestmentContributionFrequency
  horizonYears: number
  annualReturn: string
  annualFee: string
  inflationRate: string
  startDate: string | null
  includeInNetWorth: boolean
  notes: string | null
  createdAt: string
  updatedAt: string
  progress: InvestmentPlanProgress
  recentContributions: Array<{
    id: string
    transactionId: string
    amount: string
    occurredAt: string
    note: string | null
    sourceAccount: { id: string; name: string; currency: string }
  }>
  recentWithdrawals: Array<{
    id: string
    transactionId: string
    amount: string
    occurredAt: string
    note: string | null
    destinationAccount: { id: string; name: string; currency: string }
  }>
  recentValuations: Array<{
    id: string
    value: string
    capturedAt: string
    note: string | null
  }>
}

export interface CreateInvestmentPlanInput {
  name: string
  description?: string | null
  currency: string
  plannedInitialAmount: string
  recurringContribution: string
  contributionFrequency: InvestmentContributionFrequency
  horizonYears: number
  annualReturn: string
  annualFee: string
  inflationRate: string
  includeInNetWorth?: boolean
  notes?: string | null
}

export type UpdateInvestmentPlanInput = Partial<CreateInvestmentPlanInput>

export interface InvestmentContributionInput {
  sourceAccountId: string
  amount: string
  occurredAt?: string
  note?: string | null
}

export interface InvestmentWithdrawalInput {
  destinationAccountId: string
  amount: string
  occurredAt?: string
  note?: string | null
}

export interface InvestmentValuationInput {
  value: string
  capturedAt?: string
  note?: string | null
}


export type UpdateInvestmentContributionInput = Partial<InvestmentContributionInput>
export type UpdateInvestmentWithdrawalInput = Partial<InvestmentWithdrawalInput>
export type UpdateInvestmentValuationInput = Partial<InvestmentValuationInput>
