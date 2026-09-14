import { httpClient } from '@/services/http'
import type { ApiSuccess } from '@/services/http/httpTypes'
import type {
  ConvertCurrencyInput,
  ExchangeConversion,
  ExchangeCurrencies,
  ExchangeHistoryInput,
  ExchangeRateHistory,
} from '../types/exchange-rates.types'

const queryString = (values: Record<string, string | undefined>) => {
  const query = new URLSearchParams()
  Object.entries(values).forEach(([key, value]) => {
    if (value) query.set(key, value)
  })
  return query.toString()
}

export const exchangeRatesApi = {
  currencies: (signal?: AbortSignal) =>
    httpClient.get<ApiSuccess<ExchangeCurrencies>>(
      '/exchange-rates/currencies',
      signal,
    ),
  convert: (input: ConvertCurrencyInput, signal?: AbortSignal) =>
    httpClient.get<ApiSuccess<ExchangeConversion>>(
      `/exchange-rates/convert?${queryString(input)}`,
      signal,
    ),
  history: (input: ExchangeHistoryInput, signal?: AbortSignal) =>
    httpClient.get<ApiSuccess<ExchangeRateHistory>>(
      `/exchange-rates/history?${queryString(input)}`,
      signal,
    ),
}
