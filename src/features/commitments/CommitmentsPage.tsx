import { useMemo, useState } from 'react'
import {
  ArrowDownLeft,
  ArrowUpRight,
  ChevronRight,
  CreditCard,
  HandCoins,
  Landmark,
  Plus,
  Repeat2,
  Search,
  UsersRound,
  type LucideIcon,
} from 'lucide-react'
import { useNavigate } from 'react-router'
import { ErrorState } from '@/components/feedback/ErrorState'
import { PageLoader } from '@/components/feedback/PageLoader'
import { Button, Input, PageHeader } from '@/components/ui'
import { useActiveWorkspace, usePermission } from '@/features/workspace'
import {
  useCards,
  useDebts,
  useObligations,
  useSummary,
} from '@/features/liabilities/hooks'
import { useLendingSummary, useLoans } from '@/features/lending/hooks'
import {
  usePersonalBalances,
  usePersonalBalancesSummary,
} from '@/features/personal-balances/hooks'
import styles from './commitments.module.css'

type DirectionFilter = 'all' | 'payable' | 'receivable'
type ItemKind =
  | 'credit'
  | 'card'
  | 'recurring'
  | 'loan'
  | 'personal-payable'
  | 'personal-receivable'

type CommitmentItem = {
  id: string
  kind: ItemKind
  direction: Exclude<DirectionFilter, 'all'>
  title: string
  subtitle: string
  amount: number
  currency: string
  dueDate: string | null
  status: string
  href: string
  icon: LucideIcon
}

const debtQuery = new URLSearchParams({
  page: '1',
  limit: '25',
  sort: 'nextDueDate',
  order: 'asc',
}).toString()

const kindLabel: Record<ItemKind, string> = {
  credit: 'Crédito',
  card: 'Tarjeta',
  recurring: 'Pago recurrente',
  loan: 'Préstamo',
  'personal-payable': 'Deuda personal',
  'personal-receivable': 'Cobro personal',
}

const safeNumber = (value: string | number | null | undefined) => {
  const parsed = Number(value ?? 0)
  return Number.isFinite(parsed) ? parsed : 0
}

const money = (value: number, currency: string) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(value)

const shortDate = (value: string | null) => {
  if (!value) return 'Sin fecha definida'
  const normalized = value.slice(0, 10)
  const parsed = new Date(`${normalized}T12:00:00`)
  if (Number.isNaN(parsed.getTime())) return 'Sin fecha definida'
  return new Intl.DateTimeFormat('es-CO', {
    day: 'numeric',
    month: 'short',
  }).format(parsed)
}

const daysUntil = (value: string | null) => {
  if (!value) return null
  const normalized = value.slice(0, 10)
  const target = new Date(`${normalized}T12:00:00`)
  if (Number.isNaN(target.getTime())) return null
  const today = new Date()
  today.setHours(12, 0, 0, 0)
  return Math.ceil((target.getTime() - today.getTime()) / 86_400_000)
}

function SummaryMetric({
  label,
  value,
  detail,
  tone,
}: {
  label: string
  value: string
  detail: string
  tone?: 'positive' | 'negative' | 'neutral'
}) {
  return (
    <article className={styles.metric} data-tone={tone ?? 'neutral'}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  )
}

function CommitmentCard({
  item,
  onOpen,
}: {
  item: CommitmentItem
  onOpen: () => void
}) {
  const remaining = daysUntil(item.dueDate)
  const dueText =
    remaining === null
      ? 'Sin fecha definida'
      : remaining < 0
        ? `Vencido hace ${Math.abs(remaining)} d`
        : remaining === 0
          ? 'Vence hoy'
          : remaining === 1
            ? 'Vence mañana'
            : `En ${remaining} días`

  return (
    <button type="button" className={styles.itemCard} onClick={onOpen}>
      <span className={styles.itemIcon} data-direction={item.direction}>
        <item.icon size={19} aria-hidden="true" />
      </span>
      <span className={styles.itemBody}>
        <span className={styles.itemTopline}>
          <strong>{item.title}</strong>
          <span className={styles.kindPill}>{kindLabel[item.kind]}</span>
        </span>
        <span className={styles.itemSubtitle}>{item.subtitle}</span>
        <span className={styles.itemMeta}>
          <span>{shortDate(item.dueDate)}</span>
          <span aria-hidden="true">·</span>
          <span>{dueText}</span>
          {item.status ? (
            <>
              <span aria-hidden="true">·</span>
              <span>{item.status}</span>
            </>
          ) : null}
        </span>
      </span>
      <span className={styles.itemAmount} data-direction={item.direction}>
        <strong>{money(item.amount, item.currency)}</strong>
        <small>{item.direction === 'payable' ? 'Por pagar' : 'Por cobrar'}</small>
      </span>
      <ChevronRight className={styles.chevron} size={18} aria-hidden="true" />
    </button>
  )
}

