import {
  getDateFormatOptions,
  getDisplayLocale,
} from '@/features/workspace/display-preferences'

export const formatReportDate = (iso: string, timezone: string) =>
  new Intl.DateTimeFormat(getDisplayLocale(), {
    timeZone: timezone,
    ...getDateFormatOptions(),
  }).format(new Date(iso))
