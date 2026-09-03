import { Star } from 'lucide-react'
import { Link } from 'react-router'
import { Card, HorizontalScrollArea } from '@/components/ui'
import { accountTypeLabels } from '@/features/accounts/accounts.constants'
import { accountTypeIcons } from '@/features/accounts/accountIcons'
import { formatMoney } from '@/features/transactions/transactions.format'
import type { DashboardAccount } from '../types/dashboard.types'
import styles from './dashboard.module.css'
export function AccountsSummary({
  accounts,
}: {
  accounts: DashboardAccount[]
}) {
  return (
    <section className={styles.dashboardSection}>
      <div className={styles.sectionHeader}>
        <h2>Cuentas</h2>
        <Link to="/app/accounts">Ver todas</Link>
      </div>
      <HorizontalScrollArea
        className={styles.accountGrid}
        label="cuentas disponibles"
      >
        {accounts
          .filter((account) => account.type !== 'CREDIT_CARD')
          .map((account) => {
            const AccountIcon = accountTypeIcons[account.type]
            const reserved = account.reservedForGoals ?? '0.00'
            const available = account.availableBalance ?? account.currentBalance
            const hasReservations =
              account.nature === 'ASSET' && Number(reserved) > 0
            return (
              <Link
                key={account.id}
                className={styles.accountLink}
                to={`/app/accounts/${account.id}`}
              >
                <Card className={styles.account}>
                  <span className={styles.accountIcon} aria-hidden="true">
                    <AccountIcon size={21} />
                  </span>
                  <div className={styles.accountInfo}>
                    <h3>
                      {account.name}
                      {account.isFavorite && (
                        <Star
                          className={styles.favorite}
                          size={16}
                          fill="currentColor"
                          aria-label="Cuenta favorita"
                        />
                      )}
                    </h3>
                    <p>{accountTypeLabels[account.type]}</p>
                    {hasReservations && (
                      <p>
                        En metas {formatMoney(reserved, account.currency)} · saldo{' '}
                        {formatMoney(account.currentBalance, account.currency)}
                      </p>
                    )}
                  </div>
                  <strong>
                    {formatMoney(available, account.currency)}
                  </strong>
                </Card>
              </Link>
            )
          })}
      </HorizontalScrollArea>
    </section>
  )
}
