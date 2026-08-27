import { describe, expect, it } from 'vitest'
import { monthlyCardPayment } from '@/features/liabilities/card-payment.utils'
import type { Card, Statement } from '@/features/liabilities/types'

const card = (nextPayment: Card['nextPayment']): Card => ({
  id: 'card-1', name: 'Visa', institutionName: null, currency: 'COP',
  currentBalance: '608543.22', creditLimit: '1500000', billingDay: 20,
  paymentDueDay: 5, usedCredit: '608543.22', availableCredit: '891456.78',
  utilization: '40.57', nextBillingDate: '2026-08-20', nextPaymentDate: '2026-09-05',
  nextPayment, referencePeriodicRate: null, referenceRateSource: null,
})

const statement: Statement = {
  id: 'statement-1', cardAccountId: 'card-1', periodStart: '2026-08-01',
  periodEnd: '2026-08-31', dueDate: '2026-09-05', previousBalance: '0',
  purchasesAmount: '250000', paymentsAmount: '70000', interestAmount: '0', feeAmount: '0',
  calculatedBalance: '250000', reportedBalance: '250000', minimumPayment: '75000',
  paidAmount: '70000', status: 'PARTIAL',
}

describe('Pagar mes', () => {
  it('usa el próximo pago informado pendiente', () =>
    expect(monthlyCardPayment(card({ amount: '180000', originalAmount: '180000', paidAmount: '0', minimumPayment: null, source: 'INFORMED', statementId: null, expectationId: 'expectation-1', reportedTotalBalance: null }), null))
      .toEqual({ amount: '180000', source: 'INFORMED' }))

  it('usa el saldo pendiente del extracto después de pagos parciales', () =>
    expect(monthlyCardPayment(card(null), statement)).toEqual({ amount: '180000.00', source: 'INFORMED' }))

  it('distingue una estimación y permite ausencia de monto', () => {
    expect(monthlyCardPayment(card({ amount: '608543.22', originalAmount: '608543.22', paidAmount: '0', minimumPayment: null, source: 'ESTIMATED', statementId: null, expectationId: null, reportedTotalBalance: null }), null).source).toBe('ESTIMATED')
    expect(monthlyCardPayment(card(null), null)).toEqual({ amount: null, source: null })
  })
})
