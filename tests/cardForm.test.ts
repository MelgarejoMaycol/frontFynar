import { describe, expect, it } from 'vitest'
import { cardPayloadFromFormData } from '@/features/liabilities/card-form.utils'

const form = (institutionName: string) => {
  const data = new FormData()
  data.set('name', 'Creditarjeta Coomuldesa')
  data.set('institutionName', institutionName)
  data.set('currency', 'COP')
  data.set('creditLimit', '1500000.00')
  data.set('balance', '675231.02')
  data.set('billingDay', '20')
  data.set('paymentDueDay', '5')
  return data
}

describe('contrato CardForm', () => {
  it('envía valores normalizados con centavos y omite el banco vacío', () => {
    expect(cardPayloadFromFormData(form('  '), 'available')).toEqual({
      name: 'Creditarjeta Coomuldesa',
      currency: 'COP',
      creditLimit: '1500000.00',
      availableCredit: '675231.02',
      billingDay: 20,
      paymentDueDay: 5,
      currentCyclePaid: false,
    })
  })
  it('conserva banco no vacío y permite informar cupo utilizado', () => {
    const payload = cardPayloadFromFormData(form(' Coomuldesa '), 'used')
    expect(payload).toMatchObject({
      institutionName: 'Coomuldesa',
      usedCredit: '675231.02',
    })
    expect(payload).not.toHaveProperty('availableCredit')
  })
  it('informa explícitamente cuando el ciclo actual ya fue pagado', () => {
    const data = form('Coomuldesa')
    data.set('currentCyclePaid', 'on')
    expect(cardPayloadFromFormData(data, 'available')).toMatchObject({
      currentCyclePaid: true,
    })
  })
})
