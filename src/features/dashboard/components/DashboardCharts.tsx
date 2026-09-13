import { formatMoney } from '@/features/transactions/transactions.format'
import type { DashboardData } from '../types/dashboard.types'
import styles from './DashboardCharts.module.css'

type DashboardChartsProps = Pick<
  DashboardData,
  | 'baseCurrency'
  | 'summariesByCurrency'
  | 'comparisonByCurrency'
  | 'expensesByCategory'
>

const numeric = (value: string | null | undefined) => Number(value ?? 0)

const barWidth = (value: number, max: number) =>
  `${Math.max(0, Math.min(100, max > 0 ? (value / max) * 100 : 0))}%`

export function DashboardCharts({
  baseCurrency,
  summariesByCurrency,
  comparisonByCurrency,
  expensesByCategory,
}: DashboardChartsProps) {
  return (
    <div className={styles.wrapper}>
      <p className={styles.intro}>
        Compara el movimiento del período seleccionado y revisa en qué categorías
        se concentran tus egresos. Los valores usan los mismos datos del Inicio.
      </p>

      {summariesByCurrency.map((summary) => {
        const income = numeric(summary.totalIncome)
        const expenses = numeric(summary.totalExpenses)
        const flowMax = Math.max(income, expenses, 1)
        const comparison = comparisonByCurrency.find(
          (item) => item.currency === summary.currency,
        )
        const categoryRows = expensesByCategory
          .filter((item) => item.currency === summary.currency)
          .sort((a, b) => numeric(b.amount) - numeric(a.amount))
          .slice(0, 5)
        const categoryMax = Math.max(
          ...categoryRows.map((item) => numeric(item.amount)),
          1,
        )

        return (
          <section className={styles.currencySection} key={summary.currency}>
            <header className={styles.currencyHeader}>
              <div>
                <span className={styles.eyebrow}>Moneda</span>
                <h3>
                  {summary.currency}
                  {summary.currency === baseCurrency ? (
                    <small>Principal</small>
                  ) : null}
                </h3>
              </div>
              <div className={styles.netFlow}>
                <span>Flujo neto</span>
                <strong>
                  {formatMoney(summary.netCashFlow, summary.currency)}
                </strong>
              </div>
            </header>

            <div className={styles.chartGrid}>
              <article className={styles.chartCard}>
                <div className={styles.chartTitle}>
                  <div>
                    <h4>Ingresos vs egresos</h4>
                    <p>Movimiento real del período seleccionado.</p>
                  </div>
                </div>

                <div
                  className={styles.barList}
                  role="img"
                  aria-label={`Ingresos ${formatMoney(summary.totalIncome, summary.currency)} y egresos ${formatMoney(summary.totalExpenses, summary.currency)}`}
                >
                  <div className={styles.barRow}>
                    <span>Ingresos</span>
                    <div className={styles.track} aria-hidden="true">
                      <span
                        className={styles.incomeBar}
                        style={{ width: barWidth(income, flowMax) }}
                      />
                    </div>
                    <strong>{formatMoney(summary.totalIncome, summary.currency)}</strong>
                  </div>
                  <div className={styles.barRow}>
                    <span>Egresos</span>
                    <div className={styles.track} aria-hidden="true">
                      <span
                        className={styles.expenseBar}
                        style={{ width: barWidth(expenses, flowMax) }}
                      />
                    </div>
                    <strong>{formatMoney(summary.totalExpenses, summary.currency)}</strong>
                  </div>
                </div>

                {comparison ? (
                  <div className={styles.previousPeriod}>
                    <span>Período anterior</span>
                    <span>
                      Ingresos{' '}
                      <strong>
                        {formatMoney(comparison.previousIncome, summary.currency)}
                      </strong>
                    </span>
                    <span>
                      Egresos{' '}
                      <strong>
                        {formatMoney(comparison.previousExpenses, summary.currency)}
                      </strong>
                    </span>
                  </div>
                ) : (
                  <p className={styles.muted}>
                    Aún no hay un período anterior comparable para esta moneda.
                  </p>
                )}
              </article>

              <article className={styles.chartCard}>
                <div className={styles.chartTitle}>
                  <div>
                    <h4>Gastos por categoría</h4>
                    <p>Las cinco categorías con mayor gasto del período.</p>
                  </div>
                </div>

                {categoryRows.length > 0 ? (
                  <div className={styles.categoryList}>
                    {categoryRows.map((category) => (
                      <div
                        className={styles.categoryRow}
                        key={category.categoryId ?? category.categoryName}
                      >
                        <div className={styles.categoryMeta}>
                          <span>{category.categoryName}</span>
                          <small>
                            {numeric(category.percentage).toLocaleString('es-CO', {
                              maximumFractionDigits: 1,
                            })}
                            %
                          </small>
                        </div>
                        <div className={styles.track} aria-hidden="true">
                          <span
                            className={styles.categoryBar}
                            style={{
                              width: barWidth(
                                numeric(category.amount),
                                categoryMax,
                              ),
                            }}
                          />
                        </div>
                        <strong>
                          {formatMoney(category.amount, summary.currency)}
                        </strong>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={styles.empty}>
                    <strong>Sin gastos categorizados</strong>
                    <span>
                      Cuando registres egresos con categoría aparecerán aquí.
                    </span>
                  </div>
                )}
              </article>
            </div>
          </section>
        )
      })}
    </div>
  )
}
