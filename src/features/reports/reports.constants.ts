import type { ReportPeriod } from './types/report.types'
export const reportPeriodLabels: Record<ReportPeriod, string> = {
  CURRENT_MONTH: 'Este mes',
  PREVIOUS_MONTH: 'Mes anterior',
  LAST_7_DAYS: 'Últimos 7 días',
  LAST_30_DAYS: 'Últimos 30 días',
  CURRENT_YEAR: 'Este año',
  PREVIOUS_YEAR: 'Año anterior',
  CUSTOM: 'Personalizado',
}
