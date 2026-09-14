import { formatMoney } from '@/features/transactions/transactions.format'
import type { ExpensesByCategoryReport as Data } from '../types/report.types'
import { ReportEmptyState } from './ReportEmptyState'
import styles from './reports.module.css'

const fallbackColors = [
  '#154b45',
  '#5d8c74',
  '#8caf99',
  '#b7cdbc',
  '#7a9e8b',
  '#315f58',
]

export function ExpensesByCategoryReport({ data }: { data: Data }) {
  const groups = data.groupsByCurrency.filter(
    (group) => group.categories.length,
  )

  if (!groups.length)
    return (
      <ReportEmptyState message="No hay gastos por categoría en este periodo." />
    )

  return (
    <div className={styles.stacks}>
      {groups.map((group) => {
        let offset = 0
        const segments = group.categories.map((category, index) => {
          const percentage = Math.max(
            0,
            Math.min(100, Number(category.percentage || 0)),
          )
          const segment = {
            category,
            percentage,
            offset,
            color:
              category.color ??
              fallbackColors[index % fallbackColors.length]!,
          }
          offset += percentage
          return segment
        })

        return (
          <section
            key={group.currency}
            className={styles.categoryAnalysis}
            aria-label={'Categorías ' + group.currency}
          >
            <div className={styles.categoryChartColumn}>
              <div className={styles.categoryHeading}>
                <div>
                  <span className={styles.metricEyebrow}>
                    Distribución del gasto
                  </span>
                  <h3>{group.currency}</h3>
                </div>
                <strong>
                  {formatMoney(group.totalExpenses, group.currency)}
                </strong>
              </div>

              <div className={styles.donutWrap}>
                <svg
                  className={styles.donutChart}
                  viewBox="0 0 120 120"
                  role="img"
                  aria-label={
                    'Distribución porcentual del gasto en ' + group.currency
                  }
                >
                  <circle
                    className={styles.donutBackground}
                    cx="60"
                    cy="60"
                    r="48"
                    pathLength="100"
                  />
                  {segments.map((segment) => (
                    <circle
                      key={
                        segment.category.categoryId ??
                        segment.category.categoryName
                      }
                      className={styles.donutSegment}
                      cx="60"
                      cy="60"
                      r="48"
                      pathLength="100"
                      stroke={segment.color}
                      strokeDasharray={
                        segment.percentage +
                        ' ' +
                        (100 - segment.percentage)
                      }
                      strokeDashoffset={-segment.offset}
                    />
                  ))}
                  <text
                    x="60"
                    y="56"
                    textAnchor="middle"
                    className={styles.donutLabel}
                  >
                    Total
                  </text>
                  <text
                    x="60"
                    y="69"
                    textAnchor="middle"
                    className={styles.donutValue}
                  >
                    100%
                  </text>
                </svg>
              </div>
            </div>

            <ol className={styles.categoryLegend}>
              {segments.map((segment, index) => (
                <li
                  key={
                    segment.category.categoryId ??
                    segment.category.categoryName
                  }
                >
                  <div className={styles.categoryRank}>{index + 1}</div>
                  <div className={styles.categoryLegendBody}>
                    <div className={styles.categoryLegendTop}>
                      <span className={styles.categoryName}>
                        <i style={{ backgroundColor: segment.color }} />
                        {segment.category.categoryName}
                      </span>
                      <strong>
                        {formatMoney(
                          segment.category.amount,
                          group.currency,
                        )}
                      </strong>
                    </div>
                    <div className={styles.categoryLegendBottom}>
                      <div
                        className={styles.categoryTrack}
                        aria-hidden="true"
                      >
                        <span
                          style={{
                            width: segment.percentage + '%',
                            backgroundColor: segment.color,
                          }}
                        />
                      </div>
                      <span>
                        {segment.percentage.toLocaleString('es-CO', {
                          maximumFractionDigits: 1,
                        })}
                        % · {segment.category.transactionCount}{' '}
                        {segment.category.transactionCount === 1
                          ? 'movimiento'
                          : 'movimientos'}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        )
      })}
    </div>
  )
}
