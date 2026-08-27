const separatorIndex = (value: string) => {
  const indexes = [...value.matchAll(/[.,]/g)].map((match) => match.index ?? -1)
  if (!indexes.length) return -1
  const last = indexes.at(-1)!
  const kinds = new Set(indexes.map((index) => value[index]))
  const digitsAfter = value.slice(last + 1).replace(/\D/g, '').length
  if (value.endsWith('.') || value.endsWith(',')) return last
  if (kinds.size > 1) return last
  const separator = value[last]
  if (separator === ',')
    return indexes.length > 1 && digitsAfter === 3 ? -1 : last
  return digitsAfter > 0 && digitsAfter <= 2 ? last : -1
}

export const normalizeMoneyValue = (text: string) => {
  if (!text.trim()) return ''
  const cleaned = text.replace(/[^\d,.-]/g, '')
  if (!/\d/.test(cleaned)) return ''
  const negative = cleaned.startsWith('-')
  const unsigned = cleaned.replace(/-/g, '')
  const separator = separatorIndex(unsigned)
  const rawInteger = (
    separator >= 0 ? unsigned.slice(0, separator) : unsigned
  ).replace(/\D/g, '')
  const integer = (rawInteger || '0').replace(/^0+(?=\d)/, '')
  if (separator < 0) return `${negative ? '-' : ''}${integer}`
  const decimals = unsigned
    .slice(separator + 1)
    .replace(/\D/g, '')
    .slice(0, 2)
  return `${negative ? '-' : ''}${integer}.${decimals}`
}

export const formatCurrencyInput = (value: string) => {
  if (!value) return ''
  const normalized = normalizeMoneyValue(value)
  const negative = normalized.startsWith('-')
  const unsigned = negative ? normalized.slice(1) : normalized
  const [integer = '0', decimals] = unsigned.split('.')
  const grouped = integer.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `${negative ? '-' : ''}${grouped},${(decimals ?? '').padEnd(2, '0')}`
}

/** Interprets every entered digit as minor units: 9 -> 0.09, 987 -> 9.87. */
export const moneyFromMinorUnitInput = (text: string) => {
  const negative = text.trimStart().startsWith('-')
  const digits = text.replace(/\D/g, '')
  if (!digits) return ''
  const significant = digits.replace(/^0+(?=\d)/, '')
  const integer = significant.length > 2 ? significant.slice(0, -2) : '0'
  const decimals = significant.slice(-2).padStart(2, '0')
  return `${negative ? '-' : ''}${integer}.${decimals}`
}

export const parseCurrencyInput = normalizeMoneyValue
export const normalizeMoneyInput = normalizeMoneyValue
export const formatMoneyInput = formatCurrencyInput

export const canonicalMoneyInput = (value: string) => {
  const normalized = normalizeMoneyValue(value)
  if (!normalized) return ''
  const [integer, decimals = ''] = normalized.split('.')
  return `${integer}.${decimals.padEnd(2, '0')}`
}
