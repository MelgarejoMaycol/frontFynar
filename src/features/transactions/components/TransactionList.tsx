import { Badge, Button, Card } from '@/components/ui'
import type { Account } from '@/features/accounts/types/account.types'
import type { Category } from '@/features/categories/types/category.types'
import { formatMoney, formatTransactionDate } from '../transactions.format'
import type { Transaction } from '../types/transaction.types'
import styles from './transactions.module.css'
const labels = {
  INCOME: 'Ingreso',
  EXPENSE: 'Gasto',
  TRANSFER: 'Transferencia',
  ADJUSTMENT: 'Ajuste de saldo',
} as const
export function TransactionList({
  items,
  accounts,
  categories,
  timezone,
  onOpen,
}: {
  items: Transaction[]
  accounts: Account[]
  categories: Category[]
  timezone: string
  onOpen: (item: Transaction) => void
}) {
  const accountName = (id: string | null) =>
    accounts.find((x) => x.id === id)?.name ?? 'Cuenta no disponible'
  const categoryName = (id: string | null) =>
    id === null
      ? 'Sin categoría'
      : (categories.find((x) => x.id === id)?.name ?? 'Categoría no disponible')
  const adjustmentDifference = (item: Transaction) =>
    item.type === 'ADJUSTMENT'
      ? Number(item.metadata?.difference ?? item.amount)
      : 0
  return (
    <div className={styles.list}>
      {items.map((item) => {
        const difference = adjustmentDifference(item)
        const negative = item.type === 'EXPENSE' || difference < 0
        const positive = item.type === 'INCOME' || difference > 0
        return (
          <Card key={item.id} className={styles.item}>
            <div>
              <Badge>{labels[item.type]}</Badge>
              {item.status === 'CANCELLED' && <Badge>Cancelado</Badge>}
              <h2>{item.description || categoryName(item.categoryId)}</h2>
              <p>
                {item.type === 'TRANSFER'
                  ? `${accountName(item.accountId)} → ${accountName(item.destinationAccountId)}`
                  : accountName(item.accountId)}{' '}
                · {categoryName(item.categoryId)}
              </p>
              <small>{formatTransactionDate(item.occurredAt, timezone)}</small>
            </div>
            <strong
              className={
                negative
                  ? styles.expense
                  : positive
                    ? styles.income
                    : styles.transfer
              }
            >
              {negative ? '−' : positive ? '+' : ''}
              {formatMoney(item.amount, item.currency)}
            </strong>
            <Button variant="ghost" onClick={() => onOpen(item)}>
              Ver detalle
            </Button>
          </Card>
        )
      })}
    </div>
  )
}
