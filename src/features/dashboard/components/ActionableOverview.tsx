import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  PiggyBank,
  TrendingDown,
  TrendingUp,
  WalletCards,
} from 'lucide-react'
import { Link } from 'react-router'
import { Card } from '@/components/ui'
import { useBudgets } from '@/features/budgets/hooks/budgets.hooks'
import type { Budget } from '@/features/budgets/types/budget.types'
import {
  upcomingResourcePath,
  upcomingTypeLabel,
} from '@/features/liabilities/format'
import { useUpcoming } from '@/features/liabilities/hooks'
import type { Upcoming } from '@/features/liabilities/types'
import { formatMoney } from '@/features/transactions/transactions.format'
import type {
  DashboardAccount,
  DashboardComparison,
  CurrencySummary,
} from '../types/dashboard.types'
import styles from './ActionableOverview.module.css'

type AttentionItem = {
  key: string
  priority: number
  title: string
  description: string
  to: string
  tone: 'danger' | 'warning' | 'info'
  icon: typeof AlertTriangle
}

const numberValue = (value: string | null | undefined) => Number(value ?? 0)

const dateOnlyInTimezone = (timezone: string) =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())

const daysBetween = (from: string, to: string) => {
  const start = Date.parse(`${from}T00:00:00Z`)
  const end = Date.parse(`${to}T00:00:00Z`)
  return Math.ceil((end - start) / 86_400_000)
}

const changeText = (comparison: DashboardComparison) => {
  const percentage = comparison.expenseChangePercentage
  if (percentage === null) return null
  const value = Number(percentage)
  if (!Number.isFinite(value) || Math.abs(value) < 1) return null
  const absolute = Math.abs(value).toLocaleString('es-CO', {
    maximumFractionDigits: 0,
  })
  return value > 0
    ? `Tus gastos van ${absolute} % por encima del período anterior.`
    : `Tus gastos van ${absolute} % por debajo del período anterior.`
}

const activeUpcoming = (items: Upcoming[]) =>
  items.filter(
    (item) =>
      numberValue(item.amount) > 0 && !['PAID', 'CANCELLED'].includes(item.status),
  )

const buildCommitmentAttention = ({
  summaries,
  upcoming,
}: {
  summaries: CurrencySummary[]
  upcoming: Upcoming[]
}): AttentionItem[] =>
  summaries.flatMap((summary) => {
    const available = numberValue(summary.availableMoney)
    const commitments = upcoming
      .filter(
        (item) =>
          item.currency === summary.currency &&
          item.daysRemaining >= 0 &&
          item.daysRemaining <= 30,
      )
      .reduce((total, item) => total + numberValue(item.amount), 0)

    if (commitments <= 0) return []

    const afterCommitments = available - commitments
    if (afterCommitments < 0) {
      return [
        {
          key: `commitments-gap-${summary.currency}`,
          priority: 0,
          title: 'Tus compromisos superan lo disponible',
          description: `Con los pagos conocidos de los próximos 30 días te faltarían ${formatMoney(String(Math.abs(afterCommitments)), summary.currency)}. Revisa qué vence primero y cómo cubrirlo.`,
          to: '/app/liabilities',
          tone: 'danger' as const,
          icon: AlertTriangle,
        },
      ]
    }

    const coverage = available > 0 ? (commitments / available) * 100 : 0
    if (coverage < 70) return []

    return [
      {
        key: `commitments-pressure-${summary.currency}`,
        priority: 2,
        title: 'Tus pagos próximos pesan bastante',
        description: `Los compromisos conocidos de los próximos 30 días representan cerca del ${Math.round(coverage)} % de tu dinero disponible.`,
        to: '/app/liabilities',
        tone: 'warning' as const,
        icon: CalendarClock,
      },
    ]
  })

