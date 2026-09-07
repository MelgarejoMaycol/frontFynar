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
import visualStyles from './FinancialSummaryVisual.module.css'

const values = [
  [
    'Ingresos',
    'totalIncome',
    ArrowUpCircle,
    'summaryIncome',
    'income',
    '/app/transactions?type=INCOME',
  ],
  [
    'Gastos',
    'totalExpenses',
    ArrowDownCircle,
    'summaryExpense',
    'expense',
    '/app/transactions?type=EXPENSE',
  ],
  ['Flujo neto', 'netCashFlow', Landmark, 'summaryFlow', 'flow', null],
  ['Patrimonio', 'netWorth', Scale, 'summaryWorth', 'worth', '/app/accounts'],
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
    const raw = summary[key]
    const formatted = formatMoney(raw, summary.currency)
    if (key === 'totalIncome' && !raw.startsWith('-') && raw !== '0' && raw !== '0.00')
      return `+${formatted}`
    if (key === 'totalExpenses' && !raw.startsWith('-') && raw !== '0' && raw !== '0.00')
      return `−${formatted}`
    if (key === 'netCashFlow' && raw !== '0' && raw !== '0.00') {
      const negative = raw.startsWith('-')
      const absolute = negative ? raw.slice(1) : raw
      return `${negative ? '−' : '+'}${formatMoney(absolute, summary.currency)}`
    }
    return formatted
  }

  return (
    <section
      className={`${styles.dashboardSection} ${visualStyles.section}`}
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
        {values.map(([label, key, Icon, tone, visualTone, to]) => {
          const comparisonText = comparisonLabel(key, comparison)
          const content = (
            <Card
              className={`${styles.summaryCard} ${styles[tone]} ${visualStyles.card} ${visualStyles[visualTone]}`}
              data-testid={`summary-card-${key}`}
            >
              <Icon aria-hidden="true" />
              <span>{label}</span>
              <strong
                className={visualStyles.amount}
                data-testid={`summary-amount-${key}`}
              >
                {signed(key)}
              </strong>
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
            <div key={key} className={styles.summaryLink}>
              {content}
            </div>
          )
        })}
      </HorizontalScrollArea>
    </section>
  )
}
