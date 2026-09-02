import { Link } from 'react-router'
import { Card, HorizontalScrollArea } from '@/components/ui'
import { useGoals } from '@/features/goals/hooks/goals.hooks'
import { useActiveWorkspace, usePermission } from '@/features/workspace'
import { formatMoney } from '@/features/transactions/transactions.format'
import styles from './GoalsDashboardWidget.module.css'

export function GoalsDashboardWidget() {
  const workspace = useActiveWorkspace().activeWorkspace!
  const canRead = usePermission('goals.read')
  const query = useGoals(
    workspace.id,
    { includeArchived: 'false', page: 1, limit: 25 },
    canRead,
  )

  if (!canRead || query.isPending || query.isError) return null

  const relevant = [...query.data.items]
    .filter((goal) => goal.status !== 'CANCELLED')
    .sort((left, right) => {
      const priority = { ACTIVE: 0, PAUSED: 1, COMPLETED: 2, CANCELLED: 3 }
      return (
        priority[left.status] - priority[right.status] ||
        Number(right.progress.percentage) - Number(left.progress.percentage) ||
        left.name.localeCompare(right.name, 'es')
      )
    })
    .slice(0, 3)

  return (
    <Card className={styles.widget}>
      <div className={styles.header}>
        <div>
          <h2>Metas de ahorro</h2>
          <p>Dale seguimiento a lo que estás construyendo.</p>
        </div>
        {query.data.items.length > 0 && <Link to="/app/goals">Ver todas</Link>}
      </div>

      {relevant.length === 0 ? (
        <div className={styles.empty}>
          <span>Aún no tienes metas de ahorro.</span>
          <Link to="/app/goals">Crear una meta</Link>
        </div>
      ) : (
        <HorizontalScrollArea
          className={styles.list}
          label="metas de ahorro destacadas"
        >
          {relevant.map((goal) => {
            const percentage = Math.min(
              100,
              Math.max(0, Number(goal.progress.percentage)),
            )
            const currency = goal.account?.currency ?? workspace.baseCurrency
            return (
              <Link
                key={goal.id}
                className={styles.item}
                to={`/app/goals/${goal.id}`}
              >
                <div className={styles.itemHeader}>
                  <strong>{goal.name}</strong>
                  <span>{goal.progress.percentage} %</span>
                </div>
                <div
                  className={styles.progress}
                  role="progressbar"
                  aria-label={`${goal.name}: ${goal.progress.percentage} % completado`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={percentage}
                >
                  <span
                    style={{
                      width: `${percentage}%`,
                      background: goal.color ?? undefined,
                    }}
                  />
                </div>
                <small>
                  {formatMoney(goal.savedAmount, currency)} de{' '}
                  {formatMoney(goal.targetAmount, currency)}
                </small>
              </Link>
            )
          })}
        </HorizontalScrollArea>
      )}
    </Card>
  )
}
