import { useMemo, useState, type FormEvent } from 'react'
import { HandCoins, Plus, Search } from 'lucide-react'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { PageLoader } from '@/components/feedback/PageLoader'
import {
  Button,
  Dialog,
  Input,
  MoneyInput,
  PageHeader,
  Textarea,
} from '@/components/ui'
import { useActiveWorkspace, usePermission } from '@/features/workspace'
import {
  useAddPersonalBalanceEntry,
  useArchivePersonalBalance,
  useCreatePersonalBalance,
  usePersonalBalance,
  usePersonalBalances,
  usePersonalBalancesSummary,
  useSettlePersonalBalance,
  useUpdatePersonalBalance,
} from './hooks'
import type {
  PersonalBalance,
  PersonalBalanceDirection,
} from './types'
import styles from './personal-balances.module.css'

type Filter = 'all' | 'PAYABLE' | 'RECEIVABLE' | 'SETTLED'

const today = () => new Date().toISOString().slice(0, 10)
const money = (value: string, currency: string) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value))
const shortDate = (value: string | null) => {
  if (!value) return 'Sin fecha límite'
  return new Intl.DateTimeFormat('es-CO', {
    day: 'numeric',
    month: 'short',
  }).format(new Date(`${value}T00:00:00`))
}
const statusLabel: Record<PersonalBalance['status'], string> = {
  OPEN: 'Pendiente',
  PARTIAL: 'Parcial',
  SETTLED: 'Saldado',
  CANCELLED: 'Cancelado',
}

function CreateDialog({
  open,
  workspaceCurrency,
  pending,
  error,
  onClose,
  onSubmit,
}: {
  open: boolean
  workspaceCurrency: string
  pending: boolean
  error: Error | null
  onClose: () => void
  onSubmit: (input: {
    counterpartyName: string
    direction: PersonalBalanceDirection
    amount: string
    currency: string
    description?: string
    occurredOn: string
    dueOn?: string | null
    notes?: string
  }) => void
}) {
  const [direction, setDirection] = useState<PersonalBalanceDirection>('PAYABLE')
  const [counterpartyName, setCounterpartyName] = useState('')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [occurredOn, setOccurredOn] = useState(today())
  const [dueOn, setDueOn] = useState('')
  const [notes, setNotes] = useState('')
  const valid = counterpartyName.trim() && Number(amount) > 0
  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!valid) return
    onSubmit({
      counterpartyName: counterpartyName.trim(),
      direction,
      amount,
      currency: workspaceCurrency,
      description: description.trim() || undefined,
      occurredOn,
      dueOn: dueOn || null,
      notes: notes.trim() || undefined,
    })
  }
  return (
    <Dialog open={open} title="Registrar deuda o cobro" onClose={onClose}>
      <form className={styles.form} onSubmit={submit}>
        <div className={styles.directionGrid} role="radiogroup" aria-label="Tipo de saldo">
          <button
            type="button"
            className={direction === 'PAYABLE' ? styles.directionActive : styles.directionCard}
            aria-pressed={direction === 'PAYABLE'}
            onClick={() => setDirection('PAYABLE')}
          >
            <strong>Yo debo</strong>
            <span>Recibí dinero o alguien pagó algo por mí.</span>
          </button>
          <button
            type="button"
            className={direction === 'RECEIVABLE' ? styles.directionActive : styles.directionCard}
            aria-pressed={direction === 'RECEIVABLE'}
            onClick={() => setDirection('RECEIVABLE')}
          >
            <strong>Me deben</strong>
            <span>Presté dinero o pagué algo por otra persona.</span>
          </button>
        </div>
        <label className={styles.field}>
          <span>Persona</span>
          <Input
            value={counterpartyName}
            onChange={(event) => setCounterpartyName(event.target.value)}
            placeholder="Ej. Hermano"
            autoFocus
            required
          />
        </label>
        <label className={styles.field}>
          <span>Concepto</span>
          <Input
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Ej. Gasolina"
          />
        </label>
        <label className={styles.field}>
          <span>Monto</span>
          <MoneyInput
            value={amount}
            onValueChange={setAmount}
            currency={workspaceCurrency}
            minorUnits
            placeholder="$ 0,00"
            required
          />
        </label>
        <div className={styles.twoColumns}>
          <label className={styles.field}>
            <span>Fecha</span>
            <Input
              type="date"
              value={occurredOn}
              onChange={(event) => setOccurredOn(event.target.value)}
              required
            />
          </label>
          <label className={styles.field}>
            <span>Fecha esperada de pago (opcional)</span>
            <Input
              type="date"
              value={dueOn}
              onChange={(event) => setDueOn(event.target.value)}
            />
          </label>
        </div>
        <label className={styles.field}>
          <span>Notas</span>
          <Textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Opcional"
            rows={3}
          />
        </label>
        {error && <p className={styles.error}>{error.message}</p>}
        <div className={styles.dialogActions}>
          <Button type="button" variant="secondary" onClick={onClose} disabled={pending}>
            Cancelar
          </Button>
          <Button type="submit" loading={pending} disabled={!valid}>
            Guardar
          </Button>
        </div>
      </form>
    </Dialog>
  )
}

