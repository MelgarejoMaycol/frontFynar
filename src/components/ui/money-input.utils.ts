export const normalizeMoneyInput = (text: string) => {
  const cleaned = text.replace(/[^\d,.-]/g, '')
  const negative = cleaned.startsWith('-')
  const unsigned = cleaned.replace(/-/g, '')
  const separator = Math.max(
    unsigned.lastIndexOf(','),
    unsigned.lastIndexOf('.'),
  )
  const hasDecimal = separator >= 0 && unsigned.length - separator - 1 <= 2
  const integer =
    (hasDecimal ? unsigned.slice(0, separator) : unsigned).replace(/\D/g, '') ||
    '0'
  const decimals = hasDecimal
    ? unsigned
        .slice(separator + 1)
        .replace(/\D/g, '')
        .slice(0, 2)
    : ''
  return `${negative ? '-' : ''}${integer}${decimals ? `.${decimals}` : ''}`
}
export const formatMoneyInput = (value: string) => {
  if (!value) return ''
  const normalized = normalizeMoneyInput(value)
  const [integer, decimals] = normalized.split('.')
  const formatted = new Intl.NumberFormat('es-CO', {
    maximumFractionDigits: 0,
  }).format(Number(integer))
  return decimals == null ? formatted : `${formatted},${decimals}`
}
