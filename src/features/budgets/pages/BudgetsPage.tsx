import { useState } from 'react'
import {
  Button,
  Dialog,
  CurrencyCombobox,
  FilterPanel,
  Input,
  PageHeader,
  Select,
} from '@/components/ui'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { PageLoader } from '@/components/feedback/PageLoader'
import { useToast } from '@/components/feedback/toast-context'
import { useActiveWorkspace, usePermission } from '@/features/workspace'
import { formatMoney } from '@/features/transactions/transactions.format'
import { BudgetCard } from '../components/BudgetCard'
import { BudgetForm } from '../components/BudgetForm'
import { getBudgetErrorMessage } from '../budgets.errors'
import {
  useArchiveBudget,
  useBudget,
  useBudgets,
  useCreateBudget,
  useUpdateBudget,
  useRestoreBudget,
} from '../hooks/budgets.hooks'
import type { Budget, BudgetFilters, BudgetInput } from '../types/budget.types'
import styles from '../components/budgets.module.css'
import { budgetPeriodLabels, budgetStatusLabels } from '../budgets.constants'
export function BudgetsPage() {
  const requestedId = new URLSearchParams(window.location.search).get('budgetId') ?? ''
  const workspace = useActiveWorkspace().activeWorkspace!,
    canRead = usePermission('budgets.read'),
    canWrite = usePermission('budgets.write')
  const [filters, setFilters] = useState<BudgetFilters>({
      page: 1,
      limit: 25,
      includeArchived: 'false',
      status: 'ACTIVE',
    }),
    [creating, setCreating] = useState(false),
    [selected, setSelected] = useState<Budget | null>(null),
    [editing, setEditing] = useState(false),
    [archiving, setArchiving] = useState(false)
  const query = useBudgets(workspace.id, filters, canRead),
    detail = useBudget(workspace.id, selected?.id ?? requestedId),
    create = useCreateBudget(workspace.id),
    update = useUpdateBudget(workspace.id, selected?.id ?? ''),
    archive = useArchiveBudget(workspace.id)
  const restore = useRestoreBudget(workspace.id)
  const { showToast } = useToast()
  if (!canRead)
    return (
      <ErrorState
        title="Acceso restringido"
        message="No tienes permiso para consultar presupuestos en este workspace."
      />
    )
  if (query.isPending && !query.data) return <PageLoader />
  if (query.isError)
    return (
      <ErrorState
        title="No pudimos cargar los presupuestos"
        message={getBudgetErrorMessage(query.error)}
        onRetry={() => void query.refetch()}
      />
    )
  const current = detail.data ?? selected,
    close = () => {
      setCreating(false)
      setSelected(null)
      setEditing(false)
      setArchiving(false)
      if (requestedId) window.history.replaceState({}, '', '/app/budgets')
      create.reset()
      update.reset()
      archive.reset()
    },
    success = (text: string) => {
      showToast(text)
      close()
    }
  return (
    <div className={styles.page}>
      <PageHeader
        title="Presupuestos"
        description="Define límites para controlar tus gastos sin mezclar monedas."
        actions={
          canWrite ? (
            <Button onClick={() => setCreating(true)}>Crear presupuesto</Button>
          ) : undefined
        }
      />
      <FilterPanel
        active={Boolean(
          filters.search ||
          filters.period ||
          filters.currency ||
          filters.status !== 'ACTIVE',
        )}
      >
        <div className={styles.filters}>
          <label>
            Buscar
            <Input
              placeholder="Ej: Salidas, comida, universidad..."
              value={filters.search ?? ''}
              onChange={(e) =>
                setFilters((x) => ({
                  ...x,
                  search: e.target.value || undefined,
                  page: 1,
                }))
              }
            />
          </label>
          <label>
            Periodo
            <Select
              value={filters.period ?? ''}
              onChange={(e) =>
                setFilters((x) => ({
                  ...x,
                  period: (e.target.value ||
                    undefined) as BudgetFilters['period'],
                  page: 1,
                }))
              }
            >
              <option value="">Todos</option>
              <option value="WEEKLY">Semanal</option>
              <option value="MONTHLY">Mensual</option>
              <option value="YEARLY">Anual</option>
              <option value="CUSTOM">Personalizado</option>
            </Select>
          </label>
          <label>
            Moneda
            <CurrencyCombobox
              placeholder="Todas las monedas · Ej: COP"
              value={filters.currency ?? ''}
              onChange={(e) =>
                setFilters((x) => ({
                  ...x,
                  currency: e.target.value.toUpperCase() || undefined,
                  page: 1,
                }))
              }
            />
          </label>
          <label>
            Estado
            <Select
              value={filters.status ?? 'ACTIVE'}
              onChange={(e) =>
                setFilters((x) => ({
                  ...x,
                  status: e.target.value as BudgetFilters['status'],
                  includeArchived:
                    e.target.value === 'ACTIVE' ? 'false' : 'true',
                  page: 1,
                }))
              }
            >
              <option value="ACTIVE">Activos</option>
              <option value="ARCHIVED">Archivados</option>
              <option value="ALL">Todos</option>
            </Select>
          </label>
          <Button
            variant="secondary"
            onClick={() =>
              setFilters({
                page: 1,
                limit: 25,
                includeArchived: 'false',
                status: 'ACTIVE',
              })
            }
          >
            Limpiar filtros
          </Button>
        </div>
      </FilterPanel>
      {query.data.items.length === 0 ? (
        <EmptyState
          title={filters.status === 'ARCHIVED' ? 'No tienes presupuestos archivados' : 'Aún no tienes presupuestos'}
          message={filters.status === 'ARCHIVED' ? 'Los presupuestos que archives aparecerán aquí.' : 'Define un límite para controlar tus gastos.'}
        />
      ) : (
        <div className={styles.list}>
          {query.data.items.map((b) => (
            <BudgetCard
              key={b.id}
              budget={b}
              canWrite={canWrite}
              onOpen={() => setSelected(b)}
              onEdit={() => {
                setSelected(b)
                setEditing(true)
              }}
              onArchive={() => {
                setSelected(b)
                setArchiving(true)
              }}
              busy={restore.isPending}
              onRestore={() =>
                restore.mutate(b.id, {
                  onSuccess: () => showToast('Presupuesto desarchivado.'),
                  onError: (error) =>
                    showToast(getBudgetErrorMessage(error), 'error'),
                })
              }
            />
          ))}
        </div>
      )}
      {query.data.totalPages > 1 && (
        <nav className={styles.actions} aria-label="Paginación">
          <Button
            variant="secondary"
            disabled={query.data.page <= 1}
            onClick={() =>
              setFilters((x) => ({ ...x, page: (x.page ?? 1) - 1 }))
            }
          >
            Anterior
          </Button>
          <span>
            Página {query.data.page} de {query.data.totalPages}
          </span>
          <Button
            variant="secondary"
            disabled={query.data.page >= query.data.totalPages}
            onClick={() =>
              setFilters((x) => ({ ...x, page: (x.page ?? 1) + 1 }))
            }
          >
            Siguiente
          </Button>
        </nav>
      )}
      <Dialog open={creating} title="Crear presupuesto" onClose={close}>
        <BudgetForm
          workspaceId={workspace.id}
          baseCurrency={workspace.baseCurrency}
          timezone={workspace.timezone}
          pending={create.isPending}
          error={create.error}
          onCancel={close}
          onSubmit={(input) =>
            create.mutate(input, {
              onSuccess: () => success('Presupuesto creado.'),
              onError: (error) =>
                showToast(getBudgetErrorMessage(error), 'error'),
            })
          }
        />
      </Dialog>
      <Dialog
        open={Boolean(selected || requestedId) && !editing && !archiving}
        title="Detalle del presupuesto"
        onClose={close}
      >
        {detail.isPending ? (
          <PageLoader />
        ) : (
          current && (
            <div>
              <dl className={styles.detail}>
                <div>
                  <dt>Nombre</dt>
                  <dd>{current.name}</dd>
                </div>
                <div>
                  <dt>Periodo</dt>
                  <dd>{budgetPeriodLabels[current.period]}</dd>
                </div>
                <div>
                  <dt>Fechas</dt>
                  <dd>
                    {current.startsOn} — {current.endsOn}
                  </dd>
                </div>
                <div>
                  <dt>Monto</dt>
                  <dd>{formatMoney(current.amount, current.currency)}</dd>
                </div>
                <div>
                  <dt>Gastado</dt>
                  <dd>
                    {formatMoney(current.progress.spent, current.currency)}
                  </dd>
                </div>
                <div>
                  <dt>{Number(current.progress.remaining) < 0 ? 'Excedido por' : 'Disponible'}</dt>
                  <dd>
                    {formatMoney(current.progress.remaining.replace(/^-/, ''), current.currency)}
                  </dd>
                </div>
                <div>
                  <dt>Porcentaje</dt>
                  <dd>{current.progress.percentage} %</dd>
                </div>
                <div>
                  <dt>Umbral</dt>
                  <dd>{current.alertThreshold} %</dd>
                </div>
                <div>
                  <dt>Estado</dt>
                  <dd>{budgetStatusLabels[current.progress.status]}</dd>
                </div>
                <div>
                  <dt>Categorías</dt>
                  <dd>
                    {current.categories.map((x) => x.name).join(', ') ||
                      'Todas'}
                  </dd>
                </div>
                <div>
                  <dt>Cuentas</dt>
                  <dd>
                    {current.accounts.map((x) => x.name).join(', ') || 'Todas'}
                  </dd>
                </div>
              </dl>
              <h3>Proyección al final del periodo</h3>
              <dl className={styles.detail}>
                <div>
                  <dt>Gasto proyectado</dt>
                  <dd>
                    {formatMoney(
                      current.projection.projectedSpend,
                      current.currency,
                    )}
                  </dd>
                </div>
                <div>
                  <dt>Disponible proyectado</dt>
                  <dd>
                    {formatMoney(
                      current.projection.projectedRemaining,
                      current.currency,
                    )}
                  </dd>
                </div>
                <div>
                  <dt>Porcentaje proyectado</dt>
                  <dd>{current.projection.projectedPercentage} %</dd>
                </div>
                <div>
                  <dt>Estado proyectado</dt>
                  <dd>
                    {budgetStatusLabels[current.projection.projectedStatus]}
                  </dd>
                </div>
              </dl>
            </div>
          )
        )}
      </Dialog>
      <Dialog
        open={Boolean(current) && editing}
        title="Editar presupuesto"
        onClose={close}
      >
        {current && (
          <BudgetForm
            workspaceId={workspace.id}
            baseCurrency={workspace.baseCurrency}
            timezone={workspace.timezone}
            budget={current}
            pending={update.isPending}
            error={update.error}
            onCancel={close}
            onSubmit={(input: BudgetInput) =>
              update.mutate(input, {
                onSuccess: () => success('Presupuesto actualizado.'),
                onError: (error) =>
                  showToast(getBudgetErrorMessage(error), 'error'),
              })
            }
          />
        )}
      </Dialog>
      <Dialog
        open={Boolean(current) && archiving}
        title="Archivar presupuesto"
        onClose={close}
        footer={<>
          <Button variant="secondary" onClick={close}>Cancelar</Button>
          <Button disabled={archive.isPending} onClick={() => current && archive.mutate(current.id, { onSuccess: () => success('Presupuesto archivado.'), onError: (error) => showToast(getBudgetErrorMessage(error), 'error') })}>Archivar</Button>
        </>}
      >
        <p>¿Quieres archivar este presupuesto? Podrás consultarlo y desarchivarlo después.</p>
        {archive.error && <p role="alert">{getBudgetErrorMessage(archive.error)}</p>}
      </Dialog>
    </div>
  )
}
