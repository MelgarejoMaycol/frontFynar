import {
  ArrowDownCircle,
  ArrowUpCircle,
  Landmark,
  Scale,
} from 'lucide-react'
import { Card, HorizontalScrollArea } from '@/components/ui'
import { Link } from 'react-router'
import { formatMoney } from '@/features/transactions/transactions.format'
import type {
  CurrencySummary,
  DashboardComparison,
} from '../types/dashboard.types'
import styles from './dashboard.module.css'

const values = [
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

type SummaryKey = (typeof values)[number][1]

const comparisonLabel = (
  key: SummaryKey,
  comparison: DashboardComparison | undefined,
) => {
  if (!comparison || (key !== 'totalIncome' && key !== 'totalExpenses'))
    return null
  const value =
    key === 'totalIncome'
      ? comparison.incomeChangePercentage
      : comparison.expenseChangePercentage
  if (value === null) return 'Sin base comparable anterior'
  const percentage = Number(value)
  if (!Number.isFinite(percentage) || Math.abs(percentage) < 0.5)
    return 'Similar al período anterior'
  const absolute = Math.abs(percentage).toLocaleString('es-CO', {
    maximumFractionDigits: 0,
  })
  if (key === 'totalExpenses')
    return percentage > 0
      ? `${absolute} % más que el período anterior`
      : `${absolute} % menos que el período anterior`
  return percentage > 0
    ? `${absolute} % más que el período anterior`
    : `${absolute} % menos que el período anterior`
}

export function FinancialSummary({
  summary,
  comparison,
}: {
  summary: CurrencySummary
  comparison?: DashboardComparison
}) {
  const signed = (key: SummaryKey) => {
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
    <section
      className={styles.dashboardSection}
      aria-labelledby={`currency-${summary.currency}`}
    >
      <div className={styles.summaryHeading}>
        <div>
          <h2 id={`currency-${summary.currency}`}>Actividad del período</h2>
          <small>Compara el ritmo actual con el período anterior.</small>
        </div>
        <span>Valores en {summary.currency}</span>
      </div>
      <HorizontalScrollArea
        className={styles.summaryGrid}
        label={`actividad financiera en ${summary.currency}`}
      >
        {values.map(([label, key, Icon, tone, to]) => {
          const comparisonText = comparisonLabel(key, comparison)
          const content = (
            <Card className={`${styles.summaryCard} ${styles[tone]}`}>
              <Icon aria-hidden="true" />
              <span>{label}</span>
              <strong>{signed(key)}</strong>
              {comparisonText && <small>{comparisonText}</small>}
              {key === 'netWorth' && <small>Patrimonio actual</small>}
              {key === 'netCashFlow' && (
                <small>
                  {Number(summary[key]) > 0
                    ? 'Ingresaste más de lo que gastaste'
                    : Number(summary[key]) < 0
                      ? 'Gastaste más de lo que ingresaste'
                      : 'Ingresos y gastos están equilibrados'}
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
