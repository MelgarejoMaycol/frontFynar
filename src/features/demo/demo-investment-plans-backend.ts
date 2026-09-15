import type { HttpRequestOptions } from '@/services/http/httpTypes'
import type {
  CreateInvestmentPlanInput,
  InvestmentPlan,
  InvestmentPlanStatus,
} from '@/features/investments/types'
import type { Transaction } from '@/features/transactions/types/transaction.types'

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
  name?: string
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
  transactions: Transaction[]
  [key: string]: unknown
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
  if (typeof window === 'undefined') return { accounts: [], transactions: [] }
  const raw = window.localStorage.getItem(DEMO_DB_KEY)
  if (!raw) return { accounts: [], transactions: [] }
  try {
    const parsed = JSON.parse(raw) as Partial<DemoMainDb>
    return {
      ...parsed,
      accounts: parsed.accounts ?? [],
      transactions: parsed.transactions ?? [],
    }
  } catch {
    return { accounts: [], transactions: [] }
  }
}

const saveMainDb = (db: DemoMainDb) => {
  if (typeof window !== 'undefined')
    window.localStorage.setItem(DEMO_DB_KEY, JSON.stringify(db))
}

const refreshAvailableBalance = (account: DemoAccount) => {
  account.availableBalance = money(
    Number(account.currentBalance) - Number(account.reservedForGoals ?? 0),
  )
}

const createInvestmentTransaction = ({
  transactionId,
  plan,
  role,
  accountId,
  amount,
  occurredAt,
  note,
}: {
  transactionId: string
  plan: DemoPlan
  role: 'CONTRIBUTION' | 'WITHDRAWAL'
  accountId: string
  amount: number
  occurredAt: string
  note: string | null
}): Transaction => {
  const stamp = nowIso()
  return {
    id: transactionId,
    type: 'INVESTMENT',
    status: 'CONFIRMED',
    amount: money(amount),
    currency: plan.currency,
    accountId,
    destinationAccountId: null,
    categoryId: null,
    occurredAt,
    description:
      role === 'CONTRIBUTION'
        ? `Aporte a inversión · ${plan.name}`
        : `Retiro de inversión · ${plan.name}`,
    notes: note,
    merchantName: null,
    metadata: { investment: true, planId: plan.id, role },
    version: 1,
    createdAt: stamp,
    updatedAt: stamp,
  }
}

const updateDemoInvestmentTransaction = (
  db: DemoMainDb,
  transactionId: string,
  values: {
    accountId: string
    amount: number
    occurredAt: string
    note: string | null
    plan: DemoPlan
    role: 'CONTRIBUTION' | 'WITHDRAWAL'
  },
) => {
  const transaction = db.transactions.find((item) => item.id === transactionId)
  if (!transaction) {
    db.transactions.unshift(
      createInvestmentTransaction({
        transactionId,
        plan: values.plan,
        role: values.role,
        accountId: values.accountId,
        amount: values.amount,
        occurredAt: values.occurredAt,
        note: values.note,
      }),
    )
    return
  }
  transaction.accountId = values.accountId
  transaction.amount = money(values.amount)
  transaction.occurredAt = values.occurredAt
  transaction.notes = values.note
  transaction.description =
    values.role === 'CONTRIBUTION'
      ? `Aporte a inversión · ${values.plan.name}`
      : `Retiro de inversión · ${values.plan.name}`
  transaction.updatedAt = nowIso()
  transaction.version += 1
}

