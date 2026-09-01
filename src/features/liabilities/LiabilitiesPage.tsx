import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { PageLoader } from '@/components/feedback/PageLoader'
import {
  Badge,
  Button,
  Card,
  ConfirmDeleteDialog,
  CurrencyCombobox,
  Dialog,
  Dropdown,
  DropdownAction,
  FormField,
  Input,
  MoneyInput,
  Select,
  Textarea,
} from '@/components/ui'
import { useActiveWorkspace, usePermission } from '@/features/workspace'
import { ApiError } from '@/services/http/httpErrors'
import { zodResolver } from '@hookform/resolvers/zod'
import { CreditCard, MoreHorizontal, Trash2 } from 'lucide-react'
import {
  useEffect,
  useState,
  type Dispatch,
  type ReactElement,
  type SetStateAction,
} from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Link, useSearchParams } from 'react-router'
import { liabilitiesApi } from './api'
import { cardPayloadFromFormData } from './card-form.utils'
import {
  debtCreatePayload,
  debtEstimatePayload,
  decimalRateToPercent,
} from './credit-form.utils'
import { MutationActions } from './DetailPages'
import {
  calendarDate,
  frequencyLabel,
  money,
  shortCalendarDate,
  statusLabel,
  statusTone,
  upcomingResourcePath,
} from './format'
import {
  useCards,
  useCreateDebt,
  useCreateObligation,
  useDebts,
  useLiabilityMutation,
  useObligations,
  useSummary,
  useUpcoming,
} from './hooks'
import styles from './liabilities.module.css'
import { ModulePageHeader } from './ModulePageHeader'
import {
  debtSchema,
  obligationSchema,
  type DebtFormValues,
  type ObligationFormValues,
} from './schemas'
import type { CreditEstimation, ObligationInput } from './types'
import { UpcomingPaymentsView } from './UpcomingPaymentsView'
type Tab = 'summary' | 'debts' | 'cards' | 'obligations'
const tabs: { id: Tab; label: string }[] = [
  { id: 'summary', label: 'Resumen' },
  { id: 'debts', label: 'Créditos' },
  { id: 'cards', label: 'Tarjetas' },
  { id: 'obligations', label: 'Pagos recurrentes' },
]
const quality: Record<string, string> = {
  EXACT: 'Cálculo exacto',
  HIGH_ESTIMATE: 'Estimación alta',
  MEDIUM_ESTIMATE: 'Estimación aproximada',
  LOW_ESTIMATE: 'Estimación de baja confianza',
  INSUFFICIENT_DATA: 'Información insuficiente',
}
const estimationSource: Record<string, string> = {
  PROVIDED: 'Dato suministrado',
  CALCULATED: 'Dato calculado',
  ESTIMATED: 'Dato estimado',
  UNKNOWN: 'Dato desconocido',
}
const errorMessage = (e: unknown) =>
  e instanceof Error ? e.message : 'No fue posible completar la operación.'
