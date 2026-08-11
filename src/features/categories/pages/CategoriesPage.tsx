import { useMemo, useState } from 'react'
import {
  Button,
  Dialog,
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
import { categoryTypeLabels } from '../categories.constants'
import { CategoryCard } from '../components/CategoryCard'
import { CategoryForm } from '../components/CategoryForm'
import {
  useArchiveCategory,
  useCategories,
  useCreateCategory,
  useRestoreCategory,
  useUpdateCategory,
} from '../hooks/categories.hooks'
import type {
  Category,
  CategoryInput,
  CategoryType,
} from '../types/category.types'
import styles from '../components/categories.module.css'
import { getCategoryErrorMessage } from '../categories.errors'
import { normalizeCategorySearch } from '../categories.search'

type Scope = 'ALL' | 'SYSTEM' | 'CUSTOM'
type Status = 'ACTIVE' | 'ARCHIVED' | 'ALL'
export function CategoriesPage() {
  const workspaceId = useActiveWorkspace().activeWorkspace!.id
  const canRead = usePermission('categories.read')
  const canWrite = usePermission('categories.write')
  const [type, setType] = useState<CategoryType | 'ALL'>('ALL')
  const [scope, setScope] = useState<Scope>('ALL')
  const [status, setStatus] = useState<Status>('ACTIVE')
  const [search, setSearch] = useState('')
  const query = useCategories(workspaceId, canRead, status)
  const activeCategories = useCategories(workspaceId, canRead, 'ACTIVE')
  const create = useCreateCategory(workspaceId)
  const archive = useArchiveCategory(workspaceId)
  const restore = useRestoreCategory(workspaceId)
  const [editing, setEditing] = useState<Category | null>(null)
  const [creating, setCreating] = useState(false)
  const [archiving, setArchiving] = useState<Category | null>(null)
  const update = useUpdateCategory(workspaceId, editing?.id ?? '')
  const { showToast } = useToast()
  const visible = useMemo(() => {
    const term = normalizeCategorySearch(search.trim())
    return (query.data ?? []).filter(
      (category) =>
        (type === 'ALL' || category.type === type) &&
        (scope === 'ALL' ||
          (scope === 'SYSTEM' ? category.isSystem : !category.isSystem)) &&
        (!term || normalizeCategorySearch(category.name).includes(term)),
    )
  }, [query.data, scope, search, type])
  const activeFilters = Boolean(
    search || type !== 'ALL' || scope !== 'ALL' || status !== 'ACTIVE',
  )
  const clearFilters = () => {
    setSearch('')
    setType('ALL')
    setScope('ALL')
    setStatus('ACTIVE')
  }
  const close = () => {
    setCreating(false)
    setEditing(null)
    create.reset()
    update.reset()
  }
  const done = (message: string) => {
    close()
    showToast(message)
  }
  if (!canRead)
    return (
      <ErrorState
        title="Acceso restringido"
        message="No tienes permiso para consultar categorías."
      />
    )
  if (query.isPending && !query.data) return <PageLoader />
  if (query.isError)
    return (
      <ErrorState
        title="No pudimos cargar las categorías"
        message="Comprueba tu conexión."
        onRetry={() => void query.refetch()}
      />
    )
  return (
    <div className={styles.page}>
      <PageHeader
        title="Categorías"
        description="Organiza tus ingresos y gastos para entender mejor en qué se mueve tu dinero."
        actions={
          canWrite ? (
            <Button onClick={() => setCreating(true)}>Nueva categoría</Button>
          ) : undefined
        }
      />
      <FilterPanel active={activeFilters}>
        <div className={styles.searchField}>
          <label htmlFor="category-search">Buscar categoría</label>
          <Input
            id="category-search"
            type="search"
            placeholder="Buscar por nombre"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <div className={styles.filterSelects}>
          <label>
            Tipo
            <Select
              aria-label="Tipo"
              value={type}
              onChange={(event) =>
                setType(event.target.value as CategoryType | 'ALL')
              }
            >
              <option value="ALL">Todos los tipos</option>
              {(['INCOME', 'EXPENSE', 'TRANSFER', 'INVESTMENT'] as const).map(
                (value) => (
                  <option key={value} value={value}>
                    {categoryTypeLabels[value]}
                  </option>
                ),
              )}
            </Select>
          </label>
          <label>
            Origen
            <Select
              aria-label="Origen"
              value={scope}
              onChange={(event) => setScope(event.target.value as Scope)}
            >
              <option value="ALL">Sistema y personalizadas</option>
              <option value="SYSTEM">Sistema</option>
              <option value="CUSTOM">Personalizadas</option>
            </Select>
          </label>
          <label>
            Estado
            <Select
              aria-label="Estado"
              value={status}
              onChange={(event) => setStatus(event.target.value as Status)}
            >
              <option value="ACTIVE">Activas</option>
              <option value="ARCHIVED">Archivadas</option>
              <option value="ALL">Todas</option>
            </Select>
          </label>
        </div>
        {activeFilters && (
          <Button variant="ghost" onClick={clearFilters}>
            Limpiar filtros
          </Button>
        )}
      </FilterPanel>
      {visible.length === 0 ? (
        <EmptyState
          title="No encontramos categorías"
          message="Prueba con otro término o limpia los filtros."
          action={
            canWrite ? (
              <Button onClick={() => setCreating(true)}>Nueva categoría</Button>
            ) : undefined
          }
        />
      ) : (
        <div className={styles.grid}>
          {visible.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              parent={[
                ...(query.data ?? []),
                ...(activeCategories.data ?? []),
              ].find((item) => item.id === category.parentId)}
              canWrite={canWrite}
              busy={archive.isPending || restore.isPending}
              onEdit={() => setEditing(category)}
              onArchive={() => setArchiving(category)}
              onRestore={() =>
                restore.mutate(category.id, {
                  onSuccess: () => showToast('Categoría restaurada.'),
                  onError: (error) =>
                    showToast(getCategoryErrorMessage(error), 'error'),
                })
              }
            />
          ))}
        </div>
      )}
      <Dialog
        open={creating || Boolean(editing)}
        title={editing ? 'Editar categoría' : 'Nueva categoría'}
        onClose={() => !create.isPending && !update.isPending && close()}
      >
        <CategoryForm
          key={editing?.id ?? 'new'}
          category={editing ?? undefined}
          categories={activeCategories.data ?? []}
          pending={create.isPending || update.isPending}
          error={editing ? update.error : create.error}
          onCancel={close}
          onSubmit={(input: CategoryInput) => {
            if (editing) {
              const { name, parentId, icon, color } = input
              update.mutate(
                { name, parentId, icon, color },
                {
                  onSuccess: () => done('Categoría actualizada.'),
                  onError: (error) =>
                    showToast(getCategoryErrorMessage(error), 'error'),
                },
              )
            } else {
              create.mutate(input, {
                onSuccess: () => done('Categoría creada.'),
                onError: (error) =>
                  showToast(getCategoryErrorMessage(error), 'error'),
              })
            }
          }}
        />
      </Dialog>
      <Dialog
        open={Boolean(archiving)}
        title="Archivar categoría"
        onClose={() => !archive.isPending && setArchiving(null)}
        footer={
          <>
            <Button
              variant="secondary"
              disabled={archive.isPending}
              onClick={() => setArchiving(null)}
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              loading={archive.isPending}
              onClick={() =>
                archiving &&
                archive.mutate(archiving.id, {
                  onSuccess: () => {
                    setArchiving(null)
                    showToast('Categoría archivada.')
                  },
                  onError: (error) =>
                    showToast(getCategoryErrorMessage(error), 'error'),
                })
              }
            >
              Archivar
            </Button>
          </>
        }
      >
        <p>
          La categoría dejará de aparecer entre las categorías activas, pero se
          conservará en movimientos históricos.
        </p>
      </Dialog>
    </div>
  )
}
