import { describe, expect, it } from 'vitest'
import {
  calendarDate,
  money,
  statusLabel,
  statusTone,
} from '@/features/liabilities/format'
import { debtSchema, obligationSchema } from '@/features/liabilities/schemas'
import { liabilityKeys } from '@/features/liabilities/hooks'

describe('Créditos y pagos', () => {
  it('formatea moneda real, fechas calendario y estados sin asumir solo color', () => {
    expect(money('1200.00', 'USD')).toContain('US$')
    expect(calendarDate('2028-02-29')).toMatch(/29/)
    expect(statusLabel.OVERDUE).toBe('Vencido')
    expect(statusTone('OVERDUE')).toBe('error')
  })
  it('valida crédito incompleto con los campos que el backend puede estimar', () => {
    expect(
      debtSchema.safeParse({
        name: 'Vehículo',
        lenderName: 'Banco',
        type: 'VEHICLE_LOAN',
        currency: 'COP',
        originalAmount: '10000000.00',
        currentBalance: '',
        interestRate: '',
        interestRateBasis: 'EFFECTIVE_ANNUAL',
        termMonths: '36',
        installmentAmount: '',
        firstPaymentDate: '2026-09-01',
        notes: '',
      }).success,
    ).toBe(true)
  })
  it('valida obligaciones y mantiene query keys acotadas por workspace', () => {
    expect(
      obligationSchema.safeParse({
        name: 'Energía',
        expectedAmount: '120000.00',
        currency: 'COP',
        amountType: 'VARIABLE',
        frequency: 'MONTHLY',
        startsOn: '2026-08-12',
        dayOfMonth: '12',
      }).success,
    ).toBe(true)
    expect(liabilityKeys.debt('workspace-a', 'debt-a')).toEqual([
      'liabilities',
      'workspace-a',
      'debt',
      'debt-a',
    ])
  })
})