export function LiabilitiesPage() {
  const { activeWorkspace: w } = useActiveWorkspace()
  const canWrite = usePermission('debts.write')
  const [params, setParams] = useSearchParams()
  const tab = (
    tabs.some((x) => x.id === params.get('tab')) ? params.get('tab') : 'summary'
  ) as Tab
  const [modal, setModal] = useState<'debt' | 'obligation' | 'card' | null>(
    null,
  )
  const [draftVersions, setDraftVersions] = useState({
    debt: 0,
    obligation: 0,
    card: 0,
  })
  const [showArchivedObligations, setShowArchivedObligations] = useState(false)
  const [deleting, setDeleting] = useState<{
    kind: 'debt' | 'card' | 'obligation'
    id: string
    name: string
  } | null>(null)
  const [debtFilters, setDebtFilters] = useState({
    search: '',
    status: '',
    type: '',
    currency: '',
    page: 1,
  })
  const debtQuery = new URLSearchParams({
    page: String(debtFilters.page),
    limit: '25',
    sort: 'nextDueDate',
    order: 'asc',
    ...(debtFilters.search ? { search: debtFilters.search } : {}),
    ...(debtFilters.status ? { status: debtFilters.status } : {}),
    ...(debtFilters.type ? { type: debtFilters.type } : {}),
    ...(debtFilters.currency ? { currency: debtFilters.currency } : {}),
  }).toString()
  const summary = useSummary(w!.id),
    upcoming = useUpcoming(w!.id),
    debts = useDebts(w!.id, debtQuery),
    obligations = useObligations(w!.id, showArchivedObligations),
    cards = useCards(w!.id)
  const selectedObligation = params.get('obligation')
  useEffect(() => {
    if (tab !== 'obligations' || obligations.isPending) return
    const target = selectedObligation
      ? document.getElementById(`obligation-${selectedObligation}`)
      : null
    target?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    target?.focus({ preventScroll: true })
  }, [tab, selectedObligation, obligations.isPending])
  const remove = useLiabilityMutation(
    w!.id,
    (target: NonNullable<typeof deleting>) =>
      target.kind === 'debt'
        ? liabilitiesApi.deleteDebt(w!.id, target.id)
        : target.kind === 'card'
          ? liabilitiesApi.deleteCard(w!.id, target.id)
          : liabilitiesApi.deleteObligation(w!.id, target.id),
  )
  const updateObligationStatus = useLiabilityMutation(
    w!.id,
    ({ id, status }: { id: string; status: 'ACTIVE' | 'PAUSED' }) =>
      liabilitiesApi.updateObligation(w!.id, id, { status }),
  )
  const restoreObligation = useLiabilityMutation(w!.id, (id: string) =>
    liabilitiesApi.restoreObligation(w!.id, id),
  )
  const closeModal = (consumed = false) => {
    if (consumed && modal)
      setDraftVersions((current) => ({
        ...current,
        [modal]: current[modal] + 1,
      }))
    setModal(null)
  }
  return (
    <div className={styles.page}>
      <ModulePageHeader
        title="Créditos y pagos"
        actions={
          canWrite ? (
            <Button
              onClick={() =>
                setModal(
                  tab === 'obligations'
                    ? 'obligation'
                    : tab === 'cards'
                      ? 'card'
                      : 'debt',
                )
              }
            >
              {tab === 'obligations'
                ? 'Nueva obligación'
                : tab === 'cards'
                  ? 'Nueva tarjeta'
                  : 'Nuevo crédito'}
            </Button>
          ) : undefined
        }
      />
      <div
        className={styles.tabs}
        role="tablist"
        aria-label="Secciones de créditos y pagos"
      >
        {tabs.map((x) => (
          <button
            key={x.id}
            role="tab"
            aria-selected={tab === x.id}
            className={tab === x.id ? styles.activeTab : ''}
            onClick={() => setParams(x.id === 'summary' ? {} : { tab: x.id })}
          >
            {x.label}
          </button>
        ))}
      </div>
      {tab === 'summary' && (
        <>
          {summary.isPending ? (
            <PageLoader />
          ) : summary.isError ? (
            <ErrorState
              title="No pudimos cargar el resumen"
              message={errorMessage(summary.error)}
              onRetry={() => void summary.refetch()}
            />
          ) : (
            <Summary data={summary.data!} />
          )}
          {upcoming.isPending ? (
            <PageLoader />
          ) : upcoming.isError ? (
            <ErrorState
              title="No pudimos cargar los próximos pagos"
              message={errorMessage(upcoming.error)}
              onRetry={() => void upcoming.refetch()}
            />
          ) : (
            <UpcomingPayments upcoming={upcoming.data!} workspaceId={w!.id} timezone={w!.timezone} />
          )}
        </>
      )}{' '}
      {tab === 'debts' &&
        (debts.isPending ? (
          <PageLoader />
        ) : debts.isError ? (
          <ErrorState
            title="No pudimos cargar los créditos"
            message={errorMessage(debts.error)}
            onRetry={() => void debts.refetch()}
          />
        ) : (
          <Debts
            items={debts.data!.items}
            page={debts.data!.page}
            totalPages={debts.data!.totalPages}
            filters={debtFilters}
            onFilters={setDebtFilters}
            canWrite={canWrite}
            onCreate={() => setModal('debt')}
            onDelete={(id, name) => setDeleting({ kind: 'debt', id, name })}
          />
        ))}{' '}
      {tab === 'cards' &&
        (cards.isPending ? (
          <PageLoader />
        ) : cards.isError ? (
          <ErrorState
            title="No pudimos cargar las tarjetas"
            message={errorMessage(cards.error)}
            onRetry={() => void cards.refetch()}
          />
        ) : (
          <Cards
            items={cards.data!}
            canWrite={canWrite}
            onCreate={() => setModal('card')}
            onDelete={(id, name) => setDeleting({ kind: 'card', id, name })}
          />
        ))}{' '}
      {tab === 'obligations' &&
        (<>
          <div className={styles.tabs} aria-label="Estado de pagos recurrentes">
            <button
              type="button"
              className={!showArchivedObligations ? styles.activeTab : ''}
              aria-pressed={!showArchivedObligations}
              onClick={() => setShowArchivedObligations(false)}
            >
              Activos
            </button>
            <button
              type="button"
              className={showArchivedObligations ? styles.activeTab : ''}
              aria-pressed={showArchivedObligations}
              onClick={() => setShowArchivedObligations(true)}
            >
              Archivados
            </button>
          </div>
        {obligations.isPending ? (
          <PageLoader />
        ) : obligations.isError ? (
          <ErrorState
            title="No pudimos cargar los pagos recurrentes"
            message={errorMessage(obligations.error)}
            onRetry={() => void obligations.refetch()}
          />
        ) : (
          <Obligations
            items={obligations.data!}
            canWrite={canWrite}
            onCreate={() => setModal('obligation')}
            onDelete={(id, name) =>
              setDeleting({ kind: 'obligation', id, name })
            }
            onStatus={(id, status) =>
              updateObligationStatus.mutate({ id, status })
            }
            onRestore={(id) => restoreObligation.mutate(id)}
            archived={showArchivedObligations}
          />
        )}</>)}
      <Dialog
        open={modal === 'card'}
        title="Nueva tarjeta"
        onClose={() => closeModal()}
      >
        <CardForm
          key={`card-${draftVersions.card}`}
          workspaceId={w!.id}
          currency={w!.baseCurrency}
          close={closeModal}
        />
      </Dialog>
      <ConfirmDeleteDialog
        open={Boolean(deleting)}
        title={
          deleting?.kind === 'obligation'
            ? 'Archivar pago recurrente'
            : deleting?.kind === 'debt'
              ? 'Archivar crédito'
              : 'Eliminar tarjeta'
        }
        name={deleting?.name ?? ''}
        confirmLabel={deleting?.kind === 'card' ? 'Eliminar' : 'Archivar'}
        question={
          deleting?.kind !== 'card' ? '¿Quieres archivar' : undefined
        }
        description={
          deleting?.kind === 'obligation'
            ? 'Esta obligación dejará de aparecer en próximos pagos, resumen y calendario futuro. Su historial se conservará.'
            : deleting?.kind === 'debt'
              ? 'El crédito dejará de aparecer entre los activos. Su cronograma, pagos, movimientos e historial se conservarán.'
              : undefined
        }
        pending={remove.isPending}
        error={remove.error ? errorMessage(remove.error) : undefined}
        onClose={() => {
          remove.reset()
          setDeleting(null)
        }}
        onConfirm={() =>
          deleting &&
          remove.mutate(deleting, { onSuccess: () => setDeleting(null) })
        }
      />
      <Dialog
        open={modal === 'debt'}
        title="Registrar crédito"
        size="wide"
        onClose={() => closeModal()}
      >
        <DebtForm
          key={`debt-${draftVersions.debt}`}
          workspaceId={w!.id}
          currency={w!.baseCurrency}
          close={closeModal}
        />
      </Dialog>
      <Dialog
        open={modal === 'obligation'}
        title="Nueva obligación"
        onClose={() => closeModal()}
      >
        <ObligationForm
          key={`obligation-${draftVersions.obligation}`}
          workspaceId={w!.id}
          currency={w!.baseCurrency}
          close={closeModal}
        />
      </Dialog>
    </div>
  )
}
function Summary({
  data,
}: {
  data: NonNullable<ReturnType<typeof useSummary>['data']>
}) {
  return (
    <>
      {data.summariesByCurrency.map((summary) => (
        <div
          className={styles.metrics}
          key={summary.currency}
          aria-label={`Resumen en ${summary.currency}`}
        >
          <Metric
            label={`Total pendiente · ${summary.currency}`}
            value={money(summary.totalDebt, summary.currency)}
          />
          <Metric
            label="Compromisos del mes"
            value={money(summary.monthlyCommitments, summary.currency)}
          />
          <Metric
            label="Monto vencido"
            value={money(summary.overdueAmount, summary.currency)}
          />
        </div>
      ))}
      <div className={styles.metrics}>
        <Metric
          label="Próximo pago"
          value={
            data.nextPayment
              ? money(data.nextPayment.amount, data.nextPayment.currency)
              : 'Sin próximos pagos'
          }
          detail={data.nextPayment?.name}
          to={
            data.nextPayment
              ? upcomingResourcePath(data.nextPayment)
              : undefined
          }
        />
      </div>
    </>
  )
}
function UpcomingPayments({
  upcoming,
  workspaceId,
  timezone,
}: {
  upcoming: NonNullable<ReturnType<typeof useUpcoming>['data']>
  workspaceId: string
  timezone: string
}) {
  return <UpcomingPaymentsView upcoming={upcoming} workspaceId={workspaceId} timezone={timezone} />
}
function Metric({
  label,
  value,
  detail,
  to,
}: {
  label: string
  value: string
  detail?: string
  to?: string
}) {
  const content = (
    <Card className={styles.metric}>
      <span>{label}</span>
      <strong>{value}</strong>
      {detail && <small>{detail}</small>}
    </Card>
  )
  return to ? (
    <Link className={styles.metricLink} to={to}>
      {content}
    </Link>
  ) : (
    content
  )
}
function Debts({
  items,
  page,
  totalPages,
  filters,
  onFilters,
  canWrite,
  onCreate,
  onDelete,
}: {
  items: NonNullable<ReturnType<typeof useDebts>['data']>['items']
  page: number
  totalPages: number
  filters: {
    search: string
    status: string
    type: string
    currency: string
    page: number
  }
  onFilters: Dispatch<SetStateAction<typeof filters>>
  canWrite: boolean
  onCreate: () => void
  onDelete: (id: string, name: string) => void
}) {
  return (
    <>
      <div className={styles.filters} aria-label="Filtros de créditos">
        <Input
          aria-label="Buscar créditos"
          placeholder="Buscar por nombre o entidad"
          value={filters.search}
          onChange={(event) =>
            onFilters((current) => ({
              ...current,
              search: event.target.value,
              page: 1,
            }))
          }
        />
        <Select
          aria-label="Estado"
          value={filters.status}
          onChange={(event) =>
            onFilters((current) => ({
              ...current,
              status: event.target.value,
              page: 1,
            }))
          }
        >
          <option value="">Todos los estados</option>
          <option value="ACTIVE">Activos</option>
          <option value="PAID">Pagados</option>
          <option value="PAUSED">Pausados</option>
          <option value="DEFAULTED">En mora</option>
        </Select>
        <Select
          aria-label="Tipo"
          value={filters.type}
          onChange={(event) =>
            onFilters((current) => ({
              ...current,
              type: event.target.value,
              page: 1,
            }))
          }
        >
          <option value="">Todos los tipos</option>
          <option value="PERSONAL_LOAN">Personal</option>
          <option value="BANK_LOAN">Bancario</option>
          <option value="MORTGAGE">Hipotecario</option>
          <option value="VEHICLE_LOAN">Vehículo</option>
          <option value="OTHER">Otro</option>
        </Select>
        <Input
          aria-label="Moneda"
          placeholder="COP, USD…"
          maxLength={3}
          value={filters.currency}
          onChange={(event) =>
            onFilters((current) => ({
              ...current,
              currency: event.target.value.toUpperCase(),
              page: 1,
            }))
          }
        />
      </div>
      {items.length ? (
        <div className={styles.grid}>
          {items.map((d) => {
            const progress =
              Number(d.originalAmount) > 0
                ? Math.max(
                  0,
                  Math.min(
                    100,
                    (1 -
                      Number(d.currentBalance) / Number(d.originalAmount)) *
                    100,
                  ),
                )
                : 0
            return (
              <Card className={styles.resource} key={d.id}>
                <div className={styles.cardHead}>
                  <div>
                    <h2>{d.name}</h2>
                    <small>{d.lenderName || 'Entidad no informada'}</small>
                  </div>
                  <Badge tone={statusTone(d.status)}>
                    {statusLabel[d.status]}
                  </Badge>
                </div>
                <strong className={styles.hero}>
                  {money(d.currentBalance, d.currency)}
                </strong>
                <span>de {money(d.originalAmount, d.currency)}</span>
                <progress
                  max="100"
                  value={progress}
                  aria-label={`${progress.toFixed(0)}% pagado`}
                />
                <dl>
                  <div>
                    <dt>Próxima cuota</dt>
                    <dd>{money(d.installmentAmount, d.currency)}</dd>
                  </div>
                  <div>
                    <dt>Tasa</dt>
                    <dd>{decimalRateToPercent(d.interestRate)}</dd>
                  </div>
                  <div>
                    <dt>Próximo pago</dt>
                    <dd>{calendarDate(d.nextDueDate)}</dd>
                  </div>
                </dl>
                <div className={styles.obligationActions}>
                  <Link to={`/app/debts/${d.id}`}>Ver detalle y cronograma</Link>
                  {canWrite && (
                    <Dropdown
                      label={`Acciones de ${d.name}`}
                      trigger={<MoreHorizontal aria-hidden="true" />}
                    >
                      <Link to={`/app/debts/${d.id}?action=reconcile`}>
                        Conciliar
                      </Link>
                      <Button
                        variant="danger"
                        size="small"
                        onClick={() => onDelete(d.id, d.name)}
                      >
                        Archivar
                      </Button>
                    </Dropdown>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      ) : (
        <EmptyState
          title="Aún no tienes créditos registrados"
          message="Registra uno para llevar el control de cuotas, pagos y saldo pendiente."
          action={
            canWrite ? (
              <Button onClick={onCreate}>Registrar crédito</Button>
            ) : undefined
          }
        />
      )}
      {totalPages > 1 && (
        <nav className={styles.pagination} aria-label="Paginación de créditos">
          <Button
            variant="secondary"
            disabled={page <= 1}
            onClick={() =>
              onFilters((current) => ({ ...current, page: current.page - 1 }))
            }
          >
            Anterior
          </Button>
          <span>
            Página {page} de {totalPages}
          </span>
          <Button
            variant="secondary"
            disabled={page >= totalPages}
            onClick={() =>
              onFilters((current) => ({ ...current, page: current.page + 1 }))
            }
          >
            Siguiente
          </Button>
        </nav>
      )}
    </>
  )
}
function Cards({
  items,
  canWrite,
  onCreate,
  onDelete,
}: {
  items: NonNullable<ReturnType<typeof useCards>['data']>
  canWrite: boolean
  onCreate: () => void
  onDelete: (id: string, name: string) => void
}) {
  return items.length ? (
    <div className={styles.grid}>
      {items.map((c) => (
        <Card className={styles.resource} key={c.id}>
          <div className={styles.cardHead}>
            <h2>
              <CreditCard size={20} aria-hidden="true" /> {c.name}
            </h2>
            <Badge>{c.currency}</Badge>
          </div>
          {c.nextPayment && (
            <div className={styles.cardPaymentPreview}>
              <span>
                {c.nextPayment.source === 'INFORMED'
                  ? 'Próximo pago informado'
                  : 'Saldo estimado del periodo'}
              </span>
              <strong>
                {c.nextPayment.source === 'ESTIMATED' && '≈ '}
                {money(c.nextPayment.amount, c.currency)}
              </strong>
              <small>Vence el {shortCalendarDate(c.nextPaymentDate)}</small>
              {c.nextPayment.source === 'ESTIMATED' && (
                <small>
                  Todavía no sabemos cuánto te cobrará el banco en el próximo
                  vencimiento.
                </small>
              )}
              {c.nextPayment.minimumPayment && (
                <small>
                  Pago mínimo {money(c.nextPayment.minimumPayment, c.currency)}
                </small>
              )}
            </div>
          )}
          <strong className={styles.hero}>
            {money(c.usedCredit, c.currency)}
          </strong>
          <span>utilizados de {money(c.creditLimit, c.currency)}</span>
          <progress
            max="100"
            value={Number(c.utilization)}
            aria-label={`${c.utilization}% utilizado`}
          />
          <dl>
            <div>
              <dt>Disponible</dt>
              <dd>{money(c.availableCredit, c.currency)}</dd>
            </div>
            <div>
              <dt>Próximo corte</dt>
              <dd>{shortCalendarDate(c.nextBillingDate)}</dd>
            </div>
            <div>
              <dt>Próximo pago</dt>
              <dd>{shortCalendarDate(c.nextPaymentDate)}</dd>
            </div>
          </dl>
          <div className={styles.cardQuickActions}>
            {canWrite && Number(c.currentBalance) > 0 && (
              <Link
                className={styles.quickActionPrimary}
                to={`/app/debts/cards/${c.id}?action=pay-month`}
              >
                Pagar mes
              </Link>
            )}
            {canWrite && Number(c.availableCredit) > 0 && (
              <Link
                className={styles.quickActionSecondary}
                to={`/app/debts/cards/${c.id}?action=advance`}
              >
                Registrar adelanto
              </Link>
            )}
            <Link
              className={styles.quickActionSecondary}
              to={`/app/debts/cards/${c.id}`}
            >
              Ver más información
            </Link>
            {canWrite && (
              <Link
                className={styles.quickActionSecondary}
                to={`/app/debts/cards/${c.id}?action=next-payment`}
              >
                Actualizar próximo pago
              </Link>
            )}
            <Dropdown
              label={`Acciones de ${c.name}`}
              trigger={<MoreHorizontal aria-hidden="true" />}
            >
              <Link to={`/app/debts/cards/${c.id}`}>Ver más información</Link>
              {canWrite && Number(c.availableCredit) > 0 && (
                <Link to={`/app/debts/cards/${c.id}?action=advance`}>
                  Registrar adelanto
                </Link>
              )}
              {canWrite && (
                <Link to={`/app/debts/cards/${c.id}?action=contribution`}>
                  Abonar
                </Link>
              )}
              {canWrite && (
                <Link to={`/app/debts/cards/${c.id}?action=next-payment`}>
                  Actualizar próximo pago
                </Link>
              )}
              {canWrite && (
                <Button
                  variant="danger"
                  size="small"
                  onClick={() => onDelete(c.id, c.name)}
                >
                  <Trash2 size={16} aria-hidden="true" /> Eliminar tarjeta
                </Button>
              )}
            </Dropdown>
          </div>
        </Card>
      ))}
    </div>
  ) : (
    <EmptyState
      title="No tienes tarjetas registradas"
      message="Crea una cuenta de tipo tarjeta de crédito para administrar compras y extractos."
      action={<Button onClick={onCreate}>Nueva tarjeta</Button>}
    />
  )
}
function CardForm({
  workspaceId,
  currency,
  close,
}: {
  workspaceId: string
  currency: string
  close: (consumed?: boolean) => void
}) {
  const mutate = useLiabilityMutation(
    workspaceId,
    (input: Record<string, unknown>) =>
      liabilitiesApi.createCard(workspaceId, input),
  )
  const [basis, setBasis] = useState<'available' | 'used'>('available')
  const [billingDay, setBillingDay] = useState('')
  const [paymentDueDay, setPaymentDueDay] = useState('')
  const previewDay = (value: string) => {
    const requested = Number(value)
    if (!requested) return null
    const now = new Date()
    let year = now.getFullYear()
    let month = now.getMonth()
    const dayInMonth = (targetYear: number, targetMonth: number) =>
      Math.min(requested, new Date(targetYear, targetMonth + 1, 0).getDate())
    let date = new Date(year, month, dayInMonth(year, month))
    if (date < new Date(year, month, now.getDate())) {
      month += 1
      if (month > 11) {
        month = 0
        year += 1
      }
      date = new Date(year, month, dayInMonth(year, month))
    }
    return new Intl.DateTimeFormat('es-CO', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date)
  }
  return (
    <form
      className={styles.form}
      onSubmit={(event) => {
        event.preventDefault()
        const data = new FormData(event.currentTarget)
        mutate.mutate(cardPayloadFromFormData(data, basis), {
          onSuccess: () => close(true),
        })
      }}
    >
      <h3>Datos básicos</h3>
      <Field label="Nombre de la tarjeta" id="card-name">
        <Input id="card-name" name="name" placeholder="Ej. Visa principal" required />
      </Field>
      <Field label="Entidad o banco" id="card-bank">
        <Input id="card-bank" name="institutionName" placeholder="Ej. Banco de Bogotá" />
      </Field>
      <Field label="Moneda" id="card-currency">
        <CurrencyCombobox
          id="card-currency"
          name="currency"
          defaultValue={currency}
        />
      </Field>
      <h3>Cupo</h3>
      <Field label="Cupo total" id="card-limit">
        <MoneyInput id="card-limit" name="creditLimit" placeholder="Ej. 5.000.000" minorUnits required />
      </Field>
      <Select
        aria-label="Dato de cupo conocido"
        value={basis}
        onChange={(e) => setBasis(e.target.value as typeof basis)}
      >
        <option value="available">Conozco el disponible</option>
        <option value="used">Conozco el utilizado</option>
      </Select>
      <Field
        label={
          basis === 'available'
            ? 'Cupo disponible actualmente'
            : 'Cupo utilizado actualmente'
        }
        id="card-balance"
      >
        <MoneyInput id="card-balance" name="balance" placeholder="Ej. 850.000" minorUnits required />
      </Field>
      <h3>Fechas</h3>
      <Field label="Día de corte" id="card-billing">
        <div>
          <Input
            id="card-billing"
            name="billingDay"
            type="number"
            min="1"
            max="31"
            value={billingDay}
            onChange={(event) => setBillingDay(event.target.value)}
          />
          <small>
            Si el mes tiene menos días, Fynar usa su último día válido.
          </small>
          {previewDay(billingDay) && (
            <small>Próximo corte: {previewDay(billingDay)}</small>
          )}
        </div>
      </Field>
      <Field label="Fecha máxima de pago" id="card-due">
        <div>
          <Input
            id="card-due"
            name="paymentDueDay"
            type="number"
            min="1"
            max="31"
            value={paymentDueDay}
            onChange={(event) => setPaymentDueDay(event.target.value)}
          />
          <small>
            Se aplica la misma regla para febrero y meses de 30 días.
          </small>
          {previewDay(paymentDueDay) && (
            <small>Próximo pago: {previewDay(paymentDueDay)}</small>
          )}
        </div>
      </Field>
      <label className={styles.checkboxCard}>
        <Input type="checkbox" name="currentCyclePaid" />
        <span>
          <strong>Ya pagué el período actual</strong>
          <small>
            El próximo pago se calculará para el siguiente ciclo válido.
          </small>
        </span>
      </label>
      <Field label="Tasa mensual de referencia (opcional)" id="card-rate">
        <div>
          <Input
            id="card-rate"
            name="referencePeriodicRate"
            inputMode="decimal"
            placeholder="Ej. 1.85"
            pattern="\d{1,3}(?:\.\d{1,7})?"
          />
          <small>
            Se usará como estimación cuando una compra no informe su propia
            tasa.
          </small>
        </div>
      </Field>
      <MutationActions mutation={mutate} close={close} label="Crear tarjeta" />
    </form>
  )
}
function Obligations({
  items,
  canWrite,
  onCreate,
  onDelete,
  onStatus,
  onRestore,
  archived,
}: {
  items: NonNullable<ReturnType<typeof useObligations>['data']>
  canWrite: boolean
  onCreate: () => void
  onDelete: (id: string, name: string) => void
  onStatus: (id: string, status: 'ACTIVE' | 'PAUSED') => void
  onRestore: (id: string) => void
  archived: boolean
}) {
  return items.length ? (
    <div className={styles.grid}>
      {items.map((o) => {
        const nextOccurrence = [...o.occurrences]
          .filter((occurrence) =>
            ['PENDING', 'PARTIAL', 'OVERDUE'].includes(occurrence.status),
          )
          .sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0]
        return (
          <Card
            className={styles.resource}
            key={o.id}
            id={`obligation-${o.id}`}
            tabIndex={-1}
          >
            <div className={styles.cardHead}>
              <h2>{o.name}</h2>
              <Badge tone={statusTone(o.status)}>
                {statusLabel[o.status] ?? o.status}
              </Badge>
            </div>
            <strong className={styles.hero}>
              {money(o.expectedAmount, o.currency)}
            </strong>
            <span>
              {o.amountType === 'VARIABLE'
                ? 'Monto esperado, cada periodo puede variar'
                : 'Monto esperado por periodo'}
            </span>
            <dl>
              <div>
                <dt>Frecuencia</dt>
                <dd>
                  {frequencyLabel(
                    o.recurrenceRules.frequency,
                    o.recurrenceRules.intervalValue,
                  )}
                </dd>
              </div>
              <div>
                <dt>Tipo</dt>
                <dd>{o.amountType === 'FIXED' ? 'Fijo' : 'Variable'}</dd>
              </div>
              <div>
                <dt>Próximo vencimiento</dt>
                <dd>
                  {nextOccurrence
                    ? calendarDate(nextOccurrence.dueDate)
                    : 'Sin vencimiento pendiente'}
                </dd>
              </div>
              <div>
                <dt>Estado del período</dt>
                <dd>
                  {nextOccurrence
                    ? statusLabel[nextOccurrence.status]
                    : 'Al día'}
                </dd>
              </div>
            </dl>
            <div className={styles.obligationActions}>
              <Link
                className={styles.quickActionPrimary}
                to={`/app/debts/obligations/${o.id}`}
              >
                Ver detalles
              </Link>
              <Dropdown
                label={`Acciones de ${o.name}`}
                trigger={<MoreHorizontal aria-hidden="true" />}
              >
                {!archived && canWrite && nextOccurrence && (
                  <Link to={`/app/debts/obligations/${o.id}?action=pay`}>
                    Registrar pago
                  </Link>
                )}
                {!archived && canWrite && (
                  <Link to={`/app/debts/obligations/${o.id}?action=edit`}>
                    Editar
                  </Link>
                )}
                {!archived && canWrite && (
                  <Link to={`/app/debts/obligations/${o.id}?action=occurrence`}>
                    Actualizar valor
                  </Link>
                )}
                {!archived && canWrite && o.status === 'ACTIVE' && (
                  <DropdownAction onClick={() => onStatus(o.id, 'PAUSED')}>
                    Pausar
                  </DropdownAction>
                )}
                {!archived && canWrite && o.status === 'PAUSED' && (
                  <DropdownAction onClick={() => onStatus(o.id, 'ACTIVE')}>
                    Reactivar
                  </DropdownAction>
                )}
                {!archived && canWrite && (
                  <DropdownAction
                    danger
                    onClick={() => onDelete(o.id, o.name)}
                  >
                    Archivar
                  </DropdownAction>
                )}
                {archived && canWrite && (
                  <DropdownAction onClick={() => onRestore(o.id)}>
                    Restaurar
                  </DropdownAction>
                )}
                {archived && (
                  <Link to={`/app/debts/obligations/${o.id}#history`}>
                    Ver historial
                  </Link>
                )}
              </Dropdown>
            </div>
          </Card>
        )
      })}
    </div>
  ) : (
    <EmptyState
      title={archived ? 'No tienes pagos recurrentes archivados' : 'Aún no tienes pagos recurrentes'}
      message={archived ? 'Los pagos recurrentes que archives aparecerán aquí con su historial.' : 'Agrega servicios, arriendo, seguros o suscripciones para controlar sus vencimientos.'}
      action={
        canWrite && !archived ? (
          <Button onClick={onCreate}>Nueva obligación</Button>
        ) : undefined
      }
    />
  )
}
export function DebtForm({
  workspaceId,
  currency,
  close,
}: {
  workspaceId: string
  currency: string
  close: (consumed?: boolean) => void
}) {
  const create = useCreateDebt(workspaceId)
  const [estimate, setEstimate] = useState<CreditEstimation | null>(null)
  const [estimateError, setEstimateError] = useState('')
  const [estimating, setEstimating] = useState(false)
  const [calculatedFields, setCalculatedFields] = useState<
    Set<keyof DebtFormValues>
  >(new Set())
  const {
    register,
    control,
    handleSubmit,
    getValues,
    setError,
    setFocus,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<DebtFormValues>({
    resolver: zodResolver(debtSchema),
    defaultValues: {
      name: '',
      lenderName: '',
      type: 'PERSONAL_LOAN',
      currency,
      originalAmount: '',
      currentBalance: '',
      interestRate: '',
      interestRateBasis: 'EFFECTIVE_MONTHLY',
      installmentCount: '',
      paymentFrequency: 'MONTHLY',
      installmentAmount: '',
      firstPaymentDate: '',
      notes: '',
    },
  })
  const invalidateEstimate = () => {
    setEstimate(null)
    setEstimateError('')
  }

  const applyApiValidation = (error: unknown) => {
    if (!(error instanceof ApiError) || error.code !== 'VALIDATION_ERROR')
      return false
    const details = error.details as
      { fields?: Record<string, string> } | undefined
    const aliases: Record<string, keyof DebtFormValues> = {
      originalPrincipal: 'originalAmount',
      originalAmount: 'originalAmount',
      currentBalance: 'currentBalance',
      paymentAmount: 'installmentAmount',
      installmentAmount: 'installmentAmount',
      remainingInstallments: 'installmentCount',
      installmentCount: 'installmentCount',
      interestRate: 'interestRate',
      interestRateBasis: 'interestRateBasis',
      paymentFrequency: 'paymentFrequency',
      firstPaymentDate: 'firstPaymentDate',
      name: 'name',
    }
    let first: keyof DebtFormValues | undefined
    for (const [path, message] of Object.entries(details?.fields ?? {})) {
      const field = aliases[path]
      if (!field) continue
      first ??= field
      setError(field, { type: 'server', message })
    }
    if (first) setFocus(first)
    return Boolean(first)
  }
  const simulate = async () => {
    const fields = [
      'originalAmount',
      'currentBalance',
      'installmentCount',
      'interestRate',
      'firstPaymentDate',
    ] as const
    if (!(await trigger(fields))) {
      setEstimate(null)
      setFocus(fields.find((field) => errors[field]) ?? 'originalAmount')
      return
    }
    const v = getValues()
    setEstimating(true)
    setEstimateError('')
    setEstimate(null)
    try {
      const r = await liabilitiesApi.estimate(
        workspaceId,
        debtEstimatePayload(v),
      )
      setEstimate(r.data)
      const calculated = new Set<keyof DebtFormValues>()
      if (!v.installmentAmount && r.data.paymentAmount.value) {
        setValue('installmentAmount', r.data.paymentAmount.value, {
          shouldValidate: true,
        })
        calculated.add('installmentAmount')
      }
      if (!v.installmentCount && r.data.remainingInstallments.value) {
        setValue(
          'installmentCount',
          String(r.data.remainingInstallments.value),
          { shouldValidate: true },
        )
        calculated.add('installmentCount')
      }
      setCalculatedFields(calculated)
    } catch (e) {
      if (!applyApiValidation(e)) setEstimateError(errorMessage(e))
    } finally {
      setEstimating(false)
    }
  }
  return (
    <form
      className={styles.form}
      onSubmit={(e) =>
        void handleSubmit(async (v) => {
          try {
            await create.mutateAsync(debtCreatePayload(v))
            close(true)
          } catch (error) {
            applyApiValidation(error)
          }
        })(e)
      }
      noValidate
    >
      <div className={styles.formGrid}>
        <h3 className={styles.formSectionTitle}>Información general</h3>
        <Field label="Nombre" id="debt-name" error={errors.name?.message}>
          <Input
            id="debt-name"
            placeholder="Ej. Crédito de libre inversión"
            {...register('name')}
          />
        </Field>
        <Field label="Tipo" id="debt-type">
          <Select id="debt-type" {...register('type')}>
            <option value="PERSONAL_LOAN">Libre inversión</option>
            <option value="MORTGAGE">Hipotecario</option>
            <option value="VEHICLE_LOAN">Vehículo</option>
            <option value="EDUCATION_LOAN">Educativo</option>
            <option value="BANK_LOAN">Préstamo bancario</option>
            <option value="PURCHASE_FINANCING">Compra financiada</option>
            <option value="INFORMAL_LOAN">Préstamo informal</option>
            <option value="OTHER">Otro</option>
          </Select>
        </Field>
        <Field label="Entidad" id="debt-lender">
          <Input id="debt-lender" placeholder="Ej. Banco, cooperativa o persona" {...register('lenderName')} />
        </Field>
        <Field label="Moneda" id="debt-currency">
          <CurrencyCombobox id="debt-currency" {...register('currency')} />
        </Field>
        <h3 className={styles.formSectionTitle}>Estado del crédito</h3>
        <Field
          label="Monto original"
          id="debt-original"
          error={errors.originalAmount?.message}
        >
          <Controller
            name="originalAmount"
            control={control}
            render={({ field }) => (
              <MoneyInput
                id="debt-original"
                minorUnits
                placeholder="Ej. 23.000.000,00"
                value={field.value}
                onValueChange={(value) => {
                  field.onChange(value)
                  setCalculatedFields((current) => {
                    const next = new Set(current)
                    next.delete('installmentAmount')
                    return next
                  })
                  invalidateEstimate()
                }}
              />
            )}
          />
        </Field>
        <Field
          label="Saldo pendiente actualmente (opcional)"
          id="debt-balance"
          error={errors.currentBalance?.message}
          help="Es el capital o deuda que todavía tienes pendiente por pagar."
        >
          <Controller
            name="currentBalance"
            control={control}
            render={({ field }) => (
              <MoneyInput
                id="debt-balance"
                minorUnits
                placeholder="Ej. 1.200.000,00"
                value={field.value}
                onValueChange={(value) => {
                  field.onChange(value)
                  invalidateEstimate()
                }}
              />
            )}
          />
        </Field>
        <Field
          label="Valor esperado de la próxima cuota (opcional)"
          id="debt-payment"
          error={errors.installmentAmount?.message}
        >
          <div>
            <Controller
              name="installmentAmount"
              control={control}
              render={({ field }) => (
                <MoneyInput
                  id="debt-payment"
                  minorUnits
                  placeholder="Ej. 657.874,98"
                  value={field.value}
                  onValueChange={(value) => {
                    field.onChange(value)
                    setCalculatedFields((current) => {
                      const next = new Set(current)
                      next.delete('installmentAmount')
                      return next
                    })
                    invalidateEstimate()
                  }}
                />
              )}
            />
            {calculatedFields.has('installmentAmount') && (
              <small>Estimado · calculado automáticamente</small>
            )}
          </div>
        </Field>
        <Field
          label="Número de cuotas restantes (opcional)"
          id="debt-term"
          error={errors.installmentCount?.message}
        >
          <div>
            <Input
            id="debt-term"
            inputMode="numeric"
            placeholder="Ej. 46"
            {...register('installmentCount', {
              onChange: () => {
                setCalculatedFields((current) => {
                  const next = new Set(current)
                  next.delete('installmentCount')
                  return next
                })
                invalidateEstimate()
              },
            })}
            />
            {calculatedFields.has('installmentCount') && (
              <small>Estimado · calculado automáticamente</small>
            )}
          </div>
        </Field>
        <h3 className={styles.formSectionTitle}>Condiciones</h3>
        <Field label="Frecuencia de pago" id="debt-frequency">
          <Select
            id="debt-frequency"
            {...register('paymentFrequency', { onChange: invalidateEstimate })}
          >
            <option value="WEEKLY">Semanal</option>
            <option value="MONTHLY">Mensual</option>
            <option value="BIMONTHLY">Bimestral</option>
            <option value="SEMIANNUAL">Semestral</option>
          </Select>
        </Field>
        <Field
          label="Tasa de interés (opcional)"
          id="debt-rate"
          error={errors.interestRate?.message}
        >
          <div className={styles.percentageInput}>
            <Input
              id="debt-rate"
              inputMode="decimal"
              placeholder="Ej. 2,00"
              {...register('interestRate', { onChange: invalidateEstimate })}
            />
            <span aria-hidden="true">%</span>
          </div>
        </Field>
        <Field
          label="¿Cómo está expresada la tasa?"
          id="debt-basis"
          help="La tasa efectiva mensual es la que se aplica cada mes al saldo pendiente."
        >
          <Select
            id="debt-basis"
            {...register('interestRateBasis', { onChange: invalidateEstimate })}
          >
            <option value="EFFECTIVE_ANNUAL">Efectiva anual</option>
            <option value="EFFECTIVE_MONTHLY">Efectiva mensual</option>
            <option value="NOMINAL_ANNUAL">Nominal anual</option>
            <option value="NOMINAL_MONTHLY">Nominal mensual</option>
          </Select>
        </Field>
        <Field
          label="Fecha de la próxima cuota"
          id="debt-first"
          error={errors.firstPaymentDate?.message}
        >
          <Input
            id="debt-first"
            type="date"
            {...register('firstPaymentDate', { onChange: invalidateEstimate })}
          />
        </Field>
      </div>
      <h3 className={styles.formSectionTitle}>Información adicional</h3>
      <Field label="Notas" id="debt-notes">
        <Textarea id="debt-notes" placeholder="Información útil para recordar este crédito" {...register('notes')} />
      </Field>
      {estimateError && (
        <p role="alert" className={styles.error}>
          {estimateError}
        </p>
      )}
      {estimate && (
        <Card className={styles.estimate}>
          <section>
            <strong>Datos informados</strong>
            <dl>
              <div>
                <dt>Monto original</dt>
                <dd>
                  {money(getValues('originalAmount'), getValues('currency'))}
                </dd>
              </div>
              {getValues('currentBalance') && (
                <div>
                  <dt>Saldo pendiente</dt>
                  <dd>
                    {money(getValues('currentBalance'), getValues('currency'))}
                  </dd>
                </div>
              )}
              {getValues('installmentCount') && (
                <div>
                  <dt>Cuotas restantes</dt>
                  <dd>{getValues('installmentCount')}</dd>
                </div>
              )}
              {getValues('interestRate') && (
                <div>
                  <dt>Tasa informada</dt>
                  <dd>
                    {getValues('interestRate').replace('.', ',')} % ·{' '}
                    {getValues('interestRateBasis') === 'EFFECTIVE_MONTHLY'
                      ? 'efectiva mensual'
                      : 'según base seleccionada'}
                  </dd>
                </div>
              )}
              <div>
                <dt>Frecuencia</dt>
                <dd>
                  {
                    {
                      WEEKLY: 'Semanal',
                      MONTHLY: 'Mensual',
                      BIMONTHLY: 'Bimestral',
                      SEMIANNUAL: 'Semestral',
                    }[getValues('paymentFrequency')]
                  }
                </dd>
              </div>
              {getValues('firstPaymentDate') && (
                <div>
                  <dt>Próxima fecha</dt>
                  <dd>{calendarDate(getValues('firstPaymentDate'))}</dd>
                </div>
              )}
              {getValues('installmentAmount') && (
                <div>
                  <dt>Próxima cuota</dt>
                  <dd>
                    {money(
                      getValues('installmentAmount'),
                      getValues('currency'),
                    )}
                  </dd>
                </div>
              )}
            </dl>
          </section>
          <strong>Datos calculados automáticamente</strong>
          <dl>
            {estimate.paymentAmount.source !== 'PROVIDED' &&
              estimate.paymentAmount.value && (
                <div>
                  <dt>
                    Próxima cuota ·{' '}
                    {estimationSource[estimate.paymentAmount.source]}
                  </dt>
                  <dd>
                    {money(estimate.paymentAmount.value, getValues('currency'))}
                  </dd>
                </div>
              )}
            {estimate.totalInstallments.source !== 'PROVIDED' &&
              estimate.totalInstallments.value && (
                <div>
                  <dt>
                    Cuotas ·{' '}
                    {estimationSource[estimate.totalInstallments.source]}
                  </dt>
                  <dd>{estimate.totalInstallments.value}</dd>
                </div>
              )}
            {estimate.periodicRate.source !== 'PROVIDED' &&
              estimate.periodicRate.value &&
              !(
                getValues('interestRate') &&
                getValues('interestRateBasis') === 'EFFECTIVE_MONTHLY' &&
                getValues('paymentFrequency') === 'MONTHLY'
              ) && (
                <div>
                  <dt>
                    Tasa efectiva por cuota ·{' '}
                    {estimationSource[estimate.periodicRate.source]}
                  </dt>
                  <dd>{decimalRateToPercent(estimate.periodicRate.value)}</dd>
                </div>
              )}
            {estimate.estimatedEndDate.value && (
              <div>
                <dt>Fecha estimada de finalización</dt>
                <dd>{calendarDate(estimate.estimatedEndDate.value)}</dd>
              </div>
            )}
          </dl>
          {estimate.issues.includes('INCONSISTENT_INPUT') && (
            <p>
              Los datos informados no coinciden con una cuota fija calculada,
              pero se conservarán sin cambios.
            </p>
          )}
          {estimate.issues.includes('PAYMENT_TOO_LOW') && (
            <p role="alert">
              La cuota informada no alcanza a cubrir los intereses del período.
            </p>
          )}
          {estimate.overallQuality === 'INSUFFICIENT_DATA' &&
            !estimate.issues.includes('PAYMENT_TOO_LOW') ? (
            <p role="alert">
              No hay información suficiente para completar el cálculo. Ingresa
              la tasa y el número de cuotas restantes, o proporciona la cuota
              junto con las cuotas restantes.
            </p>
          ) : [
            estimate.paymentAmount,
            estimate.periodicRate,
            estimate.totalInstallments,
            estimate.remainingInstallments,
            estimate.estimatedEndDate,
          ].some((item) => item.source === 'ESTIMATED') ? (
            <small>
              Confianza de los datos inferidos:{' '}
              {quality[estimate.overallQuality]}.
            </small>
          ) : null}
        </Card>
      )}
      {create.error && (
        <p role="alert" className={styles.error}>
          {errorMessage(create.error)}
        </p>
      )}
      <div className={styles.actions}>
        <Button
          type="button"
          variant="secondary"
          loading={estimating}
          onClick={() => void simulate()}
        >
          Completar datos faltantes
        </Button>
        <Button
          type="button"
          variant="ghost"
          disabled={create.isPending}
          onClick={() => close()}
        >
          Cancelar
        </Button>
        <Button type="submit" loading={create.isPending}>
          Confirmar y guardar
        </Button>
      </div>
    </form>
  )
}
function ObligationForm({
  workspaceId,
  currency,
  close,
}: {
  workspaceId: string
  currency: string
  close: (consumed?: boolean) => void
}) {
  const create = useCreateObligation(workspaceId)
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ObligationFormValues>({
    resolver: zodResolver(obligationSchema),
    defaultValues: {
      name: '',
      expectedAmount: '',
      currency,
      amountType: 'FIXED',
      frequency: 'MONTHLY',
      startsOn: new Date().toISOString().slice(0, 10),
    },
  })
  return (
    <form
      className={styles.form}
      onSubmit={(e) =>
        void handleSubmit((v) => {
          const input: ObligationInput = {
            name: v.name,
            expectedAmount: v.expectedAmount,
            currency: v.currency,
            amountType: v.amountType,
            frequency: v.frequency,
            startsOn: v.startsOn,
            intervalValue: 1,
            remindersEnabled: true,
            dayOfMonth: new Date(`${v.startsOn}T00:00:00Z`).getUTCDate(),
          }
          create.mutate(input, { onSuccess: () => close(true) })
        })(e)
      }
    >
      <div className={styles.formGrid}>
        <Field label="Nombre" id="obl-name" error={errors.name?.message}>
          <Input id="obl-name" placeholder="Ej. Arriendo, internet o seguro" {...register('name')} />
        </Field>
        <Field
          label="Monto esperado"
          id="obl-amount"
          error={errors.expectedAmount?.message}
        >
          <Controller
            name="expectedAmount"
            control={control}
            render={({ field }) => (
              <MoneyInput
                id="obl-amount"
                minorUnits
                value={field.value}
                onValueChange={field.onChange}
              />
            )}
          />
        </Field>
        <Field label="Moneda" id="obl-currency">
          <CurrencyCombobox id="obl-currency" {...register('currency')} />
        </Field>
        <Field label="Tipo de monto" id="obl-type">
          <Select id="obl-type" {...register('amountType')}>
            <option value="FIXED">Fijo</option>
            <option value="VARIABLE">Variable</option>
          </Select>
        </Field>
        <Field label="Frecuencia" id="obl-frequency">
          <Select id="obl-frequency" {...register('frequency')}>
            <option value="MONTHLY">Mensual</option>
            <option value="WEEKLY">Semanal</option>
            <option value="YEARLY">Anual</option>
            <option value="DAILY">Diaria</option>
          </Select>
        </Field>
        <Field label="Próximo vencimiento" id="obl-start">
          <Input id="obl-start" type="date" {...register('startsOn')} />
        </Field>
      </div>
      {create.error && (
        <p role="alert" className={styles.error}>
          {errorMessage(create.error)}
        </p>
      )}
      <div className={styles.actions}>
        <Button type="button" variant="secondary" onClick={() => close()}>
          Cancelar
        </Button>
        <Button type="submit" loading={create.isPending}>
          Crear obligación
        </Button>
      </div>
    </form>
  )
}
function Field({
  label,
  id,
  error,
  help,
  children,
}: {
  label: string
  id: string
  error?: string
  help?: string
  children: ReactElement<Record<string, unknown>>
}) {
  return (
    <FormField label={label} htmlFor={id} error={error} helpText={help}>
      {children}
    </FormField>
  )
}
