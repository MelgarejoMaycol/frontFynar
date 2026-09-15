import { ArrowRight, CalendarClock, Plus, TrendingUp } from 'lucide-react'
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
        <div>
          <span className={styles.eyebrow}>
            <TrendingUp size={15} aria-hidden="true" />
            Tu inversión
          </span>
          <h2>Inversiones activas</h2>
          <p>
            Sigue lo que ya invertiste y registra un nuevo aporte sin salir de
            Inicio.
          </p>
        </div>

        <Button
          type="button"
          variant="secondary"
          onClick={() => navigate('/app/investments')}
        >
          Ver todas <ArrowRight size={16} aria-hidden="true" />
        </Button>
      </div>

      <div
        className={`${styles.grid} ${
          featuredPlans.length === 1 ? styles.single : ''
        }`}
      >
        {featuredPlans.map((plan) => (
          <article className={styles.card} key={plan.id}>
            <div className={styles.identity}>
              <div className={styles.titleRow}>
                <span className={styles.activeBadge}>Activa</span>
                <span className={styles.currency}>{plan.currency}</span>
              </div>
              <h3>{plan.name}</h3>
              <span className={styles.pace}>{plan.progress.pace.headline}</span>
            </div>

            <div className={styles.metrics}>
              <div>
                <span>Valor actual</span>
                <strong>
                  {formatMoney(plan.progress.actual.currentValue, plan.currency)}
                </strong>
              </div>
              <div>
                <span>Aportado neto</span>
                <strong>
                  {formatMoney(
                    plan.progress.actual.netContributed,
                    plan.currency,
                  )}
                </strong>
              </div>
              {plan.progress.nextSuggestion ? (
                <div className={styles.nextReference}>
                  <CalendarClock size={15} aria-hidden="true" />
                  <span>
                    Próxima referencia {plan.progress.nextSuggestion.date} ·{' '}
                    {formatMoney(
                      plan.progress.nextSuggestion.amount,
                      plan.currency,
                    )}
                  </span>
                </div>
              ) : null}
            </div>

            <div className={styles.actions}>
              <Button
                type="button"
                aria-label={`Registrar aporte en ${plan.name}`}
                onClick={() =>
                  navigate(`/app/investments/${plan.id}?action=contribute`)
                }
              >
                <Plus size={16} aria-hidden="true" /> Aportar
              </Button>
              <Button
                type="button"
                variant="secondary"
                aria-label={`Abrir inversión ${plan.name}`}
                onClick={() => navigate(`/app/investments/${plan.id}`)}
              >
                Detalles <ArrowRight size={16} aria-hidden="true" />
              </Button>
            </div>
          </article>
        ))}
      </div>

      {activePlans.length > featuredPlans.length ? (
        <p className={styles.more}>
          Tienes {activePlans.length - featuredPlans.length} inversión
          {activePlans.length - featuredPlans.length === 1 ? '' : 'es'} activa
          {activePlans.length - featuredPlans.length === 1 ? '' : 's'} más.
        </p>
      ) : null}
    </section>
  )
}