function EntryDialog({
  item,
  type,
  open,
  pending,
  error,
  onClose,
  onSubmit,
}: {
  item: PersonalBalance | null
  type: 'INCREASE' | 'PAYMENT'
  open: boolean
  pending: boolean
  error: Error | null
  onClose: () => void
  onSubmit: (amount: string, notes?: string) => void
}) {
  const [amount, setAmount] = useState('')
  const [notes, setNotes] = useState('')
  const isPayment = type === 'PAYMENT'
  const action = item?.direction === 'PAYABLE' ? 'pago' : 'cobro'
  const title = isPayment ? `Registrar ${action}` : 'Añadir monto'
  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (Number(amount) <= 0) return
    onSubmit(amount, notes.trim() || undefined)
  }
  return (
    <Dialog open={open} title={title} onClose={onClose}>
      <form className={styles.form} onSubmit={submit}>
        {item && (
          <p className={styles.modalContext}>
            {item.counterpartyName} · pendiente {money(item.currentBalance, item.currency)}
          </p>
        )}
        <label className={styles.field}>
          <span>Monto</span>
          <MoneyInput
            value={amount}
            onValueChange={setAmount}
            currency={item?.currency ?? 'COP'}
            minorUnits
            autoFocus
          />
        </label>
        <label className={styles.field}>
          <span>Nota</span>
          <Textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder={isPayment ? 'Ej. Pago en efectivo' : 'Ej. Me prestó otros $5.000'}
            rows={3}
          />
        </label>
        {error && <p className={styles.error}>{error.message}</p>}
        <div className={styles.dialogActions}>
          <Button type="button" variant="secondary" onClick={onClose} disabled={pending}>
            Cancelar
          </Button>
          <Button type="submit" loading={pending} disabled={Number(amount) <= 0}>
            Guardar
          </Button>
        </div>
      </form>
    </Dialog>
  )
}

function EditDialog({
  item,
  pending,
  error,
  onClose,
  onSubmit,
}: {
  item: PersonalBalance | null
  pending: boolean
  error: Error | null
  onClose: () => void
  onSubmit: (input: {
    counterpartyName: string
    description: string | null
    dueOn: string | null
    notes: string | null
  }) => void
}) {
  const [counterpartyName, setCounterpartyName] = useState(item?.counterpartyName ?? '')
  const [description, setDescription] = useState(item?.description ?? '')
  const [dueOn, setDueOn] = useState(item?.dueOn ?? '')
  const [notes, setNotes] = useState(item?.notes ?? '')
  if (!item) return null
  return (
    <Dialog open title="Editar registro" onClose={onClose}>
      <form
        className={styles.form}
        onSubmit={(event) => {
          event.preventDefault()
          if (!counterpartyName.trim()) return
          onSubmit({
            counterpartyName: counterpartyName.trim(),
            description: description.trim() || null,
            dueOn: dueOn || null,
            notes: notes.trim() || null,
          })
        }}
      >
        <label className={styles.field}>
          <span>Persona</span>
          <Input value={counterpartyName} onChange={(event) => setCounterpartyName(event.target.value)} />
        </label>
        <label className={styles.field}>
          <span>Concepto</span>
          <Input value={description} onChange={(event) => setDescription(event.target.value)} />
        </label>
        <label className={styles.field}>
          <span>Fecha esperada de pago (opcional)</span>
          <Input type="date" value={dueOn} onChange={(event) => setDueOn(event.target.value)} />
        </label>
        <label className={styles.field}>
          <span>Notas</span>
          <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} />
        </label>
        {error && <p className={styles.error}>{error.message}</p>}
        <div className={styles.dialogActions}>
          <Button type="button" variant="secondary" onClick={onClose} disabled={pending}>Cancelar</Button>
          <Button type="submit" loading={pending}>Guardar cambios</Button>
        </div>
      </form>
    </Dialog>
  )
}

