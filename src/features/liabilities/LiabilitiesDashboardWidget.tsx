import { Link } from 'react-router'
import { Card } from '@/components/ui'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { useActiveWorkspace, usePermission } from '@/features/workspace'
import {
  calendarDate,
  money,
  temporalLabel,
  upcomingResourcePath,
  upcomingTypeLabel,
} from './format'
import { useUpcoming } from './hooks'
import styles from './liabilities.module.css'

function LiabilitiesDashboardData({ workspaceId }: { workspaceId: string }) {
  const upcoming = useUpcoming(workspaceId)

  if (upcoming.isPending) {
    return (
      <section className={styles.dashboardWidget} aria-busy="true">
        Cargando créditos y pagos…
      </section>
    )
  }
  if (upcoming.isError) {
    return (
      <ErrorState
        title="No pudimos cargar créditos y pagos"
        message="Puedes seguir usando el dashboard e intentarlo nuevamente."
        onRetry={() => void upcoming.refetch()}
      />
    )
  }

  if (!upcoming.isSuccess) return null

  const nextItems = [...upcoming.data]
    .filter(
      (item) =>
        Number(item.amount) > 0 && !['PAID', 'CANCELLED'].includes(item.status),
    )
    .sort(
      (a, b) =>
        a.daysRemaining - b.daysRemaining || a.date.localeCompare(b.date),
    )
  return (
    <section
      className={styles.dashboardWidget}
      aria-labelledby="liabilities-dashboard-title"
    >
      <div className={styles.dashboardWidgetHeader}>
        <h2 id="liabilities-dashboard-title">Por pagar</h2>
        <Link to="/app/debts#upcoming">Ver todos</Link>
      </div>
      {nextItems.length === 0 ? (
        <EmptyState
          title="No tienes pagos pendientes."
          message="Tus próximos vencimientos aparecerán aquí."
        />
      ) : (
        <div className={styles.dashboardWidgetGrid}>
          {nextItems.slice(0, 6).map((item, index) => (
            <Link
              className={styles.dashboardPaymentLink}
              to={upcomingResourcePath(item)}
              key={`${item.type}-${item.id ?? index}`}
              aria-label={`Abrir ${item.name}: ${money(item.amount, item.currency)}, ${temporalLabel(item)}`}
            >
              <Card
                className={`${styles.dashboardWidgetCard} ${item.status === 'OVERDUE' ? styles.dashboardPaymentOverdue : ''}`}
              >
                <span>{upcomingTypeLabel(item.type)}</span>
                <strong>{item.name}</strong>
                <b>{money(item.amount, item.currency)}</b>
                <small>
                  {calendarDate(item.date)} · {temporalLabel(item)}
                </small>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}

export function LiabilitiesDashboardWidget() {
  const canRead = usePermission('debts.read')
  const { activeWorkspace } = useActiveWorkspace()
  if (!canRead || !activeWorkspace) return null
  return <LiabilitiesDashboardData workspaceId={activeWorkspace.id} />
}
