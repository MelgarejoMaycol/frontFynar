import { ArrowRight, CalendarClock, TrendingUp } from 'lucide-react'
import { useNavigate } from 'react-router'
import { Button } from '@/components/ui'
import { formatMoney } from '@/features/transactions/transactions.format'
import { useInvestmentPlans } from '@/features/investments/hooks'
import styles from './InvestmentsDashboardWidget.module.css'

export function InvestmentsDashboardWidget({
  workspaceId,
}: {
  workspaceId: string
}) {
  const navigate = useNavigate()
  const plans = useInvestmentPlans(workspaceId, Boolean(workspaceId))

  const activePlans = [...(plans.data ?? [])]
    .filter((plan) => plan.status === 'ACTIVE')
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))

  if (plans.isPending || plans.isError || activePlans.length === 0) return null

  const featuredPlans = activePlans.slice(0, 2)

  return (
    <section className={styles.widget} aria-label="Inversiones activas">
      <div className={styles.header}>
        <div className={styles.heading}>
          <span className={styles.eyebrow}>
            <TrendingUp size={15} aria-hidden="true" />
            En seguimiento
          </span>
          <div>
            <h2>Inversiones activas</h2>
            <p>
              {activePlans.length === 1
                ? 'Tienes 1 inversión activa. Aquí ves su estado sin salir de Inicio.'
                : `Tienes ${activePlans.length} inversiones activas. Te mostramos primero las más recientes.`}
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="secondary"
          onClick={() => navigate('/app/investments')}
        >
          Ver inversiones <ArrowRight size={16} aria-hidden="true" />
        </Button>
      </div>

      <div className={styles.grid}>
        {featuredPlans.map((plan) => (
          <article className={styles.card} key={plan.id}>
            <div className={styles.cardTop}>
              <div>
                <span className={styles.currency}>{plan.currency}</span>
                <h3>{plan.name}</h3>
              </div>
              <span className={styles.activeBadge}>Activa</span>
            </div>

            <div className={styles.metrics}>
              <div className={styles.metric}>
                <span>Valor actual</span>
                <strong>
                  {formatMoney(plan.progress.actual.currentValue, plan.currency)}
                </strong>
              </div>
              <div className={styles.metric}>
                <span>Aportado neto</span>
                <strong>
                  {formatMoney(plan.progress.actual.netContributed, plan.currency)}
                </strong>
              </div>
            </div>

            <div className={styles.pace}>
              <span>Ritmo del plan</span>
              <strong>{plan.progress.pace.headline}</strong>
            </div>

            {plan.progress.nextSuggestion ? (
              <div className={styles.suggestion}>
                <CalendarClock size={16} aria-hidden="true" />
                <span>
                  Próxima referencia: {plan.progress.nextSuggestion.date} ·{' '}
                  {formatMoney(
                    plan.progress.nextSuggestion.amount,
                    plan.currency,
                  )}
                </span>
              </div>
            ) : null}

            <div className={styles.actions}>
              <Button
                type="button"
                variant="secondary"
                aria-label={`Abrir inversión ${plan.name}`}
                onClick={() => navigate(`/app/investments/${plan.id}`)}
              >
                Abrir inversión <ArrowRight size={16} aria-hidden="true" />
              </Button>
            </div>
          </article>
        ))}
      </div>

      {activePlans.length > featuredPlans.length ? (
        <p className={styles.more}>
          Hay {activePlans.length - featuredPlans.length} inversión
          {activePlans.length - featuredPlans.length === 1 ? '' : 'es'} activa
          {activePlans.length - featuredPlans.length === 1 ? '' : 's'} más en el
          módulo de Inversiones.
        </p>
      ) : null}
    </section>
  )
}
