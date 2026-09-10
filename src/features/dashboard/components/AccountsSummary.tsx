import type { CSSProperties } from 'react'
import { PiggyBank, Star } from 'lucide-react'
import { Link } from 'react-router'
import { Card, HorizontalScrollArea } from '@/components/ui'
import { accountTypeLabels } from '@/features/accounts/accounts.constants'
import { accountTypeIcons } from '@/features/accounts/accountIcons'
import { formatMoney } from '@/features/transactions/transactions.format'
import type { DashboardAccount } from '../types/dashboard.types'
import styles from './dashboard.module.css'
import accountStyles from './AccountsSummary.module.css'

const ACCOUNT_CARD_MIN_WIDTH = 320
const ACCOUNT_CARD_BASE_CONTENT_WIDTH = 190
const ACCOUNT_CARD_CHARACTER_WIDTH = 13

function getAccountCardWidth(values: string[]) {
  const longestMoneyLength = Math.max(...values.map((value) => value.length), 0)

  return Math.max(
    ACCOUNT_CARD_MIN_WIDTH,
    ACCOUNT_CARD_BASE_CONTENT_WIDTH + longestMoneyLength * ACCOUNT_CARD_CHARACTER_WIDTH,
  )
}

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
            const formattedAvailable = formatMoney(available, account.currency)
            const formattedTotal = formatMoney(account.currentBalance, account.currency)
            const formattedReserved = hasReservations
              ? formatMoney(reserved, account.currency)
              : ''
            const cardWidth = getAccountCardWidth([
              formattedAvailable,
              formattedTotal,
              formattedReserved,
            ])
            const accountCardStyle: CSSProperties = {
              width: `${cardWidth}px`,
              minWidth: `${cardWidth}px`,
              maxWidth: 'none',
              flex: `0 0 ${cardWidth}px`,
            }

            return (
              <Link
                key={account.id}
                className={`${styles.accountLink} ${accountStyles.accountLink}`}
                style={accountCardStyle}
                to={`/app/accounts/${account.id}`}
              >
                <Card className={`${styles.account} ${accountStyles.accountCard}`}>
                  <div className={accountStyles.topRow}>
                    <span
                      className={`${styles.accountIcon} ${accountStyles.accountIcon}`}
                      aria-hidden="true"
                    >
                      <AccountIcon size={20} />
                    </span>
                    <div className={accountStyles.identity}>
                      <h3>
                        <span>{account.name}</span>
                        {account.isFavorite && (
                          <Star
                            className={styles.favorite}
                            size={15}
                            fill="currentColor"
                            aria-label="Cuenta favorita"
                          />
                        )}
                      </h3>
                      <p>{accountTypeLabels[account.type]}</p>
                    </div>
                  </div>

                  <div className={accountStyles.balanceBlock}>
                    <span>Disponible</span>
                    <strong>{formattedAvailable}</strong>
                  </div>

                  {hasReservations ? (
                    <div className={accountStyles.reservationRow}>
                      <span className={accountStyles.goalBadge}>
                        <PiggyBank size={14} aria-hidden="true" />
                        En metas
                      </span>
                      <span className={accountStyles.reservedAmount}>
                        {formattedReserved}
                      </span>
                      <span className={accountStyles.totalBalance}>
                        Total {formattedTotal}
                      </span>
                    </div>
                  ) : (
                    <div className={accountStyles.noReservationRow}>
                      <span>Saldo total</span>
                      <span>{formattedTotal}</span>
                    </div>
                  )}
                </Card>
              </Link>
            )
          })}
      </HorizontalScrollArea>
    </section>
  )
}
