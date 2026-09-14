import type { HttpRequestOptions } from '@/services/http/httpTypes'

type DemoFrequency =
  | 'NONE'
  | 'DAILY'
  | 'WEEKLY'
  | 'MONTHLY'
  | 'QUARTERLY'
  | 'YEARLY'

const money = (value: number) => value.toFixed(2)
const success = (data: unknown) => ({ success: true as const, data })

const currencies = [
  { code: 'COP', name: 'peso colombiano', symbol: '$', minorUnits: 2 },
  { code: 'USD', name: 'dólar estadounidense', symbol: 'US$', minorUnits: 2 },
  { code: 'EUR', name: 'euro', symbol: '€', minorUnits: 2 },
  { code: 'GBP', name: 'libra esterlina', symbol: '£', minorUnits: 2 },
  { code: 'CAD', name: 'dólar canadiense', symbol: 'CA$', minorUnits: 2 },
  { code: 'MXN', name: 'peso mexicano', symbol: 'MX$', minorUnits: 2 },
  { code: 'BRL', name: 'real brasileño', symbol: 'R$', minorUnits: 2 },
  { code: 'JPY', name: 'yen japonés', symbol: '¥', minorUnits: 0 },
  { code: 'CHF', name: 'franco suizo', symbol: 'CHF', minorUnits: 2 },
]

const copPerUnit: Record<string, number> = {
  COP: 1,
  USD: 3125,
  EUR: 3650,
  GBP: 4200,
  CAD: 2300,
  MXN: 173,
  BRL: 590,
  JPY: 21,
  CHF: 3900,
}

const demoOptions = () => ({
  currencies,
  defaultCurrency: 'COP',
  contributionFrequencies: [
    { value: 'NONE', label: 'Sin aportes' },
    { value: 'DAILY', label: 'Diario' },
    { value: 'WEEKLY', label: 'Semanal' },
    { value: 'MONTHLY', label: 'Mensual' },
    { value: 'QUARTERLY', label: 'Trimestral' },
    { value: 'YEARLY', label: 'Anual' },
  ],
  limits: { minYears: 1, maxYears: 50 },
  defaults: {
    years: 10,
    annualReturn: '0.08',
    annualFee: '0.00',
    inflationRate: '0.04',
    scenarioSpread: '0.04',
  },
})

