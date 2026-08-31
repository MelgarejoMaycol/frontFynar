import { Star } from 'lucide-react'
import { Link } from 'react-router'
import { Card, HorizontalScrollArea } from '@/components/ui'
import { accountTypeLabels } from '@/features/accounts/accounts.constants'
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
          .map((account) => (
            <Link
              key={account.id}
              className={styles.accountLink}
              to={`/app/accounts/${account.id}`}
            >
              <Card className={styles.account}>
                <div>
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
                </div>
                <strong>
                  {formatMoney(account.currentBalance, account.currency)}
                </strong>
              </Card>
            </Link>
          ))}
      </HorizontalScrollArea>
    </section>
  )
}
