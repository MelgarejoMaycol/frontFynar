import { Link } from 'react-router'
import { Card } from '@/components/ui'
import { useActiveWorkspace, usePermission } from '@/features/workspace'
import { useBudgets } from '@/features/budgets/hooks/budgets.hooks'
import { formatMoney } from '@/features/transactions/transactions.format'
import styles from './BudgetDashboardWidget.module.css'

export function BudgetDashboardWidget() {
  const workspace = useActiveWorkspace().activeWorkspace!
  const canRead = usePermission('budgets.read')
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: workspace.timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
  const query = useBudgets(workspace.id, { status: 'ACTIVE', includeArchived: 'false', dateFrom: today, dateTo: today, page: 1, limit: 100 }, canRead)
  if (!canRead || query.isPending || query.isError) return null
  const relevant = [...query.data.items]
    .sort((a, b) => Number(b.progress.percentage) - Number(a.progress.percentage) || a.id.localeCompare(b.id))
    .slice(0, 3)
  return <Card className={styles.widget}>
    <div className={styles.header}>
      <h2>Presupuestos</h2>
      {query.data.items.length > 3 && <Link to="/app/budgets">Ver todos</Link>}
    </div>
    {relevant.length === 0 ? <div className={styles.empty}>
      <span>Aún no tienes presupuestos activos.</span>
      <Link to="/app/budgets">Crear presupuesto</Link>
    </div> : <div className={styles.list}>
      {relevant.map((budget) => {
        const percentage = Number(budget.progress.percentage)
        return <Link key={budget.id} className={styles.item} to={`/app/budgets?budgetId=${budget.id}`}>
          <div><strong>{budget.name}</strong><span>{budget.progress.percentage} %</span></div>
          <div className={styles.progress} role="progressbar" aria-label={`${budget.name}: ${budget.progress.percentage} % utilizado`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.min(100, Math.max(0, percentage))}>
            <span style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }} />
          </div>
          <small>{formatMoney(budget.progress.spent, budget.currency)} de {formatMoney(budget.amount, budget.currency)}</small>
        </Link>
      })}
    </div>}
  </Card>
}
