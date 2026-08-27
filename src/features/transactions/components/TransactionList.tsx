import { Badge, Card } from '@/components/ui'
import type { Account } from '@/features/accounts/types/account.types'
import type { Category } from '@/features/categories/types/category.types'
import { formatMoney, formatTransactionDate, transactionTypeLabel } from '../transactions.format'
import type { Transaction } from '../types/transaction.types'
import styles from './transactions.module.css'
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
        const negative = item.type === 'EXPENSE' || item.type === 'DEBT_PAYMENT' || difference < 0
        const positive = item.type === 'INCOME' || difference > 0
        return (
          <button key={item.id} type="button" className={styles.itemButton} onClick={() => onOpen(item)} aria-label="Ver detalle">
          <Card className={styles.item}>
            <div>
              <Badge>{transactionTypeLabel(item)}</Badge>
              {item.status === 'CANCELLED' && <Badge>Cancelado</Badge>}
              <h2>{item.type === 'DEBT_PAYMENT'
                ? `${item.metadata?.debtOperation === 'EXTRA_PAYMENT' ? 'Abono' : 'Pago cuota'} · ${String(item.metadata?.debtName ?? 'Crédito')}`
                : item.description || categoryName(item.categoryId)}</h2>
              <p>
                {item.type === 'DEBT_PAYMENT'
                  ? item.accountId ? `Desde: ${accountName(item.accountId)}` : 'Origen: Externo'
                  : item.type === 'TRANSFER'
                  ? `${accountName(item.accountId)} → ${accountName(item.destinationAccountId)}`
                  : accountName(item.accountId)}{' '}
                {item.type !== 'DEBT_PAYMENT' && <>· {categoryName(item.categoryId)}</>}
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
            <span className={styles.detailAffordance}>Ver detalle</span>
          </Card>
          </button>
        )
      })}
    </div>
  )
}