const buildAttentionItems = ({
  upcoming,
  budgets,
  comparisons,
  timezone,
}: {
  upcoming: Upcoming[]
  budgets: Budget[]
  comparisons: DashboardComparison[]
  timezone: string
}): AttentionItem[] => {
  const attention: AttentionItem[] = []
  const pending = activeUpcoming(upcoming).sort(
    (a, b) => a.daysRemaining - b.daysRemaining || a.date.localeCompare(b.date),
  )
  const overdue = pending.find(
    (item) => item.status === 'OVERDUE' || item.daysRemaining < 0,
  )
  if (overdue) {
    attention.push({
      key: `overdue-${overdue.type}-${overdue.id}`,
      priority: 0,
      title: `${overdue.name} está vencido`,
      description: `${formatMoney(overdue.amount, overdue.currency)} pendientes · ${upcomingTypeLabel(overdue.type)}.`,
      to: upcomingResourcePath(overdue),
      tone: 'danger',
      icon: AlertTriangle,
    })
  }

  const next = pending.find(
    (item) => item !== overdue && item.daysRemaining >= 0 && item.daysRemaining <= 7,
  )
  if (next) {
    attention.push({
      key: `next-${next.type}-${next.id}`,
      priority: next.daysRemaining <= 2 ? 1 : 2,
      title:
        next.daysRemaining === 0
          ? `${next.name} vence hoy`
          : `${next.name} vence en ${next.daysRemaining} día${next.daysRemaining === 1 ? '' : 's'}`,
      description: `${formatMoney(next.amount, next.currency)} · ${upcomingTypeLabel(next.type)}.`,
      to: upcomingResourcePath(next),
      tone: next.daysRemaining <= 2 ? 'warning' : 'info',
      icon: CalendarClock,
    })
  }

  const today = dateOnlyInTimezone(timezone)
  const riskyBudgets = [...budgets]
    .filter((budget) => {
      const percentage = numberValue(budget.progress.percentage)
      return (
        budget.progress.status !== 'SAFE' ||
        budget.projection.projectedStatus !== 'SAFE' ||
        percentage >= numberValue(budget.alertThreshold)
      )
    })
    .sort(
      (a, b) =>
        numberValue(b.projection.projectedPercentage) -
          numberValue(a.projection.projectedPercentage) ||
        numberValue(b.progress.percentage) - numberValue(a.progress.percentage),
    )

  const budget = riskyBudgets[0]
  if (budget) {
    const remainingDays = Math.max(0, daysBetween(today, budget.endsOn))
    const percentage = Math.round(numberValue(budget.progress.percentage))
    const projected = Math.round(numberValue(budget.projection.projectedPercentage))
    const projectedExceeded = budget.projection.projectedStatus === 'EXCEEDED'
    const remaining = Math.max(0, numberValue(budget.progress.remaining))
    const dailyLimit = remainingDays > 0 && remaining > 0 ? remaining / remainingDays : null
    const guidance = dailyLimit
      ? ` Te quedan ${formatMoney(String(remaining), budget.currency)}; para mantenerte dentro del límite, intenta no pasar de ${formatMoney(String(dailyLimit), budget.currency)} al día.`
      : ''

    attention.push({
      key: `budget-${budget.id}`,
      priority: projectedExceeded || budget.progress.status === 'EXCEEDED' ? 1 : 3,
      title:
        budget.progress.status === 'EXCEEDED'
          ? `${budget.name} superó el presupuesto`
          : `${budget.name} necesita atención`,
      description: projectedExceeded
        ? `Llevas ${percentage} % y, al ritmo actual, podrías cerrar cerca de ${projected} %. Quedan ${remainingDays} día${remainingDays === 1 ? '' : 's'}.${guidance}`
        : `Has usado ${percentage} % y quedan ${remainingDays} día${remainingDays === 1 ? '' : 's'} del período.${guidance}`,
      to: `/app/budgets?budgetId=${budget.id}`,
      tone: projectedExceeded ? 'warning' : 'info',
      icon: projectedExceeded ? TrendingUp : AlertTriangle,
    })
  }

  const expenseComparison = comparisons
    .filter((comparison) => numberValue(comparison.previousExpenses) > 0)
    .map((comparison) => ({ comparison, text: changeText(comparison) }))
    .filter(
      (entry): entry is { comparison: DashboardComparison; text: string } =>
        Boolean(entry.text),
    )
    .sort(
      (a, b) =>
        numberValue(b.comparison.expenseChangePercentage) -
        numberValue(a.comparison.expenseChangePercentage),
    )[0]

  if (expenseComparison) {
    const higher = numberValue(expenseComparison.comparison.expenseChangePercentage) > 0
    attention.push({
      key: `comparison-${expenseComparison.comparison.currency}`,
      priority: higher ? 4 : 6,
      title: higher ? 'Estás gastando más' : 'Tu gasto viene bajando',
      description: `${expenseComparison.text} Valores en ${expenseComparison.comparison.currency}.`,
      to: '/app/transactions?type=EXPENSE',
      tone: higher ? 'warning' : 'info',
      icon: higher ? TrendingUp : TrendingDown,
    })
  }

  const negativeFlow = comparisons
    .filter((comparison) => numberValue(comparison.currentNetCashFlow) < 0)
    .sort(
      (a, b) =>
        numberValue(a.currentNetCashFlow) - numberValue(b.currentNetCashFlow),
    )[0]
  if (negativeFlow) {
    attention.push({
      key: `flow-${negativeFlow.currency}`,
      priority: 5,
      title: 'El flujo del período está en negativo',
      description: `Tus gastos superan tus ingresos por ${formatMoney(String(Math.abs(numberValue(negativeFlow.currentNetCashFlow))), negativeFlow.currency)}.`,
      to: '/app/transactions',
      tone: 'warning',
      icon: TrendingDown,
    })
  }

  return attention.sort((a, b) => a.priority - b.priority)
}

