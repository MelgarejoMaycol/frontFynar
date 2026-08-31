import { useMemo, useState, type FormEvent } from 'react'
import { Calculator, Copy, HandCoins, Plus, Printer, Search } from 'lucide-react'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { PageLoader } from '@/components/feedback/PageLoader'
import { Button, Dialog, Input, MoneyInput, PageHeader, Textarea } from '@/components/ui'
import { useActiveWorkspace, usePermission } from '@/features/workspace'
import {
  useAssetAccounts,
  useCreateLoan,
  useLendingSummary,
  useLoan,
  useLoans,
  usePayLoan,
  useSimulation,
} from './hooks'
import type {
  CreateLoanInput,
  LendingFrequency,
  LendingMethod,
  LoanInstallment,
  LoanListItem,
  SimulationInput,
  SimulationResult,
} from './types'
import styles from './lending.module.css'

type Tab = 'overview' | 'loans' | 'simulator'

const today = () => new Date().toISOString().slice(0, 10)
const nextMonth = () => {
  const date = new Date()
  date.setMonth(date.getMonth() + 1)
  return date.toISOString().slice(0, 10)
}
const money = (value: string | number, currency = 'COP') =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value || 0))
const shortDate = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short', year: 'numeric' }).format(
        new Date(`${value}T00:00:00`),
      )
    : 'Sin fecha'
const methodLabel: Record<LendingMethod, string> = {
  FIXED_PAYMENT: 'Cuota fija',
  FIXED_PRINCIPAL: 'Capital fijo',
  INTEREST_ONLY: 'Interés y capital al final',
}
const frequencyLabel: Record<LendingFrequency, string> = {
  WEEKLY: 'Semanal',
  BIWEEKLY: 'Quincenal',
  MONTHLY: 'Mensual',
}

