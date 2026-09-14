import { useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  ArrowLeft,
  BarChart3,
  Calculator,
  Coins,
  Info,
  LineChart,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import { useNavigate } from 'react-router'
import { Button, Dialog, MoneyInput } from '@/components/ui'
import { useCreateInvestmentPlan } from '@/features/investments'
import { useActiveWorkspace } from '@/features/workspace'
import {
  useInvestmentFinancialImpact,
  useInvestmentScenarios,
  useInvestmentSimulation,
  useInvestmentSimulationOptions,
} from './hooks'
import type {
  InvestmentContributionFrequency,
  InvestmentFinancialImpactResult,
  InvestmentScenarioResult,
  InvestmentSimulationResult,
} from './types'
import styles from './investment-simulator.module.css'

const formatMoney = (value: string | number, currency: string) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(Number(value))

const percent = (decimal: string) =>
  new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 }).format(
    Number(decimal) * 100,
  )

const inputPercent = (value: string) => {
  const numeric = Number(value.trim().replace(',', '.'))
  return Number.isFinite(numeric) ? String(numeric / 100) : ''
}

const scenarioLabels: Record<
  InvestmentScenarioResult['scenarios'][number]['label'],
  string
> = {
  CONSERVATIVE: 'Conservador',
  BASE: 'Base',
  OPTIMISTIC: 'Optimista',
}

const impactLabels: Record<
  InvestmentFinancialImpactResult['impact']['level'],
  string
> = {
  LOW: 'Impacto bajo',
  MODERATE: 'Impacto moderado',
  HIGH: 'Impacto alto',
  CRITICAL: 'Impacto crítico',
}

function GrowthChart({ result }: { result: InvestmentSimulationResult }) {
  const points = result.timeline
  const width = 760
  const height = 280
  const padding = 28
  const maxValue = Math.max(
    ...points.flatMap((point) => [
      Number(point.estimatedValue),
      Number(point.contributed),
    ]),
    1,
  )

  const toPolyline = (field: 'estimatedValue' | 'contributed') =>
    points
      .map((point, index) => {
        const x =
          padding +
          (index / Math.max(1, points.length - 1)) * (width - padding * 2)
        const y =
          height -
          padding -
          (Number(point[field]) / maxValue) * (height - padding * 2)
        return x.toFixed(1) + ',' + y.toFixed(1)
      })
      .join(' ')

  const valueLine = toPolyline('estimatedValue')
  const contributionLine = toPolyline('contributed')
  const end = points.at(-1)

  return (
    <div className={styles.chartBlock}>
      <div className={styles.chartHeader}>
        <div>
          <span>Evolución estimada</span>
          <strong>{result.years} años</strong>
        </div>
        <div className={styles.chartLegend}>
          <span>
            <i className={styles.valueLegend} /> Valor estimado
          </span>
          <span>
            <i className={styles.contributionLegend} /> Aportes
          </span>
        </div>
      </div>
      <div className={styles.chartScroll}>
        <svg
          className={styles.chart}
          viewBox={'0 0 ' + width + ' ' + height}
          role="img"
          aria-label="Evolución estimada de la inversión y los aportes"
        >
          {[0.25, 0.5, 0.75].map((ratio) => (
            <line
              key={ratio}
              className={styles.gridLine}
              x1={padding}
              x2={width - padding}
              y1={padding + (height - padding * 2) * ratio}
              y2={padding + (height - padding * 2) * ratio}
            />
          ))}
          <polygon
            className={styles.valueArea}
            points={
              padding +
              ',' +
              (height - padding) +
              ' ' +
              valueLine +
              ' ' +
              (width - padding) +
              ',' +
              (height - padding)
            }
          />
          <polyline className={styles.valueLine} points={valueLine} />
          <polyline
            className={styles.contributionLine}
            points={contributionLine}
          />
        </svg>
      </div>
      <div className={styles.chartFooter}>
        <span>Año 0</span>
        <span>
          Final: {end ? formatMoney(end.estimatedValue, result.currency) : '—'}
        </span>
      </div>
    </div>
  )
}