export function CommitmentsPage() {
  const { activeWorkspace } = useActiveWorkspace()
  const workspaceId = activeWorkspace!.id
  const currency = activeWorkspace!.baseCurrency
  const canWrite = usePermission('debts.write')
  const navigate = useNavigate()
  const [direction, setDirection] = useState<DirectionFilter>('all')
  const [search, setSearch] = useState('')

  const liabilitiesSummary = useSummary(workspaceId)
  const debts = useDebts(workspaceId, debtQuery)
  const cards = useCards(workspaceId)
  const obligations = useObligations(workspaceId)
  const lendingSummary = useLendingSummary(workspaceId)
  const loans = useLoans(workspaceId, { status: 'ALL' })
  const personalSummary = usePersonalBalancesSummary(workspaceId)
  const personalBalances = usePersonalBalances(workspaceId, {})

  const queries = [
    liabilitiesSummary,
    debts,
    cards,
    obligations,
    lendingSummary,
    loans,
    personalSummary,
    personalBalances,
  ]
  const allPending = queries.every((query) => query.isPending)
  const allFailed = queries.every((query) => query.isError)
  const failedCount = queries.filter((query) => query.isError).length

  const items = useMemo<CommitmentItem[]>(() => {
    const result: CommitmentItem[] = []

    debts.data?.items
      .filter((debt) => !['PAID', 'CANCELLED'].includes(debt.status))
      .forEach((debt) => {
        result.push({
          id: `credit-${debt.id}`,
          kind: 'credit',
          direction: 'payable',
          title: debt.name,
          subtitle: debt.lenderName || debt.institutionName || 'Crédito registrado',
          amount: safeNumber(debt.currentBalance),
          currency: debt.currency,
          dueDate: debt.nextDueDate,
          status: debt.status === 'ACTIVE' ? 'Activo' : debt.status,
          href: `/app/debts/${debt.id}`,
          icon: Landmark,
        })
      })

    cards.data?.forEach((card) => {
      if (safeNumber(card.currentBalance) <= 0 && !card.nextPayment) return
      result.push({
        id: `card-${card.id}`,
        kind: 'card',
        direction: 'payable',
        title: card.name,
        subtitle: card.institutionName || 'Tarjeta de crédito',
        amount: safeNumber(card.nextPayment?.amount ?? card.currentBalance),
        currency: card.currency,
        dueDate: card.nextPaymentDate,
        status: card.nextPayment?.source === 'ESTIMATED' ? 'Estimado' : '',
        href: `/app/debts/cards/${card.id}`,
        icon: CreditCard,
      })
    })

    obligations.data
      ?.filter((obligation) => obligation.status === 'ACTIVE')
      .forEach((obligation) => {
        result.push({
          id: `recurring-${obligation.id}`,
          kind: 'recurring',
          direction: 'payable',
          title: obligation.name,
          subtitle: obligation.description || 'Pago recurrente',
          amount: safeNumber(obligation.expectedAmount),
          currency: obligation.currency,
          dueDate: obligation.recurrenceRules.nextRunAt,
          status: obligation.amountType === 'VARIABLE' ? 'Monto variable' : 'Monto fijo',
          href: `/app/debts/obligations/${obligation.id}`,
          icon: Repeat2,
        })
      })

    loans.data
      ?.filter((loan) => loan.status === 'ACTIVE' || loan.status === 'OVERDUE')
      .forEach((loan) => {
        result.push({
          id: `loan-${loan.id}`,
          kind: 'loan',
          direction: 'receivable',
          title: loan.personName,
          subtitle: 'Préstamo con intereses',
          amount: safeNumber(loan.currentPrincipal),
          currency: loan.currency,
          dueDate: loan.nextDueDate,
          status: loan.status === 'OVERDUE' ? 'Vencido' : 'Activo',
          href: '/app/lending',
          icon: HandCoins,
        })
      })

    personalBalances.data
      ?.filter((balance) => !['SETTLED', 'CANCELLED'].includes(balance.status))
      .forEach((balance) => {
        const payable = balance.direction === 'PAYABLE'
        result.push({
          id: `personal-${balance.id}`,
          kind: payable ? 'personal-payable' : 'personal-receivable',
          direction: payable ? 'payable' : 'receivable',
          title: balance.counterpartyName,
          subtitle: balance.description || (payable ? 'Deuda con persona' : 'Cobro a persona'),
          amount: safeNumber(balance.currentBalance),
          currency: balance.currency,
          dueDate: balance.dueOn,
          status: balance.status === 'PARTIAL' ? 'Pago parcial' : 'Pendiente',
          href: '/app/personal-balances',
          icon: UsersRound,
        })
      })

    return result.sort((first, second) => {
      if (!first.dueDate && !second.dueDate) return first.title.localeCompare(second.title)
      if (!first.dueDate) return 1
      if (!second.dueDate) return -1
      return first.dueDate.localeCompare(second.dueDate)
    })
  }, [cards.data, debts.data, loans.data, obligations.data, personalBalances.data])

  const baseLiability = liabilitiesSummary.data?.summariesByCurrency.find(
    (row) => row.currency === currency,
  )
  const baseLending = lendingSummary.data?.currencies.find(
    (row) => row.currency === currency,
  )
  const basePersonal = personalSummary.data?.currencies.find(
    (row) => row.currency === currency,
  )
  const payable = safeNumber(baseLiability?.totalDebt) + safeNumber(basePersonal?.iOwe)
  const receivable = safeNumber(baseLending?.principalPending) + safeNumber(basePersonal?.owedToMe)
  const net = receivable - payable
  const monthly = safeNumber(baseLiability?.monthlyCommitments)

  const normalizedSearch = search.trim().toLocaleLowerCase('es')
  const visibleItems = items.filter((item) => {
    const matchesDirection = direction === 'all' || item.direction === direction
    const matchesSearch =
      !normalizedSearch ||
      `${item.title} ${item.subtitle} ${kindLabel[item.kind]}`
        .toLocaleLowerCase('es')
        .includes(normalizedSearch)
    return matchesDirection && matchesSearch
  })

  const nextItem = items.find((item) => item.dueDate)

  if (allPending) return <PageLoader />
  if (allFailed)
    return (
      <ErrorState
        title="No pudimos cargar tus créditos y deudas"
        message="Los módulos financieros no respondieron. Comprueba la conexión e inténtalo de nuevo."
        onRetry={() => queries.forEach((query) => void query.refetch())}
      />
    )

  return (
    <div className={styles.page}>
      <PageHeader
        title="Créditos, deudas y cobros"
        description="Todo lo que debes y todo lo que te deben, organizado en una sola vista."
        actions={
          canWrite ? (
            <Button onClick={() => navigate('/app/debts?tab=debts')}>
              <Plus size={17} aria-hidden="true" /> Registrar
            </Button>
          ) : undefined
        }
      />

      {failedCount > 0 ? (
        <div className={styles.partialWarning} role="status">
          Parte de la información no pudo actualizarse. La vista conserva los datos disponibles.
          <button type="button" onClick={() => queries.forEach((query) => void query.refetch())}>
            Reintentar
          </button>
        </div>
      ) : null}

      <section className={styles.manageSection} aria-label="Accesos rápidos a herramientas">
        <div>
          <h2>Herramientas</h2>
          <p>Accesos rápidos a cada módulo para entrar sin recorrer toda la página.</p>
        </div>
        <div className={styles.manageGrid}>
          <button type="button" onClick={() => navigate('/app/debts')}>
            <CreditCard size={18} aria-hidden="true" />
            <span><strong>Créditos y pagos</strong><small>Créditos, tarjetas y pagos recurrentes</small></span>
            <ChevronRight size={17} aria-hidden="true" />
          </button>
          <button type="button" onClick={() => navigate('/app/lending')}>
            <HandCoins size={18} aria-hidden="true" />
            <span><strong>Préstamos</strong><small>Simulador, intereses y cobro de cuotas</small></span>
            <ChevronRight size={17} aria-hidden="true" />
          </button>
          <button type="button" onClick={() => navigate('/app/personal-balances')}>
            <UsersRound size={18} aria-hidden="true" />
            <span><strong>Préstamos informales</strong><small>Deudas y cobros entre personas, sin cuotas ni intereses</small></span>
            <ChevronRight size={17} aria-hidden="true" />
          </button>
        </div>
      </section>

      <section className={styles.hero} aria-label="Posición de créditos y deudas">
        <div className={styles.heroCopy}>
          <span className={styles.eyebrow}>Tu posición</span>
          <h2>{net >= 0 ? 'Tienes más por cobrar que por pagar' : 'Tienes más por pagar que por cobrar'}</h2>
          <p>
            El balance neto en {currency} es <strong>{money(Math.abs(net), currency)}</strong>{' '}
            {net >= 0 ? 'a tu favor.' : 'por cubrir.'}
          </p>
        </div>
        {nextItem ? (
          <button type="button" className={styles.nextDue} onClick={() => navigate(nextItem.href)}>
            <span>Lo siguiente</span>
            <strong>{nextItem.title}</strong>
            <small>
              {shortDate(nextItem.dueDate)} · {money(nextItem.amount, nextItem.currency)}
            </small>
            <ChevronRight size={18} aria-hidden="true" />
          </button>
        ) : (
          <div className={styles.nextDueEmpty}>
            <span>Lo siguiente</span>
            <strong>Sin vencimientos próximos</strong>
            <small>Cuando registres compromisos aparecerán aquí.</small>
          </div>
        )}
      </section>

      <section className={styles.metrics} aria-label={`Resumen en ${currency}`}>
        <SummaryMetric
          label="Por pagar"
          value={money(payable, currency)}
          detail="Créditos, tarjetas y deudas personales"
          tone="negative"
        />
        <SummaryMetric
          label="Por cobrar"
          value={money(receivable, currency)}
          detail="Préstamos y cobros personales"
          tone="positive"
        />
        <SummaryMetric
          label="Compromisos del mes"
          value={money(monthly, currency)}
          detail="Cuotas y pagos programados"
        />
      </section>

      <section className={styles.workspace}>
        <div className={styles.workspaceHeader}>
          <div>
            <h2>Movimientos pendientes</h2>
            <p>Sin separar tu dinero por módulo: primero ves qué requiere atención.</p>
          </div>
          <div className={styles.directionFilters} role="group" aria-label="Filtrar por dirección">
            <button
              type="button"
              aria-pressed={direction === 'all'}
              onClick={() => setDirection('all')}
            >
              Todos
            </button>
            <button
              type="button"
              aria-pressed={direction === 'payable'}
              onClick={() => setDirection('payable')}
            >
              <ArrowUpRight size={15} aria-hidden="true" /> Por pagar
            </button>
            <button
              type="button"
              aria-pressed={direction === 'receivable'}
              onClick={() => setDirection('receivable')}
            >
              <ArrowDownLeft size={15} aria-hidden="true" /> Por cobrar
            </button>
          </div>
        </div>

        <label className={styles.searchBox}>
          <Search size={17} aria-hidden="true" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar persona, crédito, tarjeta o pago…"
            aria-label="Buscar en créditos, deudas y cobros"
          />
        </label>

        {visibleItems.length ? (
          <div className={styles.itemList}>
            {visibleItems.map((item) => (
              <CommitmentCard
                key={item.id}
                item={item}
                onOpen={() => navigate(item.href)}
              />
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <strong>No hay elementos para este filtro.</strong>
            <span>Prueba otra búsqueda o cambia entre por pagar y por cobrar.</span>
          </div>
        )}
      </section>
    </div>
  )
}
