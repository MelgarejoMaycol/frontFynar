import { Activity, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router'
import { Button } from '@/components/ui'
import { usePermission } from '@/features/workspace'
import { useFinancialHealth } from './hooks'
import type { FinancialHealthBand } from './types'
import styles from './financial-health.module.css'
import dashboardStyles from './FinancialHealthDashboard.module.css'

const label: Record<FinancialHealthBand, string> = {
  SOLID: 'Sólida',
  STABLE: 'Estable',
  ATTENTION: 'Requiere atención',
  FRAGILE: 'Frágil',
  INSUFFICIENT: 'Datos insuficientes',
}

export function FinancialHealthWidget({ workspaceId }: { workspaceId: string }) {
  const navigate = useNavigate()
  const canRead = usePermission('reports.read')
  const health = useFinancialHealth(workspaceId, canRead)

  if (!canRead) return null

  const bandLabel = health.data ? label[health.data.band] : 'Calculando'
  const recommendation = health.data?.recommendations[0]

  return (
    <section
      className={`${styles.widget} ${dashboardStyles.widget}`}
      aria-label="Salud financiera"
    >
      <div
        className={`${styles.widgetScore} ${dashboardStyles.score}`}
        aria-hidden="true"
      >
        {health.isPending ? '…' : health.data?.score ?? <Activity size={22} />}
      </div>

      <div className={`${styles.widgetText} ${dashboardStyles.content}`}>
        <div className={dashboardStyles.titleRow}>
          <h2>Salud financiera</h2>
          {!health.isError && <span className={dashboardStyles.band}>{bandLabel}</span>}
        </div>

        {health.isError ? (
          <p>No pudimos calcularla ahora. Puedes abrir el detalle e intentar de nuevo.</p>
        ) : health.data ? (
          <>
            <div className={dashboardStyles.meta}>
              <span>
                {health.data.score === null ? 'Sin puntuación todavía' : `${health.data.score}/100 puntos`}
              </span>
              <span>{health.data.availableDimensions}/5 dimensiones evaluables</span>
              <span>{Math.round(health.data.coverage)} % de cobertura</span>
            </div>
            <p className={dashboardStyles.recommendation}>
              {recommendation
                ? `Siguiente foco: ${recommendation.title}`
                : 'No hay una recomendación prioritaria pendiente en este momento.'}
            </p>
          </>
        ) : (
          <p>Calculando una lectura explicable de tus finanzas…</p>
        )}
      </div>

      <div className={dashboardStyles.action}>
        <Button variant="secondary" onClick={() => navigate('/app/financial-health')}>
          Ver detalle <ArrowRight size={16} aria-hidden="true" />
        </Button>
      </div>
    </section>
  )
}
