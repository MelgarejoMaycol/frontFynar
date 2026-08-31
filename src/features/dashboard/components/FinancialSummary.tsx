import {
  ArrowDownCircle,
  ArrowUpCircle,
  Landmark,
  Scale,
  Wallet,
} from 'lucide-react'
import { Card, HorizontalScrollArea } from '@/components/ui'
import { Link } from 'react-router'
import { formatMoney } from '@/features/transactions/transactions.format'
import type { CurrencySummary } from '../types/dashboard.types'
import styles from './dashboard.module.css'
const values = [
  [
    'Dinero disponible',
    'availableMoney',
    Wallet,
    'summaryNeutral',
    '/app/accounts',
  ],
  [
    'Ingresos',
    'totalIncome',
    ArrowUpCircle,
    'summaryIncome',
    '/app/transactions?type=INCOME',
  ],
  [
    'Gastos',
    'totalExpenses',
    ArrowDownCircle,
    'summaryExpense',
    '/app/transactions?type=EXPENSE',
  ],
  ['Flujo neto', 'netCashFlow', Landmark, 'summaryFlow', null],
  ['Patrimonio', 'netWorth', Scale, 'summaryWorth', '/app/accounts'],
] as const
export function FinancialSummary({ summary }: { summary: CurrencySummary }) {
  const signed = (key: (typeof values)[number][1]) => {
    const formatted = formatMoney(summary[key], summary.currency)
    if (key === 'totalIncome' && Number(summary[key]) > 0)
      return `+${formatted}`
    if (key === 'totalExpenses' && Number(summary[key]) > 0)
      return `−${formatted}`
    if (key === 'netCashFlow' && Number(summary[key]) !== 0)
      return `${Number(summary[key]) > 0 ? '+' : '−'}${formatMoney(String(Math.abs(Number(summary[key]))), summary.currency)}`
    return formatted
  }
  return (
    <section aria-labelledby={`currency-${summary.currency}`}>
      <div className={styles.summaryHeading}>
        <h2 id={`currency-${summary.currency}`}>Resumen financiero</h2>
        <span>Valores en {summary.currency}</span>
      </div>
      <HorizontalScrollArea
        className={styles.summaryGrid}
        label={`resumen financiero en ${summary.currency}`}
      >
        {values.map(([label, key, Icon, tone, to]) => {
          const content = (
            <Card className={`${styles.summaryCard} ${styles[tone]}`}>
              <Icon aria-hidden="true" />
              <span>{label}</span>
              <strong>{signed(key)}</strong>
              {(key === 'availableMoney' || key === 'netWorth') && (
                <small>Saldo actual</small>
              )}
              {(key === 'totalIncome' || key === 'totalExpenses') && (
                <small>Período seleccionado</small>
              )}
              {key === 'netCashFlow' && (
                <small>
                  {Number(summary[key]) > 0
                    ? 'Positivo'
                    : Number(summary[key]) < 0
                      ? 'Negativo'
                      : 'Sin variación'}
                </small>
              )}
            </Card>
          )
          return to ? (
            <Link key={key} className={styles.summaryLink} to={to}>
              {content}
            </Link>
          ) : (
            <div key={key}>{content}</div>
          )
        })}
      </HorizontalScrollArea>
    </section>
  )
}
