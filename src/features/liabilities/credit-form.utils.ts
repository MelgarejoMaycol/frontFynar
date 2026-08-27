import { canonicalMoneyInput } from '@/components/ui/money-input.utils'
import type { DebtFormValues } from './schemas'
import type { DebtEstimateInput, DebtInput } from './types'

export const canonicalCreditMoney = (value: string) => canonicalMoneyInput(value)

export const percentToDecimalRate = (value: string): string => {
  const normalized = value.trim().replace(',', '.').replace(/\s|%/g, '')
  if (!normalized) return ''
  const [whole = '0', fraction = ''] = normalized.split('.')
  const digits = `${whole}${fraction}`.replace(/^0+(?=\d)/, '') || '0'
  const scale = fraction.length + 2
  const padded = digits.padStart(scale + 1, '0')
  const integer = padded.slice(0, -scale) || '0'
  const decimals = padded.slice(-scale).replace(/0+$/, '')
  return decimals ? `${integer}.${decimals}` : integer
}

export const decimalRateToPercent = (value: string | null): string => {
  if (!value) return '—'
  return `${(Number(value) * 100).toLocaleString('es-CO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  })} %`
}

export const debtCreatePayload = (value: DebtFormValues): DebtInput => ({
  name: value.name.trim(),
  lenderName: value.lenderName.trim() || null,
  type: value.type,
  currency: value.currency,
  originalAmount: canonicalCreditMoney(value.originalAmount),
  ...(value.currentBalance
    ? { currentBalance: canonicalCreditMoney(value.currentBalance) }
    : {}),
  ...(value.interestRate
    ? {
        interestRate: percentToDecimalRate(value.interestRate),
        interestRateBasis: value.interestRateBasis,
      }
    : {}),
  ...(value.installmentCount
    ? { installmentCount: Number(value.installmentCount) }
    : {}),
  paymentFrequency: value.paymentFrequency,
  ...(value.installmentAmount
    ? { installmentAmount: canonicalCreditMoney(value.installmentAmount) }
    : {}),
  ...(value.firstPaymentDate
    ? { firstPaymentDate: value.firstPaymentDate }
    : {}),
  notes: value.notes || null,
})

export const debtEstimatePayload = (
  value: DebtFormValues,
): DebtEstimateInput => ({
  ...(value.originalAmount
    ? { originalPrincipal: canonicalCreditMoney(value.originalAmount) }
    : {}),
  ...(value.currentBalance
    ? { currentBalance: canonicalCreditMoney(value.currentBalance) }
    : {}),
  ...(value.installmentAmount
    ? { paymentAmount: canonicalCreditMoney(value.installmentAmount) }
    : {}),
  ...(value.interestRate
    ? {
        interestRate: percentToDecimalRate(value.interestRate),
        interestRateBasis: value.interestRateBasis,
      }
    : {}),
  ...(value.installmentCount
    ? { remainingInstallments: Number(value.installmentCount) }
    : {}),
  paymentFrequency: value.paymentFrequency,
  ...(value.firstPaymentDate
    ? { firstPaymentDate: value.firstPaymentDate }
    : {}),
})
