import { Link } from 'react-router'
import { ArrowDown, ArrowLeftRight, ArrowUp } from 'lucide-react'
import { Card } from '@/components/ui'
import type { DashboardAccount } from '../types/dashboard.types'
import type { Category } from '@/features/categories/types/category.types'
import {
  formatMoney,
  formatTransactionDate,
} from '@/features/transactions/transactions.format'
import type { Transaction } from '@/features/transactions/types/transaction.types'
import styles from './dashboard.module.css'
const labels = {
  INCOME: 'Ingreso',
  EXPENSE: 'Gasto',
  TRANSFER: 'Transferencia',
  ADJUSTMENT: 'Ajuste de saldo',
} as const
export function RecentTransactions({
  items,
  timezone,
  accounts,
  categories,
}: {
  items: Transaction[]
  timezone: string
  accounts: DashboardAccount[]
  categories: Category[]
}) {
  return (
    <section>
      <div className={styles.sectionHeader}>
        <h2>Movimientos recientes</h2>
        <Link to="/app/transactions">Ver movimientos</Link>
      </div>
      <div className={styles.recentList}>
        {items.slice(0, 5).map((item) => {
          const adjustmentDifference =
            item.type === 'ADJUSTMENT'
              ? Number(item.metadata?.difference ?? item.amount)
              : 0
          const Icon =
            item.type === 'INCOME'
              ? ArrowUp
              : item.type === 'EXPENSE'
                ? ArrowDown
                : ArrowLeftRight
          const account =
            accounts.find((value) => value.id === item.accountId)?.name ??
            'Cuenta'
          const category =
            categories.find((value) => value.id === item.categoryId)?.name ??
            labels[item.type]
          const sign =
            item.type === 'INCOME' || adjustmentDifference > 0
              ? '+'
              : item.type === 'EXPENSE' || adjustmentDifference < 0
                ? '−'
                : ''
          const tone =
            item.type === 'INCOME' || adjustmentDifference > 0
              ? 'income'
              : item.type === 'EXPENSE' || adjustmentDifference < 0
                ? 'expense'
                : 'transfer'
          return (
            <Link
              key={item.id}
              className={styles.recentLink}
              to={`/app/transactions?transactionId=${item.id}`}
            >
              <Card className={`${styles.recentItem} ${styles[tone]}`}>
                <Icon aria-hidden="true" />
                <div>
                  <h3>{item.description || labels[item.type]}</h3>
                  <p>
                    {category} · {account}
                  </p>
                  <small>
                    {formatTransactionDate(item.occurredAt, timezone)}
                  </small>
                </div>
                <strong>
                  {sign}
                  {formatMoney(item.amount, item.currency)}
                </strong>
              </Card>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
