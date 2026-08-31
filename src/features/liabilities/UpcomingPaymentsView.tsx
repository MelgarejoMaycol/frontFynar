import { EmptyState } from '@/components/feedback/EmptyState'
import { Badge, Button, Card } from '@/components/ui'
import { useCalendarRange } from '@/features/liabilities/hooks'
import { CalendarDays, CreditCard, HandCoins, Repeat2 } from 'lucide-react'
import { useMemo, useState } from 'react'
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

const dayKey = (date: Date) => date.toISOString().slice(0, 10)
const monthTitle = (date: Date) =>
  new Intl.DateTimeFormat('es-CO', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date)
export function UpcomingPaymentsView({
  upcoming,
  workspaceId,
}: {
  upcoming: Upcoming[]
  workspaceId: string
}) {
  const [view, setView] = useState<'cards' | 'calendar'>('cards')
  const [month, setMonth] = useState(() => {
    const now = new Date()
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
  })
  const from = new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth(), 1))
  const to = new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + 12, 0))
  const calendar = useCalendarRange(
    workspaceId,
    from.toISOString().slice(0, 10),
    to.toISOString().slice(0, 10),
  )
  const items = useMemo(
    () => {
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
    },
    [upcoming],
  )
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
          <p>
            Créditos, tarjetas y pagos recurrentes desde una única agenda
            financiera.
          </p>
        </div>
        <div className={styles.viewSwitch} aria-label="Vista de próximos pagos">
          <Button
            variant={view === 'cards' ? 'primary' : 'secondary'}
            size="small"
            aria-pressed={view === 'cards'}
            onClick={() => setView('cards')}
          >
            Próximos pagos
          </Button>
          <Button
            variant={view === 'calendar' ? 'primary' : 'secondary'}
            size="small"
            aria-pressed={view === 'calendar'}
            onClick={() => setView('calendar')}
          >
            <CalendarDays size={17} aria-hidden="true" /> Calendario
          </Button>
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
      ) : view === 'cards' ? (
        <div className={styles.upcomingGrid}>
          {items.map((item) => (
            <UpcomingCard key={`${item.type}-${item.id}`} item={item} />
          ))}
        </div>
      ) : calendar.isPending ? (
        <p>Cargando calendario…</p>
      ) : (
        <PaymentCalendar items={calendar.data ?? []} month={month} onMonth={setMonth} />
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

function PaymentCalendar({
  items,
  month,
  onMonth,
}: {
  items: Upcoming[]
  month: Date
  onMonth: (value: Date) => void
}) {
  const year = month.getUTCFullYear(),
    monthIndex = month.getUTCMonth()
  const firstWeekday = (month.getUTCDay() + 6) % 7
  const days = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate()
  const cells = Array.from({ length: firstWeekday + days }, (_, index) =>
    index < firstWeekday
      ? null
      : new Date(Date.UTC(year, monthIndex, index - firstWeekday + 1)),
  )
  const monthItems = items.filter((item) =>
    item.date.startsWith(`${year}-${String(monthIndex + 1).padStart(2, '0')}`),
  )
  const byDay = new Map<string, Upcoming[]>()
  monthItems.forEach((item) =>
    byDay.set(item.date, [...(byDay.get(item.date) ?? []), item]),
  )
  const shift = (amount: number) =>
    onMonth(new Date(Date.UTC(year, monthIndex + amount, 1)))
  const today = () => {
    const now = new Date()
    onMonth(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)))
  }
  return (
    <div className={styles.calendarPanel}>
      <div className={styles.calendarNav}>
        <Button
          variant="secondary"
          size="small"
          onClick={() => shift(-1)}
          aria-label="Mes anterior"
        >
          ←
        </Button>
        <h3>{monthTitle(month)}</h3>
        <Button
          variant="secondary"
          size="small"
          onClick={() => shift(1)}
          aria-label="Mes siguiente"
        >
          →
        </Button>
        <Button variant="secondary" size="small" onClick={today}>
          Hoy
        </Button>
      </div>
      <div
        className={styles.calendarGrid}
        role="grid"
        aria-label={`Calendario de pagos de ${monthTitle(month)}`}
      >
        {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((label) => (
          <div
            className={styles.calendarWeekday}
            role="columnheader"
            key={label}
          >
            {label}
          </div>
        ))}
        {cells.map((date, index) =>
          date ? (
            <div
              className={styles.calendarDay}
              role="gridcell"
              key={dayKey(date)}
            >
              <time dateTime={dayKey(date)}>{date.getUTCDate()}</time>
              {(byDay.get(dayKey(date)) ?? []).map((item) => (
                <CalendarEvent key={`${item.type}-${item.id}`} item={item} />
              ))}
            </div>
          ) : (
            <div
              className={styles.calendarBlank}
              role="gridcell"
              key={`blank-${index}`}
            />
          ),
        )}
      </div>
      <div
        className={styles.calendarAgenda}
        aria-label={`Agenda de ${monthTitle(month)}`}
      >
        {monthItems.length ? (
          monthItems.map((item) => (
            <div className={styles.agendaDay} key={`${item.type}-${item.id}`}>
              <time dateTime={item.date}>{calendarDate(item.date)}</time>
              <CalendarEvent item={item} />
            </div>
          ))
        ) : (
          <p>No hay pagos programados en este mes.</p>
        )}
      </div>
    </div>
  )
}

function CalendarEvent({ item }: { item: Upcoming }) {
  return (
    <Link
      className={styles.calendarEvent}
      data-kind={item.type}
      data-overdue={item.status === 'OVERDUE'}
      to={upcomingResourcePath(item)}
      aria-label={`${upcomingTypeLabel(item.type)} ${item.name}, ${money(item.amount, item.currency)}, ${statusLabel[item.status] ?? item.status}`}
    >
      <span>{upcomingTypeLabel(item.type)}</span>
      <strong>{item.name}</strong>
      <b>{money(item.amount, item.currency)}</b>
      <small>{statusLabel[item.status] ?? item.status}</small>
    </Link>
  )
}
