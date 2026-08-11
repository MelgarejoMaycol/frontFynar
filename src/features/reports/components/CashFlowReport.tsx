import { formatMoney } from '@/features/transactions/transactions.format'
import type { CashFlowReport as Data } from '../types/report.types'
import { formatReportDate } from '../reports.format'
import { ReportEmptyState } from './ReportEmptyState'
import styles from './reports.module.css'
const weekdays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
const mondayOffset = (iso: string) => {
  const day = new Date(iso).getUTCDay()
  return day === 0 ? 6 : day - 1
}
export function CashFlowReport({
  data,
  timezone,
}: {
  data: Data
  timezone: string
}) {
  if (!data.seriesByCurrency.length)
    return <ReportEmptyState message="No hay flujo de caja en este periodo." />
  return (
    <div className={styles.stacks}>
      {data.seriesByCurrency.map((series) => (
        <section key={series.currency} aria-label={`Flujo ${series.currency}`}>
          <h3>
            {series.currency} ·{' '}
            {data.groupBy === 'DAY'
              ? 'calendario diario'
              : `agrupación ${data.groupBy.toLowerCase()}`}
          </h3>
          {data.groupBy === 'DAY' && (
            <div className={styles.calendarWeekdays} aria-hidden="true">
              {weekdays.map((day) => (
                <span key={day}>{day}</span>
              ))}
            </div>
          )}
          <ul
            className={
              data.groupBy === 'DAY' ? styles.calendar : styles.flowList
            }
          >
            {data.groupBy === 'DAY' &&
              series.points[0] &&
              Array.from(
                { length: mondayOffset(series.points[0].periodStart) },
                (_, index) => (
                  <li
                    key={`empty-${index}`}
                    className={styles.calendarEmpty}
                    aria-hidden="true"
                  />
                ),
              )}
            {series.points.map((point) => (
              <li key={point.periodStart}>
                <strong>{formatReportDate(point.periodStart, timezone)}</strong>
                <span>
                  Ingresos {formatMoney(point.totalIncome, series.currency)}
                </span>
                <span>
                  Gastos {formatMoney(point.totalExpenses, series.currency)}
                </span>
                <span>
                  Neto {formatMoney(point.netCashFlow, series.currency)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
