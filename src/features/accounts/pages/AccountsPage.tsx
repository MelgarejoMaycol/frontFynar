import { useState } from 'react'
import { Button, Dialog, PageHeader, Select } from '@/components/ui'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { PageLoader } from '@/components/feedback/PageLoader'
import { LoadingSpinner } from '@/components/feedback/LoadingSpinner'
import { useActiveWorkspace, usePermission } from '@/features/workspace'
import { AccountCard } from '../components/AccountCard'
import { AccountForm } from '../components/AccountForm'
import {
  useAccounts,
  useArchiveAccount,
  useCreateAccount,
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
  const accounts = useAccounts(workspaceId, true, archived)
  const create = useCreateAccount(workspaceId)
  const favorite = useFavoriteAccount(workspaceId)
  const archive = useArchiveAccount(workspaceId)
  const restore = useRestoreAccount(workspaceId)
  const [editing, setEditing] = useState<Account | null>(null)
  const [archiving, setArchiving] = useState<Account | null>(null)
  const [creating, setCreating] = useState(
    () => new URLSearchParams(window.location.search).get('new') === '1',
  )
  const [message, setMessage] = useState('')
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
  const saved = (text: string) => {
    setMessage(text)
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
      <PageHeader
        title="Cuentas"
        description="Administra dónde tienes y manejas tu dinero."
        actions={
          canWrite ? (
            <Button onClick={openCreate}>Nueva cuenta</Button>
          ) : undefined
        }
      />
      <div className={styles.listToolbar}>
        <label htmlFor="account-status">Estado</label>
        <Select
          id="account-status"
          value={archived ? 'archived' : 'active'}
          onChange={(event) => setArchived(event.target.value === 'archived')}
        >
          <option value="active">Activas</option>
          <option value="archived">Archivadas</option>
        </Select>
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
              : 'Aún no tienes cuentas registradas'
          }
          message={
            archived
              ? 'Las cuentas que archives aparecerán aquí y conservarán su historial.'
              : 'Agrega efectivo, cuentas bancarias, billeteras o tarjetas para comenzar a organizar tu dinero.'
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
                favorite.isPending || archive.isPending || restore.isPending
              }
              onEdit={() => {
                setMessage('')
                setEditing(account)
              }}
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
          key={editing?.id ?? 'new'}
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
                  onSuccess: () => saved('Cuenta creada.'),
                })
          }
        />
      </Dialog>
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
    </div>
  )
}
