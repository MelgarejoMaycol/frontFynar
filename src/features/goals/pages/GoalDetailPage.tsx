import { useState, type CSSProperties } from 'react'
import { ArrowLeft, ArrowDownLeft, ArrowUpRight, RotateCcw } from 'lucide-react'
import { Link, useParams } from 'react-router'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { PageLoader } from '@/components/feedback/PageLoader'
import { useToast } from '@/components/feedback/toast-context'
import { Button, Dialog } from '@/components/ui'
import { formatMoney, formatTransactionDate } from '@/features/transactions/transactions.format'
import { useActiveWorkspace, usePermission } from '@/features/workspace'
import { ContributionForm } from '../components/ContributionForm'
import { GoalForm } from '../components/GoalForm'
import {
  GoalIcon,
  GoalStatusPill,
  formatGoalDate,
} from '../components/GoalVisual'
import { getGoalErrorMessage } from '../goals.errors'
import {
  useArchiveGoal,
  useContributeToGoal,
  useGoal,
  usePauseGoal,
  useRestoreGoal,
  useResumeGoal,
  useReverseGoalContribution,
  useUpdateGoal,
} from '../hooks/goals.hooks'
import type { GoalContribution, GoalInput } from '../types/goal.types'
import styles from '../components/goals.module.css'

const projectionMessage = (reason: string) => {
  if (reason === 'COMPLETED') return 'Ya alcanzaste el valor objetivo de esta meta.'
  if (reason === 'ESTIMATED')
    return 'La fecha estimada se calcula usando el ritmo observado de tus aportes. Es una proyección, no una garantía.'
  if (reason === 'NON_POSITIVE_PACE')
    return 'El historial reciente no muestra un ritmo positivo suficiente para calcular una fecha de finalización.'
  return 'Necesitamos al menos dos aportes separados por suficiente tiempo para estimar cuándo podrías completar la meta.'
}

