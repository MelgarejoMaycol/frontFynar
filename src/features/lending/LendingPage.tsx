import { useMemo, useState, type FormEvent } from 'react'
import { Calculator, HandCoins, Plus, Search } from 'lucide-react'
import { Button, Dialog, Input, MoneyInput, PageHeader, Textarea } from '@/components/ui'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { PageLoader } from '@/components/feedback/PageLoader'
import { useActiveWorkspace, usePermission } from '@/features/workspace'
import { useCreatePerson, usePeople } from '@/features/personal-balances/hooks'
import { useArchiveLoan, useAssetAccounts, useCreateLoan, useLendingSummary, useLoan, useLoans, usePayLoan, useReverseLoanPayment, useSimulation } from './hooks'
import type { LendingFrequency, LendingMethod, LendingStatus, LoanInstallment, LoanListItem, SimulationInput, SimulationResult } from './types'
import styles from './lending.module.css'

type Tab = 'summary' | 'loans' | 'simulator'
const today = () => new Date().toISOString().slice(0, 10)
const nextMonth = () => { const value = new Date(); value.setMonth(value.getMonth() + 1); return value.toISOString().slice(0, 10) }
const money = (value: string | number, currency = 'COP') => new Intl.NumberFormat('es-CO', { style: 'currency', currency, maximumFractionDigits: 2 }).format(Number(value || 0))
const date = (value: string | null) => value ? new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium' }).format(new Date(`${value.slice(0, 10)}T12:00:00`)) : 'Sin fecha'
const frequencyLabel: Record<LendingFrequency, string> = { WEEKLY: 'Semanal', BIWEEKLY: 'Quincenal', MONTHLY: 'Mensual' }
const methodLabel: Record<LendingMethod, string> = { FIXED_PAYMENT: 'Cuota fija', FIXED_PRINCIPAL: 'Capital fijo', INTEREST_ONLY: 'Solo interés; capital al final' }

function LoanCard({ loan, onOpen }: { loan: LoanListItem; onOpen: () => void }) {
  const progress = Math.min(100, Number(loan.principalReceived) / Math.max(1, Number(loan.originalPrincipal)) * 100)
  return <button type="button" className={styles.loan} onClick={onOpen}>
    <div className={styles.loanHead}><div><strong>{loan.personName}</strong><span>{Number(loan.ratePercent)} % por periodo · {frequencyLabel[loan.frequency]}</span></div><span className={styles.status}>{loan.status}</span></div>
    <div><small>Capital pendiente</small><h3>{money(loan.currentPrincipal, loan.currency)}</h3></div>
    <div className={styles.progress}><i style={{ width: `${progress}%` }} /></div>
    <div className={styles.loanFoot}><span>Cuota {money(loan.installmentAmount, loan.currency)}</span><span>{loan.nextDueDate ? date(loan.nextDueDate) : 'Finalizado'}</span></div>
  </button>
}