function ScenarioCards({
  result,
}: {
  result: InvestmentScenarioResult | undefined
}) {
  if (!result) return null

  return (
    <section className={styles.scenarioSection}>
      <div className={styles.sectionTitle}>
        <Sparkles size={18} aria-hidden="true" />
        <div>
          <h2>Tres escenarios</h2>
          <p>El resultado cambia cuando cambia el rendimiento supuesto.</p>
        </div>
      </div>
      <div className={styles.scenarioGrid}>
        {result.scenarios.map((scenario) => (
          <article
            key={scenario.label}
            className={
              styles.scenarioCard +
              (scenario.label === 'BASE' ? ' ' + styles.scenarioBase : '')
            }
          >
            <span>{scenarioLabels[scenario.label]}</span>
            <strong>
              {formatMoney(scenario.estimatedFinalValue, result.currency)}
            </strong>
            <small>Supuesto: {percent(scenario.annualReturn)}% anual</small>
            <small>
              Ganancia estimada:{' '}
              {formatMoney(scenario.estimatedProfit, result.currency)}
            </small>
          </article>
        ))}
      </div>
      <p className={styles.disclaimer}>{result.disclaimer}</p>
    </section>
  )
}

function FinancialImpact({
  result,
}: {
  result: InvestmentFinancialImpactResult | undefined
}) {
  if (!result) return null

  return (
    <section className={styles.impactSection}>
      <div className={styles.sectionTitle}>
        <Wallet size={18} aria-hidden="true" />
        <div>
          <h2>Comparación con tus finanzas</h2>
          <p>Esto solo compara la simulación. No separa ni descuenta dinero.</p>
        </div>
      </div>

      <div
        className={
          styles.impactVerdict + ' ' + styles['impact' + result.impact.level]
        }
      >
        <span>{impactLabels[result.impact.level]}</span>
        <strong>{result.impact.headline}</strong>
        <p>{result.impact.explanation}</p>
      </div>

      <div className={styles.impactMetrics}>
        <div>
          <span>Disponible actual</span>
          <strong>
            {formatMoney(result.availableMoney, result.baseCurrency)}
          </strong>
        </div>
        <div>
          <span>Disponible hipotético después</span>
          <strong>
            {formatMoney(result.remainingAvailableMoney, result.baseCurrency)}
          </strong>
        </div>
        <div>
          <span>Liquidez que representa</span>
          <strong>{result.liquidityPercentageUsed}%</strong>
        </div>
        <div>
          <span>Flujo neto del periodo</span>
          <strong>
            {formatMoney(result.currentNetCashFlow, result.baseCurrency)}
          </strong>
        </div>
        <div>
          <span>Aporte equivalente al mes</span>
          <strong>
            {formatMoney(
              result.recurringContribution.monthlyEquivalentBase,
              result.baseCurrency,
            )}
          </strong>
        </div>
      </div>

      {result.conversion && (
        <p className={styles.conversionNote}>
          <Info size={15} aria-hidden="true" />
          Para comparar con tus finanzas, Fynar convirtió la simulación de{' '}
          {result.conversion.from} a {result.conversion.to} con la tasa de
          referencia del {result.conversion.date}.
        </p>
      )}

      <p className={styles.disclaimer}>{result.disclaimer}</p>
    </section>
  )
}

