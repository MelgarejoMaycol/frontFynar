import { Link } from 'react-router'
import {
  accountNatureLabels,
  accountTypeLabels,
} from '@/features/accounts/accounts.constants'
import { formatMoney } from '@/features/transactions/transactions.format'
import type { AccountBalancesReport as Data } from '../types/report.types'
import { ReportEmptyState } from './ReportEmptyState'
import styles from './reports.module.css'
export function AccountBalancesReport({ data }: { data: Data }) {
  if (!data.accounts.length)
    return <ReportEmptyState message="No hay cuentas activas para mostrar." />
  return (
    <div className={styles.accountList}>
      {data.accounts.map((account) => (
        <article className={styles.account} key={account.id}>
          <div>
            <h3>{account.name}</h3>
            <p>
              {accountTypeLabels[account.type]} ·{' '}
              {accountNatureLabels[account.nature]} · {account.currency}
            </p>
          </div>
          <strong>
            {formatMoney(account.currentBalance, account.currency)}
          </strong>
          <Link to="/app/accounts">Ver cuenta</Link>
        </article>
      ))}
    </div>
  )
}
