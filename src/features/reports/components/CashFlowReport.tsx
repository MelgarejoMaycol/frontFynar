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

type FlowPoint = Data['seriesByCurrency'][number]['points'][number]
type FlowField = 'totalIncome' | 'totalExpenses'

const linePoints = (
  points: FlowPoint[],
  field: FlowField,
  maxValue: number,
  width: number,
  height: number,
  padding: number,
) =>
  points
    .map((point, index) => {
      const x =
        points.length === 1
          ? width / 2
          : padding +
            (index / (points.length - 1)) * (width - padding * 2)
      const value = Math.max(0, Number(point[field] || 0))
      const y =
        height -
        padding -
        (value / maxValue) * (height - padding * 2)
      return x.toFixed(1) + ',' + y.toFixed(1)
    })
    .join(' ')

const labelIndexes = (length: number) => {
  if (length <= 1) return [0]
  const indexes = [0, Math.floor((length - 1) / 2), length - 1]
  return [...new Set(indexes)]
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
      {data.seriesByCurrency.map((series) => {
        const width = 720
        const height = 260
        const padding = 30
        const maxValue = Math.max(
          ...series.points.flatMap((point) => [
            Number(point.totalIncome || 0),
            Number(point.totalExpenses || 0),
          ]),
          1,
        )
        const incomeLine = linePoints(
          series.points,
          'totalIncome',
          maxValue,
          width,
          height,
          padding,
        )
        const expenseLine = linePoints(
          series.points,
          'totalExpenses',
          maxValue,
          width,
          height,
          padding,
        )
        const maxActivity = Math.max(
          ...series.points.map(
            (point) =>
              Number(point.totalIncome || 0) +
              Number(point.totalExpenses || 0),
          ),
          1,
        )

        return (
          <section
            key={series.currency}
            className={styles.flowAnalysis}
            aria-label={'Flujo ' + series.currency}
          >
            <div className={styles.flowHeader}>
              <div>
                <span className={styles.metricEyebrow}>
                  Evolución del periodo
                </span>
                <h3>
                  {series.currency} ·{' '}
                  {data.groupBy === 'DAY'
                    ? 'calendario diario'
                    : 'agrupación ' + data.groupBy.toLowerCase()}
                </h3>
              </div>
              <div className={styles.chartLegend} aria-label="Leyenda">
                <span>
                  <i className={styles.legendIncome} />
                  Ingresos
                </span>
                <span>
                  <i className={styles.legendExpense} />
                  Gastos
                </span>
              </div>
            </div>

            <div className={styles.lineChartWrap}>
              <svg
                className={styles.lineChart}
                viewBox={'0 0 ' + width + ' ' + height}
                role="img"
                aria-label={
                  'Evolución de ingresos y gastos en ' + series.currency
                }
              >
                {[0.25, 0.5, 0.75].map((ratio) => (
                  <line
                    key={ratio}
                    className={styles.gridLine}
                    x1={padding}
                    x2={width - padding}
                    y1={padding + (height - padding * 2) * ratio}
                    y2={padding + (height - padding * 2) * ratio}
                  />
                ))}
                {series.points.length > 1 && (
                  <>
                    <polygon
                      className={styles.incomeArea}
                      points={
                        padding +
                        ',' +
                        (height - padding) +
                        ' ' +
                        incomeLine +
                        ' ' +
                        (width - padding) +
                        ',' +
                        (height - padding)
                      }
                    />
                    <polyline
                      className={styles.incomeLine}
                      points={incomeLine}
                    />
                    <polyline
                      className={styles.expenseLine}
                      points={expenseLine}
                    />
                  </>
                )}
                {series.points.length === 1 && (
                  <>
                    <circle
                      className={styles.incomePoint}
                      cx={width / 2}
                      cy={
                        height -
                        padding -
                        (Math.max(
                          0,
                          Number(series.points[0]?.totalIncome || 0),
                        ) /
                          maxValue) *
                          (height - padding * 2)
                      }
                      r="7"
                    />
                    <circle
                      className={styles.expensePoint}
                      cx={width / 2}
                      cy={
                        height -
                        padding -
                        (Math.max(
                          0,
                          Number(series.points[0]?.totalExpenses || 0),
                        ) /
                          maxValue) *
                          (height - padding * 2)
                      }
                      r="7"
                    />
                  </>
                )}
              </svg>

              <div className={styles.chartAxisLabels} aria-hidden="true">
                {labelIndexes(series.points.length).map((index) => {
                  const point = series.points[index]
                  return point ? (
                    <span key={point.periodStart}>
                      {formatReportDate(point.periodStart, timezone)}
                    </span>
                  ) : null
                })}
              </div>
            </div>

            {data.groupBy === 'DAY' ? (
              <>
                <div
                  className={styles.calendarWeekdays}
                  aria-hidden="true"
                >
                  {weekdays.map((day) => (
                    <span key={day}>{day}</span>
                  ))}
                </div>
                <ul className={styles.calendar}>
                  {series.points[0] &&
                    Array.from(
                      {
                        length: mondayOffset(
                          series.points[0].periodStart,
                        ),
                      },
                      (_, index) => (
                        <li
                          key={'empty-' + index}
                          className={styles.calendarEmpty}
                          aria-hidden="true"
                        />
                      ),
                    )}
                  {series.points.map((point) => {
                    const activity =
                      Number(point.totalIncome || 0) +
                      Number(point.totalExpenses || 0)
                    const intensity =
                      8 + Math.round((activity / maxActivity) * 42)
                    return (
                      <li
                        key={point.periodStart}
                        style={{
                          backgroundColor:
                            'color-mix(in srgb, var(--color-primary) ' +
                            intensity +
                            '%, var(--color-surface-muted))',
                        }}
                      >
                        <strong>
                          {formatReportDate(
                            point.periodStart,
                            timezone,
                          )}
                        </strong>
                        <span>
                          Ingresos{' '}
                          {formatMoney(
                            point.totalIncome,
                            series.currency,
                          )}
                        </span>
                        <span>
                          Gastos{' '}
                          {formatMoney(
                            point.totalExpenses,
                            series.currency,
                          )}
                        </span>
                        <span>
                          Neto{' '}
                          {formatMoney(
                            point.netCashFlow,
                            series.currency,
                          )}
                        </span>
                      </li>
                    )
                  })}
                </ul>
              </>
            ) : (
              <ul className={styles.flowList}>
                {series.points.map((point) => (
                  <li key={point.periodStart}>
                    <strong>
                      {formatReportDate(point.periodStart, timezone)}
                    </strong>
                    <span>
                      Ingresos{' '}
                      {formatMoney(
                        point.totalIncome,
                        series.currency,
                      )}
                    </span>
                    <span>
                      Gastos{' '}
                      {formatMoney(
                        point.totalExpenses,
                        series.currency,
                      )}
                    </span>
                    <span>
                      Neto{' '}
                      {formatMoney(
                        point.netCashFlow,
                        series.currency,
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )
      })}
    </div>
  )
}