function SimulationPanel({
  workspaceId,
  currency,
  onUse,
}: {
  workspaceId: string
  currency: string
  onUse?: (input: SimulationInput) => void
}) {
  const simulate = useSimulation(workspaceId)
  const [principal, setPrincipal] = useState('2000000')
  const [ratePercent, setRatePercent] = useState(3)
  const [termCount, setTermCount] = useState(12)
  const [method, setMethod] = useState<LendingMethod>('FIXED_PAYMENT')
  const [frequency, setFrequency] = useState<LendingFrequency>('MONTHLY')
  const [firstPaymentDate, setFirstPaymentDate] = useState(nextMonth())
  const result = simulate.data?.data
  const input: SimulationInput = {
    principal,
    ratePercent,
    termCount,
    method,
    frequency,
    firstPaymentDate,
  }
  const run = (event?: FormEvent) => {
    event?.preventDefault()
    if (Number(principal) <= 0 || termCount <= 0 || ratePercent < 0) return
    simulate.mutate(input)
  }
  const shareText = result
    ? [
        'Propuesta de préstamo',
        `Monto: ${money(principal, currency)}`,
        `Interés: ${ratePercent}% por periodo`,
        `Plazo: ${termCount} cuotas · ${frequencyLabel[frequency]}`,
        `Cuota inicial: ${money(result.installmentAmount, currency)}`,
        `Total a recibir: ${money(result.totalReceivable, currency)}`,
        `Intereses estimados: ${money(result.totalInterest, currency)}`,
        `Primera cuota: ${shortDate(firstPaymentDate)}`,
      ].join('\n')
    : ''

  return (
    <section className={styles.simulatorCard} aria-label="Simulador de préstamos">
      <div className={styles.sectionTitle}>
        <div>
          <h2>Simulador</h2>
          <p>Calcula el préstamo sin modificar saldos ni movimientos.</p>
        </div>
        <Calculator size={22} aria-hidden="true" />
      </div>
      <form className={styles.simulatorForm} onSubmit={run}>
        <label>
          <span>Monto a prestar</span>
          <MoneyInput value={principal} onValueChange={setPrincipal} currency={currency} minorUnits />
        </label>
        <label>
          <span>Interés por periodo</span>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={ratePercent}
            onChange={(event) => setRatePercent(Number(event.target.value))}
          />
        </label>
        <label>
          <span>Número de cuotas</span>
          <Input
            type="number"
            min="1"
            max="600"
            value={termCount}
            onChange={(event) => setTermCount(Number(event.target.value))}
          />
        </label>
        <label>
          <span>Forma de amortización</span>
          <select value={method} onChange={(event) => setMethod(event.target.value as LendingMethod)}>
            {Object.entries(methodLabel).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>
        <label>
          <span>Frecuencia</span>
          <select value={frequency} onChange={(event) => setFrequency(event.target.value as LendingFrequency)}>
            {Object.entries(frequencyLabel).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>
        <label>
          <span>Primera cuota</span>
          <Input type="date" value={firstPaymentDate} onChange={(event) => setFirstPaymentDate(event.target.value)} />
        </label>
        <Button type="submit" loading={simulate.isPending}>Calcular</Button>
      </form>
      {simulate.isError && <p className={styles.error}>{simulate.error.message}</p>}
      {result && (
        <SimulationResultView
          result={result}
          currency={currency}
          onCopy={() => void navigator.clipboard.writeText(shareText)}
          onPrint={() => window.print()}
          onUse={onUse ? () => onUse(input) : undefined}
        />
      )}
    </section>
  )
}

function SimulationResultView({
  result,
  currency,
  onCopy,
  onPrint,
  onUse,
}: {
  result: SimulationResult
  currency: string
  onCopy: () => void
  onPrint: () => void
  onUse?: () => void
}) {
  return (
    <div className={styles.simulationResult}>
      <div className={styles.metricsGrid}>
        <article><span>Cuota inicial</span><strong>{money(result.installmentAmount, currency)}</strong></article>
        <article><span>Total a recibir</span><strong>{money(result.totalReceivable, currency)}</strong></article>
        <article><span>Intereses</span><strong>{money(result.totalInterest, currency)}</strong></article>
        <article><span>Rentabilidad total</span><strong>{result.totalPrincipal ? `${((result.totalInterest / result.totalPrincipal) * 100).toFixed(2)} %` : '0 %'}</strong></article>
      </div>
      <div className={styles.resultActions}>
        <Button type="button" variant="secondary" onClick={onCopy}><Copy size={16} /> Copiar resumen</Button>
        <Button type="button" variant="secondary" onClick={onPrint}><Printer size={16} /> Imprimir / PDF</Button>
        {onUse && <Button type="button" onClick={onUse}>Usar para crear préstamo</Button>}
      </div>
      <div className={styles.tableWrap}>
        <table>
          <thead><tr><th>#</th><th>Fecha</th><th>Capital</th><th>Interés</th><th>Cuota</th><th>Saldo</th></tr></thead>
          <tbody>
            {result.schedule.map((row) => (
              <tr key={row.installmentNumber}>
                <td>{row.installmentNumber}</td><td>{shortDate(row.dueDate)}</td>
                <td>{money(row.principalAmount, currency)}</td><td>{money(row.interestAmount, currency)}</td>
                <td>{money(row.totalAmount, currency)}</td><td>{money(row.closingPrincipal, currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function CreateLoanDialog({
  open,
  workspaceId,
  currency,
  preset,
  onClose,
}: {
  open: boolean
  workspaceId: string
  currency: string
  preset: SimulationInput | null
  onClose: () => void
}) {
  const accounts = useAssetAccounts(workspaceId)
  const create = useCreateLoan(workspaceId)
  const [borrowerName, setBorrowerName] = useState('')
  const [principal, setPrincipal] = useState(preset?.principal ?? '')
  const [ratePercent, setRatePercent] = useState(preset?.ratePercent ?? 3)
  const [termCount, setTermCount] = useState(preset?.termCount ?? 12)
  const [method, setMethod] = useState<LendingMethod>(preset?.method ?? 'FIXED_PAYMENT')
  const [frequency, setFrequency] = useState<LendingFrequency>(preset?.frequency ?? 'MONTHLY')
  const [disbursementDate, setDisbursementDate] = useState(today())
  const [firstPaymentDate, setFirstPaymentDate] = useState(preset?.firstPaymentDate ?? nextMonth())
  const [sourceAccountId, setSourceAccountId] = useState('')
  const [notes, setNotes] = useState('')
  if (!open) return null
  const available = accounts.data?.filter((account) => account.currency === currency) ?? []
  const submit = (event: FormEvent) => {
    event.preventDefault()
    const input: CreateLoanInput = {
      borrowerName: borrowerName.trim(), principal, ratePercent, termCount, method, frequency,
      currency, sourceAccountId: sourceAccountId || null, disbursementDate, firstPaymentDate,
      notes: notes.trim() || null,
    }
    create.mutate(input, { onSuccess: onClose })
  }
  return (
    <Dialog open title="Nuevo préstamo" onClose={onClose}>
      <form className={styles.createForm} onSubmit={submit}>
        <label><span>Persona</span><Input autoFocus required value={borrowerName} onChange={(e) => setBorrowerName(e.target.value)} placeholder="Ej. Juan Pérez" /></label>
        <label><span>Monto</span><MoneyInput required value={principal} onValueChange={setPrincipal} currency={currency} minorUnits /></label>
        <div className={styles.twoCols}>
          <label><span>Interés por periodo (%)</span><Input type="number" min="0" step="0.01" value={ratePercent} onChange={(e) => setRatePercent(Number(e.target.value))} /></label>
          <label><span>Cuotas</span><Input type="number" min="1" max="600" value={termCount} onChange={(e) => setTermCount(Number(e.target.value))} /></label>
        </div>
        <div className={styles.twoCols}>
          <label><span>Método</span><select value={method} onChange={(e) => setMethod(e.target.value as LendingMethod)}>{Object.entries(methodLabel).map(([v,l]) => <option key={v} value={v}>{l}</option>)}</select></label>
          <label><span>Frecuencia</span><select value={frequency} onChange={(e) => setFrequency(e.target.value as LendingFrequency)}>{Object.entries(frequencyLabel).map(([v,l]) => <option key={v} value={v}>{l}</option>)}</select></label>
        </div>
        <div className={styles.twoCols}>
          <label><span>Fecha del préstamo</span><Input type="date" value={disbursementDate} onChange={(e) => setDisbursementDate(e.target.value)} /></label>
          <label><span>Primera cuota</span><Input type="date" value={firstPaymentDate} onChange={(e) => setFirstPaymentDate(e.target.value)} /></label>
        </div>
        <label>
          <span>¿De qué cuenta sale el dinero?</span>
          <select value={sourceAccountId} onChange={(e) => setSourceAccountId(e.target.value)}>
            <option value="">Ya lo había prestado / no afectar una cuenta</option>
            {available.map((account) => <option key={account.id} value={account.id}>{account.name} · {money(account.currentBalance, account.currency)}</option>)}
          </select>
          <small>Si seleccionas una cuenta, Fynar mueve el capital a una cuenta por cobrar; no lo registra como gasto.</small>
        </label>
        <label><span>Notas</span><Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} /></label>
        {create.isError && <p className={styles.error}>{create.error.message}</p>}
        <div className={styles.dialogActions}><Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button><Button type="submit" loading={create.isPending} disabled={!borrowerName.trim() || Number(principal) <= 0}>Crear préstamo</Button></div>
      </form>
    </Dialog>
  )
}

function PaymentDialog({
  workspaceId,
  loanId,
  currency,
  installment,
  onClose,
}: {
  workspaceId: string
  loanId: string
  currency: string
  installment: LoanInstallment
  onClose: () => void
}) {
  const accounts = useAssetAccounts(workspaceId)
  const pay = usePayLoan(workspaceId, loanId, installment.id)
  const pending = Math.max(0, Number(installment.totalAmount) - Number(installment.totalPaid)).toFixed(2)
  const [amount, setAmount] = useState(pending)
  const [receivingAccountId, setReceivingAccountId] = useState('')
  const [notes, setNotes] = useState('')
  const available = accounts.data?.filter((account) => account.currency === currency) ?? []
  return (
    <Dialog open title={`Registrar cobro · cuota ${installment.installmentNumber}`} onClose={onClose}>
      <form className={styles.createForm} onSubmit={(event) => {
        event.preventDefault()
        pay.mutate({
          receivingAccountId,
          amount,
          notes: notes.trim() || null,
          idempotencyKey: crypto.randomUUID(),
        }, { onSuccess: onClose })
      }}>
        <p className={styles.modalContext}>Pendiente de esta cuota: <strong>{money(pending, currency)}</strong></p>
        <label><span>Monto recibido</span><MoneyInput value={amount} onValueChange={setAmount} currency={currency} minorUnits /></label>
        <label><span>Cuenta donde recibiste el dinero</span><select required value={receivingAccountId} onChange={(e) => setReceivingAccountId(e.target.value)}><option value="">Selecciona una cuenta</option>{available.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}</select></label>
        <label><span>Nota</span><Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} /></label>
        {pay.isError && <p className={styles.error}>{pay.error.message}</p>}
        <div className={styles.dialogActions}><Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button><Button type="submit" loading={pay.isPending} disabled={!receivingAccountId || Number(amount) <= 0}>Registrar cobro</Button></div>
      </form>
    </Dialog>
  )
}

export function LendingPage() {
  const { activeWorkspace } = useActiveWorkspace()
  const workspaceId = activeWorkspace!.id
  const currency = activeWorkspace!.baseCurrency
  const canWrite = usePermission('debts.write')
  const [tab, setTab] = useState<Tab>('overview')
  const [search, setSearch] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [preset, setPreset] = useState<SimulationInput | null>(null)
  const [detailId, setDetailId] = useState('')
  const [payment, setPayment] = useState<LoanInstallment | null>(null)
  const summary = useLendingSummary(workspaceId)
  const loans = useLoans(workspaceId, search)
  const detail = useLoan(workspaceId, detailId)
  const current = summary.data?.currencies.find((row) => row.currency === currency) ?? summary.data?.currencies[0]

  const activeLoans = useMemo(() => loans.data?.filter((loan) => loan.status === 'ACTIVE' || loan.status === 'OVERDUE') ?? [], [loans.data])
  if (summary.isPending && loans.isPending) return <PageLoader />
  if (summary.isError || loans.isError) return <ErrorState title="No pudimos cargar Préstamos" message="Comprueba tu conexión e inténtalo nuevamente." onRetry={() => { void summary.refetch(); void loans.refetch() }} />

  const openCreate = (input?: SimulationInput) => { setPreset(input ?? null); setCreateOpen(true) }
  return (
    <div className={styles.page}>
      <PageHeader
        title="Préstamos"
        description="Controla el dinero que prestas con intereses, sus cuotas, cobros y rentabilidad."
        actions={canWrite ? <Button onClick={() => openCreate()}><Plus size={17} /> Nuevo préstamo</Button> : undefined}
      />
      <div className={styles.tabs} role="tablist">
        {([['overview','Resumen'],['loans','Mis préstamos'],['simulator','Simulador']] as const).map(([id,label]) => <button key={id} type="button" role="tab" aria-selected={tab === id} className={tab === id ? styles.tabActive : ''} onClick={() => setTab(id)}>{label}</button>)}
      </div>

      {tab === 'overview' && <>
        <section className={styles.metricsGrid}>
          <article><span>Capital pendiente</span><strong>{money(current?.principalPending ?? '0', current?.currency ?? currency)}</strong><small>{current?.activeCount ?? 0} préstamos activos</small></article>
          <article><span>Intereses por cobrar</span><strong>{money(current?.interestPending ?? '0', current?.currency ?? currency)}</strong></article>
          <article><span>Intereses recibidos</span><strong>{money(current?.interestReceived ?? '0', current?.currency ?? currency)}</strong></article>
          <article><span>Próximo cobro</span><strong>{summary.data?.upcoming[0] ? money(summary.data.upcoming[0].amount, summary.data.upcoming[0].currency) : money(0, currency)}</strong><small>{summary.data?.upcoming[0] ? `${summary.data.upcoming[0].borrowerName} · ${shortDate(summary.data.upcoming[0].dueDate)}` : 'Sin cobros pendientes'}</small></article>
        </section>
        <section className={styles.compactSection}>
          <div className={styles.sectionTitle}><div><h2>Préstamos activos</h2><p>Capital, interés y próxima fecha en una sola vista.</p></div><HandCoins size={22} /></div>
          {activeLoans.length === 0 ? <EmptyState title="Aún no tienes préstamos" description="Registra un préstamo o usa el simulador para preparar una propuesta." /> : <div className={styles.loanGrid}>{activeLoans.slice(0,6).map((loan) => <LoanCard key={loan.id} loan={loan} onOpen={() => setDetailId(loan.id)} />)}</div>}
        </section>
      </>}

      {tab === 'loans' && <section className={styles.compactSection}>
        <div className={styles.toolbar}><label className={styles.search}><Search size={16} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar persona..." /></label>{canWrite && <Button onClick={() => openCreate()}><Plus size={16} /> Registrar</Button>}</div>
        {loans.data?.length ? <div className={styles.loanGrid}>{loans.data.map((loan) => <LoanCard key={loan.id} loan={loan} onOpen={() => setDetailId(loan.id)} />)}</div> : <EmptyState title="Sin préstamos" description="No hay registros que coincidan con la búsqueda." />}
      </section>}

      {tab === 'simulator' && <SimulationPanel workspaceId={workspaceId} currency={currency} onUse={(input) => openCreate(input)} />}

      {detailId && <Dialog open title="Detalle del préstamo" onClose={() => setDetailId('')}>
        {detail.isPending ? <PageLoader /> : detail.data ? <div className={styles.detail}>
          <div className={styles.detailHeader}><div><h2>{detail.data.borrower_name}</h2><p>{money(detail.data.current_principal, detail.data.currency)} de capital pendiente</p></div><span className={styles.status}>{detail.data.status}</span></div>
          <div className={styles.detailStats}><article><span>Capital original</span><strong>{money(detail.data.original_principal, detail.data.currency)}</strong></article><article><span>Capital recuperado</span><strong>{money(detail.data.principal_received, detail.data.currency)}</strong></article><article><span>Interés recibido</span><strong>{money(detail.data.interest_received, detail.data.currency)}</strong></article></div>
          <div className={styles.tableWrap}><table><thead><tr><th>#</th><th>Fecha</th><th>Capital</th><th>Interés</th><th>Total</th><th>Estado</th><th /></tr></thead><tbody>{detail.data.installments.map((row) => <tr key={row.id}><td>{row.installmentNumber}</td><td>{shortDate(row.dueDate)}</td><td>{money(row.principalAmount, detail.data!.currency)}</td><td>{money(row.interestAmount, detail.data!.currency)}</td><td>{money(row.totalAmount, detail.data!.currency)}</td><td>{row.status}</td><td>{canWrite && row.status !== 'PAID' && row.status !== 'CANCELLED' ? <Button type="button" variant="secondary" onClick={() => setPayment(row)}>Cobrar</Button> : null}</td></tr>)}</tbody></table></div>
        </div> : <p>No se pudo cargar el préstamo.</p>}
      </Dialog>}

      {payment && detail.data && <PaymentDialog workspaceId={workspaceId} loanId={detail.data.id} currency={detail.data.currency} installment={payment} onClose={() => setPayment(null)} />}
      <CreateLoanDialog open={createOpen} workspaceId={workspaceId} currency={currency} preset={preset} onClose={() => { setCreateOpen(false); setPreset(null) }} />
    </div>
  )
}

function LoanCard({ loan, onOpen }: { loan: LoanListItem; onOpen: () => void }) {
  const progress = Math.min(100, Math.max(0, (Number(loan.principalReceived) / Number(loan.originalPrincipal || 1)) * 100))
  return <button type="button" className={styles.loanCard} onClick={onOpen}>
    <div className={styles.loanTop}><div><strong>{loan.borrowerName}</strong><span>{Number(loan.ratePercent)}% · {frequencyLabel[loan.frequency]}</span></div><span className={styles.status}>{loan.status}</span></div>
    <div className={styles.loanMoney}><span>Pendiente</span><strong>{money(loan.currentPrincipal, loan.currency)}</strong></div>
    <div className={styles.progress}><i style={{ width: `${progress}%` }} /></div>
    <div className={styles.loanFooter}><span>Cuota {money(loan.installmentAmount, loan.currency)}</span><span>{loan.nextDueDate ? shortDate(loan.nextDueDate) : 'Finalizado'}</span></div>
  </button>
}
