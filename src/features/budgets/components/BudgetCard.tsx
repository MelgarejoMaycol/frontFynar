import { Badge, Button, Card } from '@/components/ui'
import { formatMoney } from '@/features/transactions/transactions.format'
import { BudgetProgress } from './BudgetProgress'
import type { Budget } from '../types/budget.types'
import styles from './budgets.module.css'
import { budgetPeriodLabels, budgetStatusLabels } from '../budgets.constants'
export function BudgetCard({
  budget,
  canWrite,
  onOpen,
  onEdit,
  onArchive,
  onRestore = () => undefined,
  busy = false,
}: {
  budget: Budget
  canWrite: boolean
  onOpen: () => void
  onEdit: () => void
  onArchive: () => void
  onRestore?: () => void
  busy?: boolean
}) {
  return (
    <Card className={styles.card}>
      <div className={styles.cardHeader}>
        <div>
          <h2>{budget.name}</h2>
          <p>
            {budget.startsOn} — {budget.endsOn}
          </p>
        </div>
        <div className={styles.badges}>
          <Badge>{budgetPeriodLabels[budget.period]}</Badge>
          <Badge
            tone={
              budget.progress.status === 'EXCEEDED'
                ? 'error'
                : budget.progress.status === 'WARNING'
                  ? 'warning'
                  : 'success'
            }
          >
            {budgetStatusLabels[budget.progress.status]}
          </Badge>
          {!budget.isActive && <Badge>Archivado</Badge>}
        </div>
      </div>
      <strong className={styles.amount}>
        {formatMoney(budget.amount, budget.currency)}
      </strong>
      <BudgetProgress progress={budget.progress} />
      <dl className={styles.totals}>
        <div>
          <dt>Gastado</dt>
          <dd>{formatMoney(budget.progress.spent, budget.currency)}</dd>
        </div>
        <div>
          <dt>{Number(budget.progress.remaining) < 0 ? 'Excedido por' : 'Disponible'}</dt>
          <dd>{formatMoney(budget.progress.remaining.replace(/^-/, ''), budget.currency)}</dd>
        </div>
      </dl>
      <p>
        Categorías:{' '}
        {budget.categories.length
          ? budget.categories.map((x) => x.name).join(', ')
          : 'Todas'}
      </p>
      <p>
        Cuentas:{' '}
        {budget.accounts.length
          ? budget.accounts.map((x) => x.name).join(', ')
          : 'Todas'}
      </p>
      <div className={styles.actions}>
        <Button variant="ghost" onClick={onOpen}>
          Ver detalle
        </Button>
        {canWrite && budget.isActive && (
          <>
            <Button variant="secondary" onClick={onEdit}>
              Editar
            </Button>
            <Button variant="danger" onClick={onArchive}>
              Archivar
            </Button>
          </>
        )}
        {canWrite && !budget.isActive && (
          <Button variant="secondary" loading={busy} onClick={onRestore}>
            Desarchivar
          </Button>
        )}
      </div>
    </Card>
  )
}
