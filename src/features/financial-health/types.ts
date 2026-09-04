export type FinancialHealthDimensionId =
  | 'LIQUIDITY'
  | 'DEBT'
  | 'SPENDING_CONTROL'
  | 'SAVINGS'
  | 'PAYMENT_COMPLIANCE'

export type FinancialHealthBand =
  | 'SOLID'
  | 'STABLE'
  | 'ATTENTION'
  | 'FRAGILE'
  | 'INSUFFICIENT'

export interface FinancialHealthDimension {
  id: FinancialHealthDimensionId
  label: string
  score: number | null
  available: boolean
  status: FinancialHealthBand
  summary: string
  explanation: string
  metrics: Record<string, string | number | null>
  action: { label: string; url: string } | null
}

export interface FinancialHealthRecommendation {
  dimension: FinancialHealthDimensionId
  title: string
  detail: string
  action: { label: string; url: string }
}

export interface FinancialHealthSnapshot {
  kind: 'FINANCIAL_HEALTH_SNAPSHOT'
  period: string
  generatedAt: string
  score: number
  band: FinancialHealthBand
  coverage: number
  availableDimensions: number
  dimensions: Array<{
    id: string
    label: string
    score: number | null
    status: string
  }>
}

export interface FinancialHealthHistory {
  items: FinancialHealthSnapshot[]
  hasEnoughHistory: boolean
  minimumPeriods: number
  message: string
}

export interface FinancialHealthResult {
  version: string
  score: number | null
  band: FinancialHealthBand
  coverage: number
  availableDimensions: number
  dimensions: FinancialHealthDimension[]
  recommendations: FinancialHealthRecommendation[]
  methodology: {
    version: string
    aggregation: string
    rules: string[]
    disclaimer: string
  }
  period: {
    key: string
    dateFrom: string
    dateTo: string
    generatedAt: string
    timezone: string
  }
  currency: string
  dataQuality: {
    historyDays: number
    trailingWindowDays: number
    budgetCount: number
    evaluatedPayments: number
    notes: string[]
  }
  trace: Record<string, string | number | null>
  history: FinancialHealthHistory
}
