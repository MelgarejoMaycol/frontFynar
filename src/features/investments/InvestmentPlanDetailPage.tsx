import { useMemo, useState, type FormEvent } from 'react'
import {
  ArrowLeft,
  ArrowDownToLine,
  ArrowUpFromLine,
  CalendarDays,
  CheckCircle2,
  Pause,
  Play,
  RefreshCw,
  Scale,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import { useNavigate, useParams } from 'react-router'
import { Button, Dialog, MoneyInput, Spinner } from '@/components/ui'
import { useAccounts } from '@/features/accounts/hooks/accounts.hooks'
import { useActiveWorkspace } from '@/features/workspace'
import {
  useInvestmentAction,
  useInvestmentContribution,
  useInvestmentPlan,
  useInvestmentValuation,
  useInvestmentWithdrawal,
} from './hooks'
import type { InvestmentPlanStatus } from './types'
import styles from './investments.module.css'

type DialogMode = 'start' | 'contribute' | 'withdraw' | 'valuation' | null

const money = (value: string | number, currency: string) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(Number(value))

const percent = (value: string) =>
  new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 }).format(
    Number(value) * 100,
  )

const statusLabel: Record<InvestmentPlanStatus, string> = {
  DRAFT: 'Plan guardado',
  ACTIVE: 'En seguimiento',
  PAUSED: 'Pausado',
  COMPLETED: 'Finalizado',
  ARCHIVED: 'Archivado',
}

const frequencyLabel = {
  NONE: 'Sin aportes sugeridos',
  DAILY: 'Diario',
  WEEKLY: 'Semanal',
  MONTHLY: 'Mensual',
  QUARTERLY: 'Trimestral',
  YEARLY: 'Anual',
} as const

const today = () => new Date().toISOString().slice(0, 10)

