import { useMemo, useState, type FormEvent } from 'react'
import { HandCoins, Plus, Search } from 'lucide-react'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { PageLoader } from '@/components/feedback/PageLoader'
import { Button, Dialog, Input, MoneyInput, PageHeader, Textarea } from '@/components/ui'
import { useActiveWorkspace, usePermission } from '@/features/workspace'
import { useAccounts } from '@/features/accounts/hooks/accounts.hooks'
import { AccountSelect } from '@/features/accounts/components/AccountSelect'
import {
  useAddPersonalBalanceEntry,
  useArchivePersonalBalance,
  useCreatePersonalBalance,
  usePersonalBalance,
  usePersonalBalances,
  usePersonalBalancesSummary,
  useUpdatePersonalBalance,
  usePeople,
  useCreatePerson,
  useReversePersonalBalanceEntry,
  useUpdatePerson,
  useArchivePerson,
} from './hooks'
import type { PersonalBalance, PersonalBalanceDirection, FinancialPerson } from './types'
import styles from './personal-balances.module.css'

type Filter = 'all' | 'PAYABLE' | 'RECEIVABLE' | 'SETTLED'
type Accounts = Parameters<typeof AccountSelect>[0]['accounts']

const today = () => new Date().toISOString().slice(0, 10)
const money = (value: string, currency: string) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value))
const shortDate = (value: string | null) => {
  if (!value) return 'Sin fecha límite'
  return new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short' }).format(new Date(`${value}T00:00:00`))
}
const statusLabel: Record<PersonalBalance['status'], string> = {
  OPEN: 'Pendiente', PARTIAL: 'Parcial', SETTLED: 'Saldado', CANCELLED: 'Cancelado',
}

function PersonDialog({ person, pending, error, onClose, onSubmit }: {
  person: FinancialPerson | null | undefined
  pending: boolean
  error: Error | null
  onClose: () => void
  onSubmit: (input: { name: string; relationship: string | null; notes: string | null }) => void
}) {
  const [name, setName] = useState(person?.name ?? '')
  const [relationship, setRelationship] = useState(person?.relationship ?? '')
  const [notes, setNotes] = useState(person?.notes ?? '')
  return <Dialog open title={person ? 'Editar persona' : 'Nueva persona'} onClose={onClose}>
    <form className={styles.form} onSubmit={(event) => {
      event.preventDefault()
      if (name.trim()) onSubmit({ name: name.trim(), relationship: relationship.trim() || null, notes: notes.trim() || null })
    }}>
      <label className={styles.field}><span>Nombre</span><Input value={name} onChange={(e) => setName(e.target.value)} required autoFocus /></label>
      <label className={styles.field}><span>Parentesco o relación</span><Input value={relationship} onChange={(e) => setRelationship(e.target.value)} /></label>
      <label className={styles.field}><span>Notas</span><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} /></label>
      {error ? <p className={styles.error}>{error.message}</p> : null}
      <div className={styles.dialogActions}><Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button><Button type="submit" loading={pending} disabled={!name.trim()}>Guardar</Button></div>
    </form>
  </Dialog>
}

