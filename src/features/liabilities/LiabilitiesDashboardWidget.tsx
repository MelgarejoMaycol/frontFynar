import { Link } from 'react-router'
import { Card } from '@/components/ui'
import { ErrorState } from '@/components/feedback/ErrorState'
import { useActiveWorkspace, usePermission } from '@/features/workspace'
import { calendarDate, money } from './format'
import { useSummary, useUpcoming } from './hooks'
import styles from './liabilities.module.css'

function LiabilitiesDashboardData({ workspaceId }: { workspaceId: string }) {
  const summary = useSummary(workspaceId)
  const upcoming = useUpcoming(workspaceId)

  if (summary.isPending || upcoming.isPending) {
    return (
      <section className={styles.dashboardWidget} aria-busy="true">
        Cargando créditos y pagos…
      </section>
    )
  }
  if (summary.isError || upcoming.isError) {
    return (
      <ErrorState
        title="No pudimos cargar créditos y pagos"
        message="Puedes seguir usando el dashboard e intentarlo nuevamente."
        onRetry={() =>
          void Promise.all([summary.refetch(), upcoming.refetch()])
        }
      />
    )
  }

  const next = summary.data?.nextPayment ?? null
  const overdue = (upcoming.data ?? []).filter(
    (item) => item.status === 'OVERDUE',
  )
  const overdueCounts = overdue.reduce<Record<string, number>>(
    (result, item) => {
      result[item.currency] = (result[item.currency] ?? 0) + 1
      return result
    },
    {},
  )
  const overdueCurrencies = (summary.data?.summariesByCurrency ?? []).filter(
    (item) => Number(item.overdueAmount) > 0,
  )

  return (
    <section
      className={styles.dashboardWidget}
      aria-labelledby="liabilities-dashboard-title"
    >
      <div className={styles.dashboardWidgetHeader}>
        <h2 id="liabilities-dashboard-title">Créditos y pagos</h2>
        <Link to="/app/debts">Ver créditos y pagos</Link>
      </div>
      <div className={styles.dashboardWidgetGrid}>
        <Card className={styles.dashboardWidgetCard}>
          <span>Próximo pago</span>
          {next ? (
            <>
              <strong>{next.name}</strong>
              <b>{money(next.amount, next.currency)}</b>
              <small>{calendarDate(next.date)}</small>
            </>
          ) : (
            <strong>No tienes pagos próximos</strong>
          )}
        </Card>
        {overdueCurrencies.length > 0 && (
          <Card className={styles.dashboardWidgetCard}>
            <span>Vencidos</span>
            {overdueCurrencies.map((item) => (
              <div className={styles.overdueRow} key={item.currency}>
                <strong>
                  {overdueCounts[item.currency] ?? 0} pagos · {item.currency}
                </strong>
                <b>{money(item.overdueAmount, item.currency)}</b>
              </div>
            ))}
            <Link to="/app/debts?tab=upcoming">Ver pagos</Link>
          </Card>
        )}
      </div>
    </section>
  )
}

export function LiabilitiesDashboardWidget() {
  const canRead = usePermission('debts.read')
  const { activeWorkspace } = useActiveWorkspace()
  if (!canRead || !activeWorkspace) return null
  return <LiabilitiesDashboardData workspaceId={activeWorkspace.id} />
}