export function ActionableOverview({
  summaries,
  accounts,
  comparisons,
  workspaceId,
  timezone,
}: {
  summaries: CurrencySummary[]
  accounts: DashboardAccount[]
  comparisons: DashboardComparison[]
  workspaceId: string
  timezone: string
}) {
  const upcomingQuery = useUpcoming(workspaceId)
  const today = dateOnlyInTimezone(timezone)
  const budgetsQuery = useBudgets(workspaceId, {
    status: 'ACTIVE',
    includeArchived: 'false',
    dateFrom: today,
    dateTo: today,
    page: 1,
    limit: 100,
  })
  const upcoming = upcomingQuery.data ?? []
  const budgets = budgetsQuery.data?.items ?? []
  const pendingUpcoming = activeUpcoming(upcoming)
  const attention = [
    ...buildCommitmentAttention({ summaries, upcoming: pendingUpcoming }),
    ...buildAttentionItems({
      upcoming,
      budgets,
      comparisons,
      timezone,
    }),
  ]
    .sort((a, b) => a.priority - b.priority)
    .slice(0, 3)
  const isPartial = upcomingQuery.isError || budgetsQuery.isError

  return (
    <section className={styles.section} aria-labelledby="actionable-dashboard-title">
      <div className={styles.heading}>
        <div>
          <span className={styles.eyebrow}>Lo importante primero</span>
          <h2 id="actionable-dashboard-title">Tu situación hoy</h2>
          <p>
            Separamos lo que tienes, lo que ya reservaste y lo que viene por pagar.
          </p>
        </div>
        {isPartial && (
          <small className={styles.partial}>Algunos avisos no pudieron actualizarse.</small>
        )}
      </div>

      <div className={styles.layout}>
        <div className={styles.moneyColumn}>
          {summaries.map((summary) => {
            const assetAccounts = accounts.filter(
              (account) =>
                account.nature === 'ASSET' && account.currency === summary.currency,
            )
            const totalMoney =
              summary.totalMoney ??
              String(
                assetAccounts.reduce(
                  (total, account) => total + numberValue(account.currentBalance),
                  0,
                ),
              )
            const reserved =
              summary.reservedForGoals ??
              String(
                assetAccounts.reduce(
                  (total, account) =>
                    total + numberValue(account.reservedForGoals),
                  0,
                ),
              )
            const upcoming30 = pendingUpcoming
              .filter(
                (item) =>
                  item.currency === summary.currency &&
                  item.daysRemaining >= 0 &&
                  item.daysRemaining <= 30,
              )
              .reduce((total, item) => total + numberValue(item.amount), 0)
            const afterCommitments = numberValue(summary.availableMoney) - upcoming30
            const commitmentShare =
              numberValue(summary.availableMoney) > 0 && upcoming30 > 0
                ? Math.round((upcoming30 / numberValue(summary.availableMoney)) * 100)
                : 0
            return (
              <Card className={styles.moneyCard} key={summary.currency}>
                <div className={styles.moneyHeader}>
                  <div>
                    <span>Disponible para usar</span>
                    <strong>{formatMoney(summary.availableMoney, summary.currency)}</strong>
                  </div>
                  <span className={styles.currency}>{summary.currency}</span>
                </div>

                <div className={styles.breakdown}>
                  <div>
                    <WalletCards size={17} aria-hidden="true" />
                    <span>Saldo total</span>
                    <b>{formatMoney(totalMoney, summary.currency)}</b>
                  </div>
                  <div>
                    <PiggyBank size={17} aria-hidden="true" />
                    <span>En metas</span>
                    <b>{formatMoney(reserved, summary.currency)}</b>
                  </div>
                  <div>
                    <CalendarClock size={17} aria-hidden="true" />
                    <span>Compromisos · 30 días</span>
                    <b>{formatMoney(String(upcoming30), summary.currency)}</b>
                  </div>
                </div>

                <div
                  className={`${styles.afterCommitments} ${afterCommitments < 0 ? styles.afterCommitmentsDanger : ''}`}
                >
                  <span>
                    {afterCommitments >= 0
                      ? 'Después de compromisos quedarían'
                      : 'Te faltarían para cubrir compromisos'}
                  </span>
                  <strong>
                    {formatMoney(String(Math.abs(afterCommitments)), summary.currency)}
                  </strong>
                </div>
                {commitmentShare > 0 && (
                  <small className={styles.commitmentContext}>
                    Los pagos conocidos usan aproximadamente {commitmentShare} % de tu dinero disponible.
                  </small>
                )}
                <small className={styles.estimateNote}>
                  Es una estimación: los pagos próximos todavía no se descuentan de tu saldo real.
                </small>
              </Card>
            )
          })}
        </div>

        <Card className={styles.attentionCard}>
          <div className={styles.attentionHeader}>
            <div>
              <span>Prioridad</span>
              <h3>Necesita tu atención</h3>
            </div>
            <AlertTriangle size={20} aria-hidden="true" />
          </div>

          {attention.length === 0 ? (
            <div className={styles.allGood}>
              <CheckCircle2 size={22} aria-hidden="true" />
              <div>
                <strong>Sin alertas importantes</strong>
                <span>
                  No vemos vencimientos cercanos ni presupuestos en riesgo con los datos actuales.
                </span>
              </div>
            </div>
          ) : (
            <div className={styles.attentionList}>
              {attention.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.key}
                    className={`${styles.attentionItem} ${styles[item.tone]}`}
                    to={item.to}
                  >
                    <span className={styles.attentionIcon}>
                      <Icon size={18} aria-hidden="true" />
                    </span>
                    <span className={styles.attentionCopy}>
                      <strong>{item.title}</strong>
                      <small>{item.description}</small>
                    </span>
                    <ArrowRight size={17} aria-hidden="true" />
                  </Link>
                )
              })}
            </div>
          )}
        </Card>
      </div>
    </section>
  )
}