export function InvestmentPlanDetailPage() {
  const navigate = useNavigate()
  const { planId = '' } = useParams()
  const { activeWorkspaceId } = useActiveWorkspace()
  const workspaceId = activeWorkspaceId ?? ''
  const planQuery = useInvestmentPlan(
    workspaceId,
    planId,
    Boolean(workspaceId && planId),
  )
  const accounts = useAccounts(workspaceId, Boolean(workspaceId), false, 'all', true)

  const start = useInvestmentAction(workspaceId, planId, 'start')
  const pause = useInvestmentAction(workspaceId, planId, 'pause')
  const resume = useInvestmentAction(workspaceId, planId, 'resume')
  const complete = useInvestmentAction(workspaceId, planId, 'complete')
  const contribute = useInvestmentContribution(workspaceId, planId)
  const withdraw = useInvestmentWithdrawal(workspaceId, planId)
  const valuation = useInvestmentValuation(workspaceId, planId)

  const [dialog, setDialog] = useState<DialogMode>(null)
  const [amount, setAmount] = useState('')
  const [accountId, setAccountId] = useState('')
  const [note, setNote] = useState('')
  const [startDate, setStartDate] = useState(today())

  const plan = planQuery.data

  const compatibleAccounts = useMemo(
    () =>
      (accounts.data ?? []).filter(
        (account) =>
          plan &&
          account.isActive &&
          account.nature === 'ASSET' &&
          account.currency === plan.currency &&
          account.type !== 'LOAN' &&
          account.type !== 'INVESTMENT',
      ),
    [accounts.data, plan],
  )

  const closeDialog = () => {
    setDialog(null)
    setAmount('')
    setAccountId('')
    setNote('')
  }

  const actionError =
    contribute.error ??
    withdraw.error ??
    valuation.error ??
    start.error ??
    pause.error ??
    resume.error ??
    complete.error

  const submitDialog = async (event: FormEvent) => {
    event.preventDefault()
    if (!plan) return

    try {
      if (dialog === 'start') {
        await start.mutateAsync({ startDate })
      } else if (dialog === 'contribute') {
        if (!accountId || !amount || Number(amount) <= 0) return
        await contribute.mutateAsync({
          sourceAccountId: accountId,
          amount,
          note: note || null,
        })
      } else if (dialog === 'withdraw') {
        if (!accountId || !amount || Number(amount) <= 0) return
        await withdraw.mutateAsync({
          destinationAccountId: accountId,
          amount,
          note: note || null,
        })
      } else if (dialog === 'valuation') {
        if (!amount || Number(amount) < 0) return
        await valuation.mutateAsync({ value: amount, note: note || null })
      }
      closeDialog()
    } catch {
      // Los hooks conservan el error para mostrarlo dentro del diálogo.
    }
  }

  if (planQuery.isPending) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>
          <Spinner />
          <p>Cargando inversión…</p>
        </div>
      </div>
    )
  }

  if (planQuery.isError || !plan) {
    return (
      <div className={styles.page}>
        <button
          className={styles.backLink}
          type="button"
          onClick={() => navigate('/app/investments')}
        >
          <ArrowLeft size={16} aria-hidden="true" /> Volver a inversiones
        </button>
        <div className={styles.error} role="alert">
          <p>No pudimos cargar este plan de inversión.</p>
          <Button type="button" variant="secondary" onClick={() => planQuery.refetch()}>
            Reintentar
          </Button>
        </div>
      </div>
    )
  }

  const progressRatio = Math.max(
    0,
    Math.min(100, Number(plan.progress.pace.ratio ?? 0)),
  )

  const openMoneyDialog = (mode: Exclude<DialogMode, 'start' | null>) => {
    setDialog(mode)
    setAmount(
      mode === 'contribute' && plan.recurringContribution !== '0.00'
        ? plan.recurringContribution
        : '',
    )
    setAccountId(compatibleAccounts[0]?.id ?? '')
    setNote('')
  }

  return (
    <div className={styles.page}>
      <button
        className={styles.backLink}
        type="button"
        onClick={() => navigate('/app/investments')}
      >
        <ArrowLeft size={16} aria-hidden="true" /> Volver a inversiones
      </button>

      <div className={styles.education}>
        <Wallet size={18} aria-hidden="true" />
        <span>
          Este seguimiento no es una deuda ni un atraso. El aporte diario,
          semanal o mensual es solo una referencia: si no aportas en una fecha,
          no pasa nada y Fynar no crea cobros ni obligaciones.
        </span>
      </div>

      <section className={styles.detailHero}>
        <div className={styles.detailHeading}>
          <div>
            <span className={styles.status}>{statusLabel[plan.status]}</span>
            <h1>{plan.name}</h1>
            <p>
              {plan.description ??
                'Seguimiento voluntario de tus aportes reales frente al escenario que elegiste.'}
            </p>
          </div>

          <div className={styles.detailActions}>
            {plan.status === 'DRAFT' ? (
              <Button type="button" onClick={() => setDialog('start')}>
                <Play size={16} aria-hidden="true" /> Empezar inversión
              </Button>
            ) : null}
            {plan.status === 'ACTIVE' || plan.status === 'PAUSED' ? (
              <Button
                type="button"
                onClick={() => openMoneyDialog('contribute')}
              >
                <ArrowDownToLine size={16} aria-hidden="true" /> Registrar aporte
              </Button>
            ) : null}
            {plan.status !== 'DRAFT' && plan.status !== 'ARCHIVED' ? (
              <Button
                type="button"
                variant="secondary"
                onClick={() => openMoneyDialog('withdraw')}
                disabled={Number(plan.progress.actual.currentValue) <= 0}
              >
                <ArrowUpFromLine size={16} aria-hidden="true" /> Retirar
              </Button>
            ) : null}
            {plan.status !== 'DRAFT' && plan.status !== 'ARCHIVED' ? (
              <Button
                type="button"
                variant="secondary"
                onClick={() => openMoneyDialog('valuation')}
              >
                <RefreshCw size={16} aria-hidden="true" /> Actualizar valor
              </Button>
            ) : null}
          </div>
        </div>

        <div className={styles.planMeta}>
          <span>
            <CalendarDays size={14} aria-hidden="true" />
            Ritmo: {frequencyLabel[plan.contributionFrequency]}
          </span>
          <span>
            <TrendingUp size={14} aria-hidden="true" />
            Supuesto: {percent(plan.annualReturn)}% anual
          </span>
          <span>
            <Scale size={14} aria-hidden="true" />
            Horizonte: {plan.horizonYears}{' '}
            {plan.horizonYears === 1 ? 'año' : 'años'}
          </span>
        </div>
      </section>

      <div className={styles.detailGrid}>
        <main className={styles.stack}>
          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <h2>Real vs. proyectado</h2>
                <p>
                  Compara lo que has registrado con el escenario. No se trata de
                  cumplir una cuota.
                </p>
              </div>
            </div>

            <div className={styles.comparison}>
              <div className={styles.metric}>
                <span>Valor actual registrado</span>
                <strong>
                  {money(plan.progress.actual.currentValue, plan.currency)}
                </strong>
              </div>
              <div className={styles.metric}>
                <span>Aportado neto</span>
                <strong>
                  {money(plan.progress.actual.netContributed, plan.currency)}
                </strong>
              </div>
              <div className={styles.metric}>
                <span>Proyección para hoy</span>
                <strong>
                  {money(plan.progress.plan.projectedValueToday, plan.currency)}
                </strong>
              </div>
              <div className={styles.metric}>
                <span>Proyección al horizonte</span>
                <strong>
                  {money(
                    plan.progress.plan.projectedValueAtHorizon,
                    plan.currency,
                  )}
                </strong>
              </div>
            </div>

            {plan.progress.pace.ratio !== null ? (
              <div style={{ marginTop: '.9rem' }}>
                <div className={styles.progressTrack} aria-hidden="true">
                  <div
                    className={styles.progressFill}
                    style={{ width: `${progressRatio}%` }}
                  />
                </div>
              </div>
            ) : null}

            <div className={styles.pace} style={{ marginTop: '.75rem' }}>
              <strong>{plan.progress.pace.headline}</strong>
              <p>{plan.progress.pace.explanation}</p>
            </div>
          </section>

          {plan.progress.nextSuggestion ? (
            <section className={styles.suggestion}>
              <small>Próxima referencia voluntaria</small>
              <strong>
                {plan.progress.nextSuggestion.date} ·{' '}
                {money(plan.progress.nextSuggestion.amount, plan.currency)}
              </strong>
              <p>{plan.progress.nextSuggestion.message}</p>
            </section>
          ) : null}

          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <h2>Actividad real</h2>
                <p>
                  Aportes y retiros registrados. Estos sí representan movimientos
                  reales de dinero.
                </p>
              </div>
            </div>

            <div className={styles.history}>
              {plan.recentContributions.length === 0 &&
              plan.recentWithdrawals.length === 0 ? (
                <p className={styles.helper}>
                  Todavía no has registrado aportes ni retiros.
                </p>
              ) : (
                [
                  ...plan.recentContributions.map((entry) => ({
                    id: entry.id,
                    type: 'Aporte',
                    amount: entry.amount,
                    occurredAt: entry.occurredAt,
                    account: entry.sourceAccount.name,
                    positive: true,
                  })),
                  ...plan.recentWithdrawals.map((entry) => ({
                    id: entry.id,
                    type: 'Retiro',
                    amount: entry.amount,
                    occurredAt: entry.occurredAt,
                    account: entry.destinationAccount.name,
                    positive: false,
                  })),
                ]
                  .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
                  .map((entry) => (
                    <div key={entry.type + entry.id} className={styles.historyItem}>
                      <div className={styles.historyTitle}>
                        <strong>{entry.type}</strong>
                        <span className={styles.historyMeta}>
                          {new Date(entry.occurredAt).toLocaleDateString('es-CO')}{' '}
                          · {entry.account}
                        </span>
                      </div>
                      <strong
                        className={
                          styles.historyAmount +
                          ' ' +
                          (entry.positive ? styles.positive : styles.negative)
                        }
                      >
                        {entry.positive ? '+' : '-'}
                        {money(entry.amount, plan.currency)}
                      </strong>
                    </div>
                  ))
              )}
            </div>
          </section>
        </main>

        <aside className={styles.stack}>
          <section className={styles.softPanel}>
            <div className={styles.panelHeader}>
              <div>
                <h2>Tu plan</h2>
                <p>La frecuencia es una intención, no una obligación.</p>
              </div>
            </div>
            <div className={styles.history}>
              <div className={styles.historyItem}>
                <div className={styles.historyTitle}>
                  <strong>Monto inicial imaginado</strong>
                </div>
                <span className={styles.historyAmount}>
                  {money(plan.plannedInitialAmount, plan.currency)}
                </span>
              </div>
              <div className={styles.historyItem}>
                <div className={styles.historyTitle}>
                  <strong>Aporte de referencia</strong>
                  <span className={styles.historyMeta}>
                    {frequencyLabel[plan.contributionFrequency]}
                  </span>
                </div>
                <span className={styles.historyAmount}>
                  {money(plan.recurringContribution, plan.currency)}
                </span>
              </div>
              <div className={styles.historyItem}>
                <div className={styles.historyTitle}>
                  <strong>Total aportado realmente</strong>
                </div>
                <span className={styles.historyAmount}>
                  {money(plan.progress.actual.totalContributed, plan.currency)}
                </span>
              </div>
              <div className={styles.historyItem}>
                <div className={styles.historyTitle}>
                  <strong>Total retirado</strong>
                </div>
                <span className={styles.historyAmount}>
                  {money(plan.progress.actual.totalWithdrawn, plan.currency)}
                </span>
              </div>
            </div>
          </section>

          {plan.status === 'ACTIVE' ? (
            <Button
              type="button"
              variant="secondary"
              loading={pause.isPending}
              onClick={() => pause.mutate(undefined)}
            >
              <Pause size={16} aria-hidden="true" /> Pausar seguimiento
            </Button>
          ) : null}
          {plan.status === 'PAUSED' ? (
            <Button
              type="button"
              variant="secondary"
              loading={resume.isPending}
              onClick={() => resume.mutate(undefined)}
            >
              <Play size={16} aria-hidden="true" /> Reanudar seguimiento
            </Button>
          ) : null}
          {plan.status === 'ACTIVE' || plan.status === 'PAUSED' ? (
            <Button
              type="button"
              variant="ghost"
              loading={complete.isPending}
              onClick={() => complete.mutate(undefined)}
            >
              <CheckCircle2 size={16} aria-hidden="true" /> Finalizar plan
            </Button>
          ) : null}
        </aside>
      </div>

      <Dialog
        open={dialog !== null}
        title={
          dialog === 'start'
            ? 'Empezar inversión'
            : dialog === 'contribute'
              ? 'Registrar aporte'
              : dialog === 'withdraw'
                ? 'Retirar de inversión'
                : 'Actualizar valor de inversión'
        }
        onClose={closeDialog}
        footer={
          <div className={styles.dialogActions}>
            <Button type="button" variant="ghost" onClick={closeDialog}>
              Cancelar
            </Button>
            <Button
              type="submit"
              form="investment-plan-action"
              loading={
                start.isPending ||
                contribute.isPending ||
                withdraw.isPending ||
                valuation.isPending
              }
            >
              {dialog === 'start'
                ? 'Empezar'
                : dialog === 'contribute'
                  ? 'Registrar aporte'
                  : dialog === 'withdraw'
                    ? 'Retirar'
                    : 'Guardar valor'}
            </Button>
          </div>
        }
      >
        <form
          id="investment-plan-action"
          className={styles.form}
          onSubmit={submitDialog}
        >
          {dialog === 'start' ? (
            <>
              <label className={styles.field}>
                <span>Fecha de inicio</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                />
              </label>
              <p className={styles.formNote}>
                Empezar el plan no mueve dinero. El primer aporte solo se
                registra cuando tú lo hagas expresamente.
              </p>
            </>
          ) : (
            <>
              {dialog !== 'valuation' ? (
                <label className={styles.field}>
                  <span>
                    {dialog === 'contribute'
                      ? 'Cuenta de origen'
                      : 'Cuenta de destino'}
                  </span>
                  <select
                    aria-label={
                      dialog === 'contribute'
                        ? 'Cuenta de origen del aporte'
                        : 'Cuenta de destino del retiro'
                    }
                    value={accountId}
                    onChange={(event) => setAccountId(event.target.value)}
                    required
                  >
                    <option value="">Selecciona una cuenta</option>
                    {compatibleAccounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name} ·{' '}
                        {money(
                          account.availableBalance ?? account.currentBalance,
                          account.currency,
                        )}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}

              <label className={styles.field}>
                <span>
                  {dialog === 'valuation'
                    ? 'Valor actual de la inversión'
                    : dialog === 'withdraw'
                      ? 'Monto a retirar'
                      : 'Monto del aporte'}
                </span>
                <MoneyInput
                  minorUnits
                  value={amount}
                  currency={plan.currency}
                  onValueChange={setAmount}
                  aria-label={
                    dialog === 'valuation'
                      ? 'Valor actual de la inversión'
                      : dialog === 'withdraw'
                        ? 'Monto a retirar'
                        : 'Monto del aporte'
                  }
                  placeholder="0,00"
                />
              </label>

              <label className={styles.field}>
                <span>Nota opcional</span>
                <textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="Ej. aporte desde mi ahorro del mes"
                />
              </label>

              <p className={styles.formNote}>
                {dialog === 'contribute'
                  ? 'Este aporte sí saldrá de la cuenta elegida y pasará a formar parte del valor de tu inversión. No se crea una cuenta nueva.'
                  : dialog === 'withdraw'
                    ? 'El retiro volverá a la cuenta elegida y disminuirá el valor registrado de la inversión.'
                    : 'Actualizar el valor sirve para reflejar lo que realmente vale hoy tu inversión. No mueve dinero.'}
              </p>
            </>
          )}

          {actionError instanceof Error ? (
            <p className={styles.dialogError} role="alert">
              {actionError.message}
            </p>
          ) : null}
        </form>
      </Dialog>
    </div>
  )
}
