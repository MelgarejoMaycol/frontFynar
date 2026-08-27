export function cardPayloadFromFormData(
  data: FormData,
  basis: 'available' | 'used',
) {
  const institutionName = String(data.get('institutionName') ?? '').trim()
  const referencePeriodicRate = String(
    data.get('referencePeriodicRate') ?? '',
  ).trim()
  return {
    name: String(data.get('name')),
    ...(institutionName ? { institutionName } : {}),
    currency: String(data.get('currency')),
    creditLimit: String(data.get('creditLimit')),
    ...(basis === 'available'
      ? { availableCredit: String(data.get('balance')) }
      : { usedCredit: String(data.get('balance')) }),
    billingDay: Number(data.get('billingDay')) || undefined,
    paymentDueDay: Number(data.get('paymentDueDay')) || undefined,
    currentCyclePaid: data.get('currentCyclePaid') === 'on',
    ...(referencePeriodicRate
      ? { referencePeriodicRate, referenceRateSource: 'INFORMED' }
      : {}),
  }
}
