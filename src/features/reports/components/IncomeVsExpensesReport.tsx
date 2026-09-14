import { formatMoney } from '@/features/transactions/transactions.format'
import type { IncomeVsExpensesReport as Data } from '../types/report.types'
import { ReportEmptyState } from './ReportEmptyState'
import styles from './reports.module.css'

const numberValue = (value: string) => Number(value || 0)

export function IncomeVsExpensesReport({ data }: { data: Data }) {
  if (!data.summariesByCurrency.length)
    return (
      <ReportEmptyState message="No hay ingresos ni gastos en este periodo." />
    )

  return (
    <div className={styles.currencyGrid}>
      {data.summariesByCurrency.map((row) => {
        const income = numberValue(row.totalIncome)
        const expenses = numberValue(row.totalExpenses)
        const maxFlow = Math.max(income, expenses, 1)
        const savingsRate =
          income > 0 ? (numberValue(row.netCashFlow) / income) * 100 : 0
        const movementCount =
          row.incomeTransactionCount + row.expenseTransactionCount

        return (
          <article
            className={styles.currencyCard}
            key={row.currency}
            aria-label={'Resumen ' + row.currency}
          >
            <div className={styles.currencyCardHeader}>
              <div>
                <span className={styles.metricEyebrow}>
                  Balance del periodo
                </span>
                <h3>{row.currency}</h3>
              </div>
              <div
                className={
                  numberValue(row.netCashFlow) >= 0
                    ? styles.netPositive
                    : styles.netNegative
                }
              >
                <span>Flujo neto</span>
                <strong>{formatMoney(row.netCashFlow, row.currency)}</strong>
              </div>
            </div>

            <div
              className={styles.flowComparison}
              aria-label="Comparación de ingresos y gastos"
            >
              <div className={styles.flowBarRow}>
                <div>
                  <span>Ingresos</span>
                  <strong>{formatMoney(row.totalIncome, row.currency)}</strong>
                </div>
                <div className={styles.flowTrack} aria-hidden="true">
                  <span
                    className={styles.flowIncome}
                    style={{ width: Math.max(2, (income / maxFlow) * 100) + '%' }}
                  />
                </div>
              </div>
              <div className={styles.flowBarRow}>
                <div>
                  <span>Gastos</span>
                  <strong>{formatMoney(row.totalExpenses, row.currency)}</strong>
                </div>
                <div className={styles.flowTrack} aria-hidden="true">
                  <span
                    className={styles.flowExpense}
                    style={{
                      width: Math.max(2, (expenses / maxFlow) * 100) + '%',
                    }}
                  />
                </div>
              </div>
            </div>

            <dl className={styles.metrics}>
              <div>
                <dt>Tasa de ahorro</dt>
                <dd>
                  {savingsRate.toLocaleString('es-CO', {
                    maximumFractionDigits: 1,
                  })}
                  %
                </dd>
              </div>
              <div>
                <dt>Movimientos</dt>
                <dd>{movementCount}</dd>
              </div>
              <div>
                <dt>Ingreso promedio</dt>
                <dd>{formatMoney(row.averageIncome, row.currency)}</dd>
              </div>
              <div>
                <dt>Gasto promedio</dt>
                <dd>{formatMoney(row.averageExpense, row.currency)}</dd>
              </div>
            </dl>
          </article>
        )
      })}
    </div>
  )
}
