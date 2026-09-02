import { formatMoney } from '@/features/transactions/transactions.format'
import type { Budget } from '../types/budget.types'
import styles from './BudgetMovements.module.css'

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))

export function BudgetMovements({ budget }: { budget: Budget }) {
  const movements = budget.movements ?? []

  return (
    <section className={styles.section} aria-labelledby="budget-movements-title">
      <div className={styles.heading}>
        <div>
          <h3 id="budget-movements-title">Movimientos que consumen este presupuesto</h3>
          <p>
            Estos gastos confirmados son los que explican el monto utilizado actualmente.
          </p>
        </div>
        <strong>{movements.length}</strong>
      </div>

      {movements.length === 0 ? (
        <div className={styles.empty}>
          Aún no hay movimientos confirmados que apliquen a este presupuesto.
        </div>
      ) : (
        <div className={styles.list}>
          {movements.map((movement) => (
            <article className={styles.item} key={movement.id}>
              <div className={styles.main}>
                <strong>
                  {movement.merchantName || movement.description || movement.categoryName || 'Gasto'}
                </strong>
                <span>{formatDate(movement.occurredAt)}</span>
                <span>
                  {[movement.categoryName, movement.accountName].filter(Boolean).join(' · ')}
                </span>
              </div>
              <strong className={styles.amount}>
                {formatMoney(movement.amount, movement.currency)}
              </strong>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
