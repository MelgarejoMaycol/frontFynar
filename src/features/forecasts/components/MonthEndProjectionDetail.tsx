import {
  CalendarDays,
  CircleAlert,
  LineChart,
  TrendingDown,
  TrendingUp,
  WalletCards,
} from 'lucide-react'
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
  const cycleProjection = data.period.type === 'CYCLE_END'
  const relevantDates = new Set([
    data.period.dateFrom,
    data.period.dateTo,
    forecast.lowestProjectedBalance.date,
    ...forecast.timeline
      .filter((item) => item.events.length > 0)
      .map((item) => item.date),
  ])
  const timeline = forecast.timeline.filter((item) => relevantDates.has(item.date))
  const lowestIsNegative = Number(forecast.lowestProjectedBalance.amount) < 0
  const commitmentsAndSpending = String(
    Number(forecast.knownCommitments) +
      Number(forecast.estimatedVariableExpenses ?? 0),
  )

  return (
    <section
      id="month-end-projection"
      className={styles.detail}
      aria-labelledby="month-end-projection-title"
    >
      <div className={styles.detailHero}>
        <div className={styles.detailBackdrop} aria-hidden="true">
          <LineChart />
        </div>
        <div className={styles.detailHeroTopline}>
          <p className={styles.eyebrow}>
            Proyección · {cycleProjection ? 'ciclo actual' : 'mes actual'}
          </p>
          <span className={styles.badge}>
            {forecast.status === 'PARTIAL'
              ? 'Resultado parcial'
              : `Datos ${forecast.dataQuality.toLowerCase()}`}
          </span>
        </div>
        <div className={styles.detailHeroContent}>
          <div>
            <h2 id="month-end-projection-title">
              {cycleProjection ? 'Cómo podrías cerrar tu ciclo' : 'Cómo podrías cerrar el mes'}
            </h2>
            <p className={styles.amount}>
              {formatCurrency(forecast.projectedClosingBalance, forecast.currency)}
            </p>
            <p className={styles.detailLead}>
              {forecast.status === 'PARTIAL'
                ? 'Fynar ya contempla tu dinero disponible, ingresos esperados configurados y compromisos conocidos, pero todavía no estima el gasto cotidiano.'
                : `Estimación al ${dateLabel(data.period.dateTo)} usando tus movimientos, ingresos esperados y compromisos pendientes.`}
            </p>
          </div>
          <div className={styles.heroDateCard}>
            <CalendarDays size={18} aria-hidden="true" />
            <span>{cycleProjection ? 'Fin de tu ciclo' : 'Fin del mes'}</span>
            <strong>{dateLabel(data.period.dateTo)}</strong>
          </div>
        </div>
      </div>

      {data.configuredIncome && (
        <div className={styles.noticeBlock}>
          <h3>
            <TrendingUp size={18} aria-hidden="true" /> Ingreso esperado incluido
          </h3>
          <p className={styles.muted}>
            {data.configuredIncome.label}: {' '}
            <strong>
              {formatCurrency(data.configuredIncome.amount, data.configuredIncome.currency)}
            </strong>{' '}
            el {dateLabel(data.configuredIncome.date)}. Es una expectativa para la proyección; no es un movimiento real ni aumenta tu saldo hasta que realmente lo recibas.
          </p>
        </div>
      )}

      <div className={styles.factorGrid} aria-label="Factores de la proyección">
        <div className={styles.factor}>
          <span className={styles.factorIcon}>
            <WalletCards size={19} aria-hidden="true" />
          </span>
          <span>Dinero libre actual</span>
          <strong>{formatCurrency(forecast.currentAvailable, forecast.currency)}</strong>
        </div>
        <div className={styles.factor}>
          <span className={styles.factorIcon}>
            <TrendingUp size={19} aria-hidden="true" />
          </span>
          <span>Ingresos futuros esperados</span>
          <strong>{formatCurrency(forecast.expectedIncome, forecast.currency)}</strong>
        </div>
        <div className={styles.factor}>
          <span className={styles.factorIcon}>
            <TrendingDown size={19} aria-hidden="true" />
          </span>
          <span>Pagos y compromisos</span>
          <strong>- {formatCurrency(forecast.knownCommitments, forecast.currency)}</strong>
        </div>
        <div className={styles.factor}>
          <span className={styles.factorIcon}>
            <TrendingDown size={19} aria-hidden="true" />
          </span>
          <span>Gasto cotidiano estimado</span>
          <strong>
            {forecast.estimatedVariableExpenses === null
              ? 'Aún no estimable'
              : `- ${formatCurrency(forecast.estimatedVariableExpenses, forecast.currency)}`}
          </strong>
        </div>
      </div>

      <div className={styles.insightGrid}>
        <div className={styles.insightCard}>
          <p className={styles.eyebrow}>Momento más ajustado</p>
          <h3>Punto de menor liquidez</h3>
          <p className={styles.insightAmount}>
            {formatCurrency(forecast.lowestProjectedBalance.amount, forecast.currency)}
          </p>
          <p className={styles.muted}>{dateLabel(forecast.lowestProjectedBalance.date)}</p>
          <div className={lowestIsNegative ? styles.compactRisk : styles.compactWarning}>
            <CircleAlert size={16} aria-hidden="true" />
            <span>
              {lowestIsNegative
                ? 'Con los compromisos conocidos podrías necesitar ajustar gastos o fechas de pago.'
                : `Este sería el punto del ${cycleProjection ? 'ciclo' : 'mes'} en el que tendrías menos dinero libre.`}
            </span>
          </div>
        </div>

        <div className={styles.insightCard}>
          <p className={styles.eyebrow}>Lectura rápida</p>
          <h3>De dónde sale la cifra</h3>
          <div className={styles.formula}>
            <div>
              <span>Disponible hoy</span>
              <strong>{formatCurrency(forecast.currentAvailable, forecast.currency)}</strong>
            </div>
            <span aria-hidden="true">+</span>
            <div>
              <span>Ingresos</span>
              <strong>{formatCurrency(forecast.expectedIncome, forecast.currency)}</strong>
            </div>
            <span aria-hidden="true">−</span>
            <div>
              <span>Compromisos y gasto</span>
              <strong>{formatCurrency(commitmentsAndSpending, forecast.currency)}</strong>
            </div>
          </div>
          <p className={styles.muted}>
            Es una estimación explicable: no cambia movimientos, saldos ni presupuestos.
          </p>
        </div>
      </div>

      <div className={styles.timelineSection}>
        <div className={styles.sectionIntro}>
          <div>
            <p className={styles.eyebrow}>Días que sí importan</p>
            <h3>Cómo se movería tu saldo</h3>
          </div>
          <p className={styles.muted}>
            Solo mostramos fechas con impacto real o puntos clave de la proyección.
          </p>
        </div>
        <div className={styles.timeline}>
          {timeline.map((item) => (
            <div className={styles.timelineRow} key={item.date}>
              <div className={styles.timelineDate}>
                <span className={styles.timelineDot} aria-hidden="true" />
                <div>
                  <strong>{dateLabel(item.date)}</strong>
                  <p className={styles.muted}>
                    Saldo estimado: {formatCurrency(item.projectedBalance, forecast.currency)}
                  </p>
                </div>
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
        <div className={styles.noticeBlock}>
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

      <details className={styles.assumptions}>
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
