import { Activity, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router'
import { Button } from '@/components/ui'
import { usePermission } from '@/features/workspace'
import { useFinancialHealth } from './hooks'
import type { FinancialHealthBand } from './types'
import styles from './financial-health.module.css'

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

  return (
    <section className={styles.widget} aria-label="Salud financiera">
      <div className={styles.widgetScore} aria-hidden="true">
        {health.isPending ? '…' : health.data?.score ?? <Activity size={22} />}
      </div>
      <div className={styles.widgetText}>
        <h2>Salud financiera</h2>
        {health.isError ? (
          <p>No pudimos calcularla ahora. Puedes abrir el detalle e intentar de nuevo.</p>
        ) : health.data ? (
          <p>
            {health.data.score === null ? label.INSUFFICIENT : `${label[health.data.band]} · ${health.data.score}/100`}
            {' · '}
            {health.data.availableDimensions}/5 dimensiones evaluables
          </p>
        ) : (
          <p>Calculando una lectura explicable de tus finanzas…</p>
        )}
      </div>
      <Button variant="secondary" onClick={() => navigate('/app/financial-health')}>
        Ver detalle <ArrowRight size={16} aria-hidden="true" />
      </Button>
    </section>
  )
}
