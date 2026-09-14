import { useMutation, useQuery } from '@tanstack/react-query'
import { exchangeRatesApi } from '../api/exchange-rates.api'
import type {
  ConvertCurrencyInput,
  ExchangeHistoryInput,
} from '../types/exchange-rates.types'

export const exchangeRateKeys = {
  currencies: ['exchange-rates', 'currencies'] as const,
  history: (input: ExchangeHistoryInput) =>
    ['exchange-rates', 'history', input] as const,
}

export const useExchangeCurrencies = () =>
  useQuery({
    queryKey: exchangeRateKeys.currencies,
    queryFn: async ({ signal }) =>
      (await exchangeRatesApi.currencies(signal)).data,
    staleTime: 24 * 60 * 60 * 1000,
  })

export const useConvertCurrency = () =>
  useMutation({
    mutationFn: async (input: ConvertCurrencyInput) =>
      (await exchangeRatesApi.convert(input)).data,
  })

export const useExchangeRateHistory = (
  input: ExchangeHistoryInput,
  enabled = true,
) =>
  useQuery({
    queryKey: exchangeRateKeys.history(input),
    queryFn: async ({ signal }) =>
      (await exchangeRatesApi.history(input, signal)).data,
    enabled,
    staleTime: 6 * 60 * 60 * 1000,
  })
