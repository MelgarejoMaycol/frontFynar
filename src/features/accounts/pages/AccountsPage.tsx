import { useState } from 'react'
import { Plus } from 'lucide-react'
import {
  Button,
  ConfirmDeleteDialog,
  Dialog,
  PageHeader,
} from '@/components/ui'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { PageLoader } from '@/components/feedback/PageLoader'
import { LoadingSpinner } from '@/components/feedback/LoadingSpinner'
import { useActiveWorkspace, usePermission } from '@/features/workspace'
import { AccountCard } from '../components/AccountCard'
import { AccountForm } from '../components/AccountForm'
import { BalanceAdjustmentDialog } from '../components/BalanceAdjustmentDialog'
import {
  useAccounts,
  useArchiveAccount,
  useCreateAccount,
  useDeleteAccount,
  useFavoriteAccount,
  useRestoreAccount,
  useUpdateAccount,
} from '../hooks/accounts.hooks'
import type {
  Account,
  AccountInput,
  UpdateAccountInput,
} from '../types/account.types'
import styles from '../components/accounts.module.css'

export function AccountsPage() {
  const { activeWorkspace } = useActiveWorkspace()
  const workspaceId = activeWorkspace!.id
  const canWrite = usePermission('accounts.write')
  const [archived, setArchived] = useState(false)
  const [favoriteFilter, setFavoriteFilter] = useState<'all' | 'favorites'>('all')
  const accounts = useAccounts(workspaceId, true, archived, favoriteFilter, true)
  const create = useCreateAccount(workspaceId)
  const favorite = useFavoriteAccount(workspaceId)
  const archive = useArchiveAccount(workspaceId)
  const restore = useRestoreAccount(workspaceId)
  const remove = useDeleteAccount(workspaceId)
  const [editing, setEditing] = useState<Account | null>(null)
  const [archiving, setArchiving] = useState<Account | null>(null)
  const [deleting, setDeleting] = useState<Account | null>(null)
  const [adjusting, setAdjusting] = useState<Account | null>(null)
  const [creating, setCreating] = useState(
    () => new URLSearchParams(window.location.search).get('new') === '1',
  )
  const [message, setMessage] = useState('')
  const [creationKey, setCreationKey] = useState(0)
  const update = useUpdateAccount(workspaceId, editing?.id ?? '')

  const openCreate = () => {
    setMessage('')
    setCreating(true)
  }

  const closeForm = () => {
    setCreating(false)
    setEditing(null)
    create.reset()
    update.reset()
  }

  const saved = (text: string, consumeCreateDraft = false) => {
    setMessage(text)
    if (consumeCreateDraft) setCreationKey((value) => value + 1)
    closeForm()
  }

  if (accounts.isPending && !accounts.data) return <PageLoader />
  if (accounts.isError)
    return (
      <ErrorState
        title="No pudimos cargar tus cuentas"
        message="Comprueba tu conexión e inténtalo nuevamente."
        onRetry={() => void accounts.refetch()}
      />
    )

  return (
    <div className={styles.page}>
      <section className={styles.accountsHero}>
        <div className={styles.accountsHeroContent}>
          <span className={styles.accountsEyebrow}>Tu dinero, en un solo lugar</span>
          <PageHeader
            title="Cuentas"
            description="Administra dónde tienes y manejas tu dinero con una vista clara de cada saldo."
          />
          {canWrite && (
            <Button size="large" onClick={openCreate}>
              <Plus size={20} aria-hidden="true" />
              Nueva cuenta
            </Button>
          )}
          <div className={styles.heroHighlights} aria-label="Tipos de cuenta">
            <span>Efectivo</span>
            <span>Bancos</span>
            <span>Billeteras digitales</span>
          </div>
        </div>
        <div className={styles.accountsHeroVisual} aria-hidden="true">
          <img src="/illustrations/accounts-hero.svg" alt="" />
        </div>
      </section>

      <div className={styles.listToolbar} aria-label="Filtros de cuentas">
        <fieldset className={styles.filterGroup}>
          <legend>Estado</legend>
          <div className={styles.filterOptions}>
            <button type="button" aria-pressed={!archived} onClick={() => setArchived(false)}>Activas</button>
            <button type="button" aria-pressed={archived} onClick={() => setArchived(true)}>Archivadas</button>
          </div>
        </fieldset>
        <fieldset className={styles.filterGroup}>
          <legend>Favoritas</legend>
          <div className={styles.filterOptions}>
            <button type="button" aria-pressed={favoriteFilter === 'all'} onClick={() => setFavoriteFilter('all')}>Todas</button>
            <button type="button" aria-pressed={favoriteFilter === 'favorites'} onClick={() => setFavoriteFilter('favorites')}>Solo favoritas</button>
          </div>
        </fieldset>
        {accounts.isFetching && (
          <LoadingSpinner size="small" label="Actualizando cuentas" />
        )}
      </div>

      {message && (
        <p className={styles.success} role="status">
          {message}
        </p>
      )}

      {accounts.data.length === 0 ? (
        <EmptyState
          title={
            archived
              ? 'No hay cuentas archivadas'
              : favoriteFilter === 'favorites'
                ? 'No hay cuentas favoritas'
              : 'Aún no tienes cuentas registradas'
          }
          message={
            archived
              ? 'Las cuentas que archives aparecerán aquí y conservarán su historial.'
              : favoriteFilter === 'favorites'
                ? 'Marca una cuenta con la estrella para verla en este filtro.'
                : 'Agrega efectivo, cuentas bancarias o billeteras para comenzar a organizar tu dinero.'
          }
          action={
            canWrite ? (
              <Button onClick={openCreate}>Nueva cuenta</Button>
            ) : undefined
          }
        />
      ) : (
        <div className={styles.grid}>
          {accounts.data.map((account) => (
            <AccountCard
              key={account.id}
              account={account}
              canWrite={canWrite}
              busy={
                favorite.isPending ||
                archive.isPending ||
                restore.isPending ||
                remove.isPending
              }
              onEdit={() => {
                setMessage('')
                setEditing(account)
              }}
              onAdjust={() => setAdjusting(account)}
              onFavorite={() =>
                favorite.mutate(
                  { accountId: account.id, isFavorite: !account.isFavorite },
                  {
                    onSuccess: () =>
                      setMessage(
                        account.isFavorite
                          ? 'Cuenta retirada de favoritas.'
                          : 'Cuenta marcada como favorita.',
                      ),
                  },
                )
              }
              onArchive={() => setArchiving(account)}
              onDelete={() => {
                remove.reset()
                setDeleting(account)
              }}
              onRestore={() =>
                restore.mutate(account.id, {
                  onSuccess: () => setMessage('Cuenta restaurada.'),
                })
              }
            />
          ))}
        </div>
      )}

      <Dialog
        open={creating || Boolean(editing)}
        title={editing ? 'Editar cuenta' : 'Nueva cuenta'}
        onClose={() => !create.isPending && !update.isPending && closeForm()}
      >
        <AccountForm
          key={editing?.id ?? `new-${creationKey}`}
          currency={activeWorkspace!.baseCurrency}
          account={editing ?? undefined}
          pending={create.isPending || update.isPending}
          error={editing ? update.error : create.error}
          onCancel={closeForm}
          onSubmit={(input: AccountInput | UpdateAccountInput) =>
            editing
              ? update.mutate(input as UpdateAccountInput, {
                  onSuccess: () => saved('Cuenta actualizada.'),
                })
              : create.mutate(input as AccountInput, {
                  onSuccess: () => saved('Cuenta creada.', true),
                })
          }
        />
      </Dialog>

      <BalanceAdjustmentDialog
        key={adjusting?.id ?? 'no-adjustment'}
        workspaceId={workspaceId}
        account={adjusting}
        open={Boolean(adjusting)}
        onClose={() => setAdjusting(null)}
      />

      <Dialog
        open={Boolean(archiving)}
        title="Archivar cuenta"
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
                    setMessage('Cuenta archivada.')
                  },
                })
              }
            >
              Archivar cuenta
            </Button>
          </>
        }
      >
        La cuenta dejará de aparecer entre tus cuentas activas, pero conservará
        su historial de movimientos.
      </Dialog>

      <ConfirmDeleteDialog
        open={Boolean(deleting)}
        title="Eliminar cuenta"
        name={deleting?.name ?? ''}
        pending={remove.isPending}
        error={remove.error instanceof Error ? remove.error.message : undefined}
        onClose={() => {
          remove.reset()
          setDeleting(null)
        }}
        onConfirm={() =>
          deleting &&
          remove.mutate(deleting.id, {
            onSuccess: ({ data }) => {
              setDeleting(null)
              setMessage(
                data.mode === 'PHYSICAL'
                  ? 'Cuenta eliminada.'
                  : 'Cuenta retirada; su historial financiero se conservó.',
              )
            },
          })
        }
      />
    </div>
  )
}
