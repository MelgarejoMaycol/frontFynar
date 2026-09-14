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
    <div className={styles.accountAnalysis}>
      {data.summariesByCurrency.length > 0 && (
        <div className={styles.accountSummaryGrid}>
          {data.summariesByCurrency.map((summary) => (
            <article
              key={summary.currency}
              className={styles.accountSummaryCard}
            >
              <span className={styles.metricEyebrow}>
                {summary.currency}
              </span>
              <strong>
                {formatMoney(summary.netWorth, summary.currency)}
              </strong>
              <p>Patrimonio neto</p>
              <dl>
                <div>
                  <dt>Disponible</dt>
                  <dd>
                    {formatMoney(
                      summary.availableMoney,
                      summary.currency,
                    )}
                  </dd>
                </div>
                <div>
                  <dt>Activos</dt>
                  <dd>
                    {formatMoney(
                      summary.assetBalance,
                      summary.currency,
                    )}
                  </dd>
                </div>
                <div>
                  <dt>Pasivos</dt>
                  <dd>
                    {formatMoney(
                      summary.liabilityBalance,
                      summary.currency,
                    )}
                  </dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      )}

      <div className={styles.accountList}>
        {data.accounts.map((account) => {
          const sameCurrency = data.accounts.filter(
            (candidate) => candidate.currency === account.currency,
          )
          const maxBalance = Math.max(
            ...sameCurrency.map((candidate) =>
              Math.abs(Number(candidate.currentBalance || 0)),
            ),
            1,
          )
          const magnitude =
            (Math.abs(Number(account.currentBalance || 0)) /
              maxBalance) *
            100

          return (
            <article className={styles.account} key={account.id}>
              <div className={styles.accountIdentity}>
                <div>
                  <h3>{account.name}</h3>
                  <p>
                    {accountTypeLabels[account.type]} ·{' '}
                    {accountNatureLabels[account.nature]} ·{' '}
                    {account.currency}
                  </p>
                </div>
                <strong>
                  {formatMoney(
                    account.currentBalance,
                    account.currency,
                  )}
                </strong>
              </div>
              <div className={styles.accountBar} aria-hidden="true">
                <span
                  className={
                    account.nature === 'LIABILITY'
                      ? styles.accountBarLiability
                      : styles.accountBarAsset
                  }
                  style={{ width: Math.max(2, magnitude) + '%' }}
                />
              </div>
              <Link to="/app/accounts">Ver cuenta</Link>
            </article>
          )
        })}
      </div>
    </div>
  )
}
