export const isMoneyString = (value: string): boolean =>
  /^-?(?:0|[1-9]\d{0,15})(?:\.\d{1,2})?$/.test(value)

export const formatCurrency = (
  value: string,
  currency: string,
  locale = 'es-CO',
): string => {
  if (!isMoneyString(value) || !/^[A-Z]{3}$/.test(currency))
    return 'Monto no disponible'
  try {
    const formatter = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
    const symbol =
      formatter.formatToParts(0).find((part) => part.type === 'currency')
        ?.value ?? currency
    const negative = value.startsWith('-')
    const [integer = '0', fraction = ''] = (
      negative ? value.slice(1) : value
    ).split('.')
    const grouped = integer.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
    return `${negative ? '-' : ''}${symbol} ${grouped},${fraction.padEnd(2, '0')}`
  } catch {
    return `${value} ${currency}`
  }
}

export const accountOptionLabel = (account: {
  name: string
  nature: 'ASSET' | 'LIABILITY'
  currentBalance: string
  currency: string
}): string => {
  const sign = account.nature === 'LIABILITY' ? '-' : '+'
  const amount = formatCurrency(
    account.currentBalance.replace(/^-/, ''),
    account.currency,
  )
  return `${account.name} · ${sign} ${amount}`
}
