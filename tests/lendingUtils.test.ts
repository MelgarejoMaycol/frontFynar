import { describe, expect, it } from 'vitest'
import {
  getInstallmentInterestPending,
  getInstallmentPending,
  getInstallmentPrincipalPending,
  getLoanInterestPending,
  getLoanTotalPending,
  installmentStatusLabel,
  lendingStatusLabel,
} from '@/features/lending/lending.utils'
import type { LoanInstallment, LoanListItem } from '@/features/lending/types'

const loan: LoanListItem = {
  id: 'loan',
  personId: 'person',
  personName: 'Juan',
  currency: 'COP',
  originalPrincipal: '1000000.00',
  currentPrincipal: '1000000.00',
  ratePercent: '2.00',
  method: 'FIXED_PAYMENT',
  frequency: 'MONTHLY',
  termCount: 12,
  installmentAmount: '94559.60',
  expectedInterest: '134715.17',
  expectedTotal: '1134715.17',
  interestReceived: '20000.00',
  principalReceived: '0.00',
  nextDueDate: '2026-10-09',
  estimatedEndDate: '2027-09-09',
  status: 'ACTIVE',
}

const installment: LoanInstallment = {
  id: 'installment',
  installmentNumber: 1,
  dueDate: '2026-10-09',
  openingPrincipal: '1000000.00',
  principalAmount: '74559.60',
  interestAmount: '20000.00',
  totalAmount: '94559.60',
  principalPaid: '0.00',
  interestPaid: '20000.00',
  totalPaid: '20000.00',
  closingPrincipal: '925440.40',
  status: 'PARTIAL',
  paidAt: null,
}

describe('lending utils', () => {
  it('separa capital, intereses y total pendientes', () => {
    expect(getLoanInterestPending(loan)).toBeCloseTo(114715.17)
    expect(getLoanTotalPending(loan)).toBeCloseTo(1114715.17)
  })

  it('calcula exactamente lo que falta de una cuota parcial', () => {
    expect(getInstallmentPending(installment)).toBeCloseTo(74559.6)
    expect(getInstallmentPrincipalPending(installment)).toBeCloseTo(74559.6)
    expect(getInstallmentInterestPending(installment)).toBe(0)
  })

  it('traduce estados de préstamo y cuota al español', () => {
    expect(lendingStatusLabel.ACTIVE).toBe('Activo')
    expect(lendingStatusLabel.OVERDUE).toBe('Vencido')
    expect(installmentStatusLabel.PARTIAL).toBe('Parcial')
    expect(installmentStatusLabel.PENDING).toBe('Pendiente')
  })
})
