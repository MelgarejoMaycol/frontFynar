export type ExchangeCurrency = {
  code: string
  name: string
  symbol: string
  minorUnits: number
}

export type ExchangeCurrencies = {
  defaultBase: string
  currencies: ExchangeCurrency[]
}

export type ExchangeCacheStatus = 'LIVE' | 'CACHE' | 'STALE'

export type ExchangeConversion = {
  from: string
  to: string
  amount: string
  rate: string
  convertedAmount: string
  date: string
  provider: string
  fetchedAt: string
  cacheStatus: ExchangeCacheStatus
  disclaimer: string
}

export type ExchangeRatePoint = {
  date: string
  rate: string
}

export type ExchangeRateHistory = {
  base: string
  quote: string
  from: string
  to: string
  group: 'day' | 'week' | 'month'
  points: ExchangeRatePoint[]
  provider: string
  fetchedAt: string
  cacheStatus: ExchangeCacheStatus
}

export type ConvertCurrencyInput = {
  from: string
  to: string
  amount: string
}

export type ExchangeHistoryInput = {
  base: string
  quote: string
  from: string
  to: string
  group?: 'week' | 'month'
}
