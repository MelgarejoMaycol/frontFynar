import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { HandCoins, Search, UserRoundMinus, UserRoundPlus } from 'lucide-react'
import {
  Badge,
  Button,
  Card,
  Dialog,
  FormField,
  Input,
  MoneyInput,
  Textarea,
} from '@/components/ui'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { PageLoader } from '@/components/feedback/PageLoader'
import { useAccounts } from '@/features/accounts/hooks/accounts.hooks'
import { usePermission } from '@/features/workspace'
import {
  informalBalancesApi,
  type InformalBalance,
  type InformalDirection,
} from './informal-balances.api'
import { idempotency, money, shortCalendarDate } from './format'
import styles from './informal-balances.module.css'

const today = () => new Date().toISOString().slice(0, 10)
const message = (error: unknown) =>
  error instanceof Error ? error.message : 'No fue posible completar la operación.'

export function InformalBalancesPanel({
  workspaceId,
  currency,
}: {
  workspaceId: string
  currency: string
}) {
  const canWrite = usePermission('debts.write')
  const client = useQueryClient()
  const [direction, setDirection] = useState<InformalDirection | ''>('')
  const [search, setSearch] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [settling, setSettling] = useState<InformalBalance | null>(null)

  const list = useQuery({
    queryKey: ['informal-balances', workspaceId, 'list', direction, search],
    queryFn: async ({ signal }) =>
      (
        await informalBalancesApi.list(
          workspaceId,
          { direction: direction || undefined, search: search || undefined },
          signal,
        )
      ).data,
  })
  const summary = useQuery({
    queryKey: ['informal-balances', workspaceId, 'summary'],
    queryFn: async ({ signal }) =>
      (await informalBalancesApi.summary(workspaceId, signal)).data,
  })

  const refresh = async () => {
    await Promise.all([
      client.invalidateQueries({ queryKey: ['informal-balances', workspaceId] }),
      client.invalidateQueries({ queryKey: ['accounts', workspaceId] }),
      client.invalidateQueries({ queryKey: ['dashboard', workspaceId] }),
      client.invalidateQueries({ queryKey: ['liabilities', workspaceId] }),
    ])
  }
  const archive = useMutation({
    mutationFn: (id: string) => informalBalancesApi.archive(workspaceId, id),
    onSuccess: refresh,
  })

  if (list.isPending || summary.isPending) return <PageLoader />
  if (list.isError || summary.isError)
    return (
      <ErrorState
        title="No pudimos cargar lo que debes y te deben"
        message={message(list.error ?? summary.error)}
        onRetry={() => {
          void list.refetch()
          void summary.refetch()
        }}
      />
    )

  return (
    <section className={styles.panel} aria-label="Pendientes de dinero entre personas">
      <div className={styles.intro}>
        <div>
          <h2>Entre personas</h2>
          <p>
            Guarda préstamos simples, favores y dinero pendiente sin intereses ni cuotas obligatorias.
          </p>
        </div>
        {canWrite && <Button onClick={() => setCreateOpen(true)}>Nuevo pendiente</Button>}
      </div>

      <div className={styles.metrics}>
        {(summary.data.length
          ? summary.data
          : [
              {
                currency,
                totalPayable: '0',
                totalReceivable: '0',
                net: '0',
                overdueCount: 0,
              },
            ]
        ).map((item) => (
          <div className={styles.currencyGroup} key={item.currency}>
            <Card className={styles.metric}>
              <span>Yo debo · {item.currency}</span>
              <strong>{money(item.totalPayable, item.currency)}</strong>
            </Card>
            <Card className={styles.metric}>
              <span>Me deben · {item.currency}</span>
              <strong>{money(item.totalReceivable, item.currency)}</strong>
            </Card>
            <Card className={styles.metric}>
              <span>Balance · {item.currency}</span>
              <strong>{money(item.net, item.currency)}</strong>
              {item.overdueCount > 0 && <small>{item.overdueCount} pendiente(s) vencido(s)</small>}
            </Card>
          </div>
        ))}
      </div>

      <div className={styles.filters}>
        <div className={styles.segmented} aria-label="Filtrar por tipo">
          <button className={!direction ? styles.active : ''} onClick={() => setDirection('')}>
            Todos
          </button>
          <button
            className={direction === 'PAYABLE' ? styles.active : ''}
            onClick={() => setDirection('PAYABLE')}
          >
            Yo debo
          </button>
          <button
            className={direction === 'RECEIVABLE' ? styles.active : ''}
            onClick={() => setDirection('RECEIVABLE')}
          >
            Me deben
          </button>
        </div>
        <label className={styles.search}>
          <Search size={17} aria-hidden="true" />
          <span className="visually-hidden">Buscar persona o motivo</span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar persona o motivo"
          />
        </label>
      </div>

      {list.data.length === 0 ? (
        <EmptyState
          title="No hay pendientes por aquí"
          message="Registra cuando alguien te preste dinero o cuando tú le prestes a otra persona."
          action={
            canWrite ? (
              <Button onClick={() => setCreateOpen(true)}>Registrar el primero</Button>
            ) : undefined
          }
        />
      ) : (
        <div className={styles.list}>
          {list.data.map((item) => (
            <Card className={styles.item} key={item.id}>
              <div className={styles.itemIcon} aria-hidden="true">
                {item.direction === 'PAYABLE' ? <UserRoundMinus /> : <UserRoundPlus />}
              </div>
              <div className={styles.itemMain}>
                <div className={styles.itemTitle}>
                  <div>
                    <strong>{item.counterpartyName}</strong>
                    <span>{item.description}</span>
                  </div>
                  <Badge
                    tone={
                      item.status === 'SETTLED'
                        ? 'success'
                        : item.status === 'PARTIAL'
                          ? 'warning'
                          : 'neutral'
                    }
                  >
                    {item.status === 'SETTLED'
                      ? 'Listo'
                      : item.status === 'PARTIAL'
                        ? 'Pago parcial'
                        : item.direction === 'PAYABLE'
                          ? 'Debo'
                          : 'Me deben'}
                  </Badge>
                </div>
                <div className={styles.amounts}>
                  <div>
                    <span>Pendiente</span>
                    <strong>{money(item.currentBalance, item.currency)}</strong>
                  </div>
                  <div>
                    <span>Original</span>
                    <span>{money(item.originalAmount, item.currency)}</span>
                  </div>
                  <div>
                    <span>Fecha</span>
                    <span>{shortCalendarDate(item.occurredOn)}</span>
                  </div>
                  <div>
                    <span>Vence</span>
                    <span>{item.dueOn ? shortCalendarDate(item.dueOn) : 'Sin fecha'}</span>
                  </div>
                </div>
                {canWrite && item.status !== 'SETTLED' && (
                  <div className={styles.actions}>
                    <Button onClick={() => setSettling(item)}>
                      {item.direction === 'PAYABLE' ? 'Registrar pago' : 'Registrar cobro'}
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => archive.mutate(item.id)}
                      disabled={archive.isPending}
                    >
                      Archivar
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <CreateInformalDialog
        open={createOpen}
        workspaceId={workspaceId}
        currency={currency}
        onClose={() => setCreateOpen(false)}
        onSaved={async () => {
          setCreateOpen(false)
          await refresh()
        }}
      />
      <SettleInformalDialog
        item={settling}
        workspaceId={workspaceId}
        onClose={() => setSettling(null)}
        onSaved={async () => {
          setSettling(null)
          await refresh()
        }}
      />
    </section>
  )
}

function CreateInformalDialog({
  open,
  workspaceId,
  currency,
  onClose,
  onSaved,
}: {
  open: boolean
  workspaceId: string
  currency: string
  onClose: () => void
  onSaved: () => Promise<void>
}) {
  const [direction, setDirection] = useState<InformalDirection>('PAYABLE')
  const [person, setPerson] = useState('')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [occurredOn, setOccurredOn] = useState(today())
  const [dueOn, setDueOn] = useState('')
  const [notes, setNotes] = useState('')
  const mutation = useMutation({
    mutationFn: () =>
      informalBalancesApi.create(workspaceId, {
        direction,
        counterpartyName: person.trim(),
        description: description.trim(),
        amount,
        currency,
        occurredOn,
        dueOn: dueOn || null,
        notes: notes.trim() || null,
      }),
    onSuccess: onSaved,
  })
  const valid = Boolean(person.trim() && description.trim() && Number(amount) > 0 && occurredOn)
  return (
    <Dialog
      open={open}
      title="Nuevo pendiente entre personas"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={mutation.isPending}>
            Cancelar
          </Button>
          <Button loading={mutation.isPending} disabled={!valid} onClick={() => mutation.mutate()}>
            Guardar
          </Button>
        </>
      }
    >
      <div className={styles.form}>
        <div className={styles.choice}>
          <button
            type="button"
            className={direction === 'PAYABLE' ? styles.choiceActive : ''}
            onClick={() => setDirection('PAYABLE')}
          >
            <UserRoundMinus />
            Yo debo
          </button>
          <button
            type="button"
            className={direction === 'RECEIVABLE' ? styles.choiceActive : ''}
            onClick={() => setDirection('RECEIVABLE')}
          >
            <UserRoundPlus />
            Me deben
          </button>
        </div>
        <FormField
          label={direction === 'PAYABLE' ? '¿A quién le debes?' : '¿Quién te debe?'}
          htmlFor="informal-person"
        >
          <Input
            id="informal-person"
            autoFocus
            value={person}
            onChange={(event) => setPerson(event.target.value)}
            placeholder="Ej. Carlos"
          />
        </FormField>
        <FormField label="¿Por qué quedó pendiente?" htmlFor="informal-description">
          <Input
            id="informal-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Ej. Gasolina de la moto"
          />
        </FormField>
        <FormField label={`Monto · ${currency}`} htmlFor="informal-amount">
          <MoneyInput id="informal-amount" minorUnits value={amount} onValueChange={setAmount} />
        </FormField>
        <div className={styles.twoCols}>
          <FormField label="Fecha" htmlFor="informal-date">
            <Input
              id="informal-date"
              type="date"
              value={occurredOn}
              onChange={(event) => setOccurredOn(event.target.value)}
            />
          </FormField>
          <FormField label="Fecha para recordar (opcional)" htmlFor="informal-due">
            <Input
              id="informal-due"
              type="date"
              value={dueOn}
              onChange={(event) => setDueOn(event.target.value)}
            />
          </FormField>
        </div>
        <FormField label="Nota (opcional)" htmlFor="informal-notes">
          <Textarea
            id="informal-notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Algo que quieras recordar"
          />
        </FormField>
        {mutation.isError && <p className={styles.error}>{message(mutation.error)}</p>}
      </div>
    </Dialog>
  )
}

function SettleInformalDialog({
  item,
  workspaceId,
  onClose,
  onSaved,
}: {
  item: InformalBalance | null
  workspaceId: string
  onClose: () => void
  onSaved: () => Promise<void>
}) {
  const [amount, setAmount] = useState('')
  const [accountId, setAccountId] = useState('')
  const [notes, setNotes] = useState('')
  const accounts = useAccounts(workspaceId, Boolean(item), false, 'all', true)
  const availableAccounts = useMemo(
    () =>
      (accounts.data ?? []).filter(
        (account) => account.nature === 'ASSET' && account.currency === item?.currency,
      ),
    [accounts.data, item?.currency],
  )
  const shownAmount = amount || item?.currentBalance || ''
  const mutation = useMutation({
    mutationFn: () =>
      informalBalancesApi.pay(workspaceId, item!.id, {
        amount: shownAmount,
        paidAt: new Date().toISOString(),
        accountId: accountId || null,
        notes: notes.trim() || null,
        idempotencyKey: idempotency(),
      }),
    onSuccess: onSaved,
  })
  if (!item) return null
  const valid = Number(shownAmount) > 0 && Number(shownAmount) <= Number(item.currentBalance)
  return (
    <Dialog
      open
      title={
        item.direction === 'PAYABLE'
          ? `Pagar a ${item.counterpartyName}`
          : `Cobrar a ${item.counterpartyName}`
      }
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={mutation.isPending}>
            Cancelar
          </Button>
          <Button loading={mutation.isPending} disabled={!valid} onClick={() => mutation.mutate()}>
            {item.direction === 'PAYABLE' ? 'Registrar pago' : 'Registrar cobro'}
          </Button>
        </>
      }
    >
      <div className={styles.form}>
        <div className={styles.settleHint}>
          <HandCoins />
          <p>
            Pendiente actual: <strong>{money(item.currentBalance, item.currency)}</strong>. Puedes
            pagar/cobrar todo o solo una parte.
          </p>
        </div>
        <FormField label={`Monto · ${item.currency}`} htmlFor="settle-amount">
          <MoneyInput
            id="settle-amount"
            minorUnits
            value={shownAmount}
            onValueChange={setAmount}
          />
        </FormField>
        <FormField label="Cuenta de Fynar (opcional)" htmlFor="settle-account">
          <select
            id="settle-account"
            className={styles.nativeSelect}
            value={accountId}
            onChange={(event) => setAccountId(event.target.value)}
          >
            <option value="">Pago/cobro fuera de Fynar</option>
            {availableAccounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name} · {money(account.currentBalance, account.currency)}
              </option>
            ))}
          </select>
        </FormField>
        <p className={styles.help}>
          {accountId
            ? item.direction === 'PAYABLE'
              ? 'El dinero saldrá de esta cuenta y quedará un movimiento de pago.'
              : 'El dinero entrará a esta cuenta y quedará un movimiento de cobro.'
            : 'Solo se actualizará el pendiente; no se tocará ningún saldo de tus cuentas.'}
        </p>
        <FormField label="Nota (opcional)" htmlFor="settle-notes">
          <Textarea id="settle-notes" value={notes} onChange={(event) => setNotes(event.target.value)} />
        </FormField>
        {mutation.isError && <p className={styles.error}>{message(mutation.error)}</p>}
      </div>
    </Dialog>
  )
}
