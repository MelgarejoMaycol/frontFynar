import type {
  ReportGroup,
  ReportParams,
  ReportPeriod,
} from './types/report.types'

export const calendarRangeDays = (dateFrom: string, dateTo: string) => {
  const [fromYear, fromMonth, fromDay] = dateFrom.split('-').map(Number)
  const [toYear, toMonth, toDay] = dateTo.split('-').map(Number)
  return (
    Math.round(
      (Date.UTC(toYear, toMonth - 1, toDay) -
        Date.UTC(fromYear, fromMonth - 1, fromDay)) /
        86_400_000,
    ) + 1
  )
}

export function customRangeError(params: ReportParams): string | null {
  if (params.period !== 'CUSTOM') return null
  if (!params.dateFrom || !params.dateTo || params.dateFrom > params.dateTo)
    return 'Selecciona un rango de fechas válido.'
  if (calendarRangeDays(params.dateFrom, params.dateTo) > 366)
    return 'El rango personalizado no puede superar 366 días.'
  return null
}

export const groupsForPeriod = (
  period: ReportPeriod,
  params: ReportParams,
): ReportGroup[] => {
  if (period === 'LAST_7_DAYS') return ['DAY']
  if (period === 'CURRENT_YEAR' || period === 'PREVIOUS_YEAR') return ['MONTH']
  if (period === 'CUSTOM' && params.dateFrom && params.dateTo) {
    const days = calendarRangeDays(params.dateFrom, params.dateTo)
    return days <= 31
      ? ['DAY', 'WEEK', 'MONTH']
      : days <= 120
        ? ['WEEK', 'MONTH']
        : ['MONTH']
  }
  return ['DAY', 'WEEK']
}
