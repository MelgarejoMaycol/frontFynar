import {
  CalendarDays,
  ChevronRight,
  Info,
  LineChart,
  Plus,
  Sparkles,
  Target,
  TrendingUp,
  WalletCards,
} from 'lucide-react'
import { useNavigate } from 'react-router'
import { Button, PageHeader } from '@/components/ui'
import { PageLoader } from '@/components/feedback/PageLoader'
import { useActiveWorkspace } from '@/features/workspace'
import { useInvestmentPlans } from './hooks'
import type {
  InvestmentPlan,
  InvestmentPlanStatus,
  InvestmentPaceStatus,
} from './types'
import styles from './investments.module.css'

const money = (value: string | number, currency: string) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value))

const statusLabel: Record<InvestmentPlanStatus, string> = {
  DRAFT: 'Plan guardado',
  ACTIVE: 'En seguimiento',
  PAUSED: 'Pausado',
  COMPLETED: 'Finalizado',
  ARCHIVED: 'Archivado',
}

const paceLabel: Record<InvestmentPaceStatus, string> = {
  NOT_STARTED: 'Listo cuando quieras',
  AHEAD: 'Por encima del ritmo',
  ON_TRACK: 'Cerca de tu ritmo',
  BELOW_PREFERRED_PACE: 'Por debajo del ritmo elegido',
}

const frequencyLabel: Record<InvestmentPlan['contributionFrequency'], string> = {
  NONE: 'Sin ritmo de aportes',
  DAILY: 'Aporte diario',
  WEEKLY: 'Aporte semanal',
  MONTHLY: 'Aporte mensual',
  QUARTERLY: 'Aporte trimestral',
  YEARLY: 'Aporte anual',
}

const statusClass = (status: InvestmentPlanStatus) => {
  if (status === 'ACTIVE') return styles.statusActive
  if (status === 'PAUSED') return styles.statusPaused
  if (status === 'COMPLETED') return styles.statusCompleted
  return ''
}

function PlanCard({
  plan,
  onOpen,
}: {
  plan: InvestmentPlan
  onOpen: () => void
}) {
  return (
    <article className={styles.planCard}>
      <div className={styles.planTop}>
        <div className={styles.planTitle}>
          <h2>{plan.name}</h2>
          <p>
            {plan.description ??
              'Un plan flexible para comparar lo que imaginaste con lo que realmente vas construyendo.'}
          </p>
        </div>
        <span className={styles.status + ' ' + statusClass(plan.status)}>
          {statusLabel[plan.status]}
        </span>
      </div>

      <div className={styles.metrics}>
        <div className={styles.metric}>
          <span>Valor registrado</span>
          <strong>{money(plan.progress.actual.currentValue, plan.currency)}</strong>
        </div>
        <div className={styles.metric}>
          <span>Aportado neto</span>
          <strong>
            {money(plan.progress.actual.netContributed, plan.currency)}
          </strong>
        </div>
        <div className={styles.metric}>
          <span>Proyección al horizonte</span>
          <strong>
            {money(plan.progress.plan.projectedValueAtHorizon, plan.currency)}
          </strong>
        </div>
      </div>

      <div className={styles.pace}>
        <strong>{paceLabel[plan.progress.pace.status]}</strong>
        <p>{plan.progress.pace.explanation}</p>
      </div>

      <div className={styles.planMeta}>
        <span>
          <Target size={14} aria-hidden="true" />
          {plan.horizonYears} {plan.horizonYears === 1 ? 'año' : 'años'}
        </span>
        <span>
          <CalendarDays size={14} aria-hidden="true" />
          {frequencyLabel[plan.contributionFrequency]}
        </span>
        {plan.progress.nextSuggestion ? (
          <span>
            <Sparkles size={14} aria-hidden="true" />
            Próxima referencia: {plan.progress.nextSuggestion.date}
          </span>
        ) : null}
      </div>

      <div className={styles.cardActions}>
        <Button type="button" variant="secondary" onClick={onOpen}>
          Ver inversión <ChevronRight size={16} aria-hidden="true" />
        </Button>
      </div>
    </article>
  )
}

export function InvestmentsPage() {
  const navigate = useNavigate()
  const { activeWorkspaceId } = useActiveWorkspace()
  const workspaceId = activeWorkspaceId ?? ''
  const plans = useInvestmentPlans(workspaceId, Boolean(workspaceId))

  const visiblePlans = (plans.data ?? []).filter(
    (plan) => plan.status !== 'ARCHIVED',
  )
  const activeCount = visiblePlans.filter((plan) =>
    ['ACTIVE', 'PAUSED'].includes(plan.status),
  ).length
  const currencies = new Set(visiblePlans.map((plan) => plan.currency))

  return (
    <div className={styles.page}>
      <PageHeader
        title="Inversiones"
        description="Convierte una simulación en un plan flexible, registra aportes cuando realmente los hagas y compara tu evolución real con la proyección."
        actions={
          <div className={styles.headerActions}>
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/app/investments/simulator')}
            >
              <LineChart size={17} aria-hidden="true" /> Simular inversión
            </Button>
          </div>
        }
      />

      <div className={styles.education}>
        <Info size={18} aria-hidden="true" />
        <span>
          Un plan de inversión no es una cuenta ni un pago recurrente. La
          frecuencia es solo el ritmo que quieres usar como referencia. Si un
          día no aportas, Fynar no genera deuda, atraso ni movimiento
          automático.
        </span>
      </div>

      <section className={styles.overview} aria-label="Resumen de inversiones">
        <article className={styles.overviewCard}>
          <span>Planes visibles</span>
          <strong>{visiblePlans.length}</strong>
        </article>
        <article className={styles.overviewCard}>
          <span>En seguimiento</span>
          <strong>{activeCount}</strong>
        </article>
        <article className={styles.overviewCard}>
          <span>Monedas utilizadas</span>
          <strong>{currencies.size || 0}</strong>
        </article>
      </section>

      {plans.isPending ? (
        <PageLoader />
      ) : plans.isError ? (
        <div className={styles.error} role="alert">
          <TrendingUp size={28} aria-hidden="true" />
          <p>
            No pudimos cargar tus inversiones. Intenta nuevamente en unos
            momentos.
          </p>
          <Button type="button" variant="secondary" onClick={() => plans.refetch()}>
            Reintentar
          </Button>
        </div>
      ) : visiblePlans.length === 0 ? (
        <div className={styles.empty}>
          <WalletCards size={34} aria-hidden="true" />
          <h2>Aún no tienes planes de inversión</h2>
          <p>
            Empieza simulando cualquier monto. Cuando encuentres un escenario
            que te sirva, puedes guardarlo como plan sin mover dinero.
          </p>
          <Button
            type="button"
            onClick={() => navigate('/app/investments/simulator')}
          >
            <Plus size={17} aria-hidden="true" /> Simular una inversión
          </Button>
        </div>
      ) : (
        <section className={styles.grid} aria-label="Mis planes de inversión">
          {visiblePlans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              onOpen={() => navigate(`/app/investments/${plan.id}`)}
            />
          ))}
        </section>
      )}
    </div>
  )
}
