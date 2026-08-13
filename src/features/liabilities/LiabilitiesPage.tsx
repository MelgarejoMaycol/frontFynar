import {
  useState,
  type Dispatch,
  type ReactElement,
  type SetStateAction,
} from 'react'
import { Link, useSearchParams } from 'react-router'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import {
  Badge,
  Button,
  Card,
  CurrencyCombobox,
  Dialog,
  FormField,
  Input,
  MoneyInput,
  PageHeader,
  Select,
  Textarea,
} from '@/components/ui'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { PageLoader } from '@/components/feedback/PageLoader'
import { useActiveWorkspace, usePermission } from '@/features/workspace'
import { liabilitiesApi } from './api'
import {
  useCards,
  useCreateDebt,
  useCreateObligation,
  useDebts,
  useObligations,
  useSummary,
  useUpcoming,
} from './hooks'
import {
  debtSchema,
  obligationSchema,
  type DebtFormValues,
  type ObligationFormValues,
} from './schemas'
import type { CreditEstimation, DebtInput, ObligationInput } from './types'
import { calendarDate, money, statusLabel, statusTone } from './format'
import styles from './liabilities.module.css'
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
const errorMessage = (e: unknown) =>
  e instanceof Error ? e.message : 'No fue posible completar la operación.'
export function LiabilitiesPage() {
  const { activeWorkspace: w } = useActiveWorkspace()
  const canWrite = usePermission('debts.write')
  const [params, setParams] = useSearchParams()
  const tab = (
    tabs.some((x) => x.id === params.get('tab')) ? params.get('tab') : 'summary'
  ) as Tab
  const [modal, setModal] = useState<'debt' | 'obligation' | null>(null)
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
    obligations = useObligations(w!.id),
    cards = useCards(w!.id)
  const loading = [summary, upcoming, debts, obligations, cards].some(
    (q) => q.isPending,
  )
  const failed = [summary, upcoming, debts, obligations, cards].find(
    (q) => q.isError,
  )
  if (loading) return <PageLoader />
  if (failed)
    return (
      <ErrorState
        title="No pudimos cargar créditos y pagos"
        message={errorMessage(failed.error)}
        onRetry={() => window.location.reload()}
      />
    )
  return (
    <div className={styles.page}>
      <PageHeader
        title="Créditos y pagos"
        description="Consulta lo que debes, tus próximos compromisos y registra pagos."
        actions={
          canWrite ? (
            <Button
              onClick={() =>
                setModal(tab === 'obligations' ? 'obligation' : 'debt')
              }
            >
              {tab === 'obligations' ? 'Nueva obligación' : 'Nuevo crédito'}
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
        <Summary data={summary.data!} upcoming={upcoming.data!} />
      )}{' '}
      {tab === 'debts' && (
        <Debts
          items={debts.data!.items}
          page={debts.data!.page}
          totalPages={debts.data!.totalPages}
          filters={debtFilters}
          onFilters={setDebtFilters}
          canWrite={canWrite}
          onCreate={() => setModal('debt')}
        />
      )}{' '}
      {tab === 'cards' && <Cards items={cards.data!} />}{' '}
      {tab === 'obligations' && (
        <Obligations
          items={obligations.data!}
          canWrite={canWrite}
          onCreate={() => setModal('obligation')}
        />
      )}
      <Dialog
        open={modal === 'debt'}
        title="Registrar crédito"
        onClose={() => setModal(null)}
      >
        <DebtForm
          workspaceId={w!.id}
          currency={w!.baseCurrency}
          close={() => setModal(null)}
        />
      </Dialog>
      <Dialog
        open={modal === 'obligation'}
        title="Nueva obligación"
        onClose={() => setModal(null)}
      >
        <ObligationForm
          workspaceId={w!.id}
          currency={w!.baseCurrency}
          close={() => setModal(null)}
        />
      </Dialog>
    </div>
  )
}
function Summary({
  data,
  upcoming,
}: {
  data: NonNullable<ReturnType<typeof useSummary>['data']>
  upcoming: NonNullable<ReturnType<typeof useUpcoming>['data']>
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
        />
      </div>
      <section>
        <h2>Próximos vencimientos</h2>
        {upcoming.length ? (
          <div className={styles.list}>
            {upcoming.map((x) => (
              <Card className={styles.row} key={`${x.type}-${x.id}`}>
                <div>
                  <strong>{x.name}</strong>
                  <small>
                    {x.type === 'DEBT_INSTALLMENT'
                      ? 'Cuota de crédito'
                      : x.type === 'OBLIGATION'
                        ? 'Pago recurrente'
                        : 'Tarjeta'}{' '}
                    · {calendarDate(x.date)}
                  </small>
                </div>
                <div className={styles.amount}>
                  <strong>{money(x.amount, x.currency)}</strong>
                  <Badge tone={statusTone(x.status)}>
                    {statusLabel[x.status] ?? x.status}
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No tienes pagos próximos"
            message="Tus cuotas, obligaciones y extractos pendientes aparecerán aquí."
          />
        )}
      </section>
    </>
  )
}
function Metric({
  label,
  value,
  detail,
}: {
  label: string
  value: string
  detail?: string
}) {
  return (
    <Card className={styles.metric}>
      <span>{label}</span>
      <strong>{value}</strong>
      {detail && <small>{detail}</small>}
    </Card>
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
                    <dt>Cuota</dt>
                    <dd>{money(d.installmentAmount, d.currency)}</dd>
                  </div>
                  <div>
                    <dt>Tasa</dt>
                    <dd>
                      {d.interestRate ? `${d.interestRate}%` : 'No informada'}
                    </dd>
                  </div>
                  <div>
                    <dt>Próximo pago</dt>
                    <dd>{calendarDate(d.nextDueDate)}</dd>
                  </div>
                </dl>
                <Link to={`/app/debts/${d.id}`}>Ver detalle y cronograma</Link>
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
}: {
  items: NonNullable<ReturnType<typeof useCards>['data']>
}) {
  return items.length ? (
    <div className={styles.grid}>
      {items.map((c) => (
        <Card className={styles.resource} key={c.id}>
          <div className={styles.cardHead}>
            <h2>{c.name}</h2>
            <Badge>{c.currency}</Badge>
          </div>
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
              <dt>Corte</dt>
              <dd>{c.billingDay ?? 'No informado'}</dd>
            </div>
            <div>
              <dt>Pago</dt>
              <dd>{c.paymentDueDay ?? 'No informado'}</dd>
            </div>
          </dl>
          <Link to={`/app/debts/cards/${c.id}`}>
            Compras, extractos y pagos
          </Link>
        </Card>
      ))}
    </div>
  ) : (
    <EmptyState
      title="No tienes tarjetas registradas"
      message="Crea una cuenta de tipo tarjeta de crédito para administrar compras y extractos."
      action={<Link to="/app/accounts?new=1">Crear tarjeta</Link>}
    />
  )
}
function Obligations({
  items,
  canWrite,
  onCreate,
}: {
  items: NonNullable<ReturnType<typeof useObligations>['data']>
  canWrite: boolean
  onCreate: () => void
}) {
  return items.length ? (
    <div className={styles.grid}>
      {items.map((o) => (
        <Card className={styles.resource} key={o.id}>
          <div className={styles.cardHead}>
            <h2>{o.name}</h2>
            <Badge>{o.amountType === 'FIXED' ? 'Fijo' : 'Variable'}</Badge>
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
              <dd>{o.recurrenceRules.frequency}</dd>
            </div>
            <div>
              <dt>Vencimientos</dt>
              <dd>{o.occurrences.length}</dd>
            </div>
          </dl>
          <Link to={`/app/debts/obligations/${o.id}`}>
            Ver periodos y registrar pagos
          </Link>
        </Card>
      ))}
    </div>
  ) : (
    <EmptyState
      title="Aún no tienes pagos recurrentes"
      message="Agrega servicios, arriendo, seguros o suscripciones para controlar sus vencimientos."
      action={
        canWrite ? (
          <Button onClick={onCreate}>Nueva obligación</Button>
        ) : undefined
      }
    />
  )
}
function DebtForm({
  workspaceId,
  currency,
  close,
}: {
  workspaceId: string
  currency: string
  close: () => void
}) {
  const create = useCreateDebt(workspaceId)
  const [estimate, setEstimate] = useState<CreditEstimation | null>(null)
  const [estimateError, setEstimateError] = useState('')
  const [estimating, setEstimating] = useState(false)
  const {
    register,
    control,
    handleSubmit,
    getValues,
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
      interestRateBasis: 'EFFECTIVE_ANNUAL',
      termMonths: '',
      installmentAmount: '',
      firstPaymentDate: '',
      notes: '',
    },
  })
  const payload = (v: DebtFormValues): DebtInput => ({
    name: v.name,
    lenderName: v.lenderName || null,
    type: v.type,
    currency: v.currency,
    originalAmount: v.originalAmount,
    ...(v.currentBalance ? { currentBalance: v.currentBalance } : {}),
    ...(v.interestRate
      ? { interestRate: v.interestRate, interestRateBasis: v.interestRateBasis }
      : {}),
    ...(v.termMonths ? { termMonths: Number(v.termMonths) } : {}),
    ...(v.installmentAmount ? { installmentAmount: v.installmentAmount } : {}),
    ...(v.firstPaymentDate ? { firstPaymentDate: v.firstPaymentDate } : {}),
    notes: v.notes || null,
  })
  const simulate = async () => {
    const v = getValues()
    setEstimating(true)
    setEstimateError('')
    try {
      const r = await liabilitiesApi.estimate(workspaceId, {
        originalPrincipal: v.originalAmount || undefined,
        currentBalance: v.currentBalance || undefined,
        paymentAmount: v.installmentAmount || undefined,
        interestRate: v.interestRate || undefined,
        interestRateBasis: v.interestRate ? v.interestRateBasis : undefined,
        totalInstallments: v.termMonths ? Number(v.termMonths) : undefined,
        firstPaymentDate: v.firstPaymentDate || undefined,
      })
      setEstimate(r.data)
    } catch (e) {
      setEstimateError(errorMessage(e))
    } finally {
      setEstimating(false)
    }
  }
  return (
    <form
      className={styles.form}
      onSubmit={(e) =>
        void handleSubmit((v) =>
          create.mutate(payload(v), { onSuccess: close }),
        )(e)
      }
      noValidate
    >
      <div className={styles.formGrid}>
        <Field label="Nombre" id="debt-name" error={errors.name?.message}>
          <Input id="debt-name" {...register('name')} />
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
          <Input id="debt-lender" {...register('lenderName')} />
        </Field>
        <Field label="Moneda" id="debt-currency">
          <CurrencyCombobox id="debt-currency" {...register('currency')} />
        </Field>
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
                value={field.value}
                onValueChange={field.onChange}
              />
            )}
          />
        </Field>
        <Field label="Saldo actual (opcional)" id="debt-balance">
          <Controller
            name="currentBalance"
            control={control}
            render={({ field }) => (
              <MoneyInput
                id="debt-balance"
                value={field.value}
                onValueChange={field.onChange}
              />
            )}
          />
        </Field>
        <Field label="Cuota (opcional)" id="debt-payment">
          <Controller
            name="installmentAmount"
            control={control}
            render={({ field }) => (
              <MoneyInput
                id="debt-payment"
                value={field.value}
                onValueChange={field.onChange}
              />
            )}
          />
        </Field>
        <Field label="Plazo en meses (opcional)" id="debt-term">
          <Input
            id="debt-term"
            inputMode="numeric"
            {...register('termMonths')}
          />
        </Field>
        <Field label="Tasa (opcional)" id="debt-rate">
          <Input
            id="debt-rate"
            inputMode="decimal"
            {...register('interestRate')}
          />
        </Field>
        <Field label="Base de tasa" id="debt-basis">
          <Select id="debt-basis" {...register('interestRateBasis')}>
            <option value="EFFECTIVE_ANNUAL">Efectiva anual</option>
            <option value="EFFECTIVE_MONTHLY">Efectiva mensual</option>
            <option value="NOMINAL_ANNUAL">Nominal anual</option>
            <option value="NOMINAL_MONTHLY">Nominal mensual</option>
          </Select>
        </Field>
        <Field label="Primera cuota" id="debt-first">
          <Input
            id="debt-first"
            type="date"
            {...register('firstPaymentDate')}
          />
        </Field>
      </div>
      <Field label="Notas" id="debt-notes">
        <Textarea id="debt-notes" {...register('notes')} />
      </Field>
      {estimateError && (
        <p role="alert" className={styles.error}>
          {estimateError}
        </p>
      )}
      {estimate && (
        <Card className={styles.estimate}>
          <strong>{quality[estimate.overallQuality]}</strong>
          <span>
            Cuota: {money(estimate.paymentAmount.value, getValues('currency'))}{' '}
            · Plazo: {estimate.totalInstallments.value ?? 'No calculado'} · Tasa
            mensual: {estimate.periodicRate.value ?? 'No calculada'}
          </span>
          <small>
            Los valores calculados por Fynar se guardarán únicamente después de
            tu confirmación.
          </small>
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
          Estimar datos
        </Button>
        <Button
          type="button"
          variant="ghost"
          disabled={create.isPending}
          onClick={close}
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
  close: () => void
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
      dayOfMonth: '',
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
            ...(v.dayOfMonth ? { dayOfMonth: Number(v.dayOfMonth) } : {}),
          }
          create.mutate(input, { onSuccess: close })
        })(e)
      }
    >
      <div className={styles.formGrid}>
        <Field label="Nombre" id="obl-name" error={errors.name?.message}>
          <Input id="obl-name" {...register('name')} />
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
        <Field label="Comienza" id="obl-start">
          <Input id="obl-start" type="date" {...register('startsOn')} />
        </Field>
        <Field label="Día del mes" id="obl-day">
          <Input id="obl-day" inputMode="numeric" {...register('dayOfMonth')} />
        </Field>
      </div>
      {create.error && (
        <p role="alert" className={styles.error}>
          {errorMessage(create.error)}
        </p>
      )}
      <div className={styles.actions}>
        <Button type="button" variant="secondary" onClick={close}>
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
  children,
}: {
  label: string
  id: string
  error?: string
  children: ReactElement<Record<string, unknown>>
}) {
  return (
    <FormField label={label} htmlFor={id} error={error}>
      {children}
    </FormField>
  )
}