const simulate = (
  body: Record<string, unknown>,
  annualReturnOverride?: number,
) => {
  const currency = String(body.currency ?? 'COP').toUpperCase()
  const initialAmount = Number(body.initialAmount ?? 0)
  const recurringContribution = Number(body.recurringContribution ?? 0)
  const contributionFrequency = String(
    body.contributionFrequency ?? 'MONTHLY',
  ) as DemoFrequency
  const years = Math.max(1, Math.min(50, Number(body.years ?? 10)))
  const annualReturn =
    annualReturnOverride ??
    Number(body.annualReturn ?? body.baseAnnualReturn ?? 0.08)
  const annualFee = Number(body.annualFee ?? 0)
  const inflationRate = Number(body.inflationRate ?? 0)
  const months = years * 12
  const daysPerYear = 365
  const days = years * daysPerYear
  const grossDaily = Math.pow(1 + annualReturn, 1 / daysPerYear)
  const feeDaily = Math.pow(1 - annualFee, 1 / daysPerYear)
  const dailyFactor = grossDaily * feeDaily
  const eventsPerYear: Record<DemoFrequency, number> = {
    NONE: 0,
    DAILY: 365,
    WEEKLY: 52,
    MONTHLY: 12,
    QUARTERLY: 4,
    YEARLY: 1,
  }
  const yearlyEvents = eventsPerYear[contributionFrequency]

  let balance = initialAmount
  let totalContributions = initialAmount
  let nextTimelineMonth = 1
  const timeline = [
    {
      month: 0,
      year: 0,
      contributed: money(totalContributions),
      estimatedValue: money(balance),
      estimatedProfit: '0.00',
    },
  ]

  for (let day = 1; day <= days; day += 1) {
    balance *= dailyFactor
    if (yearlyEvents > 0 && recurringContribution > 0) {
      const eventsBefore = Math.floor(((day - 1) * yearlyEvents) / daysPerYear)
      const eventsNow = Math.floor((day * yearlyEvents) / daysPerYear)
      const newEvents = eventsNow - eventsBefore
      if (newEvents > 0) {
        const contribution = recurringContribution * newEvents
        balance += contribution
        totalContributions += contribution
      }
    }

    while (
      nextTimelineMonth <= months &&
      day >= Math.round((nextTimelineMonth * daysPerYear) / 12)
    ) {
      timeline.push({
        month: nextTimelineMonth,
        year: Number((nextTimelineMonth / 12).toFixed(4)),
        contributed: money(totalContributions),
        estimatedValue: money(balance),
        estimatedProfit: money(balance - totalContributions),
      })
      nextTimelineMonth += 1
    }
  }

  const estimatedProfit = balance - totalContributions
  const inflationAdjustedValue =
    inflationRate > 0 ? balance / Math.pow(1 + inflationRate, years) : balance
  const totalReturnPercentage =
    totalContributions > 0 ? (estimatedProfit / totalContributions) * 100 : 0

  return {
    currency,
    initialAmount: money(initialAmount),
    recurringContribution: money(recurringContribution),
    contributionFrequency,
    years,
    annualReturn: annualReturn.toFixed(8),
    annualFee: annualFee.toFixed(8),
    inflationRate: inflationRate.toFixed(8),
    effectiveMonthlyReturn: (Math.pow(dailyFactor, daysPerYear / 12) - 1).toFixed(8),
    effectiveAnnualReturn: (Math.pow(dailyFactor, daysPerYear) - 1).toFixed(8),
    totalContributions: money(totalContributions),
    estimatedFinalValue: money(balance),
    estimatedProfit: money(estimatedProfit),
    inflationAdjustedValue: money(inflationAdjustedValue),
    totalReturnPercentage: totalReturnPercentage.toFixed(2),
    timeline,
    assumptions: [
      'La rentabilidad anual se distribuye de forma equivalente a lo largo del año para modelar aportes diarios, semanales y periódicos.',
      'Los aportes periódicos se incorporan al final de cada intervalo configurado.',
      annualFee > 0
        ? 'La comisión anual indicada se descuenta durante el periodo.'
        : 'No se incluyeron comisiones.',
      inflationRate > 0
        ? 'El valor real estimado descuenta la inflación anual indicada.'
        : 'No se aplicó ajuste por inflación.',
      'Los resultados son escenarios matemáticos y no garantizan rendimientos futuros.',
      'Simular no crea movimientos ni modifica cuentas, metas, presupuestos o saldos.',
    ],
  }
}

