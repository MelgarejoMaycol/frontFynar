import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import {
  Button,
  ConfirmDeleteDialog,
  Dialog,
  FilterPanel,
  PageHeader,
} from '@/components/ui'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { PageLoader } from '@/components/feedback/PageLoader'
import { useAccounts } from '@/features/accounts/hooks/accounts.hooks'
import { useCategories } from '@/features/categories/hooks/categories.hooks'
import { useActiveWorkspace, usePermission } from '@/features/workspace'
import { TransactionFilters } from '../components/TransactionFilters'
import { TransactionForm } from '../components/TransactionForm'
import { TransactionList } from '../components/TransactionList'
import {
  useCancelTransaction,
  useCreateTransaction,
  useTransaction,
  useInfiniteTransactions,
  useUpdateTransaction,
} from '../hooks/transactions.hooks'
import { getTransactionErrorMessage } from '../transactions.errors'
import { formatMoney, formatTransactionDate, transactionStatusLabels, transactionTypeLabel } from '../transactions.format'
import type {
  CreateTransactionInput,
  Transaction,
  TransactionFilters as Filters,
  UpdateTransactionInput,
} from '../types/transaction.types'
import styles from '../components/transactions.module.css'

export function TransactionsPage() {
  const initialParams = new URLSearchParams(window.location.search)
  const initialAccountId = initialParams.get('accountId') ?? undefined
  const workspace = useActiveWorkspace().activeWorkspace!
  const canRead = usePermission('transactions.read'),
    canWrite = usePermission('transactions.write')
  const [filters, setFilters] = useState<Filters>({
    limit: 20,
    type: (initialParams.get('type') || undefined) as Filters['type'],
    accountId: initialParams.get('accountId') || undefined,
  })
  const [creating, setCreating] = useState(
      () => new URLSearchParams(window.location.search).get('new') === '1',
    ),
    [selected, setSelected] = useState<Transaction | null>(null),
    [editing, setEditing] = useState(false),
    [cancelling, setCancelling] = useState(false),
    [message, setMessage] = useState('')
  const [creationKey, setCreationKey] = useState(0)
  const transactions = useInfiniteTransactions(workspace.id, filters, canRead),
    accounts = useAccounts(workspace.id, canRead),
    categories = useCategories(workspace.id, canRead)
  const requestedId = initialParams.get('transactionId') ?? ''
  const detail = useTransaction(workspace.id, selected?.id ?? requestedId),
    create = useCreateTransaction(workspace.id),
    update = useUpdateTransaction(workspace.id, selected?.id ?? ''),
    cancel = useCancelTransaction(workspace.id)
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const { fetchNextPage, hasNextPage, isFetchingNextPage } = transactions
  useEffect(() => {
    const node = loadMoreRef.current
    if (!node || !hasNextPage) return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting && !isFetchingNextPage)
        void fetchNextPage()
    }, { rootMargin: '240px' })
    observer.observe(node)
    return () => observer.disconnect()
  }, [fetchNextPage, hasNextPage, isFetchingNextPage])
  if (!canRead)
    return (
      <ErrorState
        title="Acceso restringido"
        message="No tienes permiso para consultar movimientos en este workspace."
      />
    )
  if (transactions.isPending || accounts.isPending || categories.isPending)
    return <PageLoader />
  if (transactions.isError || accounts.isError || categories.isError)
    return (
      <ErrorState
        title="No pudimos cargar los movimientos"
        message={getTransactionErrorMessage(
          transactions.error ?? accounts.error ?? categories.error,
        )}
        onRetry={() =>
          void Promise.all([
            transactions.refetch(),
            accounts.refetch(),
            categories.refetch(),
          ])
        }
      />
    )
  const current = detail.data ?? selected
  const close = () => {
    if (requestedId) window.history.replaceState({}, '', '/app/transactions')
    setCreating(false)
    setEditing(false)
    setCancelling(false)
    setSelected(null)
    create.reset()
    update.reset()
    cancel.reset()
  }
  const success = (value: string) => {
    setMessage(value)
    close()
  }
  const accountName = (id: string | null) =>
    accounts.data.find((x) => x.id === id)?.name ?? 'No disponible'
  const categoryName = (id: string | null) =>
    id === null
      ? 'Sin categoría'
      : (categories.data.find((x) => x.id === id)?.name ?? 'No disponible')
  return (
    <div className={styles.page}>
      <PageHeader
        title="Movimientos"
        description="Registra y consulta ingresos, gastos y transferencias del workspace."
        actions={
          canWrite ? (
            <Button
              disabled={!accounts.data.some((account) => account.isActive)}
              onClick={() => {
                setMessage('')
                setCreationKey((value) => value + 1)
                setCreating(true)
              }}
            >
              Registrar movimiento
            </Button>
          ) : undefined
        }
      />
      {message && <p role="status">{message}</p>}
      <FilterPanel
        active={Boolean(
          filters.search ||
          filters.type ||
          filters.accountId ||
          filters.categoryId ||
          filters.dateFrom ||
          filters.dateTo,
        )}
      >
        <TransactionFilters
          value={filters}
          accounts={accounts.data}
          categories={categories.data}
          timezone={workspace.timezone}
          onChange={setFilters}
        />
      </FilterPanel>
      {transactions.data.pages[0]?.items.length === 0 ? (
        <EmptyState
          title="No hay movimientos"
          message="No encontramos movimientos para los filtros seleccionados."
        />
      ) : (
        <TransactionList
          items={transactions.data.pages.flatMap((page) => page.items).filter((item, index, all) => all.findIndex((candidate) => candidate.id === item.id) === index)}
          accounts={accounts.data}
          categories={categories.data}
          timezone={workspace.timezone}
          onOpen={setSelected}
        />
      )}
      <div ref={loadMoreRef} className={styles.pagination}>
        {transactions.isFetchingNextPage ? (
          <span role="status">Cargando más movimientos…</span>
        ) : transactions.hasNextPage ? (
          <Button variant="secondary" onClick={() => void transactions.fetchNextPage()}>
            Cargar más
          </Button>
        ) : null}
      </div>
      <Dialog
        open={creating && accounts.data.some((account) => account.isActive)}
        title="Registrar movimiento"
        onClose={close}
      >
        <TransactionForm
          key={creationKey}
          workspaceId={workspace.id}
          timezone={workspace.timezone}
          initialAccountId={initialAccountId}
          pending={create.isPending}
          error={create.error}
          onCancel={close}
          onSubmit={(input) =>
            create.mutate(input as CreateTransactionInput, {
              onSuccess: () => success('Movimiento registrado.'),
            })
          }
        />
      </Dialog>
      <Dialog
        open={Boolean(selected || requestedId) && !editing && !cancelling}
        title="Detalle del movimiento"
        onClose={close}
        footer={
          current &&
          canWrite &&
          current.status === 'CONFIRMED' &&
          current.type !== 'ADJUSTMENT' &&
          current.type !== 'DEBT_PAYMENT' &&
          current.metadata?.cardCashAdvance !== true ? (
            <>
              <Button variant="secondary" onClick={() => setEditing(true)}>
                Editar
              </Button>
              <Button variant="danger" onClick={() => setCancelling(true)}>
                Eliminar
              </Button>
            </>
          ) : undefined
        }
      >
        {detail.isPending ? (
          <PageLoader />
        ) : detail.isError ? (
          <p role="alert">{getTransactionErrorMessage(detail.error)}</p>
        ) : (
          current && (
            <dl className={styles.detail}>
              <div>
                <dt>Tipo</dt>
                <dd>
                  {transactionTypeLabel(current)}
                </dd>
              </div>
              <div>
                <dt>Estado</dt>
                <dd>{transactionStatusLabels[current.status]}</dd>
              </div>
              <div>
                <dt>Monto</dt>
                <dd>
                  {current.type === 'EXPENSE' ||
                  (current.type === 'ADJUSTMENT' &&
                    Number(current.metadata?.difference ?? 0) < 0)
                    ? '−'
                    : current.type === 'INCOME' ||
                        (current.type === 'ADJUSTMENT' &&
                          Number(current.metadata?.difference ?? 0) > 0)
                      ? '+'
                      : ''}
                  {formatMoney(current.amount, current.currency)}
                </dd>
              </div>
              <div>
                <dt>Fecha</dt>
                <dd>
                  {formatTransactionDate(
                    current.occurredAt,
                    workspace.timezone,
                  )}
                </dd>
              </div>
              <div>
                <dt>{current.metadata?.cardCashAdvance === true ? 'Tarjeta origen' : current.type === 'INCOME' ? 'Destino' : 'Cuenta'}</dt>
                <dd>{accountName(current.accountId)}</dd>
              </div>
              {current.destinationAccountId && (
                <div>
                  <dt>Cuenta destino</dt>
                  <dd>{accountName(current.destinationAccountId)}</dd>
                </div>
              )}
              <div>
                <dt>Categoría</dt>
                <dd>{current.type === 'DEBT_PAYMENT' ? 'Operación financiera especializada' : categoryName(current.categoryId)}</dd>
              </div>
              {current.type === 'DEBT_PAYMENT' && (
                <>
                  <div><dt>Crédito</dt><dd>{String(current.metadata?.debtName ?? 'No disponible')}</dd></div>
                  <div><dt>Cuenta origen</dt><dd>{current.accountId ? accountName(current.accountId) : 'Externo'}</dd></div>
                  {current.metadata?.balanceBefore != null && <div><dt>Saldo anterior</dt><dd>{formatMoney(String(current.metadata.balanceBefore), current.currency)}</dd></div>}
                  {current.metadata?.balanceAfter != null && <div><dt>Saldo posterior</dt><dd>{formatMoney(String(current.metadata.balanceAfter), current.currency)}</dd></div>}
                  {current.metadata?.strategy != null && <div><dt>Estrategia</dt><dd>{current.metadata.strategy === 'REDUCE_PAYMENT' ? 'Reducir cuota' : 'Reducir plazo'}</dd></div>}
                  {current.metadata?.debtId != null && <div><dt>Navegación</dt><dd><Link to={`/app/debts/${String(current.metadata.debtId)}`}>Ver crédito</Link></dd></div>}
                </>
              )}
              <div>
                <dt>Descripción</dt>
                <dd>{current.description || 'Sin descripción'}</dd>
              </div>
              <div>
                <dt>Comercio</dt>
                <dd>{current.merchantName || 'No indicado'}</dd>
              </div>
              <div>
                <dt>Notas</dt>
                <dd>{current.notes || 'Sin notas'}</dd>
              </div>
            </dl>
          )
        )}
      </Dialog>
      <Dialog
        open={Boolean(current) && editing}
        title="Editar movimiento"
        onClose={close}
      >
        {current && (
          <TransactionForm
            workspaceId={workspace.id}
            timezone={workspace.timezone}
            transaction={current}
            pending={update.isPending}
            error={update.error}
            onCancel={close}
            onSubmit={(input) =>
              update.mutate(input as UpdateTransactionInput, {
                onSuccess: () => success('Movimiento actualizado.'),
              })
            }
          />
        )}
      </Dialog>
      <ConfirmDeleteDialog
        open={Boolean(current) && cancelling}
        title="Eliminar movimiento"
        name={current?.description || 'Movimiento'}
        description="El backend revertirá su efecto financiero y conservará el registro cancelado para proteger la trazabilidad."
        pending={cancel.isPending}
        error={
          cancel.error ? getTransactionErrorMessage(cancel.error) : undefined
        }
        onClose={close}
        onConfirm={() =>
          current &&
          cancel.mutate(
            { id: current.id, version: current.version },
            {
              onSuccess: () =>
                success('Movimiento eliminado y saldo revertido.'),
            },
          )
        }
      />
    </div>
  )
}
