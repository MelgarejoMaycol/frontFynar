import { useMemo, useState, type FormEvent } from 'react'
import { ArrowLeft, Banknote, Calculator, CreditCard, Landmark, ShieldCheck, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router'
import { Button, MoneyInput } from '@/components/ui'
import { useAccounts } from '@/features/accounts/hooks/accounts.hooks'
import { useCategories } from '@/features/categories/hooks/categories.hooks'
import { useActiveWorkspace } from '@/features/workspace'
import { usePurchaseSimulation } from './hooks'
import type { PurchasePaymentMethod, PurchaseSimulationResult, SimulationImpactLevel } from './types'
import styles from './simulator.module.css'

const paymentMethods: Array<{
  value: PurchasePaymentMethod
  label: string
  description: string
  icon: typeof Banknote
}> = [
  { value: 'CASH', label: 'Contado', description: 'Sale de una cuenta ahora', icon: Banknote },
  { value: 'CREDIT_CARD', label: 'Tarjeta', description: 'Compra con tu tarjeta de crédito', icon: CreditCard },
  { value: 'FINANCING', label: 'Financiación', description: 'Crédito o financiación externa', icon: Landmark },
]

const levelLabels: Record<SimulationImpactLevel, string> = {
  LOW: 'Impacto bajo',
  MODERATE: 'Impacto moderado',
  HIGH: 'Impacto alto',
  CRITICAL: 'Impacto crítico',
}

const formatMoney = (value: string | number, currency = 'COP') =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(Number(value))

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('es-CO', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${value}T00:00:00Z`))

function ResultPanel({ result }: { result: PurchaseSimulationResult }) {
  const delta = Number(result.before.projectedClosingBalance) - Number(result.after.projectedClosingBalance)
  return (
    <section className={styles.resultPanel} aria-live="polite">
      <div className={`${styles.verdict} ${styles[`level${result.impact.level}`]}`}>
        <div className={styles.verdictTop}>
          <span className={styles.levelPill}>{levelLabels[result.impact.level]}</span>
          <Sparkles size={18} aria-hidden="true" />
        </div>
        <h2>{result.impact.headline}</h2>
        <p>{result.impact.explanation}</p>
      </div>

      <div className={styles.comparison}>
        <div className={styles.metricCard}>
          <span>Antes de comprar</span>
          <strong>{formatMoney(result.before.projectedClosingBalance, result.currency)}</strong>
          <small>Proyección al cierre</small>
        </div>
        <div className={styles.metricArrow} aria-hidden="true">→</div>
        <div className={styles.metricCard}>
          <span>Después de comprar</span>
          <strong>{formatMoney(result.after.projectedClosingBalance, result.currency)}</strong>
          <small>Proyección al cierre</small>
        </div>
      </div>

      <div className={styles.impactGrid}>
        <div><span>Impacto en tu margen</span><strong>-{formatMoney(delta, result.currency)}</strong></div>
        <div><span>Compromiso añadido este periodo</span><strong>{formatMoney(result.after.addedCommitmentThisPeriod, result.currency)}</strong></div>
        <div><span>Punto de menor liquidez</span><strong>{formatMoney(result.after.lowestProjectedBalance.amount, result.currency)}</strong></div>
        {result.after.selectedAccountAfter !== null && (
          <div>
            <span>{result.purchase.paymentMethod === 'CREDIT_CARD' ? 'Cupo estimado después' : 'Saldo estimado de la cuenta'}</span>
            <strong>{formatMoney(result.after.selectedAccountAfter, result.currency)}</strong>
          </div>
        )}
      </div>

      {result.budgets.length > 0 && (
        <div className={styles.assumptions}>
          <div className={styles.assumptionTitle}>Impacto en presupuestos</div>
          <ul>
            {result.budgets.map((budget) => (
              <li key={budget.id}>
                <strong>{budget.name}:</strong> quedaría en {formatMoney(budget.spentAfter, result.currency)} de {formatMoney(budget.amount, result.currency)} ({Math.round(Number(budget.percentageAfter))}%). {budget.statusAfter === 'EXCEEDED' ? 'Se excedería.' : budget.statusAfter === 'WARNING' ? 'Entraría en alerta.' : 'Seguiría dentro del límite.'}
              </li>
            ))}
          </ul>
        </div>
      )}

      {result.financing && (
        <>
          <div className={styles.financingBox}>
            <div><span>Cuota estimada</span><strong>{formatMoney(result.financing.monthlyPayment, result.currency)}</strong></div>
            <div><span>Intereses estimados</span><strong>{formatMoney(result.financing.estimatedInterest, result.currency)}</strong></div>
            <div><span>Costo total estimado</span><strong>{formatMoney(result.financing.totalCost, result.currency)}</strong></div>
            <div><span>Plazo</span><strong>{result.financing.installments} cuotas</strong></div>
          </div>
          <div className={styles.assumptions}>
            <div className={styles.assumptionTitle}>Compromisos futuros estimados</div>
            <ul>
              {result.financing.schedule.slice(0, 12).map((item) => (
                <li key={item.installment}>Cuota {item.installment} · {formatDate(item.date)} · {formatMoney(item.amount, result.currency)}</li>
              ))}
              {result.financing.schedule.length > 12 && <li>Y {result.financing.schedule.length - 12} cuotas adicionales del mismo cronograma estimado.</li>}
            </ul>
          </div>
        </>
      )}

      <div className={styles.assumptions}>
        <div className={styles.assumptionTitle}><ShieldCheck size={18} /> Qué tuvo en cuenta Fynar</div>
        <ul>{result.assumptions.map((item) => <li key={item}>{item}</li>)}</ul>
      </div>
    </section>
  )
}

export function PurchaseSimulatorPage() {
  const navigate = useNavigate()
  const { activeWorkspaceId, activeWorkspace } = useActiveWorkspace()
  const workspaceId = activeWorkspaceId ?? ''
  const currency = activeWorkspace?.baseCurrency ?? 'COP'
  const accounts = useAccounts(workspaceId, Boolean(workspaceId))
  const categories = useCategories(workspaceId, Boolean(workspaceId))
  const simulation = usePurchaseSimulation(workspaceId)
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [method, setMethod] = useState<PurchasePaymentMethod>('CASH')
  const [accountId, setAccountId] = useState('')
  const [installments, setInstallments] = useState(1)
  const [ratePercent, setRatePercent] = useState('')
  const [formError, setFormError] = useState<string | null>(null)

  const eligibleAccounts = useMemo(() => {
    const list = accounts.data ?? []
    return method === 'CREDIT_CARD'
      ? list.filter((account) => account.type === 'CREDIT_CARD' && account.isActive)
      : list.filter((account) => account.nature === 'ASSET' && account.type !== 'CREDIT_CARD' && account.isActive)
  }, [accounts.data, method])

  const expenseCategories = useMemo(
    () => (categories.data ?? []).filter((category) => category.type === 'EXPENSE' && category.isActive),
    [categories.data],
  )

  const changeMethod = (next: PurchasePaymentMethod) => {
    setMethod(next)
    setAccountId('')
    if (next === 'CASH') {
      setInstallments(1)
      setRatePercent('')
    }
    simulation.reset()
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    setFormError(null)
    const numericAmount = Number(amount)
    const numericRate = ratePercent.trim() === '' ? undefined : Number(ratePercent.replace(',', '.')) / 100
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setFormError('Ingresa un precio mayor que cero.')
      return
    }
    if ((method === 'CASH' || method === 'CREDIT_CARD') && !accountId) {
      setFormError(method === 'CASH' ? 'Selecciona la cuenta desde la que pagarías.' : 'Selecciona la tarjeta que usarías.')
      return
    }
    if (method !== 'CASH' && installments > 1 && numericRate === undefined) {
      setFormError('Para varias cuotas necesitamos la tasa mensual. Si la compra es sin intereses, escribe 0.')
      return
    }
    simulation.mutate({
      name: name.trim() || undefined,
      amount: numericAmount,
      paymentMethod: method,
      accountId: method === 'FINANCING' ? undefined : accountId,
      categoryId: categoryId || undefined,
      installments: method === 'CASH' ? 1 : installments,
      monthlyRate: method === 'CASH' ? undefined : numericRate,
    })
  }

  return (
    <div className={styles.page}>
      <button className={styles.backButton} type="button" onClick={() => navigate('/app/dashboard')}>
        <ArrowLeft size={17} /> Volver a Inicio
      </button>

      <header className={styles.hero}>
        <div className={styles.heroIcon}><Calculator size={25} /></div>
        <div>
          <span className={styles.eyebrow}>Simulador de decisiones</span>
          <h1>¿Puedo comprar esto?</h1>
          <p>Mira cómo una compra podría cambiar tu fin de mes antes de gastar un peso.</p>
        </div>
      </header>

      <div className={styles.layout}>
        <form className={styles.formPanel} onSubmit={submit}>
          <div className={styles.sectionHeading}><span>Paso 1</span><h2>Cuéntanos qué quieres comprar</h2></div>
          <label className={styles.field}>
            <span>¿Qué es? <small>Opcional</small></span>
            <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Ej. Computador, celular, viaje…" maxLength={120} />
          </label>
          <label className={styles.field}>
            <span>¿Cuánto cuesta?</span>
            <MoneyInput minorUnits value={amount} onValueChange={setAmount} currency={currency} placeholder="0,00" aria-label="Precio de la compra" />
          </label>
          <label className={styles.field}>
            <span>Categoría <small>Opcional, mejora el análisis</small></span>
            <select value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
              <option value="">Sin categoría</option>
              {expenseCategories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select>
            <small className={styles.help}>Si la eliges, Fynar medirá también el impacto sobre tus presupuestos activos.</small>
          </label>

          <div className={styles.sectionHeading}><span>Paso 2</span><h2>¿Cómo lo pagarías?</h2></div>
          <div className={styles.methodGrid}>
            {paymentMethods.map(({ value, label, description, icon: Icon }) => (
              <button key={value} type="button" className={`${styles.methodCard} ${method === value ? styles.methodSelected : ''}`} onClick={() => changeMethod(value)} aria-pressed={method === value}>
                <Icon size={21} /><strong>{label}</strong><small>{description}</small>
              </button>
            ))}
          </div>

          {(method === 'CASH' || method === 'CREDIT_CARD') && (
            <label className={styles.field}>
              <span>{method === 'CASH' ? 'Cuenta de pago' : 'Tarjeta'}</span>
              <select value={accountId} onChange={(event) => setAccountId(event.target.value)}>
                <option value="">Selecciona una opción</option>
                {eligibleAccounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name} · {method === 'CREDIT_CARD'
                      ? `Cupo ${formatMoney(Math.max(0, Number(account.creditLimit ?? 0) - Number(account.currentBalance)), account.currency)}`
                      : `Disponible ${formatMoney(account.availableBalance ?? account.currentBalance, account.currency)}`}
                  </option>
                ))}
              </select>
              {!accounts.isLoading && eligibleAccounts.length === 0 && <small className={styles.help}>No encontramos una cuenta compatible para esta forma de pago.</small>}
            </label>
          )}

          {method !== 'CASH' && (
            <div className={styles.twoColumns}>
              <label className={styles.field}>
                <span>Número de cuotas</span>
                <select value={installments} onChange={(event) => setInstallments(Number(event.target.value))}>
                  {[1, 3, 6, 12, 18, 24, 36, 48].map((value) => <option key={value} value={value}>{value}</option>)}
                </select>
              </label>
              <label className={styles.field}>
                <span>Tasa mensual (%)</span>
                <input inputMode="decimal" value={ratePercent} onChange={(event) => setRatePercent(event.target.value)} placeholder={installments > 1 ? 'Ej. 1,8' : '0'} />
                <small className={styles.help}>Si es sin intereses, escribe 0.</small>
              </label>
            </div>
          )}

          {(formError || simulation.isError) && <div className={styles.errorBox}>{formError ?? (simulation.error instanceof Error ? simulation.error.message : 'No pudimos realizar la simulación.')}</div>}
          <Button type="submit" size="large" loading={simulation.isPending} disabled={!workspaceId} className={styles.simulateButton}>Simular impacto</Button>
          <p className={styles.safeNote}><ShieldCheck size={16} /> Simular no registra ninguna compra ni modifica tus saldos.</p>
        </form>

        <aside className={styles.previewPanel}>
          {simulation.data ? <ResultPanel result={simulation.data} /> : (
            <div className={styles.emptyPreview}>
              <div className={styles.emptyIcon}><Sparkles size={28} /></div>
              <h2>Tu respuesta aparecerá aquí</h2>
              <p>Fynar comparará tu compra con la proyección del periodo y tus compromisos conocidos.</p>
              <div className={styles.previewItems}>
                <span>Saldo proyectado antes y después</span>
                <span>Impacto sobre tu margen y presupuestos</span>
                <span>Cuota, intereses, costo total y cronograma si financias</span>
                <span>Punto de menor liquidez del periodo</span>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