function CreateDialog({ open, workspaceCurrency, pending, error, onClose, onSubmit, people, accounts, onCreatePerson }: {
  open: boolean
  workspaceCurrency: string
  pending: boolean
  error: Error | null
  onClose: () => void
  onSubmit: (input: {
    personId: string
    direction: PersonalBalanceDirection
    amount: string
    currency: string
    sourceAccountId?: string | null
    description?: string
    occurredOn: string
    dueOn?: string | null
    notes?: string
  }) => void
  people: FinancialPerson[]
  accounts: Accounts
  onCreatePerson: (input: { name: string; relationship?: string | null }, select: (id: string) => void) => void
}) {
  const [direction, setDirection] = useState<PersonalBalanceDirection>('PAYABLE')
  const [personId, setPersonId] = useState('')
  const [sourceAccountId, setSourceAccountId] = useState('')
  const [addingPerson, setAddingPerson] = useState(false)
  const [personName, setPersonName] = useState('')
  const [relationship, setRelationship] = useState('')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [occurredOn, setOccurredOn] = useState(today())
  const [dueOn, setDueOn] = useState('')
  const [notes, setNotes] = useState('')
  const needsSource = direction === 'RECEIVABLE'
  const valid = Boolean(personId) && Number(amount) > 0 && (!needsSource || Boolean(sourceAccountId))
  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!valid) return
    onSubmit({
      personId,
      direction,
      amount,
      currency: workspaceCurrency,
      sourceAccountId: needsSource ? sourceAccountId : null,
      description: description.trim() || undefined,
      occurredOn,
      dueOn: dueOn || null,
      notes: notes.trim() || undefined,
    })
  }
  return <Dialog open={open} title="Registrar deuda o cobro" onClose={onClose}>
    <form className={styles.form} onSubmit={submit}>
      <div className={styles.directionGrid} role="radiogroup" aria-label="Tipo de saldo">
        <button type="button" className={direction === 'PAYABLE' ? styles.directionActive : styles.directionCard} aria-pressed={direction === 'PAYABLE'} onClick={() => setDirection('PAYABLE')}>
          <strong>Yo debo</strong><span>Recibí dinero o alguien pagó algo por mí.</span>
        </button>
        <button type="button" className={direction === 'RECEIVABLE' ? styles.directionActive : styles.directionCard} aria-pressed={direction === 'RECEIVABLE'} onClick={() => setDirection('RECEIVABLE')}>
          <strong>Me deben</strong><span>Presté dinero o pagué algo por otra persona.</span>
        </button>
      </div>
      <label className={styles.field}><span>Persona</span><select value={personId} onChange={(event) => setPersonId(event.target.value)} required autoFocus>
        <option value="">Buscar o seleccionar persona...</option>
        {people.map((person) => <option key={person.id} value={person.id}>{person.name}{person.relationship ? ` · ${person.relationship}` : ''}</option>)}
      </select></label>
      <Button type="button" variant="secondary" onClick={() => setAddingPerson(true)}><Plus size={16} aria-hidden="true" /> Agregar persona</Button>
      <label className={styles.field}><span>Concepto</span><Input value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Ej. Gasolina" /></label>
      <label className={styles.field}><span>Monto</span><MoneyInput value={amount} onValueChange={setAmount} currency={workspaceCurrency} minorUnits placeholder="$ 0,00" required /></label>
      {needsSource ? <label className={styles.field}>
        <span>¿De qué cuenta salió el dinero?</span>
        <AccountSelect accounts={accounts} value={sourceAccountId} onChange={(event) => setSourceAccountId(event.target.value)} required placeholder="Selecciona la cuenta desde la que prestaste" />
        <small>El monto se descontará de esta cuenta al guardar el préstamo informal.</small>
      </label> : null}
      <div className={styles.twoColumns}>
        <label className={styles.field}><span>Fecha</span><Input type="date" value={occurredOn} onChange={(event) => setOccurredOn(event.target.value)} required /></label>
        <label className={styles.field}><span>Fecha esperada de pago (opcional)</span><Input type="date" value={dueOn} onChange={(event) => setDueOn(event.target.value)} /></label>
      </div>
      <label className={styles.field}><span>Notas</span><Textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Opcional" rows={3} /></label>
      {error && <p className={styles.error}>{error.message}</p>}
      <div className={styles.dialogActions}><Button type="button" variant="secondary" onClick={onClose} disabled={pending}>Cancelar</Button><Button type="submit" loading={pending} disabled={!valid}>Guardar</Button></div>
    </form>
    <Dialog open={addingPerson} title="Agregar persona" onClose={() => setAddingPerson(false)}>
      <form className={styles.form} onSubmit={(event) => {
        event.preventDefault()
        if (!personName.trim()) return
        onCreatePerson({ name: personName.trim(), relationship: relationship.trim() || null }, (id) => { setPersonId(id); setAddingPerson(false) })
      }}>
        <label className={styles.field}><span>Nombre</span><Input value={personName} onChange={(e) => setPersonName(e.target.value)} required /></label>
        <label className={styles.field}><span>Parentesco o relación</span><Input value={relationship} onChange={(e) => setRelationship(e.target.value)} placeholder="Ej. Hermano, amiga, compañero" /></label>
        <div className={styles.dialogActions}><Button type="button" variant="secondary" onClick={() => setAddingPerson(false)}>Cancelar</Button><Button type="submit">Guardar persona</Button></div>
      </form>
    </Dialog>
  </Dialog>
}

