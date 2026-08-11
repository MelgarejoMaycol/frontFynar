import { formatMoney } from '@/features/transactions/transactions.format'
import type { IncomeVsExpensesReport as Data } from '../types/report.types'
import { ReportEmptyState } from './ReportEmptyState'
import styles from './reports.module.css'
export function IncomeVsExpensesReport({ data }: { data: Data }) {
  if (!data.summariesByCurrency.length)
    return (
      <ReportEmptyState message="No hay ingresos ni gastos en este periodo." />
    )
  return (
    <div className={styles.currencyGrid}>
      {data.summariesByCurrency.map((row) => (
        <article
          className={styles.currencyCard}
          key={row.currency}
          aria-label={`Resumen ${row.currency}`}
        >
          <h3>{row.currency}</h3>
          <dl className={styles.metrics}>
            <div>
              <dt>Ingresos</dt>
              <dd>{formatMoney(row.totalIncome, row.currency)}</dd>
            </div>
            <div>
              <dt>Gastos</dt>
              <dd>{formatMoney(row.totalExpenses, row.currency)}</dd>
            </div>
            <div>
              <dt>Flujo neto</dt>
              <dd>{formatMoney(row.netCashFlow, row.currency)}</dd>
            </div>
          </dl>
        </article>
      ))}
    </div>
  )
}
