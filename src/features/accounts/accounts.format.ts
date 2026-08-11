export const isMoneyString = (value: string): boolean =>
  /^-?(?:0|[1-9]\d{0,15})(?:\.\d{1,2})?$/.test(value)

export const formatCurrency = (
  value: string,
  currency: string,
  locale = 'es-CO',
): string => {
  if (!isMoneyString(value) || !/^[A-Z]{3}$/.test(currency))
    return 'Monto no disponible'
  const number = Number(value)
  if (!Number.isFinite(number)) return 'Monto no disponible'
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
    }).format(number)
  } catch {
    return `${value} ${currency}`
  }
}
