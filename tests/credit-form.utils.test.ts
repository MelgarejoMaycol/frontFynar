import { describe, expect, it } from 'vitest'
import {
  canonicalCreditMoney,
  debtCreatePayload,
  debtEstimatePayload,
  decimalRateToPercent,
  percentToDecimalRate,
} from '@/features/liabilities/credit-form.utils'

describe('adaptadores del formulario de crédito', () => {
  const form = {
    name: 'Crédito libre inversión prueba',
    lenderName: 'Bancolombia',
    type: 'PERSONAL_LOAN' as const,
    currency: 'COP',
    originalAmount: '10000000.00',
    currentBalance: '10000000.00',
    interestRate: '1,50',
    interestRateBasis: 'EFFECTIVE_MONTHLY' as const,
    installmentCount: '24',
    paymentFrequency: 'MONTHLY' as const,
    installmentAmount: '',
    firstPaymentDate: '2026-09-24',
    notes: '',
  }

  it('envía dinero progresivo en formato canónico', () => {
    expect(canonicalCreditMoney('23.000.000,00')).toBe('23000000.00')
    expect(canonicalCreditMoney('1.200.000,00')).toBe('1200000.00')
    expect(canonicalCreditMoney('657.874,98')).toBe('657874.98')
  })

  it('convierte 2% a 0.02 y no a 200%', () => {
    expect(percentToDecimalRate('2')).toBe('0.02')
    expect(percentToDecimalRate('2,50')).toBe('0.025')
    expect(decimalRateToPercent('0.02')).toBe('2,00 %')
  })

  it('construye el contrato exacto y distinto para estimar y crear', () => {
    expect(debtEstimatePayload(form)).toEqual({
      originalPrincipal: '10000000.00',
      currentBalance: '10000000.00',
      interestRate: '0.015',
      interestRateBasis: 'EFFECTIVE_MONTHLY',
      remainingInstallments: 24,
      paymentFrequency: 'MONTHLY',
      firstPaymentDate: '2026-09-24',
    })
    expect(debtCreatePayload(form)).toEqual({
      name: 'Crédito libre inversión prueba',
      lenderName: 'Bancolombia',
      type: 'PERSONAL_LOAN',
      currency: 'COP',
      originalAmount: '10000000.00',
      currentBalance: '10000000.00',
      interestRate: '0.015',
      interestRateBasis: 'EFFECTIVE_MONTHLY',
      installmentCount: 24,
      paymentFrequency: 'MONTHLY',
      firstPaymentDate: '2026-09-24',
      notes: null,
    })
    expect(debtEstimatePayload(form)).not.toHaveProperty('installmentCount')
    expect(debtCreatePayload(form)).not.toHaveProperty('remainingInstallments')
    expect(debtCreatePayload(form)).not.toHaveProperty('termMonths')
  })
})
