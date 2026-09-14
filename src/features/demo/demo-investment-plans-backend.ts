import type { HttpRequestOptions } from '@/services/http/httpTypes'
import type {
  CreateInvestmentPlanInput,
  InvestmentPlan,
  InvestmentPlanStatus,
} from '@/features/investments/types'

const STORAGE_KEY = 'fynar-demo-investment-plans-v1'
const DEMO_DB_KEY = 'fynar-demo-database-v3'
const success = (data: unknown) => ({ success: true as const, data })
const nowIso = () => new Date().toISOString()
const money = (value: number) => value.toFixed(2)
const id = (prefix: string) =>
  `${prefix}-${globalThis.crypto?.randomUUID?.() ?? Date.now().toString(36)}`

type DemoPlan = Omit<InvestmentPlan, 'progress'> & {
  progress?: InvestmentPlan['progress']
}

type DemoInvestmentStore = {
  plans: DemoPlan[]
}

type DemoAccount = {
  id: string
  currency: string
  currentBalance: string
  reservedForGoals?: string
  availableBalance?: string
  nature: string
  type: string
  isActive: boolean
}

type DemoMainDb = {
  accounts: DemoAccount[]
}

const emptyStore = (): DemoInvestmentStore => ({ plans: [] })

const readStore = (): DemoInvestmentStore => {
  if (typeof window === 'undefined') return emptyStore()
  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) return emptyStore()
  try {
    return JSON.parse(raw) as DemoInvestmentStore
  } catch {
    return emptyStore()
  }
}