export function PersonalBalancesPage() {
  const { activeWorkspace } = useActiveWorkspace()
  const workspaceId = activeWorkspace!.id
  const canWrite = usePermission('debts.write')
  const [filter, setFilter] = useState<Filter>('all')
  const [search, setSearch] = useState('')
  const [creating, setCreating] = useState(false)
  const [message, setMessage] = useState('')
  const [entryTarget, setEntryTarget] = useState<PersonalBalance | null>(null)
  const [entryType, setEntryType] = useState<'INCREASE' | 'PAYMENT'>('PAYMENT')
  const [detailId, setDetailId] = useState('')
  const [editing, setEditing] = useState<PersonalBalance | null>(null)
  const [archiving, setArchiving] = useState<PersonalBalance | null>(null)

  const filters = useMemo(
    () => ({
      direction:
        filter === 'PAYABLE' || filter === 'RECEIVABLE' ? filter : undefined,
      status: filter === 'SETTLED' ? 'SETTLED' : undefined,
      q: search.trim() || undefined,
    }),
    [filter, search],
  )
  const list = usePersonalBalances(workspaceId, filters)
  const summary = usePersonalBalancesSummary(workspaceId)
  const detail = usePersonalBalance(workspaceId, detailId)
  const create = useCreatePersonalBalance(workspaceId)
  const addEntry = useAddPersonalBalanceEntry(workspaceId, entryTarget?.id ?? '')
  const settle = useSettlePersonalBalance(workspaceId)
  const archive = useArchivePersonalBalance(workspaceId)
  const update = useUpdatePersonalBalance(workspaceId, editing?.id ?? '')
  const summaryCurrency =
    summary.data?.currencies.find(({ currency }) => currency === activeWorkspace!.baseCurrency) ??
    summary.data?.currencies[0]

  if (list.isPending && !list.data) return <PageLoader />
  if (list.isError)
    return (
      <ErrorState
        title="No pudimos cargar Deudas y cobros"
        message="Comprueba tu conexión e inténtalo nuevamente."
        onRetry={() => void list.refetch()}
      />
    )

  const openEntry = (item: PersonalBalance, type: 'INCREASE' | 'PAYMENT') => {
    setEntryTarget(item)
    setEntryType(type)
    addEntry.reset()
  }

  return (
    <div className={styles.page}>
      <PageHeader
        title="Deudas y cobros"
        description="Controla fácilmente lo que debes y lo que otras personas te deben, sin intereses ni cuotas."
        actions={
          canWrite ? (
            <Button onClick={() => setCreating(true)}>
              <Plus size={17} aria-hidden="true" /> Registrar
            </Button>
          ) : undefined
        }
      />

      <section className={styles.summaryGrid} aria-label="Resumen de deudas y cobros">
        <article className={styles.summaryCard}>
          <span>Debo</span>
          <strong>{money(summaryCurrency?.iOwe ?? '0', summaryCurrency?.currency ?? activeWorkspace!.baseCurrency)}</strong>
          <small>{summaryCurrency?.iOweCount ?? 0} pendientes</small>
        </article>
        <article className={styles.summaryCard}>
          <span>Me deben</span>
          <strong>{money(summaryCurrency?.owedToMe ?? '0', summaryCurrency?.currency ?? activeWorkspace!.baseCurrency)}</strong>
          <small>{summaryCurrency?.owedToMeCount ?? 0} pendientes</small>
        </article>
        <article className={styles.summaryCard}>
          <span>Balance</span>
          <strong>{money(summaryCurrency?.netPosition ?? '0', summaryCurrency?.currency ?? activeWorkspace!.baseCurrency)}</strong>
          <small>{Number(summaryCurrency?.netPosition ?? 0) >= 0 ? 'A tu favor' : 'Por pagar'}</small>
        </article>
      </section>

      <div className={styles.toolbar}>
        <div className={styles.filters} aria-label="Filtros">
          {([
            ['all', 'Todos'],
            ['PAYABLE', 'Debo'],
            ['RECEIVABLE', 'Me deben'],
            ['SETTLED', 'Saldados'],
          ] as const).map(([id, label]) => (
            <button
              key={id}
              type="button"
              aria-pressed={filter === id}
              onClick={() => setFilter(id)}
            >
              {label}
            </button>
          ))}
        </div>
        <label className={styles.searchBox}>
          <Search size={17} aria-hidden="true" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar persona o concepto..."
            aria-label="Buscar persona o concepto"
          />
        </label>
      </div>

      {message && <p className={styles.success} role="status">{message}</p>}

      {list.data!.length === 0 ? (
        <EmptyState
          title="No hay registros para mostrar"
          message="Registra un préstamo informal, un dinero que debes o un dinero que te deben."
          action={canWrite ? <Button onClick={() => setCreating(true)}>Registrar</Button> : undefined}
        />
      ) : (
        <div className={styles.list}>
          {list.data!.map((item) => (
            <article key={item.id} className={styles.balanceCard}>
              <button className={styles.cardMain} type="button" onClick={() => setDetailId(item.id)}>
                <span className={styles.avatar} aria-hidden="true">{item.counterpartyName.slice(0, 1).toUpperCase()}</span>
                <span className={styles.cardText}>
                  <strong>{item.counterpartyName}</strong>
                  <small>{item.description || (item.direction === 'PAYABLE' ? 'Dinero que debes' : 'Dinero que te deben')}</small>
                  <span>{shortDate(item.dueOn)} · {statusLabel[item.status]}</span>
                </span>
                <span className={styles.amountBlock}>
                  <strong>{money(item.currentBalance, item.currency)}</strong>
                  <small className={item.direction === 'PAYABLE' ? styles.payable : styles.receivable}>
                    {item.direction === 'PAYABLE' ? 'Debo' : 'Me deben'}
                  </small>
                </span>
              </button>
              {canWrite && item.status !== 'SETTLED' && (
                <div className={styles.quickActions}>
                  <Button variant="secondary" onClick={() => openEntry(item, 'PAYMENT')}>
                    {item.direction === 'PAYABLE' ? 'Registrar pago' : 'Registrar cobro'}
                  </Button>
                  <Button variant="secondary" onClick={() => openEntry(item, 'INCREASE')}>Añadir monto</Button>
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      <CreateDialog
        key={creating ? 'create-open' : 'create-closed'}
        open={creating}
        workspaceCurrency={activeWorkspace!.baseCurrency}
        pending={create.isPending}
        error={create.error instanceof Error ? create.error : null}
        onClose={() => !create.isPending && setCreating(false)}
        onSubmit={(input) =>
          create.mutate(input, {
            onSuccess: () => {
              setCreating(false)
              setMessage('Registro creado correctamente.')
            },
          })
        }
      />

      <EntryDialog
        key={`${entryTarget?.id ?? 'none'}-${entryType}`}
        item={entryTarget}
        type={entryType}
        open={Boolean(entryTarget)}
        pending={addEntry.isPending}
        error={addEntry.error instanceof Error ? addEntry.error : null}
        onClose={() => !addEntry.isPending && setEntryTarget(null)}
        onSubmit={(amount, notes) =>
          addEntry.mutate(
            { type: entryType, amount, notes },
            {
              onSuccess: () => {
                setEntryTarget(null)
                setMessage(entryType === 'PAYMENT' ? 'Movimiento registrado.' : 'Monto añadido.')
              },
            },
          )
        }
      />

      <Dialog
        open={Boolean(detailId)}
        title={detail.data?.counterpartyName ?? 'Detalle'}
        onClose={() => setDetailId('')}
      >
        {detail.isPending ? (
          <div className={styles.detailLoading}>Cargando historial...</div>
        ) : detail.isError || !detail.data ? (
          <p className={styles.error}>No pudimos cargar este registro.</p>
        ) : (
          <div className={styles.detail}>
            <div className={styles.detailAmount}>
              <span>{detail.data.direction === 'PAYABLE' ? 'Debes actualmente' : 'Te deben actualmente'}</span>
              <strong>{money(detail.data.currentBalance, detail.data.currency)}</strong>
            </div>
            <dl className={styles.metaGrid}>
              <div><dt>Inicial</dt><dd>{money(detail.data.originalAmount, detail.data.currency)}</dd></div>
              <div><dt>Desde</dt><dd>{shortDate(detail.data.occurredOn)}</dd></div>
              <div><dt>Vence</dt><dd>{shortDate(detail.data.dueOn)}</dd></div>
              <div><dt>Estado</dt><dd>{statusLabel[detail.data.status]}</dd></div>
            </dl>
            <div className={styles.history}>
              <h3>Historial</h3>
              {detail.data.entries?.map((entry) => (
                <div key={entry.id} className={styles.historyRow}>
                  <span>
                    <strong>{entry.type === 'PAYMENT' ? (detail.data!.direction === 'PAYABLE' ? 'Pago' : 'Cobro') : entry.type === 'INCREASE' ? 'Monto añadido' : 'Registro inicial'}</strong>
                    <small>{new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(entry.occurredAt))}</small>
                  </span>
                  <strong className={entry.type === 'PAYMENT' ? styles.historyPayment : undefined}>
                    {entry.type === 'PAYMENT' ? '−' : '+'}{money(entry.amount, detail.data.currency)}
                  </strong>
                </div>
              ))}
            </div>
            {canWrite && (
              <div className={styles.detailActions}>
                <Button variant="secondary" onClick={() => { setEditing(detail.data!); setDetailId('') }}>Editar</Button>
                {detail.data.status !== 'SETTLED' && (
                  <Button
                    variant="secondary"
                    loading={settle.isPending}
                    onClick={() =>
                      settle.mutate(detail.data!.id, {
                        onSuccess: () => {
                          setDetailId('')
                          setMessage('Saldo marcado como saldado.')
                        },
                      })
                    }
                  >
                    Marcar como saldado
                  </Button>
                )}
                <Button variant="danger" onClick={() => { setArchiving(detail.data!); setDetailId('') }}>Archivar</Button>
              </div>
            )}
          </div>
        )}
      </Dialog>

      <EditDialog
        key={editing?.id ?? 'no-edit'}
        item={editing}
        pending={update.isPending}
        error={update.error instanceof Error ? update.error : null}
        onClose={() => !update.isPending && setEditing(null)}
        onSubmit={(input) =>
          update.mutate(input, {
            onSuccess: () => {
              setEditing(null)
              setMessage('Registro actualizado.')
            },
          })
        }
      />

      <Dialog
        open={Boolean(archiving)}
        title="Archivar registro"
        onClose={() => !archive.isPending && setArchiving(null)}
        footer={
          <>
            <Button variant="secondary" disabled={archive.isPending} onClick={() => setArchiving(null)}>Cancelar</Button>
            <Button
              variant="danger"
              loading={archive.isPending}
              onClick={() =>
                archiving && archive.mutate(archiving.id, {
                  onSuccess: () => {
                    setArchiving(null)
                    setMessage('Registro archivado.')
                  },
                })
              }
            >
              Archivar
            </Button>
          </>
        }
      >
        Este registro dejará de aparecer en la lista principal. Su historial no se convertirá en un crédito ni en un pago recurrente.
      </Dialog>
    </div>
  )
}

export function PersonalBalancesIcon() {
  return <HandCoins aria-hidden="true" />
}