function EntryDialog({ item, type, open, pending, error, onClose, onSubmit, accounts }: {
  item: PersonalBalance | null
  type: 'INCREASE' | 'PAYMENT'
  open: boolean
  pending: boolean
  error: Error | null
  onClose: () => void
  onSubmit: (amount: string, accountId: string, notes?: string) => void
  accounts: Accounts
}) {
  const [amount, setAmount] = useState('')
  const [notes, setNotes] = useState('')
  const [accountId, setAccountId] = useState('')
  const isPayment = type === 'PAYMENT'
  const action = item?.direction === 'PAYABLE' ? 'pago' : 'cobro'
  const title = isPayment ? `Registrar ${action}` : 'Añadir monto'
  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (Number(amount) <= 0 || (isPayment && !accountId)) return
    onSubmit(amount, accountId, notes.trim() || undefined)
  }
  return <Dialog open={open} title={title} onClose={onClose}>
    <form className={styles.form} onSubmit={submit}>
      {item && <p className={styles.modalContext}>{item.counterpartyName} · pendiente {money(item.currentBalance, item.currency)}</p>}
      <label className={styles.field}><span>Monto</span><MoneyInput value={amount} onValueChange={setAmount} currency={item?.currency ?? 'COP'} minorUnits autoFocus /></label>
      {isPayment ? <label className={styles.field}><span>{item?.direction === 'PAYABLE' ? '¿Desde qué cuenta vas a pagar?' : '¿A qué cuenta llegó el dinero?'}</span><AccountSelect accounts={accounts} value={accountId} onChange={(event) => setAccountId(event.target.value)} required /></label> : null}
      <label className={styles.field}><span>Nota</span><Textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder={isPayment ? 'Ej. Pago en efectivo' : 'Ej. Me prestó otros $5.000'} rows={3} /></label>
      {error && <p className={styles.error}>{error.message}</p>}
      <div className={styles.dialogActions}><Button type="button" variant="secondary" onClick={onClose} disabled={pending}>Cancelar</Button><Button type="submit" loading={pending} disabled={Number(amount) <= 0 || (isPayment && !accountId)}>Guardar</Button></div>
    </form>
  </Dialog>
}