const cancelDemoInvestmentTransaction = (
  db: DemoMainDb,
  transactionId: string,
) => {
  const transaction = db.transactions.find((item) => item.id === transactionId)
  if (!transaction) return
  transaction.status = 'CANCELLED'
  transaction.updatedAt = nowIso()
  transaction.version += 1
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
  const recordId = parts[investmentsIndex + 3]
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

  if (method === 'POST' && action === 'contributions' && !recordId) {
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

    const available =
      Number(account.currentBalance) - Number(account.reservedForGoals ?? 0)
    if (available < amount) throw new Error('Saldo disponible insuficiente')

    account.currentBalance = money(Number(account.currentBalance) - amount)
    refreshAvailableBalance(account)
    const occurredAt = String(body.occurredAt ?? nowIso())
    const note = body.note ? String(body.note) : null
    const transactionId = id('demo-investment-transaction')
    plan.recentContributions.unshift({
      id: id('demo-investment-contribution'),
      transactionId,
      amount: money(amount),
      occurredAt,
      note,
      sourceAccount: {
        id: account.id,
        name: account.name ?? 'Cuenta',
        currency: account.currency,
      },
    })
    db.transactions.unshift(
      createInvestmentTransaction({
        transactionId,
        plan,
        role: 'CONTRIBUTION',
        accountId: account.id,
        amount,
        occurredAt,
        note,
      }),
    )
    plan.updatedAt = nowIso()
    saveMainDb(db)
    saveStore(store)
    return success(publicPlan(plan)) as TResponse
  }

  if (action === 'contributions' && recordId && method === 'PATCH') {
    const entry = plan.recentContributions.find((item) => item.id === recordId)
    if (!entry) throw new Error('Aporte de inversión no encontrado')

    const db = readMainDb()
    const previousAccount = db.accounts.find(
      (item) => item.id === entry.sourceAccount.id,
    )
    if (!previousAccount) throw new Error('Cuenta anterior no disponible')
    previousAccount.currentBalance = money(
      Number(previousAccount.currentBalance) + Number(entry.amount),
    )
    refreshAvailableBalance(previousAccount)

    const nextAccountId = String(body.sourceAccountId ?? entry.sourceAccount.id)
    const nextAccount = db.accounts.find((item) => item.id === nextAccountId)
    if (
      !nextAccount ||
      !nextAccount.isActive ||
      nextAccount.nature !== 'ASSET' ||
      nextAccount.currency !== plan.currency
    )
      throw new Error('Cuenta de origen no disponible')

    const nextAmount = Number(body.amount ?? entry.amount)
    const available =
      Number(nextAccount.currentBalance) -
      Number(nextAccount.reservedForGoals ?? 0)
    if (available < nextAmount) throw new Error('Saldo disponible insuficiente')

    nextAccount.currentBalance = money(
      Number(nextAccount.currentBalance) - nextAmount,
    )
    refreshAvailableBalance(nextAccount)
    entry.sourceAccount = {
      id: nextAccount.id,
      name: nextAccount.name ?? 'Cuenta',
      currency: nextAccount.currency,
    }
    entry.amount = money(nextAmount)
    entry.occurredAt = String(body.occurredAt ?? entry.occurredAt)
    entry.note =
      body.note !== undefined ? (body.note ? String(body.note) : null) : entry.note
    updateDemoInvestmentTransaction(db, entry.transactionId, {
      accountId: nextAccount.id,
      amount: nextAmount,
      occurredAt: entry.occurredAt,
      note: entry.note,
      plan,
      role: 'CONTRIBUTION',
    })
    plan.updatedAt = nowIso()
    saveMainDb(db)
    saveStore(store)
    return success(publicPlan(plan)) as TResponse
  }

  if (action === 'contributions' && recordId && method === 'DELETE') {
    const index = plan.recentContributions.findIndex((item) => item.id === recordId)
    if (index < 0) throw new Error('Aporte de inversión no encontrado')
    const entry = plan.recentContributions[index]!
    const db = readMainDb()
    const account = db.accounts.find((item) => item.id === entry.sourceAccount.id)
    if (!account) throw new Error('Cuenta de origen no disponible')
    account.currentBalance = money(
      Number(account.currentBalance) + Number(entry.amount),
    )
    refreshAvailableBalance(account)
    plan.recentContributions.splice(index, 1)
    cancelDemoInvestmentTransaction(db, entry.transactionId)
    plan.updatedAt = nowIso()
    saveMainDb(db)
    saveStore(store)
    return success(publicPlan(plan)) as TResponse
  }

  if (method === 'POST' && action === 'withdrawals' && !recordId) {
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
    refreshAvailableBalance(account)
    const occurredAt = String(body.occurredAt ?? nowIso())
    const note = body.note ? String(body.note) : null
    const transactionId = id('demo-investment-transaction')
    plan.recentWithdrawals.unshift({
      id: id('demo-investment-withdrawal'),
      transactionId,
      amount: money(amount),
      occurredAt,
      note,
      destinationAccount: {
        id: account.id,
        name: account.name ?? 'Cuenta',
        currency: account.currency,
      },
    })
    db.transactions.unshift(
      createInvestmentTransaction({
        transactionId,
        plan,
        role: 'WITHDRAWAL',
        accountId: account.id,
        amount,
        occurredAt,
        note,
      }),
    )
    plan.updatedAt = nowIso()
    saveMainDb(db)
    saveStore(store)
    return success(publicPlan(plan)) as TResponse
  }

  if (action === 'withdrawals' && recordId && method === 'PATCH') {
    const entry = plan.recentWithdrawals.find((item) => item.id === recordId)
    if (!entry) throw new Error('Retiro de inversión no encontrado')
    const nextAmount = Number(body.amount ?? entry.amount)
    const trackedBeforeThisWithdrawal = currentValue(plan).value + Number(entry.amount)
    if (trackedBeforeThisWithdrawal < nextAmount)
      throw new Error('El retiro supera el valor registrado de la inversión')

    const db = readMainDb()
    const previousAccount = db.accounts.find(
      (item) => item.id === entry.destinationAccount.id,
    )
    if (!previousAccount) throw new Error('Cuenta anterior no disponible')
    if (Number(previousAccount.currentBalance) < Number(entry.amount))
      throw new Error(
        'La cuenta que recibió el retiro no tiene saldo suficiente para revertirlo',
      )
    previousAccount.currentBalance = money(
      Number(previousAccount.currentBalance) - Number(entry.amount),
    )
    refreshAvailableBalance(previousAccount)

    const nextAccountId = String(
      body.destinationAccountId ?? entry.destinationAccount.id,
    )
    const nextAccount = db.accounts.find((item) => item.id === nextAccountId)
    if (
      !nextAccount ||
      !nextAccount.isActive ||
      nextAccount.nature !== 'ASSET' ||
      nextAccount.currency !== plan.currency
    )
      throw new Error('Cuenta de destino no disponible')

    nextAccount.currentBalance = money(
      Number(nextAccount.currentBalance) + nextAmount,
    )
    refreshAvailableBalance(nextAccount)
    entry.destinationAccount = {
      id: nextAccount.id,
      name: nextAccount.name ?? 'Cuenta',
      currency: nextAccount.currency,
    }
    entry.amount = money(nextAmount)
    entry.occurredAt = String(body.occurredAt ?? entry.occurredAt)
    entry.note =
      body.note !== undefined ? (body.note ? String(body.note) : null) : entry.note
    updateDemoInvestmentTransaction(db, entry.transactionId, {
      accountId: nextAccount.id,
      amount: nextAmount,
      occurredAt: entry.occurredAt,
      note: entry.note,
      plan,
      role: 'WITHDRAWAL',
    })
    plan.updatedAt = nowIso()
    saveMainDb(db)
    saveStore(store)
    return success(publicPlan(plan)) as TResponse
  }

  if (action === 'withdrawals' && recordId && method === 'DELETE') {
    const index = plan.recentWithdrawals.findIndex((item) => item.id === recordId)
    if (index < 0) throw new Error('Retiro de inversión no encontrado')
    const entry = plan.recentWithdrawals[index]!
    const db = readMainDb()
    const account = db.accounts.find(
      (item) => item.id === entry.destinationAccount.id,
    )
    if (!account) throw new Error('Cuenta de destino no disponible')
    if (Number(account.currentBalance) < Number(entry.amount))
      throw new Error(
        'La cuenta que recibió el retiro no tiene saldo suficiente para revertirlo',
      )
    account.currentBalance = money(
      Number(account.currentBalance) - Number(entry.amount),
    )
    refreshAvailableBalance(account)
    plan.recentWithdrawals.splice(index, 1)
    cancelDemoInvestmentTransaction(db, entry.transactionId)
    plan.updatedAt = nowIso()
    saveMainDb(db)
    saveStore(store)
    return success(publicPlan(plan)) as TResponse
  }

  if (method === 'POST' && action === 'valuations' && !recordId) {
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

  if (action === 'valuations' && recordId && method === 'PATCH') {
    const entry = plan.recentValuations.find((item) => item.id === recordId)
    if (!entry) throw new Error('Actualización de valor no encontrada')
    entry.value = money(Number(body.value ?? entry.value))
    entry.capturedAt = String(body.capturedAt ?? entry.capturedAt)
    entry.note =
      body.note !== undefined ? (body.note ? String(body.note) : null) : entry.note
    plan.updatedAt = nowIso()
    saveStore(store)
    return success(publicPlan(plan)) as TResponse
  }

  if (action === 'valuations' && recordId && method === 'DELETE') {
    const index = plan.recentValuations.findIndex((item) => item.id === recordId)
    if (index < 0) throw new Error('Actualización de valor no encontrada')
    plan.recentValuations.splice(index, 1)
    plan.updatedAt = nowIso()
    saveStore(store)
    return success(publicPlan(plan)) as TResponse
  }

  if (method === 'GET' && action === 'progress')
    return success(progress(plan)) as TResponse

  throw new Error(`Ruta demo de plan de inversión no soportada: ${method} ${path}`)
}
