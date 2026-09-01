import { EmptyState } from '@/components/feedback/EmptyState'
import { Badge, Card } from '@/components/ui'
import { CreditCard, HandCoins, Repeat2 } from 'lucide-react'
import { useMemo } from 'react'
import { Link } from 'react-router'
import {
  calendarDate,
  money,
  statusLabel,
  statusTone,
  temporalLabel,
  upcomingResourcePath,
  upcomingTypeLabel,
} from './format'
import styles from './liabilities.module.css'
import type { Upcoming } from './types'

export function UpcomingPaymentsView({
  upcoming,
}: {
  upcoming: Upcoming[]
  workspaceId: string
  timezone: string
}) {
  const items = useMemo(() => {
    const selected = new Map<string, Upcoming>()
    for (const item of upcoming) {
      if (Number(item.amount) <= 0 || ['PAID', 'CANCELLED'].includes(item.status)) {
        continue
      }
      const current = selected.get(item.resourceId)
      if (!current || item.date < current.date) {
        selected.set(item.resourceId, item)
        continue
      }
      if (
        item.date === current.date &&
        ['OVERDUE', 'PARTIAL', 'PENDING'].indexOf(item.status) <
          ['OVERDUE', 'PARTIAL', 'PENDING'].indexOf(current.status)
      ) {
        selected.set(item.resourceId, item)
      }
    }
    return [...selected.values()].sort(
      (a, b) => a.date.localeCompare(b.date) || a.name.localeCompare(b.name),
    )
  }, [upcoming])

  const overdue = items.filter(
    (item) => item.status === 'OVERDUE' || item.daysRemaining < 0,
  )
  const overdueByCurrency = [
    ...new Set(overdue.map((item) => item.currency)),
  ].map((currency) => ({
    currency,
    amount: overdue
      .filter((item) => item.currency === currency)
      .reduce((total, item) => total + Number(item.amount), 0)
      .toFixed(2),
  }))

  return (
    <section id="upcoming" tabIndex={-1} className={styles.upcomingSection}>
      <div className={styles.sectionHeading}>
        <div>
          <h2>Próximos pagos</h2>
          <p>Créditos, tarjetas y pagos recurrentes que requieren atención.</p>
        </div>
      </div>
      {overdue.length > 0 && (
        <Card className={styles.overdueSummary}>
          <strong>Vencidos</strong>
          <span>
            {overdue.length} {overdue.length === 1 ? 'pago' : 'pagos'}
          </span>
          {overdueByCurrency.map((entry) => (
            <b key={entry.currency}>{money(entry.amount, entry.currency)}</b>
          ))}
        </Card>
      )}
      {items.length === 0 ? (
        <EmptyState
          title="No tienes pagos próximos"
          message="Tus cuotas, obligaciones y extractos pendientes aparecerán aquí."
        />
      ) : (
        <div className={styles.upcomingGrid}>
          {items.map((item) => (
            <UpcomingCard key={`${item.type}-${item.id}`} item={item} />
          ))}
        </div>
      )}
    </section>
  )
}

function UpcomingCard({ item }: { item: Upcoming }) {
  return (
    <Link
      className={styles.upcomingCardLink}
      to={upcomingResourcePath(item)}
      aria-label={`Abrir ${upcomingTypeLabel(item.type)} ${item.name}, ${money(item.amount, item.currency)}, ${calendarDate(item.date)}`}
    >
      <Card
        className={`${styles.upcomingCard} ${item.status === 'OVERDUE' ? styles.upcomingOverdue : ''}`}
      >
        <div className={styles.upcomingCardType} data-kind={item.type}>
          {item.type === 'DEBT_INSTALLMENT' ? (
            <HandCoins size={17} aria-hidden="true" />
          ) : item.type === 'OBLIGATION' ? (
            <Repeat2 size={17} aria-hidden="true" />
          ) : (
            <CreditCard size={17} aria-hidden="true" />
          )}{' '}
          {upcomingTypeLabel(item.type)}
        </div>
        <strong>{item.name}</strong>
        <time dateTime={item.date}>{calendarDate(item.date)}</time>
        <b>{money(item.amount, item.currency)}</b>
        <div className={styles.upcomingCardFooter}>
          <Badge tone={statusTone(item.status)}>
            {statusLabel[item.status] ?? item.status}
          </Badge>
          <span>{temporalLabel(item)}</span>
        </div>
      </Card>
    </Link>
  )
}
