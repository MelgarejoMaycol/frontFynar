import { useState, type CSSProperties } from 'react'
import { Link } from 'react-router'
import { Plus } from 'lucide-react'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { PageLoader } from '@/components/feedback/PageLoader'
import { useToast } from '@/components/feedback/toast-context'
import { Button, Dialog, FilterPanel, Input, PageHeader, Select } from '@/components/ui'
import { useActiveWorkspace, usePermission } from '@/features/workspace'
import { formatMoney } from '@/features/transactions/transactions.format'
import { ContributionForm } from '../components/ContributionForm'
import { GoalForm } from '../components/GoalForm'
import { GoalIcon, GoalStatusPill } from '../components/GoalVisual'
import { getGoalErrorMessage } from '../goals.errors'
import { formatGoalDate } from '../goals.format'
import {
  useContributeToGoal,
  useCreateGoal,
  useGoals,
  useRestoreGoal,
} from '../hooks/goals.hooks'
import type { Goal, GoalFilters, GoalInput } from '../types/goal.types'
import styles from '../components/goals.module.css'

type GoalView =
  | 'CURRENT'
  | 'ACTIVE'
  | 'PAUSED'
  | 'COMPLETED'
  | 'ARCHIVED'
  | 'ALL'

const filtersFor = (
  view: GoalView,
  search: string,
  page: number,
): GoalFilters => ({
  page,
  limit: 25,
  search: search.trim() || undefined,
  includeArchived:
    view === 'ARCHIVED' || view === 'ALL' ? 'true' : 'false',
  status:
    view === 'ACTIVE'
      ? 'ACTIVE'
      : view === 'PAUSED'
        ? 'PAUSED'
        : view === 'COMPLETED'
          ? 'COMPLETED'
          : view === 'ARCHIVED'
            ? 'CANCELLED'
            : undefined,
})

const goalCurrency = (goal: Goal, fallback: string) =>
  goal.account?.currency ?? fallback

const estimatedLabel = (goal: Goal) => {
  if (goal.progress.estimationReason === 'COMPLETED') return 'Objetivo alcanzado'
  if (goal.progress.estimatedCompletionDate)
    return `Estimado: ${formatGoalDate(goal.progress.estimatedCompletionDate)}`
  if (goal.progress.estimationReason === 'NON_POSITIVE_PACE')
    return 'El ritmo actual no permite estimar una fecha'
  return 'La proyección aparecerá con más historial'
}