const impact = (body: Record<string, unknown>) => {
  const currency = String(body.currency ?? 'COP').toUpperCase()
  const initialOriginal = Number(body.initialAmount ?? 0)
  const recurringOriginal = Number(body.recurringContribution ?? 0)
  const contributionFrequency = String(
    body.contributionFrequency ?? 'MONTHLY',
  ) as DemoFrequency
  const rate = copPerUnit[currency] ?? 1
  const initialBase = initialOriginal * rate
  const recurringBase = recurringOriginal * rate
  const recurringMonthlyEquivalent =
    contributionFrequency === 'DAILY'
      ? (recurringBase * 365) / 12
      : contributionFrequency === 'WEEKLY'
        ? (recurringBase * 52) / 12
        : contributionFrequency === 'QUARTERLY'
          ? recurringBase / 3
          : contributionFrequency === 'YEARLY'
            ? recurringBase / 12
            : contributionFrequency === 'NONE'
              ? 0
              : recurringBase

  const available = 5_815_500
  const income = 4_750_000
  const expenses = 2_223_554.76
  const commitments = 640_000
  const netCashFlow = income - expenses
  const remaining = available - initialBase
  const liquidityUsed = available > 0 ? (initialBase / available) * 100 : 100
  const recurringShare =
    netCashFlow > 0
      ? (recurringMonthlyEquivalent / netCashFlow) * 100
      : recurringMonthlyEquivalent > 0
        ? 100
        : 0

  const level =
    remaining < 0
      ? 'CRITICAL'
      : liquidityUsed >= 80 ||
          (netCashFlow > 0 && recurringMonthlyEquivalent >= netCashFlow)
        ? 'HIGH'
        : liquidityUsed >= 50 || recurringShare >= 50
          ? 'MODERATE'
          : 'LOW'

  const copy =
    level === 'CRITICAL'
      ? {
          headline: 'La inversión supera tu disponible actual',
          explanation:
            'Como simulación es válida, pero si saliera hoy de tus cuentas dejaría tu disponible por debajo de cero.',
        }
      : level === 'HIGH'
        ? {
            headline: 'La inversión consumiría una parte alta de tu liquidez',
            explanation:
              'Puedes simularla libremente, pero comparada con tus finanzas actuales reduciría de forma importante tu margen.',
          }
        : level === 'MODERATE'
          ? {
              headline: 'La inversión tendría un impacto moderado en tu liquidez',
              explanation:
                'La simulación deja margen, aunque representa una parte relevante de tu disponible o de tu flujo mensual.',
            }
          : {
              headline: 'La inversión tendría un impacto bajo sobre tu situación actual',
              explanation:
                'Comparada con tu disponible y tu flujo del periodo, conservarías un margen amplio.',
            }

  return {
    simulationCurrency: currency,
    baseCurrency: 'COP',
    initialInvestment: {
      original: money(initialOriginal),
      baseEquivalent: money(initialBase),
    },
    recurringContribution: {
      original: money(recurringOriginal),
      baseEquivalent: money(recurringBase),
      frequency: contributionFrequency,
      monthlyEquivalentBase: money(recurringMonthlyEquivalent),
    },
    availableMoney: money(available),
    remainingAvailableMoney: money(remaining),
    liquidityPercentageUsed: liquidityUsed.toFixed(2),
    currentPeriodIncome: money(income),
    currentPeriodExpenses: money(expenses),
    currentNetCashFlow: money(netCashFlow),
    knownCommitments: money(commitments),
    recurringContributionShareOfPositiveCashFlow: recurringShare.toFixed(2),
    conversion:
      currency === 'COP'
        ? null
        : {
            from: currency,
            to: 'COP',
            rate: String(rate),
            date: new Date().toISOString().slice(0, 10),
          },
    impact: { level, ...copy },
    disclaimer:
      'Esta comparación no reserva dinero ni modifica saldos. Solo contrasta la simulación con la situación financiera actual de Fynar.',
  }
}

export function isDemoInvestmentPath(path: string) {
  return /\/workspaces\/[^/]+\/simulations\/investment\//.test(path)
}

export async function handleDemoInvestmentRequest<
  TResponse,
  TBody = unknown,
>(
  path: string,
  options: HttpRequestOptions<TBody> = {},
): Promise<TResponse> {
  const url = new URL(path, 'https://demo.fynar.local')
  const action = url.pathname.split('/').at(-1)
  const method = options.method ?? 'GET'
  const body = (options.body ?? {}) as Record<string, unknown>

  if (method === 'GET' && action === 'options')
    return success(demoOptions()) as TResponse

  if (method === 'POST' && action === 'calculate')
    return success(simulate(body)) as TResponse

  if (method === 'POST' && action === 'scenarios') {
    const base = Number(body.baseAnnualReturn ?? 0.08)
    const spread = Math.max(0, Number(body.spread ?? 0.04))
    const summarize = (
      label: 'CONSERVATIVE' | 'BASE' | 'OPTIMISTIC',
      rate: number,
    ) => {
      const result = simulate(body, Math.max(-0.99, rate))
      return {
        label,
        annualReturn: result.annualReturn,
        estimatedFinalValue: result.estimatedFinalValue,
        estimatedProfit: result.estimatedProfit,
        inflationAdjustedValue: result.inflationAdjustedValue,
        totalReturnPercentage: result.totalReturnPercentage,
      }
    }
    return success({
      currency: String(body.currency ?? 'COP').toUpperCase(),
      spread: spread.toFixed(8),
      scenarios: [
        summarize('CONSERVATIVE', base - spread),
        summarize('BASE', base),
        summarize('OPTIMISTIC', base + spread),
      ],
      disclaimer:
        'Los escenarios son estimaciones matemáticas basadas en tasas supuestas y no garantizan rendimientos futuros.',
    }) as TResponse
  }

  if (method === 'POST' && action === 'financial-impact')
    return success(impact(body)) as TResponse

  throw new Error(`Ruta demo de inversión no soportada: ${method} ${path}`)
}
