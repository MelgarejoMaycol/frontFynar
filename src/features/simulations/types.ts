export type PurchasePaymentMethod = 'CASH' | 'CREDIT_CARD' | 'FINANCING'
export type SimulationImpactLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL'

export interface PurchaseSimulationInput {
  name?: string
  amount: number
  paymentMethod: PurchasePaymentMethod
  accountId?: string
  installments: number
  monthlyRate?: number
}

export interface PurchaseSimulationResult {
  purchase: {
    name: string | null
    amount: string
    paymentMethod: PurchasePaymentMethod
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
  }
  impact: {
    level: SimulationImpactLevel
    headline: string
    explanation: string
  }
  period: { type: string; dateFrom: string; dateTo: string; generatedAt: string; timezone: string }
  currency: string
  assumptions: string[]
}