function Results({
  simulation,
  scenarios,
  impact,
  onSavePlan,
}: {
  simulation: InvestmentSimulationResult
  scenarios?: InvestmentScenarioResult
  impact?: InvestmentFinancialImpactResult
  onSavePlan: () => void
}) {
  const yearlyRows = useMemo(
    () =>
      simulation.timeline.filter(
        (point) =>
          point.month === 0 ||
          point.month === simulation.years * 12 ||
          point.month % 12 === 0,
      ),
    [simulation],
  )

  return (
    <div className={styles.results}>
      <section className={styles.resultHero}>
        <span>Valor estimado al final</span>
        <strong>
          {formatMoney(simulation.estimatedFinalValue, simulation.currency)}
        </strong>
        <small>
          Con un supuesto de {percent(simulation.annualReturn)}% anual durante{' '}
          {simulation.years} años.
        </small>
      </section>

      <div className={styles.resultActions}>
        <Button type="button" onClick={onSavePlan}>
          Guardar como plan
        </Button>
        <small>
          Guardarlo no mueve dinero. Después decides cuándo empezar y cuándo
          registrar aportes reales.
        </small>
      </div>

      <div className={styles.resultMetrics}>
        <div>
          <Coins size={18} aria-hidden="true" />
          <span>Total aportado</span>
          <strong>
            {formatMoney(simulation.totalContributions, simulation.currency)}
          </strong>
        </div>
        <div>
          <TrendingUp size={18} aria-hidden="true" />
          <span>Rendimiento estimado</span>
          <strong>
            {formatMoney(simulation.estimatedProfit, simulation.currency)}
          </strong>
        </div>
        <div>
          <BarChart3 size={18} aria-hidden="true" />
          <span>Retorno sobre aportes</span>
          <strong>{simulation.totalReturnPercentage}%</strong>
        </div>
        <div>
          <ShieldCheck size={18} aria-hidden="true" />
          <span>Valor ajustado por inflación</span>
          <strong>
            {formatMoney(
              simulation.inflationAdjustedValue,
              simulation.currency,
            )}
          </strong>
        </div>
      </div>

      <GrowthChart result={simulation} />
      <ScenarioCards result={scenarios} />
      <FinancialImpact result={impact} />

      <section className={styles.yearTableSection}>
        <div className={styles.sectionTitle}>
          <LineChart size={18} aria-hidden="true" />
          <div>
            <h2>Evolución año por año</h2>
            <p>Separa cuánto aportaste y cuánto sería rendimiento.</p>
          </div>
        </div>
        <div className={styles.tableScroll}>
          <table>
            <thead>
              <tr>
                <th>Año</th>
                <th>Aportado</th>
                <th>Valor estimado</th>
                <th>Rendimiento</th>
              </tr>
            </thead>
            <tbody>
              {yearlyRows.map((row) => (
                <tr key={row.month}>
                  <td>{Math.round(row.year)}</td>
                  <td>{formatMoney(row.contributed, simulation.currency)}</td>
                  <td>{formatMoney(row.estimatedValue, simulation.currency)}</td>
                  <td>{formatMoney(row.estimatedProfit, simulation.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className={styles.assumptions}>
        <strong>
          <ShieldCheck size={17} aria-hidden="true" /> Qué está suponiendo Fynar
        </strong>
        <ul>
          {simulation.assumptions.map((assumption) => (
            <li key={assumption}>{assumption}</li>
          ))}
        </ul>
      </section>
    </div>
  )
}

export function InvestmentSimulatorPage() {
  const navigate = useNavigate()
  const { activeWorkspaceId, activeWorkspace } = useActiveWorkspace()
  const workspaceId = activeWorkspaceId ?? ''
  const options = useInvestmentSimulationOptions(
    workspaceId,
    Boolean(workspaceId),
  )
  const simulation = useInvestmentSimulation(workspaceId)
  const scenarios = useInvestmentScenarios(workspaceId)
  const financialImpact = useInvestmentFinancialImpact(workspaceId)
  const createPlan = useCreateInvestmentPlan(workspaceId)

  const [currency, setCurrency] = useState(
    activeWorkspace?.baseCurrency ?? 'COP',
  )
  const [initialAmount, setInitialAmount] = useState('')
  const [recurringContribution, setRecurringContribution] = useState('0')
  const [frequency, setFrequency] =
    useState<InvestmentContributionFrequency>('MONTHLY')
  const [years, setYears] = useState(10)
  const [annualReturnPercent, setAnnualReturnPercent] = useState('8')
  const [annualFeePercent, setAnnualFeePercent] = useState('0')
  const [inflationPercent, setInflationPercent] = useState('4')
  const [advanced, setAdvanced] = useState(false)
  const [compareWithFinances, setCompareWithFinances] = useState(true)
  const [formError, setFormError] = useState<string | null>(null)
  const [saveOpen, setSaveOpen] = useState(false)
  const [planName, setPlanName] = useState('Mi plan de inversión')

  useEffect(() => {
    if (!options.data) return
    setCurrency((current) =>
      options.data.currencies.some((item) => item.code === current)
        ? current
        : options.data.defaultCurrency,
    )
  }, [options.data])

  const clearResults = () => {
    simulation.reset()
    scenarios.reset()
    financialImpact.reset()
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setFormError(null)

    const annualReturn = inputPercent(annualReturnPercent)
    const annualFee = inputPercent(annualFeePercent)
    const inflationRate = inputPercent(inflationPercent)

    if (!initialAmount || Number(initialAmount) <= 0) {
      setFormError('Ingresa un monto inicial mayor que cero.')
      return
    }
    if (!annualReturn || Number(annualReturn) <= -1) {
      setFormError('Ingresa una rentabilidad anual válida.')
      return
    }
    if (!annualFee || Number(annualFee) < 0 || Number(annualFee) >= 1) {
      setFormError('La comisión anual debe estar entre 0% y menos de 100%.')
      return
    }
    if (
      !inflationRate ||
      Number(inflationRate) < 0 ||
      Number(inflationRate) > 1
    ) {
      setFormError('La inflación debe estar entre 0% y 100%.')
      return
    }

    const contribution =
      frequency === 'NONE' ? '0' : recurringContribution || '0'
    const input = {
      currency,
      initialAmount,
      recurringContribution: contribution,
      contributionFrequency: frequency,
      years,
      annualReturn,
      annualFee,
      inflationRate,
    }

    try {
      const tasks: Promise<unknown>[] = [
        simulation.mutateAsync(input),
        scenarios.mutateAsync({
          ...input,
          baseAnnualReturn: annualReturn,
          spread: options.data?.defaults.scenarioSpread ?? '0.04',
        }),
      ]
      if (compareWithFinances) {
        tasks.push(
          financialImpact.mutateAsync({
            currency,
            initialAmount,
            recurringContribution: contribution,
            contributionFrequency: frequency,
          }),
        )
      } else {
        financialImpact.reset()
      }
      await Promise.all(tasks)
    } catch {
      // Cada hook conserva el error específico para mostrarlo en la interfaz.
    }
  }

  const pending =
    simulation.isPending ||
    scenarios.isPending ||
    financialImpact.isPending

  const error =
    formError ||
    (simulation.error instanceof Error ? simulation.error.message : null) ||
    (scenarios.error instanceof Error ? scenarios.error.message : null) ||
    (financialImpact.error instanceof Error
      ? financialImpact.error.message
      : null)

  return (
    <div className={styles.page}>
      <button
        className={styles.backButton}
        type="button"
        onClick={() => navigate('/app/dashboard')}
      >
        <ArrowLeft size={17} aria-hidden="true" /> Volver a Inicio
      </button>

      <header className={styles.hero}>
        <div className={styles.heroIcon}>
          <TrendingUp size={26} aria-hidden="true" />
        </div>
        <div>
          <span className={styles.eyebrow}>Inversiones</span>
          <h1>Simula cómo podría crecer una inversión</h1>
          <p>
            Usa cualquier monto, aunque no esté en tus cuentas. Prueba aportes,
            tiempo, rentabilidad, inflación y comisiones sin modificar un saldo
            real.
          </p>
        </div>
      </header>

      <div className={styles.layout}>
        <form className={styles.formPanel} onSubmit={submit}>
          <div className={styles.sectionHeading}>
            <span>Paso 1</span>
            <h2>Define la inversión</h2>
          </div>

          <label className={styles.field}>
            <span>Monto inicial</span>
            <MoneyInput
              minorUnits
              value={initialAmount}
              onValueChange={(value) => {
                setInitialAmount(value)
                clearResults()
              }}
              currency={currency}
              placeholder="0,00"
              aria-label="Monto inicial de la inversión"
            />
          </label>

          <label className={styles.field}>
            <span>Moneda</span>
            <select
              aria-label="Moneda de la simulación"
              value={currency}
              disabled={options.isPending}
              onChange={(event) => {
                setCurrency(event.target.value)
                clearResults()
              }}
            >
              {(options.data?.currencies ?? []).map((item) => (
                <option key={item.code} value={item.code}>
                  {item.code} · {item.name}
                </option>
              ))}
            </select>
          </label>

          <div className={styles.twoColumns}>
            <label className={styles.field}>
              <span>Aporte periódico</span>
              <MoneyInput
                minorUnits
                value={recurringContribution}
                onValueChange={(value) => {
                  setRecurringContribution(value)
                  clearResults()
                }}
                currency={currency}
                placeholder="0,00"
                aria-label="Aporte periódico"
                disabled={frequency === 'NONE'}
              />
            </label>

            <label className={styles.field}>
              <span>Frecuencia</span>
              <select
                aria-label="Frecuencia de aportes"
                value={frequency}
                onChange={(event) => {
                  const next =
                    event.target.value as InvestmentContributionFrequency
                  setFrequency(next)
                  if (next === 'NONE') setRecurringContribution('0')
                  clearResults()
                }}
              >
                {(options.data?.contributionFrequencies ?? [
                  { value: 'NONE' as const, label: 'Sin aportes' },
                  { value: 'DAILY' as const, label: 'Diario' },
                  { value: 'WEEKLY' as const, label: 'Semanal' },
                  { value: 'MONTHLY' as const, label: 'Mensual' },
                  { value: 'QUARTERLY' as const, label: 'Trimestral' },
                  { value: 'YEARLY' as const, label: 'Anual' },
                ]).map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className={styles.twoColumns}>
            <label className={styles.field}>
              <span>Horizonte</span>
              <select
                aria-label="Años de inversión"
                value={years}
                onChange={(event) => {
                  setYears(Number(event.target.value))
                  clearResults()
                }}
              >
                {[1, 2, 3, 5, 10, 15, 20, 25, 30, 40, 50].map((value) => (
                  <option key={value} value={value}>
                    {value} {value === 1 ? 'año' : 'años'}
                  </option>
                ))}
              </select>
            </label>

            <label className={styles.field}>
              <span>Rentabilidad esperada anual (%)</span>
              <input
                aria-label="Rentabilidad anual"
                inputMode="decimal"
                value={annualReturnPercent}
                onChange={(event) => {
                  setAnnualReturnPercent(event.target.value)
                  clearResults()
                }}
                placeholder="Ej. 8"
              />
            </label>
          </div>

          <button
            className={styles.advancedToggle}
            type="button"
            onClick={() => setAdvanced((value) => !value)}
            aria-expanded={advanced}
          >
            <Calculator size={17} aria-hidden="true" />
            {advanced ? 'Ocultar opciones avanzadas' : 'Opciones avanzadas'}
          </button>

          {advanced && (
            <div className={styles.advancedPanel}>
              <label className={styles.field}>
                <span>Comisión anual (%)</span>
                <input
                  aria-label="Comisión anual"
                  inputMode="decimal"
                  value={annualFeePercent}
                  onChange={(event) => {
                    setAnnualFeePercent(event.target.value)
                    clearResults()
                  }}
                  placeholder="0"
                />
              </label>
              <label className={styles.field}>
                <span>Inflación anual (%)</span>
                <input
                  aria-label="Inflación anual"
                  inputMode="decimal"
                  value={inflationPercent}
                  onChange={(event) => {
                    setInflationPercent(event.target.value)
                    clearResults()
                  }}
                  placeholder="4"
                />
              </label>
            </div>
          )}

          <label className={styles.compareToggle}>
            <input
              type="checkbox"
              checked={compareWithFinances}
              onChange={(event) => {
                setCompareWithFinances(event.target.checked)
                financialImpact.reset()
              }}
            />
            <span>
              <strong>Comparar con mis finanzas</strong>
              <small>
                Contrasta el monto con tu disponible y flujo actual, sin tocar
                tus saldos.
              </small>
            </span>
          </label>

          {error && (
            <div className={styles.errorBox} role="alert">
              {error}
            </div>
          )}

          <Button
            type="submit"
            size="large"
            loading={pending}
            disabled={!workspaceId || options.isError}
            className={styles.simulateButton}
          >
            Simular inversión
          </Button>

          <p className={styles.safeNote}>
            <ShieldCheck size={16} aria-hidden="true" />
            Simular nunca crea movimientos ni modifica dinero real.
          </p>
        </form>

        <aside className={styles.previewPanel}>
          {simulation.data ? (
            <Results
              simulation={simulation.data}
              scenarios={scenarios.data}
              impact={financialImpact.data}
              onSavePlan={() => setSaveOpen(true)}
            />
          ) : (
            <div className={styles.emptyPreview}>
              <div className={styles.emptyIcon}>
                <Sparkles size={28} aria-hidden="true" />
              </div>
              <h2>Construye un escenario antes de invertir</h2>
              <p>
                Fynar separará aportes y rendimiento, mostrará la evolución en
                el tiempo y podrá compararla con tu situación actual.
              </p>
              <div className={styles.previewItems}>
                <span>Valor futuro y rendimiento estimado</span>
                <span>Gráfica de crecimiento y aportes</span>
                <span>Escenarios conservador, base y optimista</span>
                <span>Impacto opcional sobre tu liquidez actual</span>
              </div>
            </div>
          )}
        </aside>
      </div>

      <Dialog
        open={saveOpen}
        title="Guardar como plan"
        onClose={() => setSaveOpen(false)}
        footer={
          <div className={styles.saveDialogActions}>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setSaveOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              form="save-investment-plan"
              loading={createPlan.isPending}
            >
              Guardar plan
            </Button>
          </div>
        }
      >
        <form
          id="save-investment-plan"
          className={styles.savePlanForm}
          onSubmit={async (event) => {
            event.preventDefault()
            if (!simulation.data || !planName.trim()) return
            try {
              const created = await createPlan.mutateAsync({
                name: planName.trim(),
                currency: simulation.data.currency,
                plannedInitialAmount: simulation.data.initialAmount,
                recurringContribution: simulation.data.recurringContribution,
                contributionFrequency: simulation.data.contributionFrequency,
                horizonYears: simulation.data.years,
                annualReturn: simulation.data.annualReturn,
                annualFee: simulation.data.annualFee,
                inflationRate: simulation.data.inflationRate,
                includeInNetWorth: true,
              })
              setSaveOpen(false)
              navigate(`/app/investments/${created.id}`)
            } catch {
              // El hook conserva el error para mostrarlo en el diálogo.
            }
          }}
        >
          <label className={styles.field}>
            <span>Nombre del plan</span>
            <input
              aria-label="Nombre del plan"
              value={planName}
              maxLength={140}
              onChange={(event) => setPlanName(event.target.value)}
              placeholder="Ej. Fondo de largo plazo"
            />
          </label>
          <p className={styles.savePlanNote}>
            Se guardarán el monto, el ritmo de aportes, el horizonte y tus
            supuestos. No se crea una cuenta, no se descuenta dinero y no nace
            ninguna obligación recurrente.
          </p>
          {createPlan.error instanceof Error ? (
            <p className={styles.errorBox} role="alert">
              {createPlan.error.message}
            </p>
          ) : null}
        </form>
      </Dialog>
    </div>
  )
}