export function GoalsPage() {
  const workspace = useActiveWorkspace().activeWorkspace!
  const canRead = usePermission('goals.read')
  const canWrite = usePermission('goals.write')
  const { showToast } = useToast()
  const [view, setView] = useState<GoalView>('CURRENT')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [creating, setCreating] = useState(false)
  const [creationKey, setCreationKey] = useState(0)
  const [quickGoal, setQuickGoal] = useState<Goal | null>(null)
  const filters = filtersFor(view, search, page)
  const query = useGoals(workspace.id, filters, canRead)
  const create = useCreateGoal(workspace.id)
  const restore = useRestoreGoal(workspace.id)
  const contribute = useContributeToGoal(workspace.id, quickGoal?.id ?? '')

  if (!canRead)
    return (
      <ErrorState
        title="Acceso restringido"
        message="No tienes permiso para consultar metas de ahorro en este workspace."
      />
    )

  if (query.isPending && !query.data) return <PageLoader />

  if (query.isError)
    return (
      <ErrorState
        title="No pudimos cargar tus metas"
        message={getGoalErrorMessage(query.error)}
        onRetry={() => void query.refetch()}
      />
    )

  const closeCreate = () => {
    setCreating(false)
    create.reset()
  }
  const closeContribution = () => {
    setQuickGoal(null)
    contribute.reset()
  }

  return (
    <div className={styles.page}>
      <PageHeader
        title="Metas de ahorro"
        description="Ponle propósito a tu dinero, registra aportes reales y sigue cuánto te falta para llegar a cada objetivo."
        actions={
          canWrite ? (
            <Button onClick={() => setCreating(true)}>
              <Plus size={18} aria-hidden="true" /> Nueva meta
            </Button>
          ) : undefined
        }
      />

      <FilterPanel
        title="Organiza tus metas"
        active={Boolean(search || view !== 'CURRENT')}
      >
        <div className={styles.filters}>
          <label>
            Buscar
            <Input
              placeholder="Ej: moto, viaje, emergencia..."
              value={search}
              onChange={(event) => {
                setSearch(event.target.value)
                setPage(1)
              }}
            />
          </label>
          <label>
            Estado
            <Select
              value={view}
              onChange={(event) => {
                setView(event.target.value as GoalView)
                setPage(1)
              }}
            >
              <option value="CURRENT">Vigentes</option>
              <option value="ACTIVE">Activas</option>
              <option value="PAUSED">Pausadas</option>
              <option value="COMPLETED">Completadas</option>
              <option value="ARCHIVED">Archivadas</option>
              <option value="ALL">Todas</option>
            </Select>
          </label>
          <Button
            variant="secondary"
            onClick={() => {
              setSearch('')
              setView('CURRENT')
              setPage(1)
            }}
          >
            Limpiar filtros
          </Button>
        </div>
      </FilterPanel>

      {query.data.items.length === 0 ? (
        <EmptyState
          title={
            view === 'ARCHIVED'
              ? 'No tienes metas archivadas'
              : search
                ? 'No encontramos metas con ese nombre'
                : 'Aún no tienes metas de ahorro'
          }
          message={
            view === 'ARCHIVED'
              ? 'Cuando archives una meta aparecerá aquí y conservará todo su historial.'
              : search
                ? 'Prueba con otra búsqueda o limpia los filtros.'
                : 'Crea un objetivo y empieza a medir cuánto has reservado para alcanzarlo.'
          }
          action={
            canWrite && view !== 'ARCHIVED' && !search ? (
              <Button onClick={() => setCreating(true)}>Crear mi primera meta</Button>
            ) : undefined
          }
        />
      ) : (
        <div className={styles.list} aria-label="metas de ahorro">
          {query.data.items.map((goal) => {
            const currency = goalCurrency(goal, workspace.baseCurrency)
            const percentage = Math.min(
              100,
              Math.max(0, Number(goal.progress.percentage)),
            )
            const archived = Boolean(goal.archivedAt)
            return (
              <article
                key={goal.id}
                className={styles.card}
                style={
                  {
                    '--goal-color': goal.color ?? '#154B45',
                  } as CSSProperties
                }
              >
                <Link
                  className={styles.cardLink}
                  to={`/app/goals/${goal.id}`}
                  aria-label={`Ver meta ${goal.name}`}
                />
                <div className={styles.cardTop}>
                  <div className={styles.cardTitle}>
                    <GoalIcon goal={goal} />
                    <div>
                      <h2>{goal.name}</h2>
                      <p>{goal.account?.name ?? 'Sin cuenta específica'}</p>
                    </div>
                  </div>
                  <GoalStatusPill status={goal.status} />
                </div>

                <div
                  className={styles.progressBlock}
                  style={{ pointerEvents: 'none' }}
                >
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
                      Faltan {formatMoney(goal.progress.remainingAmount, currency)}
                    </span>
                  </div>
                </div>

                <div
                  className={styles.cardFooter}
                  style={{ pointerEvents: 'none' }}
                >
                  <div>
                    <strong>
                      {goal.targetDate
                        ? `Meta: ${formatGoalDate(goal.targetDate)}`
                        : 'Sin fecha límite'}
                    </strong>
                    <span>{estimatedLabel(goal)}</span>
                  </div>
                  {canWrite && goal.status === 'ACTIVE' && !archived && (
                    <div
                      className={styles.quickButton}
                      style={{ pointerEvents: 'auto' }}
                    >
                      <Button
                        size="small"
                        onClick={() => {
                          contribute.reset()
                          setQuickGoal(goal)
                        }}
                      >
                        Aportar
                      </Button>
                    </div>
                  )}
                  {canWrite && archived && (
                    <div
                      className={styles.quickButton}
                      style={{ pointerEvents: 'auto' }}
                    >
                      <Button
                        size="small"
                        variant="secondary"
                        loading={restore.isPending}
                        onClick={() =>
                          restore.mutate(goal.id, {
                            onSuccess: () => showToast('Meta restaurada.'),
                            onError: (error) =>
                              showToast(getGoalErrorMessage(error), 'error'),
                          })
                        }
                      >
                        Restaurar
                      </Button>
                    </div>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      )}

      {query.data.totalPages > 1 && (
        <nav className={styles.pagination} aria-label="Paginación de metas">
          <Button
            variant="secondary"
            disabled={query.data.page <= 1}
            onClick={() => setPage((value) => Math.max(1, value - 1))}
          >
            Anterior
          </Button>
          <span>
            Página {query.data.page} de {query.data.totalPages}
          </span>
          <Button
            variant="secondary"
            disabled={query.data.page >= query.data.totalPages}
            onClick={() => setPage((value) => value + 1)}
          >
            Siguiente
          </Button>
        </nav>
      )}

      <Dialog open={creating} title="Crear meta de ahorro" onClose={closeCreate}>
        <GoalForm
          key={`new-goal-${creationKey}`}
          workspaceId={workspace.id}
          pending={create.isPending}
          error={create.error}
          onCancel={closeCreate}
          onSubmit={(input: GoalInput) =>
            create.mutate(input, {
              onSuccess: () => {
                setCreationKey((value) => value + 1)
                showToast('Meta creada correctamente.')
                closeCreate()
              },
              onError: (error) =>
                showToast(getGoalErrorMessage(error), 'error'),
            })
          }
        />
      </Dialog>

      <Dialog
        open={Boolean(quickGoal)}
        title="Registrar aporte a la meta"
        onClose={closeContribution}
      >
        {quickGoal && (
          <ContributionForm
            workspaceId={workspace.id}
            timezone={workspace.timezone}
            baseCurrency={workspace.baseCurrency}
            goal={quickGoal}
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
        )}
      </Dialog>
    </div>
  )
}
