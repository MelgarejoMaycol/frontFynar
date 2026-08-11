import {
  getDateFormatOptions,
  getDisplayLocale,
} from '@/features/workspace/display-preferences'

export const formatMoney = (amount: string, currency: string) => {
  const value = Number(amount)
  return Number.isFinite(value)
    ? new Intl.NumberFormat(getDisplayLocale(), {
        style: 'currency',
        currency,
      }).format(value)
    : `${amount} ${currency}`
}
export const formatTransactionDate = (value: string, timezone: string) =>
  new Intl.DateTimeFormat(getDisplayLocale(), {
    ...getDateFormatOptions(),
    hour: 'numeric',
    minute: '2-digit',
    timeZone: timezone,
  }).format(new Date(value))

const partsInTimezone = (value: Date, timezone: string) =>
  Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(value)
      .map(({ type, value: part }) => [type, part]),
  )

const timezoneOffset = (instant: Date, timezone: string) => {
  const part = partsInTimezone(instant, timezone)
  return (
    Date.UTC(
      Number(part.year),
      Number(part.month) - 1,
      Number(part.day),
      Number(part.hour),
      Number(part.minute),
      Number(part.second),
    ) -
    Math.floor(instant.getTime() / 1000) * 1000
  )
}

export function workspaceDateTimeToIso(
  value: string,
  timezone: string,
): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(
    value,
  )
  if (!match) throw new Error('Fecha local inválida')
  const desired = Date.UTC(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
    Number(match[4]),
    Number(match[5]),
    Number(match[6] ?? 0),
  )
  let instant = new Date(desired)
  instant = new Date(desired - timezoneOffset(instant, timezone))
  instant = new Date(desired - timezoneOffset(instant, timezone))
  return instant.toISOString()
}

export function isoToWorkspaceDateTimeValue(
  value: string,
  timezone: string,
): string {
  const part = partsInTimezone(new Date(value), timezone)
  return `${part.year}-${part.month}-${part.day}T${part.hour}:${part.minute}`
}
export const workspaceDateStartToIso = (date: string, timezone: string) =>
  workspaceDateTimeToIso(`${date}T00:00:00`, timezone)
export const workspaceDateEndToIso = (date: string, timezone: string) =>
  new Date(
    new Date(workspaceDateTimeToIso(`${date}T23:59:59`, timezone)).getTime() +
      999,
  ).toISOString()