export function GoalDetailPage() {
  const { goalId = '' } = useParams()
  const workspace = useActiveWorkspace().activeWorkspace!
  const canRead = usePermission('goals.read')
  const canWrite = usePermission('goals.write')
  const { showToast } = useToast()
  const detail = useGoal(workspace.id, goalId)
  const update = useUpdateGoal(workspace.id, goalId)
  const pause = usePauseGoal(workspace.id)
  const resume = useResumeGoal(workspace.id)
  const archive = useArchiveGoal(workspace.id)
  const restore = useRestoreGoal(workspace.id)
  const contribute = useContributeToGoal(workspace.id, goalId)
  const reverse = useReverseGoalContribution(workspace.id, goalId)
  const [editing, setEditing] = useState(false)
  const [contributionMode, setContributionMode] = useState<
    'CONTRIBUTE' | 'WITHDRAW' | null
  >(null)
  const [archiving, setArchiving] = useState(false)
  const [reversing, setReversing] = useState<GoalContribution | null>(null)

  if (!canRead)
    return (
      <ErrorState
        title="Acceso restringido"
        message="No tienes permiso para consultar esta meta de ahorro."
      />
    )

  if (detail.isPending) return <PageLoader />

  if (detail.isError || !detail.data)
    return (
      <ErrorState
        title="No pudimos cargar la meta"
        message={getGoalErrorMessage(detail.error)}
        onRetry={() => void detail.refetch()}
      />
    )

  const goal = detail.data
  const currency = goal.account?.currency ?? workspace.baseCurrency
  const percentage = Math.min(
    100,
    Math.max(0, Number(goal.progress.percentage)),
  )
  const archived = Boolean(goal.archivedAt)
  const hasSavings = Number(goal.savedAmount) > 0

  const closeContribution = () => {
    setContributionMode(null)
    contribute.reset()
  }
  const closeEdit = () => {
    setEditing(false)
    update.reset()
  }
  const closeArchive = () => {
    setArchiving(false)
    archive.reset()
  }
  const closeReverse = () => {
    setReversing(null)
    reverse.reset()
  }

  return (
    <div className={styles.detailPage}>
      <Link className={styles.backLink} to="/app/goals">
        <ArrowLeft size={16} aria-hidden="true" /> Volver a metas de ahorro
      </Link>

      <section
        className={styles.detailHero}
        style={
          { '--goal-color': goal.color ?? '#154B45' } as CSSProperties
        }
        aria-labelledby="goal-detail-title"
      >
        <div className={styles.detailTop}>
          <div className={styles.cardTitle}>
            <GoalIcon goal={goal} size={25} />
            <div className={styles.detailHeading}>
              <h1 id="goal-detail-title">{goal.name}</h1>
              <p className={styles.detailSubtitle}>
                {goal.account
                  ? `Asociada a ${goal.account.name} · ${goal.account.currency}`
                  : `Sin cuenta específica · ${currency}`}
              </p>
            </div>
          </div>
          <GoalStatusPill status={goal.status} />
        </div>

        <div className={styles.progressBlock}>
          <div className={styles.amountRow}>
            <strong>{formatMoney(goal.savedAmount, currency)}</strong>
            <span>de {formatMoney(goal.targetAmount, currency)}</span>
          </div>
          <div
            className={styles.progressTrack}
            role="progressbar"
            aria-label={`${goal.name}: ${goal.progress.percentage} % completado`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percentage}
          >
            <span
              className={styles.progressFill}
              style={{ width: `${percentage}%` }}
            />
          </div>
          <div className={styles.amountRow}>
            <span>{goal.progress.percentage} % completado</span>
            <span>
              {Number(goal.progress.remainingAmount) > 0
                ? `Faltan ${formatMoney(goal.progress.remainingAmount, currency)}`
                : `Excedente ${formatMoney(goal.progress.surplusAmount, currency)}`}
            </span>
          </div>
        </div>

        {canWrite && (
          <div className={styles.detailActions}>
            {goal.status === 'ACTIVE' && !archived && (
              <Button onClick={() => setContributionMode('CONTRIBUTE')}>
                <ArrowUpRight size={17} aria-hidden="true" /> Aportar
              </Button>
            )}
            {hasSavings && !archived && (
              <Button
                variant="secondary"
                onClick={() => setContributionMode('WITHDRAW')}
              >
                <ArrowDownLeft size={17} aria-hidden="true" /> Retirar asignación
              </Button>
            )}
            {!archived && (
              <Button variant="secondary" onClick={() => setEditing(true)}>
                Editar meta
              </Button>
            )}
            {goal.status === 'ACTIVE' && !archived && (
              <Button
                variant="ghost"
                loading={pause.isPending}
                onClick={() =>
                  pause.mutate(goal.id, {
                    onSuccess: () => showToast('Meta pausada.'),
                    onError: (error) =>
                      showToast(getGoalErrorMessage(error), 'error'),
                  })
                }
              >
                Pausar
              </Button>
            )}
            {goal.status === 'PAUSED' && !archived && (
              <Button
                variant="secondary"
                loading={resume.isPending}
                onClick={() =>
                  resume.mutate(goal.id, {
                    onSuccess: () => showToast('Meta reactivada.'),
                    onError: (error) =>
                      showToast(getGoalErrorMessage(error), 'error'),
                  })
                }
              >
                Reactivar
              </Button>
            )}
            {!archived ? (
              <Button variant="ghost" onClick={() => setArchiving(true)}>
                Archivar
              </Button>
            ) : (
              <Button
                loading={restore.isPending}
                onClick={() =>
                  restore.mutate(goal.id, {
                    onSuccess: () => showToast('Meta restaurada.'),
                    onError: (error) =>
                      showToast(getGoalErrorMessage(error), 'error'),
                  })
                }
              >
                Restaurar meta
              </Button>
            )}
          </div>
        )}
      </section>

      <section className={styles.section} aria-labelledby="goal-plan-title">
        <div className={styles.sectionHeader}>
          <h2 id="goal-plan-title">Plan y proyección</h2>
          {goal.targetDate && (
            <span className={styles.targetMeta}>
              Fecha objetivo: {formatGoalDate(goal.targetDate)}
            </span>
          )}
        </div>
        <div className={styles.metricGrid}>
          <div className={styles.metric}>
            <span>Ahorrado</span>
            <strong>{formatMoney(goal.savedAmount, currency)}</strong>
          </div>
          <div className={styles.metric}>
            <span>{Number(goal.progress.remainingAmount) > 0 ? 'Por reunir' : 'Excedente'}</span>
            <strong>
              {formatMoney(
                Number(goal.progress.remainingAmount) > 0
                  ? goal.progress.remainingAmount
                  : goal.progress.surplusAmount,
                currency,
              )}
            </strong>
          </div>
          <div className={styles.metric}>
            <span>Aporte mensual sugerido</span>
            <strong>
              {goal.progress.suggestedMonthlyAmount
                ? formatMoney(goal.progress.suggestedMonthlyAmount, currency)
                : 'Sin cálculo'}
            </strong>
          </div>
          <div className={styles.metric}>
            <span>Ritmo mensual observado</span>
            <strong>
              {goal.progress.averageMonthlyContribution
                ? formatMoney(goal.progress.averageMonthlyContribution, currency)
                : 'Aún sin datos'}
            </strong>
          </div>
          <div className={styles.metric}>
            <span>Finalización estimada</span>
            <strong>
              {goal.progress.estimatedCompletionDate
                ? formatGoalDate(goal.progress.estimatedCompletionDate)
                : 'Aún sin estimación'}
            </strong>
          </div>
          <div className={styles.metric}>
            <span>Cuenta asociada</span>
            <strong>{goal.account?.name ?? 'Sin cuenta específica'}</strong>
          </div>
        </div>
        <p className={styles.projectionNote}>
          {projectionMessage(goal.progress.estimationReason)}
        </p>
      </section>

      <section className={styles.section} aria-labelledby="goal-history-title">
        <div className={styles.sectionHeader}>
          <div>
            <h2 id="goal-history-title">Historial de la meta</h2>
            <p className={styles.projectionNote}>
              Aquí quedan registrados aportes, retiros y correcciones sin alterar el historial anterior.
            </p>
          </div>
        </div>

        {goal.contributions.length === 0 ? (
          <EmptyState
            title="Todavía no hay movimientos en esta meta"
            message="Registra tu primer aporte para empezar a medir el progreso."
            action={
              canWrite && goal.status === 'ACTIVE' && !archived ? (
                <Button onClick={() => setContributionMode('CONTRIBUTE')}>
                  Registrar primer aporte
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className={styles.history}>
            {goal.contributions.map((entry) => (
              <article key={entry.id} className={styles.historyItem}>
                <span className={styles.historyIcon} aria-hidden="true">
                  {entry.direction === 'IN' ? (
                    <ArrowUpRight size={17} />
                  ) : (
                    <ArrowDownLeft size={17} />
                  )}
                </span>
                <div className={styles.historyMain}>
                  <strong>
                    {entry.direction === 'IN' ? 'Aporte' : 'Retiro o corrección'}
                  </strong>
                  <span className={styles.historyMeta}>
                    {formatTransactionDate(entry.contributedAt, workspace.timezone)}
                    {entry.transactionId ? ' · Vinculado a un movimiento real' : ' · Asignación interna'}
                  </span>
                </div>
                <div className={styles.historyActions}>
                  <span
                    className={
                      entry.direction === 'IN' ? styles.amountIn : styles.amountOut
                    }
                  >
                    {entry.direction === 'IN' ? '+' : '−'}
                    {formatMoney(entry.amount.replace(/^-/, ''), currency)}
                  </span>
                  {canWrite && !archived && (
                    <Button
                      size="small"
                      variant="ghost"
                      onClick={() => setReversing(entry)}
                    >
                      <RotateCcw size={14} aria-hidden="true" /> Revertir
                    </Button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <Dialog
        open={contributionMode === 'CONTRIBUTE'}
        title="Registrar aporte a la meta"
        onClose={closeContribution}
      >
        <ContributionForm
          workspaceId={workspace.id}
          timezone={workspace.timezone}
          baseCurrency={workspace.baseCurrency}
          goal={goal}
          mode="CONTRIBUTE"
          pending={contribute.isPending}
          error={contribute.error}
          onCancel={closeContribution}
          onSubmit={(input) =>
            contribute.mutate(input, {
              onSuccess: () => {
                showToast('Aporte registrado correctamente.')
                closeContribution()
              },
              onError: (error) =>
                showToast(getGoalErrorMessage(error), 'error'),
            })
          }
        />
      </Dialog>

      <Dialog
        open={contributionMode === 'WITHDRAW'}
        title="Retirar asignación de la meta"
        onClose={closeContribution}
      >
        <ContributionForm
          workspaceId={workspace.id}
          timezone={workspace.timezone}
          baseCurrency={workspace.baseCurrency}
          goal={goal}
          mode="WITHDRAW"
          pending={contribute.isPending}
          error={contribute.error}
          onCancel={closeContribution}
          onSubmit={(input) =>
            contribute.mutate(input, {
              onSuccess: () => {
                showToast('Retiro registrado correctamente.')
                closeContribution()
              },
              onError: (error) =>
                showToast(getGoalErrorMessage(error), 'error'),
            })
          }
        />
      </Dialog>

      <Dialog open={editing} title="Editar meta de ahorro" onClose={closeEdit}>
        <GoalForm
          workspaceId={workspace.id}
          goal={goal}
          pending={update.isPending}
          error={update.error}
          onCancel={closeEdit}
          onSubmit={(input: GoalInput) =>
            update.mutate(input, {
              onSuccess: () => {
                showToast('Meta actualizada correctamente.')
                closeEdit()
              },
              onError: (error) =>
                showToast(getGoalErrorMessage(error), 'error'),
            })
          }
        />
      </Dialog>

      <Dialog
        open={archiving}
        title="Archivar meta de ahorro"
        onClose={closeArchive}
        footer={
          <>
            <Button variant="secondary" onClick={closeArchive}>
              Cancelar
            </Button>
            <Button
              loading={archive.isPending}
              onClick={() =>
                archive.mutate(goal.id, {
                  onSuccess: () => {
                    showToast('Meta archivada. Su historial se conserva.')
                    closeArchive()
                  },
                  onError: (error) =>
                    showToast(getGoalErrorMessage(error), 'error'),
                })
              }
            >
              Archivar meta
            </Button>
          </>
        }
      >
        <p>
          La meta dejará de aparecer entre las vigentes, pero conservará todos sus aportes, retiros y cálculos para que puedas restaurarla después.
        </p>
        {archive.error && <p role="alert">{getGoalErrorMessage(archive.error)}</p>}
      </Dialog>

      <Dialog
        open={Boolean(reversing)}
        title="Revertir registro de la meta"
        onClose={closeReverse}
        footer={
          <>
            <Button variant="secondary" onClick={closeReverse}>
              Cancelar
            </Button>
            <Button
              loading={reverse.isPending}
              onClick={() =>
                reversing &&
                reverse.mutate(reversing.id, {
                  onSuccess: () => {
                    showToast('Registro revertido y progreso recalculado.')
                    closeReverse()
                  },
                  onError: (error) =>
                    showToast(getGoalErrorMessage(error), 'error'),
                })
              }
            >
              Confirmar reversión
            </Button>
          </>
        }
      >
        <p>
          Fynar no borrará el registro original. Creará una corrección compensatoria para mantener la trazabilidad y recalcular el avance de la meta.
        </p>
        {reverse.error && <p role="alert">{getGoalErrorMessage(reverse.error)}</p>}
      </Dialog>
    </div>
  )
}