function EditDialog({ item, pending, error, onClose, onSubmit, people, accounts }: {
  item: PersonalBalance | null
  pending: boolean
  error: Error | null
  onClose: () => void
  onSubmit: (input: { personId: string; originalAmount: string; sourceAccountId?: string | null; description: string | null; dueOn: string | null; notes: string | null }) => void
  people: FinancialPerson[]
  accounts: Accounts
}) {
  const openingEntry = item?.entries?.find((entry) => entry.type === 'OPENING')
  const [personId, setPersonId] = useState(item?.personId ?? '')
  const [originalAmount, setOriginalAmount] = useState(item?.originalAmount ?? '')
  const [sourceAccountId, setSourceAccountId] = useState(openingEntry?.accountId ?? '')
  const [description, setDescription] = useState(item?.description ?? '')
  const [dueOn, setDueOn] = useState(item?.dueOn ?? '')
  const [notes, setNotes] = useState(item?.notes ?? '')
  if (!item) return null
  const sourceAlreadyApplied = Boolean(openingEntry?.accountId)
  return <Dialog open title="Editar registro" onClose={onClose}>
    <form className={styles.form} onSubmit={(event) => {
      event.preventDefault()
      if (!personId || Number(originalAmount) <= 0) return
      onSubmit({ personId, originalAmount, sourceAccountId: item.direction === 'RECEIVABLE' ? sourceAccountId || null : undefined, description: description.trim() || null, dueOn: dueOn || null, notes: notes.trim() || null })
    }}>
      <label className={styles.field}><span>Persona</span><select value={personId} onChange={(event) => setPersonId(event.target.value)} required>{people.map((person) => <option key={person.id} value={person.id}>{person.name}{person.relationship ? ` · ${person.relationship}` : ''}</option>)}</select></label>
      <label className={styles.field}><span>Monto original</span><MoneyInput value={originalAmount} onValueChange={setOriginalAmount} currency={item.currency} minorUnits required /></label>
      {item.direction === 'RECEIVABLE' ? <label className={styles.field}>
        <span>Cuenta de donde salió el dinero</span>
        <AccountSelect accounts={accounts} value={sourceAccountId} onChange={(event) => setSourceAccountId(event.target.value)} disabled={sourceAlreadyApplied} placeholder="Registrar cuenta de origen" />
        <small>{sourceAlreadyApplied ? `Ya fue descontado de ${openingEntry?.accountName ?? 'la cuenta registrada'}.` : 'Si este préstamo es reciente, selecciona la cuenta y al guardar se descontará el monto original. Si es histórico, puedes dejarlo sin cuenta.'}</small>
      </label> : null}
      <label className={styles.field}><span>Concepto</span><Input value={description} onChange={(event) => setDescription(event.target.value)} /></label>
      <label className={styles.field}><span>Fecha esperada de pago (opcional)</span><Input type="date" value={dueOn} onChange={(event) => setDueOn(event.target.value)} /></label>
      <label className={styles.field}><span>Notas</span><Textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} /></label>
      {error && <p className={styles.error}>{error.message}</p>}
      <div className={styles.dialogActions}><Button type="button" variant="secondary" onClick={onClose} disabled={pending}>Cancelar</Button><Button type="submit" loading={pending}>Guardar cambios</Button></div>
    </form>
  </Dialog>
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
  const [personFilter, setPersonFilter] = useState('')
  const [section, setSection] = useState<'balances' | 'people'>('balances')
  const [personDialog, setPersonDialog] = useState<FinancialPerson | null | undefined>(undefined)

  const filters = useMemo(() => ({
    direction: filter === 'PAYABLE' || filter === 'RECEIVABLE' ? filter : undefined,
    status: filter === 'SETTLED' ? 'SETTLED' : undefined,
    q: search.trim() || undefined,
  }), [filter, search])
  const list = usePersonalBalances(workspaceId, filters)
  const summary = usePersonalBalancesSummary(workspaceId)
  const people = usePeople(workspaceId)
  const accounts = useAccounts(workspaceId, true, false, 'all', true)
  const detail = usePersonalBalance(workspaceId, detailId)
  const create = useCreatePersonalBalance(workspaceId)
  const addEntry = useAddPersonalBalanceEntry(workspaceId, entryTarget?.id ?? '')
  const createPerson = useCreatePerson(workspaceId)
  const updatePerson = useUpdatePerson(workspaceId)
  const archivePerson = useArchivePerson(workspaceId)
  const reverseEntry = useReversePersonalBalanceEntry(workspaceId, detailId)
  const archive = useArchivePersonalBalance(workspaceId)
  const update = useUpdatePersonalBalance(workspaceId, editing?.id ?? '')
  const summaryCurrency = summary.data?.currencies.find(({ currency }) => currency === activeWorkspace!.baseCurrency) ?? summary.data?.currencies[0]
  const activeAccounts = (accounts.data ?? []).filter((account) => account.nature === 'ASSET')

  if (list.isPending && !list.data) return <PageLoader />
  if (list.isError) return <ErrorState title="No pudimos cargar Deudas y cobros" message="Comprueba tu conexión e inténtalo nuevamente." onRetry={() => void list.refetch()} />

  const openEntry = (item: PersonalBalance, type: 'INCREASE' | 'PAYMENT') => { setEntryTarget(item); setEntryType(type); addEntry.reset() }

  return <div className={styles.page}>
    <PageHeader title="Deudas y cobros" description="Controla fácilmente lo que debes y lo que otras personas te deben, sin intereses ni cuotas." actions={canWrite ? <Button onClick={() => setCreating(true)}><Plus size={17} aria-hidden="true" /> Registrar</Button> : undefined} />
    <div className={styles.filters} aria-label="Secciones"><button type="button" aria-pressed={section === 'balances'} onClick={() => setSection('balances')}>Deudas y cobros</button><button type="button" aria-pressed={section === 'people'} onClick={() => setSection('people')}>Personas ({people.data?.length ?? 0})</button></div>

    {section === 'balances' ? <><section className={styles.summaryGrid} aria-label="Resumen de deudas y cobros">
      <article className={styles.summaryCard}><span>Debo</span><strong>{money(summaryCurrency?.iOwe ?? '0', summaryCurrency?.currency ?? activeWorkspace!.baseCurrency)}</strong><small>{summaryCurrency?.iOweCount ?? 0} pendientes</small></article>
      <article className={styles.summaryCard}><span>Me deben</span><strong>{money(summaryCurrency?.owedToMe ?? '0', summaryCurrency?.currency ?? activeWorkspace!.baseCurrency)}</strong><small>{summaryCurrency?.owedToMeCount ?? 0} pendientes</small></article>
      <article className={styles.summaryCard}><span>Balance</span><strong>{money(summaryCurrency?.netPosition ?? '0', summaryCurrency?.currency ?? activeWorkspace!.baseCurrency)}</strong><small>{Number(summaryCurrency?.netPosition ?? 0) >= 0 ? 'A tu favor' : 'Por pagar'}</small></article>
    </section>
    <div className={styles.toolbar}><div className={styles.filters} aria-label="Filtros">{([['all', 'Activos'], ['PAYABLE', 'Debo'], ['RECEIVABLE', 'Me deben'], ['SETTLED', 'Saldados']] as const).map(([id, label]) => <button key={id} type="button" aria-pressed={filter === id} onClick={() => setFilter(id)}>{label}</button>)}</div>
      <select aria-label="Filtrar por persona" value={personFilter} onChange={(event) => setPersonFilter(event.target.value)}><option value="">Todas las personas</option>{(people.data ?? []).map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}</select>
      <label className={styles.searchBox}><Search size={17} aria-hidden="true" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar persona o concepto..." aria-label="Buscar persona o concepto" /></label>
    </div>
    {message && <p className={styles.success} role="status">{message}</p>}
    {list.data!.length === 0 ? <EmptyState title="No hay registros para mostrar" message="Registra un préstamo informal, un dinero que debes o un dinero que te deben." action={canWrite ? <Button onClick={() => setCreating(true)}>Registrar</Button> : undefined} /> : <div className={styles.list}>
      {list.data!.filter((item) => !personFilter || item.personId === personFilter).map((item) => <article key={item.id} className={`${styles.balanceCard} ${item.direction === 'PAYABLE' ? styles.balancePayable : styles.balanceReceivable}`}>
        <button className={styles.cardMain} type="button" onClick={() => setDetailId(item.id)}><span className={styles.avatar} aria-hidden="true">{item.counterpartyName.slice(0, 1).toUpperCase()}</span><span className={styles.cardText}><strong>{item.counterpartyName}</strong>{item.person.relationship ? <small>{item.person.relationship}</small> : null}<small>{item.description || (item.direction === 'PAYABLE' ? 'Dinero que debes' : 'Dinero que te deben')}</small><span>{shortDate(item.dueOn)} · {statusLabel[item.status]}</span></span><span className={styles.amountBlock}><strong>{money(item.status === 'SETTLED' ? item.originalAmount : item.currentBalance, item.currency)}</strong><small className={item.direction === 'PAYABLE' ? styles.payable : styles.receivable}>{item.status === 'SETTLED' ? `Saldado${item.settledAt ? ` · ${shortDate(item.settledAt.slice(0, 10))}` : ''}` : item.direction === 'PAYABLE' ? 'Debo' : 'Me deben'}</small></span></button>
        <div className={styles.progressBlock} aria-label={`${Math.round((1 - Number(item.currentBalance) / Number(item.originalAmount)) * 100)}% ${item.direction === 'PAYABLE' ? 'pagado' : 'cobrado'}`}><span><span style={{ width: `${Math.max(0, Math.min(100, (1 - Number(item.currentBalance) / Number(item.originalAmount)) * 100))}%` }} /></span><small>{money(String(Number(item.originalAmount) - Number(item.currentBalance)), item.currency)} de {money(item.originalAmount, item.currency)} {item.direction === 'PAYABLE' ? 'pagados' : 'cobrados'}</small></div>
        {canWrite && item.status !== 'SETTLED' && <div className={styles.quickActions}><Button variant="secondary" onClick={() => openEntry(item, 'PAYMENT')}>{item.direction === 'PAYABLE' ? 'Registrar pago' : 'Registrar cobro'}</Button><Button variant="secondary" onClick={() => openEntry(item, 'INCREASE')}>Añadir monto</Button></div>}
      </article>)}
    </div>}</> : <section className={styles.peopleSection}><div className={styles.peopleHeader}><div><h2>Personas</h2><p>Contrapartes relacionadas con tus deudas y cobros.</p></div>{canWrite ? <Button onClick={() => setPersonDialog(null)}><Plus size={16} /> Nueva persona</Button> : null}</div><div className={styles.peopleGrid}>{(people.data ?? []).map((person) => {
      const related = list.data!.filter((item) => item.personId === person.id)
      const payable = related.filter((item) => item.direction === 'PAYABLE').reduce((sum, item) => sum + Number(item.currentBalance), 0)
      const receivable = related.filter((item) => item.direction === 'RECEIVABLE').reduce((sum, item) => sum + Number(item.currentBalance), 0)
      return <article key={person.id} className={styles.personCard}><div><strong>{person.name}</strong><small>{person.relationship || 'Sin relación indicada'}</small></div><dl><div><dt>Me debe</dt><dd>{money(String(receivable), activeWorkspace!.baseCurrency)}</dd></div><div><dt>Le debo</dt><dd>{money(String(payable), activeWorkspace!.baseCurrency)}</dd></div><div><dt>Balance</dt><dd>{money(String(receivable - payable), activeWorkspace!.baseCurrency)}</dd></div></dl>{canWrite ? <div className={styles.quickActions}><Button variant="secondary" onClick={() => setPersonDialog(person)}>Editar</Button><Button variant="danger" onClick={() => archivePerson.mutate(person.id)}>Eliminar</Button></div> : null}</article>
    })}</div></section>}

    <CreateDialog key={creating ? 'create-open' : 'create-closed'} open={creating} workspaceCurrency={activeWorkspace!.baseCurrency} pending={create.isPending} error={create.error instanceof Error ? create.error : null} onClose={() => !create.isPending && setCreating(false)} onSubmit={(input) => create.mutate(input, { onSuccess: () => { setCreating(false); setMessage('Registro creado correctamente.') } })} people={people.data ?? []} accounts={activeAccounts} onCreatePerson={(input, select) => createPerson.mutate(input, { onSuccess: ({ data }) => select(data.id) })} />

    {personDialog !== undefined ? <PersonDialog key={personDialog?.id ?? 'new-person'} person={personDialog} pending={personDialog ? updatePerson.isPending : createPerson.isPending} error={(personDialog ? updatePerson.error : createPerson.error) instanceof Error ? (personDialog ? updatePerson.error : createPerson.error) as Error : null} onClose={() => setPersonDialog(undefined)} onSubmit={(input) => personDialog ? updatePerson.mutate({ id: personDialog.id, input }, { onSuccess: () => setPersonDialog(undefined) }) : createPerson.mutate(input, { onSuccess: () => setPersonDialog(undefined) })} /> : null}

    <EntryDialog key={`${entryTarget?.id ?? 'none'}-${entryType}`} item={entryTarget} type={entryType} open={Boolean(entryTarget)} pending={addEntry.isPending} error={addEntry.error instanceof Error ? addEntry.error : null} onClose={() => !addEntry.isPending && setEntryTarget(null)} accounts={activeAccounts} onSubmit={(amount, accountId, notes) => addEntry.mutate(entryType === 'PAYMENT' ? { type: 'PAYMENT', amount, accountId, notes } : { type: 'INCREASE', amount, notes }, { onSuccess: () => { setEntryTarget(null); setMessage(entryType === 'PAYMENT' ? 'Movimiento registrado.' : 'Monto añadido.') } })} />

    <Dialog open={Boolean(detailId)} title={detail.data?.counterpartyName ?? 'Detalle'} onClose={() => setDetailId('')}>
      {detail.isPending ? <div className={styles.detailLoading}>Cargando historial...</div> : detail.isError || !detail.data ? <p className={styles.error}>No pudimos cargar este registro.</p> : <div className={styles.detail}>
        <div className={styles.detailAmount}><span>{detail.data.direction === 'PAYABLE' ? 'Debes actualmente' : 'Te deben actualmente'}</span><strong>{money(detail.data.currentBalance, detail.data.currency)}</strong></div>
        <dl className={styles.metaGrid}><div><dt>Inicial</dt><dd>{money(detail.data.originalAmount, detail.data.currency)}</dd></div><div><dt>Desde</dt><dd>{shortDate(detail.data.occurredOn)}</dd></div><div><dt>Vence</dt><dd>{shortDate(detail.data.dueOn)}</dd></div><div><dt>Estado</dt><dd>{statusLabel[detail.data.status]}</dd></div></dl>
        <div className={styles.history}><h3>Historial</h3>{detail.data.entries?.map((entry) => <div key={entry.id} className={styles.historyRow}><span><strong>{entry.type === 'PAYMENT' ? (detail.data!.direction === 'PAYABLE' ? 'Pago' : 'Cobro') : entry.type === 'INCREASE' ? 'Monto añadido' : 'Registro inicial'}</strong><small>{new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(entry.occurredAt))}</small>{entry.accountName ? <small>{entry.type === 'OPENING' ? 'Desde' : detail.data!.direction === 'PAYABLE' ? 'Desde' : 'A'} {entry.accountName}</small> : null}</span><span className={styles.entryAmount}><strong className={entry.type === 'PAYMENT' ? styles.historyPayment : undefined}>{entry.type === 'PAYMENT' ? '−' : '+'}{money(entry.amount, detail.data.currency)}</strong>{canWrite && entry.type === 'PAYMENT' && entry.transactionId && !entry.reversedAt ? <Button variant="secondary" loading={reverseEntry.isPending} onClick={() => reverseEntry.mutate(entry.id)}>Revertir</Button> : entry.reversedAt ? <small>Revertido</small> : null}</span></div>)}</div>
        {canWrite && <div className={styles.detailActions}><Button variant="secondary" onClick={() => { setEditing(detail.data!); setDetailId('') }}>Editar</Button><Button variant="danger" onClick={() => { setArchiving(detail.data!); setDetailId('') }}>Eliminar</Button></div>}
      </div>}
    </Dialog>

    <EditDialog key={editing?.id ?? 'no-edit'} item={editing} pending={update.isPending} error={update.error instanceof Error ? update.error : null} onClose={() => !update.isPending && setEditing(null)} onSubmit={(input) => update.mutate(input, { onSuccess: () => { setEditing(null); setMessage('Registro actualizado.') } })} people={people.data ?? []} accounts={activeAccounts} />

    <Dialog open={Boolean(archiving)} title="Eliminar registro" onClose={() => !archive.isPending && setArchiving(null)} footer={<><Button variant="secondary" disabled={archive.isPending} onClick={() => setArchiving(null)}>Cancelar</Button><Button variant="danger" loading={archive.isPending} onClick={() => archiving && archive.mutate(archiving.id, { onSuccess: () => { setArchiving(null); setMessage('Registro eliminado.') } })}>Eliminar</Button></>}>
      Este registro dejará de aparecer en la lista principal. Su historial no se convertirá en un crédito ni en un pago recurrente.
    </Dialog>
  </div>
}

export function PersonalBalancesIcon() { return <HandCoins aria-hidden="true" /> }
