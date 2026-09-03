import { ArrowRight, CalendarRange, TriangleAlert } from 'lucide-react'
import { useNavigate } from 'react-router'
import { formatCurrency } from '@/features/accounts/accounts.format'
import { Button } from '@/components/ui'
import { useMonthEndForecast } from '../hooks/forecasts.hooks'
import styles from './forecast.module.css'

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short' }).format(
    new Date(`${value}T00:00:00`),
  )

export function MonthEndProjectionCard({ workspaceId }: { workspaceId: string }) {
  const navigate = useNavigate()
  const query = useMonthEndForecast(workspaceId)

  if (query.isPending)
    return (
      <section className={styles.card} aria-label="Proyección de fin de mes">
        <p className={styles.eyebrow}>Proyección de fin de mes</p>
        <p className={styles.muted}>Calculando con tus datos reales…</p>
      </section>
    )

  if (query.isError || !query.data)
    return (
      <section className={styles.card} aria-label="Proyección de fin de mes">
        <p className={styles.eyebrow}>Proyección de fin de mes</p>
        <p className={styles.muted}>
          No pudimos calcularla ahora. Tus demás datos siguen disponibles.
        </p>
        <div className={styles.actions}>
          <Button variant="secondary" onClick={() => void query.refetch()}>
            Reintentar
          </Button>
        </div>
      </section>
    )

  const forecast = query.data.primary
  const lowest = Number(forecast.lowestProjectedBalance.amount)
  const partial = forecast.status === 'PARTIAL'

  return (
    <section className={styles.card} aria-labelledby="month-end-title">
      <div className={styles.cardHeader}>
        <div>
          <p className={styles.eyebrow}>Proyección de fin de mes</p>
          <h2 id="month-end-title">
            {partial ? 'Saldo después de compromisos conocidos' : 'Saldo estimado al cierre'}
          </h2>
          <p className={styles.amount}>
            {formatCurrency(forecast.projectedClosingBalance, forecast.currency)}
          </p>
        </div>
        <span className={styles.badge}>
          <CalendarRange size={15} aria-hidden="true" />{' '}
          {partial ? 'Proyección parcial' : `Datos ${forecast.dataQuality.toLowerCase()}`}
        </span>
      </div>

      <p className={styles.description}>
        {partial
          ? 'Fynar ya puede descontar tus pagos conocidos, pero todavía no tiene historial suficiente para inventar cuánto gastarás en el día a día.'
          : 'Calculado con tu dinero libre actual, ingresos programados, compromisos pendientes y tu ritmo de gasto con salida real de dinero.'}
      </p>

      <div className={styles.metrics}>
        <div className={styles.metric}>
          <span>Disponible hoy</span>
          <strong>{formatCurrency(forecast.currentAvailable, forecast.currency)}</strong>
        </div>
        <div className={styles.metric}>
          <span>Compromisos pendientes</span>
          <strong>{formatCurrency(forecast.knownCommitments, forecast.currency)}</strong>
        </div>
      </div>

      {lowest < 0 ? (
        <p className={styles.risk} role="status">
          <TriangleAlert size={16} aria-hidden="true" /> Podrías quedar en negativo cerca del{' '}
          {formatDate(forecast.lowestProjectedBalance.date)}. Revisa el detalle antes de asumir nuevos gastos.
        </p>
      ) : lowest < Number(forecast.currentAvailable) * 0.15 ? (
        <p className={styles.warning} role="status">
          Tu punto de menor liquidez sería cerca del {formatDate(forecast.lowestProjectedBalance.date)}:{' '}
          <strong>{formatCurrency(forecast.lowestProjectedBalance.amount, forecast.currency)}</strong>.
        </p>
      ) : null}

      <div className={styles.actions}>
        <Button
          variant="secondary"
          onClick={() => navigate('/app/reports#month-end-projection')}
        >
          Ver cómo se calculó <ArrowRight size={17} aria-hidden="true" />
        </Button>
      </div>
    </section>
  )
}