function Simulator({ workspaceId, currency, onUse }: { workspaceId: string; currency: string; onUse: (input: SimulationInput) => void }) {
  const mutation = useSimulation(workspaceId)
  const [input, setInput] = useState<SimulationInput>({ principal: '2000000', ratePercent: 2, termCount: 12, method: 'FIXED_PAYMENT', frequency: 'MONTHLY', firstPaymentDate: nextMonth() })
  const result = mutation.data?.data
  const submit = (event: FormEvent) => { event.preventDefault(); mutation.mutate(input) }
  return <section className={styles.section}>
    <div className={styles.sectionHead}><div><h2>Simulador</h2><p>Es de solo lectura: no crea movimientos ni altera cuentas.</p></div><Calculator /></div>
    <form className={styles.simForm} onSubmit={submit}>
      <label><span>Capital</span><MoneyInput value={input.principal} onValueChange={(principal) => setInput((current) => ({ ...current, principal }))} currency={currency} minorUnits /></label>
      <label><span>Interés por {frequencyLabel[input.frequency].toLowerCase()} (%)</span><Input type="number" min="0" max="100" step="0.01" value={input.ratePercent} onChange={(e) => setInput((current) => ({ ...current, ratePercent: Number(e.target.value) }))} /></label>
      <label><span>Número de cuotas</span><Input type="number" min="1" max="600" value={input.termCount} onChange={(e) => setInput((current) => ({ ...current, termCount: Number(e.target.value) }))} /></label>
      <label><span>Amortización</span><select value={input.method} onChange={(e) => setInput((current) => ({ ...current, method: e.target.value as LendingMethod }))}>{Object.entries(methodLabel).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
      <label><span>Frecuencia</span><select value={input.frequency} onChange={(e) => setInput((current) => ({ ...current, frequency: e.target.value as LendingFrequency }))}>{Object.entries(frequencyLabel).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
      <label><span>Primera cuota</span><Input type="date" value={input.firstPaymentDate} onChange={(e) => setInput((current) => ({ ...current, firstPaymentDate: e.target.value }))} /></label>
      <Button type="submit" loading={mutation.isPending}>Calcular</Button>
    </form>
    {mutation.isError ? <p className={styles.error}>{mutation.error.message}</p> : null}
    {result ? <SimulationTable result={result} currency={currency} onUse={() => onUse(input)} /> : null}
  </section>
}

function SimulationTable({ result, currency, onUse }: { result: SimulationResult; currency: string; onUse: () => void }) {
  return <div className={styles.detail}>
    <div className={styles.grid}><article className={styles.card}><span>Primera cuota</span><strong>{money(result.installmentAmount, currency)}</strong></article><article className={styles.card}><span>Total estimado</span><strong>{money(result.totalReceivable, currency)}</strong></article><article className={styles.card}><span>Interés estimado</span><strong>{money(result.totalInterest, currency)}</strong></article></div>
    <div className={styles.actions}><Button type="button" variant="secondary" onClick={() => window.print()}>Imprimir / PDF</Button><Button type="button" onClick={onUse}>Usar para crear</Button></div>
    <div className={styles.table}><table><thead><tr><th>#</th><th>Fecha</th><th>Capital</th><th>Interés</th><th>Cuota</th><th>Saldo</th></tr></thead><tbody>{result.schedule.map((row) => <tr key={row.installmentNumber}><td>{row.installmentNumber}</td><td>{date(row.dueDate)}</td><td>{money(row.principalAmount, currency)}</td><td>{money(row.interestAmount, currency)}</td><td>{money(row.totalAmount, currency)}</td><td>{money(row.closingPrincipal, currency)}</td></tr>)}</tbody></table></div>
  </div>
}

function CreateDialog({ open, workspaceId, currency, preset, onClose }: { open: boolean; workspaceId: string; currency: string; preset: SimulationInput | null; onClose: () => void }) {
  const people = usePeople(workspaceId); const accounts = useAssetAccounts(workspaceId); const createPerson = useCreatePerson(workspaceId); const create = useCreateLoan(workspaceId)
  const [personId, setPersonId] = useState(''); const [newPerson, setNewPerson] = useState(''); const [sourceAccountId, setSourceAccountId] = useState(''); const [notes, setNotes] = useState('')
  const [principal, setPrincipal] = useState(preset?.principal ?? ''); const [rate, setRate] = useState(preset?.ratePercent ?? 2); const [term, setTerm] = useState(preset?.termCount ?? 12)
  const [method, setMethod] = useState<LendingMethod>(preset?.method ?? 'FIXED_PAYMENT'); const [frequency, setFrequency] = useState<LendingFrequency>(preset?.frequency ?? 'MONTHLY'); const [disbursement, setDisbursement] = useState(today()); const [first, setFirst] = useState(preset?.firstPaymentDate ?? nextMonth())
  if (!open) return null
  const compatible = accounts.data?.filter((account) => account.currency === currency) ?? []
  const addPerson = () => createPerson.mutate({ name: newPerson }, { onSuccess: ({ data }) => { setPersonId(data.id); setNewPerson('') } })
  const submit = (event: FormEvent) => { event.preventDefault(); create.mutate({ personId, principal, ratePercent: rate, termCount: term, method, frequency, currency, sourceAccountId: sourceAccountId || null, disbursementDate: disbursement, firstPaymentDate: first, notes: notes || null }, { onSuccess: onClose }) }
  return <Dialog open title="Registrar préstamo" onClose={onClose}><form className={styles.form} onSubmit={submit}>
    <label><span>Persona</span><select required value={personId} onChange={(e) => setPersonId(e.target.value)}><option value="">Selecciona una persona</option>{people.data?.map((person) => <option key={person.id} value={person.id}>{person.name}{person.relationship ? ` · ${person.relationship}` : ''}</option>)}</select></label>
    <div className={styles.cols}><label><span>Crear persona sin perder el formulario</span><Input value={newPerson} onChange={(e) => setNewPerson(e.target.value)} placeholder="Nombre" /></label><Button type="button" variant="secondary" disabled={!newPerson.trim()} loading={createPerson.isPending} onClick={addPerson}>Agregar persona</Button></div>
    <div className={styles.cols}><label><span>Capital</span><MoneyInput value={principal} onValueChange={setPrincipal} currency={currency} minorUnits /></label><label><span>Interés por {frequencyLabel[frequency].toLowerCase()} (%)</span><Input type="number" min="0" max="100" step="0.01" value={rate} onChange={(e) => setRate(Number(e.target.value))} /></label></div>
    <div className={styles.cols}><label><span>Cuotas</span><Input type="number" min="1" max="600" value={term} onChange={(e) => setTerm(Number(e.target.value))} /></label><label><span>Frecuencia</span><select value={frequency} onChange={(e) => setFrequency(e.target.value as LendingFrequency)}>{Object.entries(frequencyLabel).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label></div>
    <label><span>Amortización</span><select value={method} onChange={(e) => setMethod(e.target.value as LendingMethod)}>{Object.entries(methodLabel).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
    <div className={styles.cols}><label><span>Fecha de desembolso</span><Input type="date" value={disbursement} onChange={(e) => setDisbursement(e.target.value)} /></label><label><span>Primera cuota</span><Input type="date" value={first} onChange={(e) => setFirst(e.target.value)} /></label></div>
    <label><span>Origen del dinero</span><select value={sourceAccountId} onChange={(e) => setSourceAccountId(e.target.value)}><option value="">Préstamo histórico (no reducir una cuenta)</option>{compatible.map((account) => <option key={account.id} value={account.id}>{account.name} · {money(account.currentBalance, account.currency)}</option>)}</select></label>
    <p className={styles.hint}>Con cuenta de origen, el desembolso es una transferencia hacia una cuenta por cobrar; nunca un gasto.</p>
    <label><span>Notas</span><Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} /></label>
    {create.isError || createPerson.isError ? <p className={styles.error}>{create.error?.message ?? createPerson.error?.message}</p> : null}
    <div className={styles.actions}><Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button><Button type="submit" disabled={!personId || Number(principal) <= 0} loading={create.isPending}>Crear préstamo</Button></div>
  </form></Dialog>
}

function PaymentDialog({ workspaceId, loanId, currency, installment, onClose }: { workspaceId: string; loanId: string; currency: string; installment: LoanInstallment; onClose: () => void }) {
  const accounts = useAssetAccounts(workspaceId); const pay = usePayLoan(workspaceId, loanId, installment.id); const pending = (Number(installment.totalAmount) - Number(installment.totalPaid)).toFixed(2)
  const [amount, setAmount] = useState(pending); const [accountId, setAccountId] = useState(''); const [notes, setNotes] = useState('')
  return <Dialog open title={`Cobrar cuota ${installment.installmentNumber}`} onClose={onClose}><form className={styles.form} onSubmit={(event) => { event.preventDefault(); pay.mutate({ amount, receivingAccountId: accountId, notes: notes || null, idempotencyKey: crypto.randomUUID() }, { onSuccess: onClose }) }}>
    <p>Saldo de la cuota: <strong>{money(pending, currency)}</strong>. Se aplica primero a interés y luego a capital.</p>
    <label><span>Monto recibido</span><MoneyInput value={amount} onValueChange={setAmount} currency={currency} minorUnits /></label>
    <label><span>Cuenta receptora</span><select required value={accountId} onChange={(e) => setAccountId(e.target.value)}><option value="">Selecciona una cuenta</option>{accounts.data?.filter((a) => a.currency === currency).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select></label>
    <label><span>Nota</span><Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} /></label>{pay.isError ? <p className={styles.error}>{pay.error.message}</p> : null}
    <div className={styles.actions}><Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button><Button type="submit" disabled={!accountId || Number(amount) <= 0 || Number(amount) > Number(pending)} loading={pay.isPending}>Registrar cobro</Button></div>
  </form></Dialog>
}

export function LendingPage() {
  const { activeWorkspace } = useActiveWorkspace(); const workspaceId = activeWorkspace!.id; const currency = activeWorkspace!.baseCurrency; const canWrite = usePermission('debts.write')
  const [tab, setTab] = useState<Tab>('summary'); const [search, setSearch] = useState(''); const [status, setStatus] = useState<LendingStatus | 'ALL'>('ACTIVE'); const [detailId, setDetailId] = useState(''); const [createOpen, setCreateOpen] = useState(false); const [preset, setPreset] = useState<SimulationInput | null>(null); const [payment, setPayment] = useState<LoanInstallment | null>(null)
  const summary = useLendingSummary(workspaceId); const loans = useLoans(workspaceId, { q: search || undefined, status }); const detail = useLoan(workspaceId, detailId); const reverse = useReverseLoanPayment(workspaceId, detailId); const archive = useArchiveLoan(workspaceId)
  const active = useMemo(() => loans.data?.filter((loan) => loan.status === 'ACTIVE' || loan.status === 'OVERDUE') ?? [], [loans.data]); const totals = summary.data?.currencies.find((row) => row.currency === currency) ?? summary.data?.currencies[0]
  if (summary.isPending && loans.isPending) return <PageLoader />
  if (summary.isError || loans.isError) return <ErrorState title="No pudimos cargar Préstamos" message="Comprueba la conexión e inténtalo de nuevo." onRetry={() => { void summary.refetch(); void loans.refetch() }} />
  const openCreate = (value?: SimulationInput) => { setPreset(value ?? null); setCreateOpen(true) }
  return <div className={styles.page}><PageHeader title="Préstamos" description="Administra el dinero que prestas, sus cuotas, cobros e intereses." actions={canWrite ? <Button onClick={() => openCreate()}><Plus size={17} /> Nuevo préstamo</Button> : undefined} />
    <div className={styles.tabs} role="tablist">{([['summary', 'Resumen'], ['loans', 'Préstamos'], ['simulator', 'Simulador']] as const).map(([key, label]) => <button type="button" role="tab" aria-selected={tab === key} className={tab === key ? styles.active : ''} key={key} onClick={() => setTab(key)}>{label}</button>)}</div>
    {tab === 'summary' ? <><div className={styles.grid}><article className={styles.card}><span>Capital pendiente</span><strong>{money(totals?.principalPending ?? 0, totals?.currency ?? currency)}</strong><small>{totals?.activeCount ?? 0} activos</small></article><article className={styles.card}><span>Interés pendiente</span><strong>{money(totals?.interestPending ?? 0, totals?.currency ?? currency)}</strong></article><article className={styles.card}><span>Interés recibido</span><strong>{money(totals?.interestReceived ?? 0, totals?.currency ?? currency)}</strong></article><article className={styles.card}><span>Próximo cobro</span><strong>{summary.data?.upcoming[0] ? money(summary.data.upcoming[0].amount, summary.data.upcoming[0].currency) : money(0, currency)}</strong><small>{summary.data?.upcoming[0]?.personName ?? 'Sin cobros pendientes'}</small></article></div><section className={styles.section}><div className={styles.sectionHead}><div><h2>Préstamos activos</h2><p>Ordenados por vencimiento y mora.</p></div><HandCoins /></div>{active.length ? <div className={styles.loans}>{active.map((loan) => <LoanCard key={loan.id} loan={loan} onOpen={() => setDetailId(loan.id)} />)}</div> : <EmptyState title="Aún no hay préstamos activos" description="Registra uno nuevo o prepara una propuesta en el simulador." />}</section></> : null}
    {tab === 'loans' ? <section className={styles.section}><div className={styles.toolbar}><div><Search size={16} /> <Input aria-label="Buscar persona" placeholder="Buscar persona" value={search} onChange={(e) => setSearch(e.target.value)} /></div><select aria-label="Filtrar estado" value={status} onChange={(e) => setStatus(e.target.value as LendingStatus | 'ALL')}><option value="ACTIVE">Activos y vencidos</option><option value="PAID">Pagados</option><option value="ARCHIVED">Archivados</option><option value="ALL">Todos</option></select></div>{loans.data?.length ? <div className={styles.loans}>{loans.data.map((loan) => <LoanCard key={loan.id} loan={loan} onOpen={() => setDetailId(loan.id)} />)}</div> : <EmptyState title="Sin resultados" description="No hay préstamos con estos filtros." />}</section> : null}
    {tab === 'simulator' ? <Simulator workspaceId={workspaceId} currency={currency} onUse={openCreate} /> : null}
    {detailId ? <Dialog open title="Detalle del préstamo" onClose={() => setDetailId('')}>{detail.isPending ? <PageLoader /> : detail.data ? <div className={styles.detail}><div className={styles.sectionHead}><div><h2>{detail.data.personName}</h2><p>{money(detail.data.currentPrincipal, detail.data.currency)} pendiente · {Number(detail.data.ratePercent)} % por {frequencyLabel[detail.data.frequency].toLowerCase()}</p></div><span className={styles.status}>{detail.data.status}</span></div><div className={styles.table}><table><thead><tr><th>#</th><th>Fecha</th><th>Capital</th><th>Interés</th><th>Pendiente</th><th>Estado</th><th /></tr></thead><tbody>{detail.data.installments.map((row) => <tr key={row.id}><td>{row.installmentNumber}</td><td>{date(row.dueDate)}</td><td>{money(row.principalAmount, detail.data!.currency)}</td><td>{money(row.interestAmount, detail.data!.currency)}</td><td>{money(Number(row.totalAmount) - Number(row.totalPaid), detail.data!.currency)}</td><td>{row.status}</td><td>{canWrite && row.status !== 'PAID' ? <Button type="button" variant="secondary" onClick={() => setPayment(row)}>Cobrar</Button> : null}</td></tr>)}</tbody></table></div><div className={styles.payments}><h3>Cobros</h3>{detail.data.payments.length ? detail.data.payments.map((row) => <div className={styles.payment} key={row.id}><p><strong>{money(row.totalReceived, detail.data!.currency)}</strong><br /><small>Capital {money(row.principalReceived, detail.data!.currency)} · interés {money(row.interestReceived, detail.data!.currency)}</small></p>{row.reversedAt ? <span className={styles.status}>Revertido</span> : canWrite ? <Button type="button" variant="secondary" loading={reverse.isPending} onClick={() => { const reason = window.prompt('Motivo de la reversión'); if (reason) reverse.mutate({ paymentId: row.id, reason }) }}>Revertir</Button> : null}</div>) : <p className={styles.hint}>Aún no hay cobros.</p>}</div>{canWrite && detail.data.status === 'PAID' ? <div className={styles.actions}><Button type="button" variant="secondary" loading={archive.isPending} onClick={() => archive.mutate(detail.data!.id, { onSuccess: () => setDetailId('') })}>Archivar préstamo</Button></div> : null}</div> : <p>No se pudo cargar el detalle.</p>}</Dialog> : null}
    {payment && detail.data ? <PaymentDialog workspaceId={workspaceId} loanId={detail.data.id} currency={detail.data.currency} installment={payment} onClose={() => setPayment(null)} /> : null}
    <CreateDialog key={`${createOpen}-${preset?.principal ?? ''}`} open={createOpen} workspaceId={workspaceId} currency={currency} preset={preset} onClose={() => { setCreateOpen(false); setPreset(null) }} />
  </div>
}
