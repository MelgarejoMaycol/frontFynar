export type ForecastDataQuality = 'PARTIAL' | 'LOW' | 'MEDIUM' | 'HIGH'

export interface ForecastTimelineEvent {
  date: string
  direction: 'IN' | 'OUT'
  amount: string
  label: string
  source: 'EXPECTED_INCOME' | 'KNOWN_COMMITMENT'
}

export interface MonthEndCurrencyForecast {
  currency: string
  status: 'PARTIAL' | 'COMPLETE'
  dataQuality: ForecastDataQuality
  currentAvailable: string
  expectedIncome: string
  knownCommitments: string
  estimatedVariableExpenses: string | null
  knownClosingBalance: string
  projectedClosingBalance: string
  lowestProjectedBalance: {
    date: string
    amount: string
  }
  historyDays: number
  daysRemaining: number
  assumptions: string[]
  limitations: string[]
  timeline: Array<{
    date: string
    projectedBalance: string
    events: ForecastTimelineEvent[]
  }>
}

export interface MonthEndForecastData {
  period: {
    dateFrom: string
    dateTo: string
    generatedAt: string
    timezone: string
  }
  baseCurrency: string
  primary: MonthEndCurrencyForecast
  byCurrency: MonthEndCurrencyForecast[]
  methodology: {
    version: string
    description: string
  }
}
