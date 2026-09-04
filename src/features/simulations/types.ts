export type PurchasePaymentMethod = 'CASH' | 'CREDIT_CARD' | 'FINANCING'
export type SimulationImpactLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL'

export interface PurchaseSimulationInput {
  name?: string
  amount: number
  paymentMethod: PurchasePaymentMethod
  accountId?: string
  categoryId?: string
  installments: number
  monthlyRate?: number
}

export interface PurchaseSimulationResult {
  purchase: {
    name: string | null
    amount: string
    paymentMethod: PurchasePaymentMethod
    categoryId: string | null
    account: { id: string; name: string; type: string; currency: string } | null
  }
  before: {
    currentAvailable: string
    projectedClosingBalance: string
    lowestProjectedBalance: { amount: string; date: string }
    knownCommitments: string
  }
  after: {
    projectedClosingBalance: string
    lowestProjectedBalance: { amount: string; date: string }
    addedCommitmentThisPeriod: string
    selectedAccountAfter: string | null
  }
  financing: null | {
    installments: number
    monthlyRate: number
    monthlyPayment: string
    estimatedInterest: string
    totalCost: string
    schedule: Array<{ installment: number; date: string; amount: string }>
  }
  budgets: Array<{
    id: string
    name: string
    amount: string
    spentBefore: string
    spentAfter: string
    remainingAfter: string
    percentageAfter: string
    statusAfter: 'SAFE' | 'WARNING' | 'EXCEEDED'
  }>
  impact: {
    level: SimulationImpactLevel
    headline: string
    explanation: string
  }
  period: { type: string; dateFrom: string; dateTo: string; generatedAt: string; timezone: string }
  currency: string
  assumptions: string[]
}