const saveStore = (store: DemoInvestmentStore) => {
  if (typeof window !== 'undefined')
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

const readMainDb = (): DemoMainDb => {
  if (typeof window === 'undefined') return { accounts: [] }
  const raw = window.localStorage.getItem(DEMO_DB_KEY)
  if (!raw) return { accounts: [] }
  try {
    return JSON.parse(raw) as DemoMainDb
  } catch {
    return { accounts: [] }
  }
}

const saveMainDb = (db: DemoMainDb) => {
  if (typeof window !== 'undefined')
    window.localStorage.setItem(DEMO_DB_KEY, JSON.stringify(db))
}

const eventsPerYear = (frequency: DemoPlan['contributionFrequency']) => {
  if (frequency === 'DAILY') return 365
  if (frequency === 'WEEKLY') return 52
  if (frequency === 'MONTHLY') return 12
  if (frequency === 'QUARTERLY') return 4
  if (frequency === 'YEARLY') return 1
  return 0
}

const currentValue = (plan: DemoPlan) => {
  const latest = [...plan.recentValuations].sort((a, b) =>
    b.capturedAt.localeCompare(a.capturedAt),
  )[0]
  const since = latest?.capturedAt ?? null
  const contributions = plan.recentContributions
    .filter((entry) => !since || entry.occurredAt > since)
    .reduce((sum, entry) => sum + Number(entry.amount), 0)
  const withdrawals = plan.recentWithdrawals
    .filter((entry) => !since || entry.occurredAt > since)
    .reduce((sum, entry) => sum + Number(entry.amount), 0)
  return {
    value: Number(latest?.value ?? 0) + contributions - withdrawals,
    basis: latest ? ('MANUAL_PLUS_FLOWS' as const) : ('CASH_FLOWS_ONLY' as const),
    latest,
  }
}

const totals = (plan: DemoPlan) => {
  const contributed = plan.recentContributions.reduce(
    (sum, entry) => sum + Number(entry.amount),
    0,
  )
  const withdrawn = plan.recentWithdrawals.reduce(
    (sum, entry) => sum + Number(entry.amount),
    0,
  )
  return { contributed, withdrawn, net: contributed - withdrawn }
}

const projection = (plan: DemoPlan) => {
  const events = eventsPerYear(plan.contributionFrequency)
  const annualReturn = Number(plan.annualReturn)
  const fee = Number(plan.annualFee)
  const netRate = Math.max(-0.99, annualReturn - fee)
  const years = plan.horizonYears
  let balance = Number(plan.plannedInitialAmount)
  for (let year = 0; year < years; year += 1) {
    balance *= 1 + netRate
    balance += Number(plan.recurringContribution) * events
  }
  return balance
}

const progress = (plan: DemoPlan): InvestmentPlan['progress'] => {
  const actual = totals(plan)
  const tracked = currentValue(plan)
  const horizon = projection(plan)

  if (!plan.startDate) {
    return {
      status: plan.status,
      actual: {
        totalContributed: money(actual.contributed),
        totalWithdrawn: money(actual.withdrawn),
        netContributed: money(actual.net),
        currentValue: money(tracked.value),
        valuationBasis: tracked.basis,
        latestValuationAt: tracked.latest?.capturedAt ?? null,
      },
      plan: {
        expectedContributedToDate: '0.00',
        projectedValueToday: '0.00',
        projectedValueAtHorizon: money(horizon),
        projectedProfitAtHorizon: money(
          horizon -
            Number(plan.plannedInitialAmount) -
            Number(plan.recurringContribution) *
              eventsPerYear(plan.contributionFrequency) *
              plan.horizonYears,
        ),
      },
      pace: {
        status: 'NOT_STARTED',
        ratio: null,
        headline: 'Tu plan está guardado y listo cuando quieras empezar',
        explanation:
          'No hay fechas vencidas ni pagos pendientes. Puedes iniciar y aportar cuando te resulte conveniente.',
      },
      nextSuggestion: null,
    }
  }

  const started = new Date(`${plan.startDate}T00:00:00.000Z`).getTime()
  const elapsedDays = Math.max(0, Math.floor((Date.now() - started) / 86_400_000))
  const elapsedYears = elapsedDays / 365
  const events = Math.floor(
    elapsedYears * eventsPerYear(plan.contributionFrequency),
  )
  const expected =
    Number(plan.plannedInitialAmount) +
    Number(plan.recurringContribution) * events
  const ratio = expected > 0 ? actual.net / expected : 1
  const paceStatus =
    ratio >= 1.1 ? 'AHEAD' : ratio >= 0.9 ? 'ON_TRACK' : 'BELOW_PREFERRED_PACE'
  const pace =
    paceStatus === 'AHEAD'
      ? {
          headline: 'Vas por encima del ritmo que elegiste',
          explanation:
            'Has aportado más de la referencia del plan. No necesitas mantener ese ritmo.',
        }
      : paceStatus === 'ON_TRACK'
        ? {
            headline: 'Vas cerca del ritmo que elegiste',
            explanation:
              'Tus aportes están próximos a la referencia. Puedes cambiar el ritmo cuando lo necesites.',
          }
        : {
            headline: 'Vas por debajo del ritmo que habías imaginado',
            explanation:
              'No es una deuda ni un atraso. El plan es una referencia y puedes retomar, reducir o pausar cuando quieras.',
          }

  const annualReturn = Math.max(-0.99, Number(plan.annualReturn) - Number(plan.annualFee))
  const projectedToday =
    Number(plan.plannedInitialAmount) * Math.pow(1 + annualReturn, elapsedYears) +
    Math.max(0, expected - Number(plan.plannedInitialAmount))

  const eventCount = eventsPerYear(plan.contributionFrequency)
  const nextDate =
    eventCount > 0
      ? new Date(
          started +
            Math.ceil((events + 1) * (365 / eventCount)) * 86_400_000,
        )
          .toISOString()
          .slice(0, 10)
      : null

  return {
    status: plan.status,
    actual: {
      totalContributed: money(actual.contributed),
      totalWithdrawn: money(actual.withdrawn),
      netContributed: money(actual.net),
      currentValue: money(tracked.value),
      valuationBasis: tracked.basis,
      latestValuationAt: tracked.latest?.capturedAt ?? null,
    },
    plan: {
      expectedContributedToDate: money(expected),
      projectedValueToday: money(projectedToday),
      projectedValueAtHorizon: money(horizon),
      projectedProfitAtHorizon: money(
        horizon -
          Number(plan.plannedInitialAmount) -
          Number(plan.recurringContribution) *
            eventsPerYear(plan.contributionFrequency) *
            plan.horizonYears,
      ),
      varianceCurrentVsProjected: money(tracked.value - projectedToday),
    },
    pace: {
      status: paceStatus,
      ratio: (ratio * 100).toFixed(2),
      ...pace,
    },
    nextSuggestion:
      plan.status === 'ACTIVE' &&
      eventCount > 0 &&
      Number(plan.recurringContribution) > 0
        ? {
            date: nextDate,
            amount: money(Number(plan.recurringContribution)),
            message:
              'Este es el próximo aporte sugerido por tu ritmo, no una obligación. Si no aportas ese día, no se genera deuda ni atraso.',
          }
        : null,
  }
}

const publicPlan = (plan: DemoPlan): InvestmentPlan => ({
  ...plan,
  progress: progress(plan),
})

const findPlan = (store: DemoInvestmentStore, planId: string) => {
  const plan = store.plans.find((item) => item.id === planId)
  if (!plan) throw new Error('Plan de inversión no encontrado')
  return plan
}

export const resetDemoInvestmentPlans = () => {
  if (typeof window !== 'undefined') window.localStorage.removeItem(STORAGE_KEY)
}

export const demoInvestmentNetWorth = (currency: string) =>
  readStore().plans
    .filter(
      (plan) =>
        plan.currency === currency &&
        plan.includeInNetWorth &&
        plan.status !== 'DRAFT' &&
        plan.status !== 'ARCHIVED',
    )
    .reduce((sum, plan) => sum + currentValue(plan).value, 0)

export function isDemoInvestmentPlanPath(path: string) {
  return /\/workspaces\/[^/]+\/investments(?:\/|$)/.test(path)
}

export async function handleDemoInvestmentPlanRequest<
  TResponse,
  TBody = unknown,
>(
  path: string,
  options: HttpRequestOptions<TBody> = {},
): Promise<TResponse> {
  const url = new URL(path, 'https://demo.fynar.local')
  const parts = url.pathname.split('/').filter(Boolean)
  const investmentsIndex = parts.indexOf('investments')
  const planId = parts[investmentsIndex + 1]
  const action = parts[investmentsIndex + 2]
  const method = options.method ?? 'GET'
  const body = (options.body ?? {}) as Record<string, unknown>
  const store = readStore()

  if (!planId && method === 'GET') {
    return success(
      store.plans
        .filter((plan) => plan.status !== 'ARCHIVED')
        .map(publicPlan),
    ) as TResponse
  }

  if (!planId && method === 'POST') {
    const input = body as unknown as CreateInvestmentPlanInput
    const stamp = nowIso()
    const plan: DemoPlan = {
      id: id('demo-investment-plan'),
      name: String(input.name ?? 'Mi plan de inversión'),
      description: input.description ?? null,
      currency: String(input.currency ?? 'COP'),
      status: 'DRAFT',
      plannedInitialAmount: money(Number(input.plannedInitialAmount ?? 0)),
      recurringContribution: money(Number(input.recurringContribution ?? 0)),
      contributionFrequency: input.contributionFrequency ?? 'MONTHLY',
      horizonYears: Number(input.horizonYears ?? 10),
      annualReturn: String(input.annualReturn ?? '0.08'),
      annualFee: String(input.annualFee ?? '0'),
      inflationRate: String(input.inflationRate ?? '0'),
      startDate: null,
      includeInNetWorth: input.includeInNetWorth ?? true,
      notes: input.notes ?? null,
      createdAt: stamp,
      updatedAt: stamp,
      recentContributions: [],
      recentWithdrawals: [],
      recentValuations: [],
    }
    store.plans.unshift(plan)
    saveStore(store)
    return success(publicPlan(plan)) as TResponse
  }

  const plan = findPlan(store, planId!)

  if (method === 'GET' && !action) return success(publicPlan(plan)) as TResponse

  if (method === 'PATCH' && !action) {
    Object.assign(plan, body, { updatedAt: nowIso() })
    saveStore(store)
    return success(publicPlan(plan)) as TResponse
  }

  if (method === 'POST' && action === 'start') {
    if (plan.status !== 'DRAFT') throw new Error('Este plan ya fue iniciado')
    plan.status = 'ACTIVE'
    plan.startDate = String(body.startDate ?? nowIso().slice(0, 10))
    plan.updatedAt = nowIso()
    saveStore(store)
    return success(publicPlan(plan)) as TResponse
  }

  if (method === 'POST' && action === 'pause') {
    plan.status = 'PAUSED'
    plan.updatedAt = nowIso()
    saveStore(store)
    return success(publicPlan(plan)) as TResponse
  }

  if (method === 'POST' && action === 'resume') {
    plan.status = 'ACTIVE'
    plan.updatedAt = nowIso()
    saveStore(store)
    return success(publicPlan(plan)) as TResponse
  }

  if (method === 'POST' && action === 'complete') {
    plan.status = 'COMPLETED'
    plan.updatedAt = nowIso()
    saveStore(store)
    return success(publicPlan(plan)) as TResponse
  }

  if (method === 'POST' && action === 'archive') {
    plan.status = 'ARCHIVED'
    plan.updatedAt = nowIso()
    saveStore(store)
    return success({ id: plan.id, archived: true }) as TResponse
  }

  if (method === 'POST' && action === 'contributions') {
    if (!['ACTIVE', 'PAUSED'].includes(plan.status))
      throw new Error('Inicia el plan antes de registrar aportes')

    const amount = Number(body.amount ?? 0)
    const accountId = String(body.sourceAccountId ?? '')
    const db = readMainDb()
    const account = db.accounts.find((item) => item.id === accountId)
    if (
      !account ||
      !account.isActive ||
      account.nature !== 'ASSET' ||
      account.currency !== plan.currency
    )
      throw new Error('Cuenta de origen no disponible')

    const available = Number(
      account.availableBalance ??
        Number(account.currentBalance) - Number(account.reservedForGoals ?? 0),
    )
    if (available < amount) throw new Error('Saldo disponible insuficiente')

    account.currentBalance = money(Number(account.currentBalance) - amount)
    account.availableBalance = money(available - amount)
    const occurredAt = String(body.occurredAt ?? nowIso())
    plan.recentContributions.unshift({
      id: id('demo-investment-contribution'),
      amount: money(amount),
      occurredAt,
      note: body.note ? String(body.note) : null,
      sourceAccount: {
        id: account.id,
        name:
          (
            account as DemoAccount & {
              name?: string
            }
          ).name ?? 'Cuenta',
        currency: account.currency,
      },
    })
    plan.updatedAt = nowIso()
    saveMainDb(db)
    saveStore(store)
    return success(publicPlan(plan)) as TResponse
  }

  if (method === 'POST' && action === 'withdrawals') {
    const amount = Number(body.amount ?? 0)
    const tracked = currentValue(plan)
    if (tracked.value < amount)
      throw new Error('El retiro supera el valor registrado de la inversión')

    const accountId = String(body.destinationAccountId ?? '')
    const db = readMainDb()
    const account = db.accounts.find((item) => item.id === accountId)
    if (
      !account ||
      !account.isActive ||
      account.nature !== 'ASSET' ||
      account.currency !== plan.currency
    )
      throw new Error('Cuenta de destino no disponible')

    account.currentBalance = money(Number(account.currentBalance) + amount)
    account.availableBalance = money(
      Number(account.currentBalance) - Number(account.reservedForGoals ?? 0),
    )
    const occurredAt = String(body.occurredAt ?? nowIso())
    plan.recentWithdrawals.unshift({
      id: id('demo-investment-withdrawal'),
      amount: money(amount),
      occurredAt,
      note: body.note ? String(body.note) : null,
      destinationAccount: {
        id: account.id,
        name:
          (
            account as DemoAccount & {
              name?: string
            }
          ).name ?? 'Cuenta',
        currency: account.currency,
      },
    })
    plan.updatedAt = nowIso()
    saveMainDb(db)
    saveStore(store)
    return success(publicPlan(plan)) as TResponse
  }

  if (method === 'POST' && action === 'valuations') {
    plan.recentValuations.unshift({
      id: id('demo-investment-valuation'),
      value: money(Number(body.value ?? 0)),
      capturedAt: String(body.capturedAt ?? nowIso()),
      note: body.note ? String(body.note) : null,
    })
    plan.updatedAt = nowIso()
    saveStore(store)
    return success(publicPlan(plan)) as TResponse
  }

  if (method === 'GET' && action === 'progress')
    return success(progress(plan)) as TResponse

  throw new Error(`Ruta demo de plan de inversión no soportada: ${method} ${path}`)
}
