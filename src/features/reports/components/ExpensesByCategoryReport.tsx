import { formatMoney } from '@/features/transactions/transactions.format'
import type { ExpensesByCategoryReport as Data } from '../types/report.types'
import { ReportEmptyState } from './ReportEmptyState'
import styles from './reports.module.css'
export function ExpensesByCategoryReport({ data }: { data: Data }) {
  const groups = data.groupsByCurrency.filter(
    (group) => group.categories.length,
  )
  if (!groups.length)
    return (
      <ReportEmptyState message="No hay gastos por categoría en este periodo." />
    )
  return (
    <div className={styles.stacks}>
      {groups.map((group) => (
        <section
          key={group.currency}
          aria-label={`Categorías ${group.currency}`}
        >
          <h3>
            {group.currency} ·{' '}
            {formatMoney(group.totalExpenses, group.currency)}
          </h3>
          <ul className={styles.rows}>
            {group.categories.map((category) => (
              <li key={category.categoryId ?? 'none'}>
                <span className={styles.categoryName}>
                  <i
                    style={{
                      backgroundColor:
                        category.color ?? 'var(--color-secondary)',
                    }}
                  />
                  {category.categoryName}
                </span>
                <span>
                  {formatMoney(category.amount, group.currency)} ·{' '}
                  {category.percentage} %
                </span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
