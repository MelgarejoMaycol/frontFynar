import { CircleAlert, TrendingDown, TrendingUp, WalletCards } from 'lucide-react'
import { PageLoader } from '@/components/feedback/PageLoader'
import { ErrorState } from '@/components/feedback/ErrorState'
import { formatCurrency } from '@/features/accounts/accounts.format'
import { useMonthEndForecast } from '../hooks/forecasts.hooks'
import styles from './forecast.module.css'

const dateLabel = (value: string) =>
  new Intl.DateTimeFormat('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${value}T00:00:00`))

export function MonthEndProjectionDetail({ workspaceId }: { workspaceId: string }) {
  const query = useMonthEndForecast(workspaceId)
  if (query.isPending) return <PageLoader />
  if (query.isError || !query.data)
    return (
      <ErrorState
        title="No pudimos calcular la proyección"
        message="Intenta nuevamente. La proyección no modifica ningún dato financiero."
        onRetry={() => void query.refetch()}
      />
    )

  const data = query.data
  const forecast = data.primary
  const relevantDates = new Set([
    data.period.dateFrom,
    data.period.dateTo,
    forecast.lowestProjectedBalance.date,
    ...forecast.timeline
      .filter((item) => item.events.length > 0)
      .map((item) => item.date),
  ])
  const timeline = forecast.timeline.filter((item) => relevantDates.has(item.date))

  return (
    <section
      id="month-end-projection"
      className={styles.detail}
      aria-labelledby="month-end-projection-title"
    >
      <div className={styles.detailHeader}>
        <div>
          <p className={styles.eyebrow}>Qué puede pasar con tu dinero</p>
          <h2 id="month-end-projection-title">Proyección de fin de mes</h2>
          <p className={styles.amount}>
            {formatCurrency(forecast.projectedClosingBalance, forecast.currency)}
          </p>
          <p className={styles.muted}>
            {forecast.status === 'PARTIAL'
              ? 'Resultado parcial basado únicamente en lo que Fynar puede sustentar con tus datos.'
              : `Estimación para el ${dateLabel(data.period.dateTo)}.`}
          </p>
        </div>
        <span className={styles.badge}>
          {forecast.status === 'PARTIAL'
            ? 'Parcial'
            : `Calidad de datos: ${forecast.dataQuality.toLowerCase()}`}
        </span>
      </div>

      <div className={styles.factorGrid} aria-label="Factores de la proyección">
        <div className={styles.factor}>
          <WalletCards size={20} aria-hidden="true" />
          <span>Dinero libre actual</span>
          <strong>{formatCurrency(forecast.currentAvailable, forecast.currency)}</strong>
        </div>
        <div className={styles.factor}>
          <TrendingUp size={20} aria-hidden="true" />
          <span>Ingresos futuros conocidos</span>
          <strong>{formatCurrency(forecast.expectedIncome, forecast.currency)}</strong>
        </div>
        <div className={styles.factor}>
          <TrendingDown size={20} aria-hidden="true" />
          <span>Pagos y compromisos</span>
          <strong>- {formatCurrency(forecast.knownCommitments, forecast.currency)}</strong>
        </div>
        <div className={styles.factor}>
          <TrendingDown size={20} aria-hidden="true" />
          <span>Gasto cotidiano estimado</span>
          <strong>
            {forecast.estimatedVariableExpenses === null
              ? 'Aún no estimable'
              : `- ${formatCurrency(forecast.estimatedVariableExpenses, forecast.currency)}`}
          </strong>
        </div>
      </div>

      <div>
        <h3>Punto de menor liquidez</h3>
        <p className={Number(forecast.lowestProjectedBalance.amount) < 0 ? styles.risk : styles.warning}>
          {dateLabel(forecast.lowestProjectedBalance.date)} ·{' '}
          <strong>
            {formatCurrency(forecast.lowestProjectedBalance.amount, forecast.currency)}
          </strong>
          {Number(forecast.lowestProjectedBalance.amount) < 0
            ? ' — con los compromisos conocidos podrías necesitar ajustar gastos o fechas de pago.'
            : ' — este sería el momento del mes en el que tendrías menos dinero libre.'}
        </p>
      </div>

      <div>
        <h3>Cómo se movería tu saldo</h3>
        <p className={styles.muted}>
          Mostramos los días relevantes, no una lista de relleno. Los gastos cotidianos estimados se distribuyen progresivamente cuando hay historial suficiente.
        </p>
        <div className={styles.timeline}>
          {timeline.map((item) => (
            <div className={styles.timelineRow} key={item.date}>
              <div>
                <strong>{dateLabel(item.date)}</strong>
                <p className={styles.muted}>
                  Saldo estimado: {formatCurrency(item.projectedBalance, forecast.currency)}
                </p>
              </div>
              <div className={styles.timelineEvents}>
                {item.events.length === 0 ? (
                  <span>Referencia de la proyección</span>
                ) : (
                  item.events.map((event, index) => (
                    <span key={`${event.source}-${event.label}-${index}`}>
                      {event.direction === 'IN' ? '+' : '-'}{' '}
                      {formatCurrency(event.amount, forecast.currency)} · {event.label}
                    </span>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {forecast.limitations.length > 0 && (
        <div>
          <h3>
            <CircleAlert size={18} aria-hidden="true" /> Lo que todavía no podemos asegurar
          </h3>
          <ul className={styles.list}>
            {forecast.limitations.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      <details>
        <summary>Ver supuestos del cálculo</summary>
        <ul className={styles.list}>
          {forecast.assumptions.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p className={styles.muted}>Método: {data.methodology.description}</p>
      </details>
    </section>
  )
}
