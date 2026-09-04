import {
  ArrowRight,
  CalendarRange,
  LineChart,
  ShoppingBag,
  TriangleAlert,
  WalletCards,
} from 'lucide-react'
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
      <section className={styles.card} aria-label="Proyección financiera">
        <div className={styles.cardBackdrop} aria-hidden="true">
          <LineChart />
        </div>
        <p className={styles.eyebrow}>Proyección financiera</p>
        <p className={styles.muted}>Calculando con tus datos reales…</p>
      </section>
    )

  if (query.isError || !query.data)
    return (
      <section className={styles.card} aria-label="Proyección financiera">
        <div className={styles.cardBackdrop} aria-hidden="true">
          <LineChart />
        </div>
        <div className={styles.compactTopline}>
          <p className={styles.eyebrow}>Proyección financiera</p>
        </div>
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

  const data = query.data
  const forecast = data.primary
  const lowest = Number(forecast.lowestProjectedBalance.amount)
  const partial = forecast.status === 'PARTIAL'
  const currentAvailable = Number(forecast.currentAvailable)
  const hasRisk = lowest < 0
  const hasWarning = !hasRisk && currentAvailable > 0 && lowest < currentAvailable * 0.15
  const cycleProjection = data.period.type === 'CYCLE_END'
  const periodLabel = cycleProjection ? 'Tu ciclo' : 'Este mes'
  const projectionTitle = cycleProjection ? 'Proyección al cierre de tu ciclo' : 'Proyección de fin de mes'

  return (
    <section className={styles.card} aria-labelledby="month-end-title">
      <div className={styles.cardBackdrop} aria-hidden="true">
        <LineChart />
      </div>

      <div className={styles.compactTopline}>
        <p className={styles.eyebrow}>{projectionTitle}</p>
        <span className={styles.badge}>
          <CalendarRange size={14} aria-hidden="true" />
          {partial ? 'Parcial' : periodLabel}
        </span>
      </div>

      <div className={styles.compactMain}>
        <div className={styles.compactAmountBlock}>
          <span className={styles.compactLabel}>
            {partial ? 'Después de compromisos conocidos' : 'Saldo estimado al cierre'}
          </span>
          <h2 id="month-end-title" className={styles.amount}>
            {formatCurrency(forecast.projectedClosingBalance, forecast.currency)}
          </h2>
          <p className={styles.compactHint}>
            {data.configuredIncome
              ? `Incluye ${data.configuredIncome.label.toLowerCase()} el ${formatDate(data.configuredIncome.date)}.`
              : partial
                ? 'Aún falta historial para estimar tu gasto cotidiano con confianza.'
                : `Basado en ${forecast.historyDays} días de comportamiento real.`}
          </p>
        </div>

        <div className={styles.compactMetrics} aria-label="Resumen de la proyección">
          <div className={styles.compactMetric}>
            <WalletCards size={16} aria-hidden="true" />
            <span>Hoy</span>
            <strong>{formatCurrency(forecast.currentAvailable, forecast.currency)}</strong>
          </div>
          <div className={styles.compactMetric}>
            <CalendarRange size={16} aria-hidden="true" />
            <span>Por pagar</span>
            <strong>{formatCurrency(forecast.knownCommitments, forecast.currency)}</strong>
          </div>
        </div>
      </div>

      {(hasRisk || hasWarning) && (
        <div
          className={hasRisk ? styles.compactRisk : styles.compactWarning}
          role="status"
        >
          <TriangleAlert size={16} aria-hidden="true" />
          <span>
            {hasRisk
              ? `Podrías quedar en negativo cerca del ${formatDate(forecast.lowestProjectedBalance.date)}.`
              : `Tu menor liquidez sería cerca del ${formatDate(forecast.lowestProjectedBalance.date)}: ${formatCurrency(forecast.lowestProjectedBalance.amount, forecast.currency)}.`}
          </span>
        </div>
      )}

      <div className={styles.compactFooter}>
        <span className={styles.compactFootnote}>
          Cierra el {formatDate(data.period.dateTo)} · no cambia tus saldos reales.
        </span>
        <div className={styles.actions} style={{ gap: '.65rem' }}>
          <Button
            variant="secondary"
            onClick={() => navigate('/app/reports#month-end-projection')}
          >
            Ver detalle <ArrowRight size={16} aria-hidden="true" />
          </Button>
          <Button onClick={() => navigate('/app/simulator')}>
            <ShoppingBag size={16} aria-hidden="true" /> ¿Puedo comprar algo?
          </Button>
        </div>
      </div>
    </section>
  )
}
