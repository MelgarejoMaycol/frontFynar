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


export type InvestmentContributionFrequency =
  | 'NONE'
  | 'MONTHLY'
  | 'QUARTERLY'
  | 'YEARLY'

export interface InvestmentSimulationInput {
  currency: string
  initialAmount: string
  recurringContribution: string
  contributionFrequency: InvestmentContributionFrequency
  years: number
  annualReturn: string
  annualFee: string
  inflationRate: string
}

export interface InvestmentSimulationResult {
  currency: string
  initialAmount: string
  recurringContribution: string
  contributionFrequency: InvestmentContributionFrequency
  years: number
  annualReturn: string
  annualFee: string
  inflationRate: string
  effectiveMonthlyReturn: string
  effectiveAnnualReturn: string
  totalContributions: string
  estimatedFinalValue: string
  estimatedProfit: string
  inflationAdjustedValue: string
  totalReturnPercentage: string
  timeline: Array<{
    month: number
    year: number
    contributed: string
    estimatedValue: string
    estimatedProfit: string
  }>
  assumptions: string[]
}

export interface InvestmentScenarioInput
  extends Omit<InvestmentSimulationInput, 'annualReturn'> {
  baseAnnualReturn: string
  spread: string
}

export interface InvestmentScenarioResult {
  currency: string
  spread: string
  scenarios: Array<{
    label: 'CONSERVATIVE' | 'BASE' | 'OPTIMISTIC'
    annualReturn: string
    estimatedFinalValue: string
    estimatedProfit: string
    inflationAdjustedValue: string
    totalReturnPercentage: string
  }>
  disclaimer: string
}

export interface InvestmentFinancialImpactInput {
  currency: string
  initialAmount: string
  recurringContribution: string
}

export interface InvestmentFinancialImpactResult {
  simulationCurrency: string
  baseCurrency: string
  initialInvestment: {
    original: string
    baseEquivalent: string
  }
  recurringContribution: {
    original: string
    baseEquivalent: string
  }
  availableMoney: string
  remainingAvailableMoney: string
  liquidityPercentageUsed: string
  currentPeriodIncome: string
  currentPeriodExpenses: string
  currentNetCashFlow: string
  knownCommitments: string
  recurringContributionShareOfPositiveCashFlow: string
  conversion: null | {
    from: string
    to: string
    rate: string
    date: string
  }
  impact: {
    level: SimulationImpactLevel
    headline: string
    explanation: string
  }
  disclaimer: string
}

export interface InvestmentSimulationOptions {
  currencies: Array<{
    code: string
    name: string
    symbol: string
    minorUnits: number
  }>
  defaultCurrency: string
  contributionFrequencies: Array<{
    value: InvestmentContributionFrequency
    label: string
  }>
  limits: {
    minYears: number
    maxYears: number
  }
  defaults: {
    years: number
    annualReturn: string
    annualFee: string
    inflationRate: string
    scenarioSpread: string
  }
}
