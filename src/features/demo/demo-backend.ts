import type { HttpRequestOptions } from '@/services/http/httpTypes'
import type { Account } from '@/features/accounts/types/account.types'
import type { Budget } from '@/features/budgets/types/budget.types'
import type { Category } from '@/features/categories/types/category.types'
import type { Goal } from '@/features/goals/types/goal.types'
import type { Transaction } from '@/features/transactions/types/transaction.types'
import { demoPreferences, demoUser, demoWorkspace } from './demo-mode'

const STORAGE_KEY = 'fynar-demo-database-v3'

type DemoNotification = {
  id: string
  type:
    | 'BUDGET_ALERT'
    | 'PAYMENT_DUE'
    | 'LIQUIDITY_RISK'
    | 'UNUSUAL_SPENDING'
    | 'INCOME_DROP'
    | 'GOAL_PROGRESS'
    | 'SYSTEM'
  title: string
  message: string
  severity: 'INFO' | 'WARNING' | 'CRITICAL' | 'SUCCESS'
  source: string
  sourceId: string | null
  actionUrl: string | null
  actionLabel: string | null
  context: Record<string, string | number | boolean | null>
  scheduledFor: string | null
  sentAt: string | null
  readAt: string | null
  dismissedAt: string | null
  createdAt: string
}

type DemoDb = {
  accounts: Account[]
  categories: Category[]
  transactions: Transaction[]
  budgets: Budget[]
  goals: Goal[]
  notifications: DemoNotification[]
  preferences: typeof demoPreferences
}

const today = () => new Date()
const nowIso = () => today().toISOString()
const dateOnly = (date: Date) => date.toISOString().slice(0, 10)
const money = (value: number) => value.toFixed(2)
const numeric = (value: string | null | undefined) => Number(value ?? 0)

const id = (prefix: string) =>
  `${prefix}-${globalThis.crypto?.randomUUID?.() ?? Date.now().toString(36)}`

const success = (data: unknown) => ({ success: true as const, data })

const monthDate = (offset: number, day: number) => {
  const base = today()
  return new Date(
    Date.UTC(base.getUTCFullYear(), base.getUTCMonth() - offset, day, 12),
  )
}

const categoriesSeed = (): Category[] => {
  const createdAt = nowIso()
  const rows: Array<[string, string, Category['type'], string, string]> = [
    ['salary', 'Salario', 'INCOME', 'banknote', '#2f7d65'],
    ['extra', 'Ingresos extra', 'INCOME', 'chart-line', '#4c8c70'],
    ['food', 'Alimentación', 'EXPENSE', 'utensils', '#d88b4a'],
    ['home', 'Hogar', 'EXPENSE', 'house', '#816baf'],
    ['transport', 'Transporte', 'EXPENSE', 'car', '#4f79b8'],
    ['services', 'Servicios', 'EXPENSE', 'receipt', '#5d8c74'],
    ['health', 'Salud', 'EXPENSE', 'heart-pulse', '#c65f6c'],
    ['fun', 'Entretenimiento', 'EXPENSE', 'gamepad-2', '#c0833d'],
    ['shopping', 'Compras personales', 'EXPENSE', 'shopping-bag', '#a66e8d'],
    ['subscriptions', 'Suscripciones', 'EXPENSE', 'repeat', '#6f83b5'],
    ['education', 'Educación', 'EXPENSE', 'graduation-cap', '#3f8c8a'],
    ['transfer', 'Transferencias', 'TRANSFER', 'arrow-left-right', '#64748b'],
  ]
  return rows.map(([key, name, type, icon, color]) => ({
    id: `demo-category-${key}`,
    parentId: null,
    name,
    type,
    icon,
    color,
    scope: key === 'education' ? 'CUSTOM' : 'SYSTEM',
    isSystem: key !== 'education',
    isActive: true,
    createdAt,
    updatedAt: createdAt,
  }))
}

const accountsSeed = (): Account[] => {
  const createdAt = '2025-09-01T12:00:00.000Z'
  return [
    {
      id: 'demo-account-bancolombia',
      name: 'Bancolombia',
      type: 'SAVINGS',
      nature: 'ASSET',
      institutionName: 'Bancolombia',
      currency: 'COP',
      openingBalance: '1800000.00',
      currentBalance: '3850000.00',
      reservedForGoals: '900000.00',
      availableBalance: '2950000.00',
      creditLimit: null,
      billingDay: null,
      paymentDueDay: null,
      color: '#154B45',
      icon: 'landmark',
      isFavorite: true,
      isActive: true,
      includeInNetWorth: true,
      createdAt,
      updatedAt: nowIso(),
    },
    {
      id: 'demo-account-nequi',
      name: 'Nequi',
      type: 'E_WALLET',
      nature: 'ASSET',
      institutionName: 'Nequi',
      currency: 'COP',
      openingBalance: '450000.00',
      currentBalance: '1120500.00',
      reservedForGoals: '0.00',
      availableBalance: '1120500.00',
      creditLimit: null,
      billingDay: null,
      paymentDueDay: null,
      color: '#7734A8',
      icon: 'wallet',
      isFavorite: true,
      isActive: true,
      includeInNetWorth: true,
      createdAt,
      updatedAt: nowIso(),
    },
    {
      id: 'demo-account-daviplata',
      name: 'Daviplata',
      type: 'E_WALLET',
      nature: 'ASSET',
      institutionName: 'Davivienda',
      currency: 'COP',
      openingBalance: '250000.00',
      currentBalance: '685000.00',
      reservedForGoals: '100000.00',
      availableBalance: '585000.00',
      creditLimit: null,
      billingDay: null,
      paymentDueDay: null,
      color: '#B62323',
      icon: 'wallet',
      isFavorite: false,
      isActive: true,
      includeInNetWorth: true,
      createdAt,
      updatedAt: nowIso(),
    },
    {
      id: 'demo-account-cash',
      name: 'Efectivo',
      type: 'CASH',
      nature: 'ASSET',
      institutionName: null,
      currency: 'COP',
      openingBalance: '200000.00',
      currentBalance: '310000.00',
      reservedForGoals: '0.00',
      availableBalance: '310000.00',
      creditLimit: null,
      billingDay: null,
      paymentDueDay: null,
      color: '#577C65',
      icon: 'banknote',
      isFavorite: false,
      isActive: true,
      includeInNetWorth: true,
      createdAt,
      updatedAt: nowIso(),
    },
    {
      id: 'demo-account-savings',
      name: 'Ahorro programado',
      type: 'SAVINGS',
      nature: 'ASSET',
      institutionName: 'Bancolombia',
      currency: 'COP',
      openingBalance: '500000.00',
      currentBalance: '1450000.00',
      reservedForGoals: '600000.00',
      availableBalance: '850000.00',
      creditLimit: null,
      billingDay: null,
      paymentDueDay: null,
      color: '#6F9C83',
      icon: 'piggy-bank',
      isFavorite: false,
      isActive: true,
      includeInNetWorth: true,
      createdAt,
      updatedAt: nowIso(),
    },
  ]
}

const createTransaction = (
  key: string,
  date: Date,
  type: Transaction['type'],
  amount: number,
  accountId: string,
  categoryId: string | null,
  description: string,
): Transaction => {
  const timestamp = new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      14,
    ),
  ).toISOString()
  return {
    id: `demo-transaction-${key}`,
    type,
    status: 'CONFIRMED',
    amount: money(amount),
    currency: 'COP',
    accountId,
    destinationAccountId: null,
    categoryId,
    occurredAt: timestamp,
    description,
    notes: null,
    merchantName: null,
    version: 1,
    createdAt: timestamp,
    updatedAt: timestamp,
  }
}

const transactionsSeed = () => {
  const rows: Transaction[] = []
  const current = today()
  for (let offset = 0; offset < 12; offset += 1) {
    const month = monthDate(offset, 1)
    const maxDay =
      offset === 0
        ? current.getUTCDate()
        : new Date(
            Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + 1, 0),
          ).getUTCDate()
    const push = (
      day: number,
      suffix: string,
      type: Transaction['type'],
      amount: number,
      accountId: string,
      categoryId: string | null,
      description: string,
    ) => {
      if (day <= maxDay)
        rows.push(
          createTransaction(
            `${offset}-${suffix}`,
            monthDate(offset, day),
            type,
            amount,
            accountId,
            categoryId,
            description,
          ),
        )
    }

    push(
      5,
      'salary',
      'INCOME',
      4100000,
      'demo-account-bancolombia',
      'demo-category-salary',
      'Pago nómina',
    )
    if (offset % 2 === 0)
      push(
        12,
        'freelance',
        'INCOME',
        650000 + offset * 15000,
        'demo-account-bancolombia',
        'demo-category-extra',
        'Proyecto freelance',
      )
    push(
      1,
      'rent',
      'EXPENSE',
      1100000,
      'demo-account-bancolombia',
      'demo-category-home',
      'Arriendo',
    )
    push(
      7,
      'market-a',
      'EXPENSE',
      310000 + offset * 3500,
      'demo-account-nequi',
      'demo-category-food',
      'Mercado semanal',
    )
    push(
      21,
      'market-b',
      'EXPENSE',
      275000 + offset * 2500,
      'demo-account-bancolombia',
      'demo-category-food',
      'Mercado hogar',
    )
    push(
      10,
      'transport',
      'EXPENSE',
      185000 + offset * 2000,
      'demo-account-daviplata',
      'demo-category-transport',
      'Transporte del mes',
    )
    push(
      11,
      'internet',
      'EXPENSE',
      118000,
      'demo-account-bancolombia',
      'demo-category-services',
      'Internet hogar',
    )
    push(
      14,
      'mobile',
      'EXPENSE',
      60000,
      'demo-account-daviplata',
      'demo-category-services',
      'Plan móvil',
    )
    push(
      18,
      'fun',
      'EXPENSE',
      140000 + offset * 1000,
      'demo-account-nequi',
      'demo-category-fun',
      'Salida y entretenimiento',
    )
    push(
      23,
      'subscription',
      'EXPENSE',
      58900,
      'demo-account-daviplata',
      'demo-category-subscriptions',
      'Plataformas digitales',
    )
    push(
      25,
      'health',
      'EXPENSE',
      75000,
      'demo-account-nequi',
      'demo-category-health',
      'Farmacia',
    )
  }
  return rows.sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
}

const budgetFrom = (
  key: string,
  name: string,
  amount: number,
  categoryId: string,
): Budget => {
  const now = today()
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
  const end = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0),
  )
  const categories = categoriesSeed()
  const category = categories.find((item) => item.id === categoryId)!
  const accounts = accountsSeed()
  return {
    id: `demo-budget-${key}`,
    name,
    period: 'MONTHLY',
    startsOn: dateOnly(start),
    endsOn: dateOnly(end),
    amount: money(amount),
    currency: 'COP',
    alertThreshold: '80',
    rolloverEnabled: false,
    isActive: true,
    categories: [
      {
        id: category.id,
        name: category.name,
        type: 'EXPENSE',
        icon: category.icon,
        color: category.color,
        isSystem: category.isSystem,
        isActive: true,
      },
    ],
    accounts: accounts.slice(0, 3).map((account) => ({
      id: account.id,
      name: account.name,
      type: account.type,
      nature: account.nature,
      currency: account.currency,
      isActive: account.isActive,
    })),
    progress: {
      spent: '0.00',
      remaining: money(amount),
      percentage: '0.00',
      status: 'SAFE',
    },
    projection: {
      projectedSpend: '0.00',
      projectedRemaining: money(amount),
      projectedPercentage: '0.00',
      projectedStatus: 'SAFE',
    },
    movements: [],
    createdAt: nowIso(),
    updatedAt: nowIso(),
  }
}

const goalFrom = (
  key: string,
  name: string,
  saved: number,
  target: number,
  accountId: string,
  color: string,
): Goal => {
  const account = accountsSeed().find((item) => item.id === accountId)!
  const percentage = Math.min(100, (saved / target) * 100)
  return {
    id: `demo-goal-${key}`,
    name,
    targetAmount: money(target),
    savedAmount: money(saved),
    targetDate:
      key === 'emergency'
        ? '2026-12-31'
        : key === 'trip'
          ? '2027-06-30'
          : '2027-03-31',
    status: 'ACTIVE',
    icon: key === 'emergency' ? 'shield' : key === 'trip' ? 'plane' : 'laptop',
    color,
    account: {
      id: account.id,
      name: account.name,
      type: account.type,
      nature: account.nature,
      currency: account.currency,
      isActive: true,
    },
    progress: {
      savedAmount: money(saved),
      targetAmount: money(target),
      remainingAmount: money(Math.max(0, target - saved)),
      surplusAmount: money(Math.max(0, saved - target)),
      percentage: percentage.toFixed(2),
      suggestedMonthlyAmount: money(Math.max(0, (target - saved) / 6)),
      averageMonthlyContribution: money(saved / 10),
      estimatedCompletionDate: null,
      estimationReason: 'ESTIMATED',
    },
    contributions: [],
    archivedAt: null,
    createdAt: '2025-10-01T12:00:00.000Z',
    updatedAt: nowIso(),
  }
}

const notificationsSeed = (): DemoNotification[] => [
  {
    id: 'demo-notification-budget',
    type: 'BUDGET_ALERT',
    title: 'Alimentación está cerca del límite',
    message: 'Has usado gran parte del presupuesto de alimentación este mes.',
    severity: 'WARNING',
    source: 'BUDGET',
    sourceId: 'demo-budget-food',
    actionUrl: '/app/budgets',
    actionLabel: 'Ver presupuesto',
    context: { budget: 'Alimentación' },
    scheduledFor: null,
    sentAt: nowIso(),
    readAt: null,
    dismissedAt: null,
    createdAt: nowIso(),
  },
  {
    id: 'demo-notification-goal',
    type: 'GOAL_PROGRESS',
    title: 'Tu fondo de emergencia sigue creciendo',
    message: 'Ya superaste la mitad de tu objetivo de ahorro.',
    severity: 'SUCCESS',
    source: 'GOAL',
    sourceId: 'demo-goal-emergency',
    actionUrl: '/app/goals',
    actionLabel: 'Ver meta',
    context: { progress: 60 },
    scheduledFor: null,
    sentAt: nowIso(),
    readAt: null,
    dismissedAt: null,
    createdAt: nowIso(),
  },
]

const seed = (): DemoDb => ({
  accounts: accountsSeed(),
  categories: categoriesSeed(),
  transactions: transactionsSeed(),
  budgets: [
    budgetFrom('food', 'Alimentación', 850000, 'demo-category-food'),
    budgetFrom('transport', 'Transporte', 500000, 'demo-category-transport'),
    budgetFrom('fun', 'Entretenimiento', 350000, 'demo-category-fun'),
    budgetFrom('home', 'Hogar', 1450000, 'demo-category-home'),
    budgetFrom(
      'subscriptions',
      'Suscripciones',
      180000,
      'demo-category-subscriptions',
    ),
  ],
  goals: [
    goalFrom(
      'emergency',
      'Fondo de emergencia',
      4800000,
      8000000,
      'demo-account-bancolombia',
      '#154B45',
    ),
    goalFrom(
      'trip',
      'Viaje',
      2250000,
      5000000,
      'demo-account-savings',
      '#5D8C74',
    ),
    goalFrom(
      'laptop',
      'Portátil nuevo',
      2400000,
      4500000,
      'demo-account-bancolombia',
      '#4F79B8',
    ),
  ],
  notifications: notificationsSeed(),
  preferences: { ...demoPreferences },
})

const readDb = (): DemoDb => {
  if (typeof window === 'undefined') return seed()
  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    const initial = seed()
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(initial))
    return initial
  }
  try {
    return JSON.parse(raw) as DemoDb
  } catch {
    const initial = seed()
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(initial))
    return initial
  }
}

const saveDb = (db: DemoDb) => {
  if (typeof window !== 'undefined')
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(db))
}

export const resetDemoDatabase = () => {
  if (typeof window !== 'undefined')
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seed()))
}

const pathParts = (pathname: string) => pathname.split('/').filter(Boolean)

const resolveRange = (search: URLSearchParams) => {
  const now = today()
  const period = search.get('period') ?? 'CURRENT_MONTH'
  if (period === 'CUSTOM' && search.get('dateFrom') && search.get('dateTo'))
    return {
      from: search.get('dateFrom')!,
      to: search.get('dateTo')!,
      period,
    }
  if (period === 'LAST_7_DAYS' || period === 'LAST_30_DAYS') {
    const days = period === 'LAST_7_DAYS' ? 6 : 29
    const start = new Date(now)
    start.setUTCDate(start.getUTCDate() - days)
    return { from: dateOnly(start), to: dateOnly(now), period }
  }
  if (period === 'CURRENT_YEAR' || period === 'PREVIOUS_YEAR') {
    const year =
      now.getUTCFullYear() - (period === 'PREVIOUS_YEAR' ? 1 : 0)
    const start = new Date(Date.UTC(year, 0, 1))
    const end =
      period === 'CURRENT_YEAR'
        ? now
        : new Date(Date.UTC(year, 11, 31, 23, 59))
    return { from: dateOnly(start), to: dateOnly(end), period }
  }
  const offset = period === 'PREVIOUS_MONTH' ? 1 : 0
  const base = monthDate(offset, 1)
  const start = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), 1))
  const end =
    offset === 0
      ? now
      : new Date(
          Date.UTC(base.getUTCFullYear(), base.getUTCMonth() + 1, 0, 23, 59),
        )
  return { from: dateOnly(start), to: dateOnly(end), period }
}

const transactionsInRange = (
  db: DemoDb,
  from: string,
  to: string,
): Transaction[] =>
  db.transactions.filter((item) => {
    const date = item.occurredAt.slice(0, 10)
    return date >= from && date <= to && item.status === 'CONFIRMED'
  })

const recalculateBudgets = (db: DemoDb) => {
  db.budgets = db.budgets.map((budget) => {
    const categoryIds = new Set(budget.categories.map((item) => item.id))
    const accountIds = new Set(budget.accounts.map((item) => item.id))
    const movements = db.transactions.filter(
      (transaction) =>
        transaction.type === 'EXPENSE' &&
        transaction.status === 'CONFIRMED' &&
        transaction.occurredAt.slice(0, 10) >= budget.startsOn &&
        transaction.occurredAt.slice(0, 10) <= budget.endsOn &&
        (!categoryIds.size ||
          (transaction.categoryId && categoryIds.has(transaction.categoryId))) &&
        (!accountIds.size ||
          (transaction.accountId && accountIds.has(transaction.accountId))),
    )
    const spent = movements.reduce(
      (total, movement) => total + numeric(movement.amount),
      0,
    )
    const limit = numeric(budget.amount)
    const percentage = limit > 0 ? (spent / limit) * 100 : 0
    const status =
      percentage >= 100 ? 'EXCEEDED' : percentage >= 80 ? 'WARNING' : 'SAFE'
    return {
      ...budget,
      progress: {
        spent: money(spent),
        remaining: money(limit - spent),
        percentage: percentage.toFixed(2),
        status,
      },
      projection: {
        projectedSpend: money(spent * 1.12),
        projectedRemaining: money(limit - spent * 1.12),
        projectedPercentage: (percentage * 1.12).toFixed(2),
        projectedStatus:
          percentage * 1.12 >= 100
            ? 'EXCEEDED'
            : percentage * 1.12 >= 80
              ? 'WARNING'
              : 'SAFE',
      },
      movements: movements.slice(0, 8).map((movement) => ({
        id: movement.id,
        amount: movement.amount,
        currency: movement.currency,
        occurredAt: movement.occurredAt,
        description: movement.description,
        merchantName: movement.merchantName,
        categoryId: movement.categoryId,
        categoryName:
          db.categories.find((item) => item.id === movement.categoryId)?.name ??
          null,
        accountId: movement.accountId ?? '',
        accountName:
          db.accounts.find((item) => item.id === movement.accountId)?.name ??
          null,
      })),
    } satisfies Budget
  })
}

const summaryForRange = (db: DemoDb, from: string, to: string) => {
  const rows = transactionsInRange(db, from, to)
  const income = rows
    .filter((item) => item.type === 'INCOME')
    .reduce((total, item) => total + numeric(item.amount), 0)
  const expenses = rows
    .filter((item) => item.type === 'EXPENSE')
    .reduce((total, item) => total + numeric(item.amount), 0)
  return { rows, income, expenses, net: income - expenses }
}

const dashboard = (db: DemoDb, search: URLSearchParams) => {
  recalculateBudgets(db)
  const range = resolveRange(search)
  const current = summaryForRange(db, range.from, range.to)
  const assets = db.accounts.filter(
    (account) => account.isActive && account.nature === 'ASSET',
  )
  const totalMoney = assets.reduce(
    (total, account) => total + numeric(account.currentBalance),
    0,
  )
  const reserved = assets.reduce(
    (total, account) => total + numeric(account.reservedForGoals),
    0,
  )
  const available = assets.reduce(
    (total, account) =>
      total +
      numeric(
        account.availableBalance ??
          money(
            numeric(account.currentBalance) -
              numeric(account.reservedForGoals),
          ),
      ),
    0,
  )
  const expensesByCategory = db.categories
    .filter((category) => category.type === 'EXPENSE')
    .map((category) => {
      const amount = current.rows
        .filter(
          (transaction) =>
            transaction.type === 'EXPENSE' &&
            transaction.categoryId === category.id,
        )
        .reduce((total, transaction) => total + numeric(transaction.amount), 0)
      return {
        categoryId: category.id,
        categoryName: category.name,
        icon: category.icon,
        color: category.color,
        currency: 'COP',
        amount: money(amount),
        percentage:
          current.expenses > 0
            ? ((amount / current.expenses) * 100).toFixed(2)
            : '0.00',
      }
    })
    .filter((item) => numeric(item.amount) > 0)
    .sort((a, b) => numeric(b.amount) - numeric(a.amount))

  const previousBase = new Date(range.from + 'T12:00:00Z')
  previousBase.setUTCMonth(previousBase.getUTCMonth() - 1)
  const previousFrom = dateOnly(
    new Date(
      Date.UTC(
        previousBase.getUTCFullYear(),
        previousBase.getUTCMonth(),
        1,
      ),
    ),
  )
  const previousTo = dateOnly(
    new Date(
      Date.UTC(
        previousBase.getUTCFullYear(),
        previousBase.getUTCMonth() + 1,
        0,
      ),
    ),
  )
  const previous = summaryForRange(db, previousFrom, previousTo)

  return {
    period: {
      type: range.period,
      dateFrom: range.from + 'T05:00:00.000Z',
      dateTo: range.to + 'T23:59:59.999Z',
      timezone: demoWorkspace.timezone,
    },
    baseCurrency: 'COP',
    summariesByCurrency: [
      {
        currency: 'COP',
        availableMoney: money(available),
        totalMoney: money(totalMoney),
        reservedForGoals: money(reserved),
        totalIncome: money(current.income),
        totalExpenses: money(current.expenses),
        netCashFlow: money(current.net),
        netWorth: money(totalMoney - 1820000),
        expectedCollections: '1060000.00',
        scheduledPayments: '640000.00',
        projectedEndLiquidity: money(
          available + current.net + 1060000 - 640000,
        ),
        forecastDate: range.to,
      },
    ],
    accountBalances: assets.map((account) => ({
      id: account.id,
      name: account.name,
      type: account.type,
      nature: account.nature,
      currency: account.currency,
      currentBalance: account.currentBalance,
      reservedForGoals: account.reservedForGoals,
      availableBalance: account.availableBalance,
      isFavorite: account.isFavorite,
      includeInNetWorth: account.includeInNetWorth,
    })),
    recentTransactions: current.rows.slice(0, Number(search.get('recentLimit') ?? 5)),
    budgetProgress: db.budgets.map((item) => item.progress),
    expensesByCategory,
    accountsByType: [],
    comparisonByCurrency: [
      {
        currency: 'COP',
        currentIncome: money(current.income),
        previousIncome: money(previous.income),
        incomeChangeAmount: money(current.income - previous.income),
        incomeChangePercentage:
          previous.income > 0
            ? (((current.income - previous.income) / previous.income) * 100).toFixed(2)
            : null,
        currentExpenses: money(current.expenses),
        previousExpenses: money(previous.expenses),
        expenseChangeAmount: money(current.expenses - previous.expenses),
        expenseChangePercentage:
          previous.expenses > 0
            ? (((current.expenses - previous.expenses) / previous.expenses) * 100).toFixed(2)
            : null,
        currentNetCashFlow: money(current.net),
        previousNetCashFlow: money(previous.net),
      },
    ],
  }
}

const updateAccountForTransaction = (
  db: DemoDb,
  transaction: Transaction,
  direction: 1 | -1,
) => {
  const amount = numeric(transaction.amount) * direction
  const account = db.accounts.find(
    (item) => item.id === transaction.accountId,
  )
  if (account) {
    const delta =
      transaction.type === 'INCOME'
        ? amount
        : transaction.type === 'EXPENSE'
          ? -amount
          : -amount
    account.currentBalance = money(numeric(account.currentBalance) + delta)
    account.availableBalance = money(
      numeric(account.currentBalance) - numeric(account.reservedForGoals),
    )
    account.updatedAt = nowIso()
  }
  if (transaction.type === 'TRANSFER') {
    const destination = db.accounts.find(
      (item) => item.id === transaction.destinationAccountId,
    )
    if (destination) {
      destination.currentBalance = money(
        numeric(destination.currentBalance) + amount,
      )
      destination.availableBalance = money(
        numeric(destination.currentBalance) -
          numeric(destination.reservedForGoals),
      )
      destination.updatedAt = nowIso()
    }
  }
}

const createMovement = (
  db: DemoDb,
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER',
  body: Record<string, unknown>,
) => {
  const transaction: Transaction = {
    id: id('demo-transaction'),
    type,
    status: 'CONFIRMED',
    amount: String(body.amount ?? '0'),
    currency: 'COP',
    accountId: String(body.accountId ?? ''),
    destinationAccountId:
      type === 'TRANSFER' ? String(body.destinationAccountId ?? '') : null,
    categoryId: body.categoryId ? String(body.categoryId) : null,
    occurredAt: String(body.occurredAt ?? nowIso()),
    description: body.description ? String(body.description) : null,
    notes: body.notes ? String(body.notes) : null,
    merchantName: body.merchantName ? String(body.merchantName) : null,
    version: 1,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  }
  db.transactions.unshift(transaction)
  updateAccountForTransaction(db, transaction, 1)
  recalculateBudgets(db)
  return transaction
}

const goalProgress = (goal: Goal) => {
  const saved = numeric(goal.savedAmount)
  const target = numeric(goal.targetAmount)
  const percentage = target > 0 ? Math.min(100, (saved / target) * 100) : 0
  goal.progress = {
    ...goal.progress,
    savedAmount: goal.savedAmount,
    targetAmount: goal.targetAmount,
    remainingAmount: money(Math.max(0, target - saved)),
    surplusAmount: money(Math.max(0, saved - target)),
    percentage: percentage.toFixed(2),
  }
  return goal
}

const periodResponse = (
  search: URLSearchParams,
  timezone = demoWorkspace.timezone,
) => {
  const range = resolveRange(search)
  return {
    type: range.period,
    dateFrom: range.from + 'T05:00:00.000Z',
    dateTo: range.to + 'T23:59:59.999Z',
    timezone,
  }
}

const reports = (db: DemoDb, route: string, search: URLSearchParams) => {
  const period = periodResponse(search)
  const rows = transactionsInRange(
    db,
    period.dateFrom.slice(0, 10),
    period.dateTo.slice(0, 10),
  )
  const incomeRows = rows.filter((item) => item.type === 'INCOME')
  const expenseRows = rows.filter((item) => item.type === 'EXPENSE')
  const totalIncome = incomeRows.reduce(
    (total, item) => total + numeric(item.amount),
    0,
  )
  const totalExpenses = expenseRows.reduce(
    (total, item) => total + numeric(item.amount),
    0,
  )

  if (route === 'income-vs-expenses')
    return {
      period,
      summariesByCurrency: [
        {
          currency: 'COP',
          totalIncome: money(totalIncome),
          totalExpenses: money(totalExpenses),
          netCashFlow: money(totalIncome - totalExpenses),
          incomeTransactionCount: incomeRows.length,
          expenseTransactionCount: expenseRows.length,
          averageIncome: money(
            incomeRows.length ? totalIncome / incomeRows.length : 0,
          ),
          averageExpense: money(
            expenseRows.length ? totalExpenses / expenseRows.length : 0,
          ),
          comparisonWithPreviousPeriod: {},
        },
      ],
    }

  if (route === 'expenses-by-category') {
    const categories = db.categories
      .filter((category) => category.type === 'EXPENSE')
      .map((category) => {
        const matches = expenseRows.filter(
          (item) => item.categoryId === category.id,
        )
        const amount = matches.reduce(
          (total, item) => total + numeric(item.amount),
          0,
        )
        return {
          categoryId: category.id,
          categoryName: category.name,
          icon: category.icon,
          color: category.color,
          amount: money(amount),
          percentage:
            totalExpenses > 0
              ? ((amount / totalExpenses) * 100).toFixed(2)
              : '0.00',
          transactionCount: matches.length,
        }
      })
      .filter((item) => numeric(item.amount) > 0)
    return {
      period,
      groupsByCurrency: [
        {
          currency: 'COP',
          totalExpenses: money(totalExpenses),
          categories,
        },
      ],
    }
  }

  if (route === 'cash-flow') {
    const groupBy = search.get('groupBy') ?? 'DAY'
    const grouped = new Map<
      string,
      { income: number; expenses: number; incomeCount: number; expenseCount: number }
    >()
    for (const transaction of rows) {
      const date = new Date(transaction.occurredAt)
      const key =
        groupBy === 'MONTH'
          ? transaction.occurredAt.slice(0, 7) + '-01'
          : groupBy === 'WEEK'
            ? (() => {
                const date = new Date(transaction.occurredAt)
                const day = date.getUTCDay()
                const mondayOffset = day === 0 ? -6 : 1 - day
                date.setUTCDate(date.getUTCDate() + mondayOffset)
                return dateOnly(date)
              })()
            : transaction.occurredAt.slice(0, 10)
      const current = grouped.get(key) ?? {
        income: 0,
        expenses: 0,
        incomeCount: 0,
        expenseCount: 0,
      }
      if (transaction.type === 'INCOME') {
        current.income += numeric(transaction.amount)
        current.incomeCount += 1
      }
      if (transaction.type === 'EXPENSE') {
        current.expenses += numeric(transaction.amount)
        current.expenseCount += 1
      }
      grouped.set(key, current)
      void date
    }
    const points = [...grouped.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => ({
        periodStart: key + 'T05:00:00.000Z',
        periodEnd: key + 'T23:59:59.999Z',
        totalIncome: money(value.income),
        totalExpenses: money(value.expenses),
        netCashFlow: money(value.income - value.expenses),
        incomeCount: value.incomeCount,
        expenseCount: value.expenseCount,
      }))
    return {
      period,
      groupBy,
      seriesByCurrency: [{ currency: 'COP', points }],
    }
  }

  const active = db.accounts.filter((account) => account.isActive)
  const assetBalance = active
    .filter((item) => item.nature === 'ASSET')
    .reduce((total, item) => total + numeric(item.currentBalance), 0)
  const liabilityBalance = active
    .filter((item) => item.nature === 'LIABILITY')
    .reduce((total, item) => total + numeric(item.currentBalance), 0)
  return {
    summariesByCurrency: [
      {
        currency: 'COP',
        assetBalance: money(assetBalance),
        liabilityBalance: money(liabilityBalance),
        netWorth: money(assetBalance - liabilityBalance),
        availableMoney: money(
          active.reduce(
            (total, item) =>
              total + (item.nature === 'ASSET' ? numeric(item.availableBalance) : 0),
            0,
          ),
        ),
        accountCount: active.length,
      },
    ],
    accounts: active.map((account) => ({
      id: account.id,
      name: account.name,
      type: account.type,
      nature: account.nature,
      currency: account.currency,
      currentBalance: account.currentBalance,
      isFavorite: account.isFavorite,
      includeInNetWorth: account.includeInNetWorth,
      isActive: account.isActive,
    })),
    pagination: {
      page: 1,
      limit: 100,
      total: active.length,
      totalPages: 1,
    },
  }
}

const upcoming = () => {
  const base = today()
  const item = (days: number, key: string, name: string, amount: number) => {
    const date = new Date(base)
    date.setUTCDate(date.getUTCDate() + days)
    return {
      type: key === 'card' ? 'CARD_ESTIMATE' : 'OBLIGATION',
      id: `demo-upcoming-${key}`,
      resourceId: `demo-${key}`,
      name,
      date: dateOnly(date),
      amount: money(amount),
      currency: 'COP',
      status: 'PENDING',
      daysRemaining: days,
      source: key === 'card' ? 'ESTIMATED' : 'SCHEDULED',
      amountLabel: key === 'card' ? 'Pago estimado' : 'Pago programado',
    }
  }
  return [
    item(3, 'card', 'Tarjeta Visa', 320000),
    item(6, 'internet', 'Internet hogar', 118000),
    item(10, 'cellphone', 'Crédito celular', 142000),
    item(13, 'mobile', 'Plan móvil', 60000),
  ]
}

const liabilitySummary = () => ({
  totalDebt: '1820000.00',
  monthlyCommitments: '640000.00',
  nextPayment: upcoming()[0],
  overdueAmount: '0.00',
  principalPaid: '960000.00',
  interestPaid: '145000.00',
  activeDebts: 1,
  activeObligations: 2,
  cards: {
    creditLimit: '4000000.00',
    used: '980000.00',
    available: '3020000.00',
    utilization: '24.50',
  },
  cardsByCurrency: [
    {
      currency: 'COP',
      creditLimit: '4000000.00',
      used: '980000.00',
      available: '3020000.00',
      utilization: '24.50',
    },
  ],
  summariesByCurrency: [
    {
      currency: 'COP',
      creditDebt: '840000.00',
      cardDebt: '980000.00',
      totalDebt: '1820000.00',
      monthlyCommitments: '640000.00',
      overdueAmount: '0.00',
      principalPaid: '960000.00',
      interestPaid: '145000.00',
    },
  ],
  upcoming: upcoming(),
})

const debts = () => [
  {
    id: 'demo-debt-cellphone',
    name: 'Crédito celular',
    institutionName: 'Operador móvil',
    lenderName: null,
    type: 'PURCHASE_FINANCING',
    status: 'ACTIVE',
    currency: 'COP',
    originalAmount: '1800000.00',
    currentBalance: '840000.00',
    interestRate: '1.2',
    interestRateBasis: 'EFFECTIVE_MONTHLY',
    interestType: 'FIXED',
    termMonths: 18,
    installmentCount: 18,
    paymentFrequency: 'MONTHLY',
    installmentAmount: '142000.00',
    disbursementDate: '2025-10-02',
    firstPaymentDate: '2025-11-22',
    estimatedEndDate: '2027-04-22',
    nextDueDate: dateOnly(
      new Date(Date.now() + 10 * 86_400_000),
    ),
    paymentDay: 22,
    liabilityAccountId: null,
    notes: null,
    createdAt: '2025-10-02T12:00:00.000Z',
    updatedAt: nowIso(),
  },
]

const cards = () => [
  {
    id: 'demo-card-visa',
    name: 'Tarjeta Visa',
    institutionName: 'Bancolombia',
    currency: 'COP',
    currentBalance: '980000.00',
    creditLimit: '4000000.00',
    billingDay: 8,
    paymentDueDay: 17,
    usedCredit: '980000.00',
    availableCredit: '3020000.00',
    utilization: '24.50',
    nextBillingDate: dateOnly(
      new Date(Date.now() + 18 * 86_400_000),
    ),
    nextPaymentDate: dateOnly(
      new Date(Date.now() + 3 * 86_400_000),
    ),
    nextPayment: {
      amount: '320000.00',
      originalAmount: '320000.00',
      paidAmount: '0.00',
      minimumPayment: '95000.00',
      source: 'ESTIMATED',
      statementId: null,
      expectationId: 'demo-expectation',
      reportedTotalBalance: null,
    },
    referencePeriodicRate: '1.85',
    referenceRateSource: 'INFORMED',
  },
]

const obligations = () => [
  {
    id: 'demo-obligation-internet',
    name: 'Internet hogar',
    description: 'Plan hogar',
    expectedAmount: '118000.00',
    currency: 'COP',
    amountType: 'FIXED',
    status: 'ACTIVE',
    paymentAccountId: 'demo-account-bancolombia',
    categoryId: 'demo-category-services',
    remindersEnabled: true,
    recurrenceRules: {
      frequency: 'MONTHLY',
      intervalValue: 1,
      dayOfWeek: null,
      dayOfMonth: 18,
      startsOn: '2025-09-18',
      endsOn: null,
      nextRunAt: dateOnly(new Date(Date.now() + 6 * 86_400_000)),
    },
    occurrences: [],
  },
  {
    id: 'demo-obligation-mobile',
    name: 'Plan móvil',
    description: 'Plan pospago',
    expectedAmount: '60000.00',
    currency: 'COP',
    amountType: 'FIXED',
    status: 'ACTIVE',
    paymentAccountId: 'demo-account-daviplata',
    categoryId: 'demo-category-services',
    remindersEnabled: true,
    recurrenceRules: {
      frequency: 'MONTHLY',
      intervalValue: 1,
      dayOfWeek: null,
      dayOfMonth: 25,
      startsOn: '2025-09-25',
      endsOn: null,
      nextRunAt: dateOnly(new Date(Date.now() + 13 * 86_400_000)),
    },
    occurrences: [],
  },
]

const lendingLoans = () => [
  {
    id: 'demo-loan-carlos',
    personId: 'demo-person-carlos',
    personName: 'Carlos',
    currency: 'COP',
    originalPrincipal: '1200000.00',
    currentPrincipal: '820000.00',
    ratePercent: '1.5',
    method: 'FIXED_PAYMENT',
    frequency: 'MONTHLY',
    termCount: 8,
    installmentAmount: '180000.00',
    expectedInterest: '92000.00',
    expectedTotal: '1292000.00',
    interestReceived: '46000.00',
    principalReceived: '380000.00',
    nextDueDate: dateOnly(new Date(Date.now() + 23 * 86_400_000)),
    estimatedEndDate: '2027-02-07',
    status: 'ACTIVE',
  },
]

const personalBalances = () => {
  const person = (
    key: string,
    name: string,
    relationship: string,
    direction: 'PAYABLE' | 'RECEIVABLE',
    amount: number,
    dueOn: string | null,
  ) => ({
    id: `demo-personal-${key}`,
    counterpartyName: name,
    personId: `demo-person-${key}`,
    person: {
      id: `demo-person-${key}`,
      name,
      relationship,
    },
    direction,
    originalAmount: money(amount),
    currentBalance: money(amount),
    currency: 'COP',
    description:
      direction === 'PAYABLE' ? 'Dinero recibido' : 'Dinero prestado',
    occurredOn: '2026-08-20',
    dueOn,
    status: 'OPEN',
    settledAt: null,
    notes: null,
    createdAt: '2026-08-20T12:00:00.000Z',
    updatedAt: nowIso(),
    entries: [],
  })
  return [
    person('camila', 'Camila', 'Amiga', 'RECEIVABLE', 240000, null),
    person(
      'andres',
      'Andrés',
      'Hermano',
      'PAYABLE',
      85000,
      dateOnly(new Date(Date.now() + 8 * 86_400_000)),
    ),
    person(
      'laura',
      'Laura',
      'Compañera',
      'RECEIVABLE',
      125000,
      dateOnly(new Date(Date.now() + 18 * 86_400_000)),
    ),
  ]
}

const financialHealth = () => ({
  version: 'financial-health-v1',
  score: 82,
  band: 'SOLID',
  coverage: 100,
  availableDimensions: 5,
  dimensions: [
    {
      id: 'LIQUIDITY',
      label: 'Liquidez',
      score: 88,
      available: true,
      status: 'SOLID',
      summary: 'Tienes margen para cubrir tus compromisos.',
      explanation: 'Tu disponible supera los pagos conocidos del periodo.',
      metrics: { availableMoney: 5815500, commitments: 640000 },
      action: { label: 'Ver cuentas', url: '/app/accounts' },
    },
    {
      id: 'DEBT',
      label: 'Deuda',
      score: 80,
      available: true,
      status: 'SOLID',
      summary: 'Tu nivel de deuda se mantiene controlado.',
      explanation: 'Las cuotas representan una porción manejable de tus ingresos.',
      metrics: { debt: 1820000, monthlyCommitments: 640000 },
      action: { label: 'Ver deudas', url: '/app/commitments' },
    },
    {
      id: 'SPENDING_CONTROL',
      label: 'Control de gasto',
      score: 76,
      available: true,
      status: 'STABLE',
      summary: 'Tus presupuestos están funcionando.',
      explanation: 'La mayoría se mantiene por debajo del límite.',
      metrics: { budgetCount: 5 },
      action: { label: 'Ver presupuestos', url: '/app/budgets' },
    },
    {
      id: 'SAVINGS',
      label: 'Ahorro',
      score: 84,
      available: true,
      status: 'SOLID',
      summary: 'Estás reservando dinero con constancia.',
      explanation: 'Mantienes varias metas activas.',
      metrics: { activeGoals: 3 },
      action: { label: 'Ver metas', url: '/app/goals' },
    },
    {
      id: 'PAYMENT_COMPLIANCE',
      label: 'Pagos',
      score: 82,
      available: true,
      status: 'SOLID',
      summary: 'Tus pagos conocidos están al día.',
      explanation: 'No hay compromisos vencidos.',
      metrics: { overdue: 0 },
      action: { label: 'Ver compromisos', url: '/app/commitments' },
    },
  ],
  recommendations: [
    {
      dimension: 'SAVINGS',
      title: 'Mantén el ritmo de ahorro',
      detail: 'Tu fondo de emergencia avanza de forma saludable.',
      action: { label: 'Ver metas', url: '/app/goals' },
    },
  ],
  methodology: {
    version: 'v1',
    aggregation: 'Promedio ponderado de cinco dimensiones.',
    rules: ['Solo usa datos disponibles.', 'No sustituye asesoría profesional.'],
    disclaimer: 'Indicador orientativo para educación financiera.',
  },
  period: {
    key: dateOnly(today()).slice(0, 7),
    dateFrom: dateOnly(monthDate(0, 1)),
    dateTo: dateOnly(today()),
    generatedAt: nowIso(),
    timezone: demoWorkspace.timezone,
  },
  currency: 'COP',
  dataQuality: {
    historyDays: 365,
    trailingWindowDays: 90,
    budgetCount: 5,
    evaluatedPayments: 11,
    notes: [],
  },
  trace: {},
  history: {
    items: [],
    hasEnoughHistory: true,
    minimumPeriods: 3,
    message: 'Hay suficiente historial para comparar tendencias.',
  },
})

const monthEndForecast = (db: DemoDb) => {
  const dash = dashboard(db, new URLSearchParams({ period: 'CURRENT_MONTH' }))
  const summary = dash.summariesByCurrency[0]!
  const current = today()
  const end = new Date(
    Date.UTC(current.getUTCFullYear(), current.getUTCMonth() + 1, 0),
  )
  const primary = {
    currency: 'COP',
    status: 'COMPLETE',
    dataQuality: 'HIGH',
    currentAvailable: summary.availableMoney,
    expectedIncome: '0.00',
    knownCommitments: '640000.00',
    estimatedVariableExpenses: '950000.00',
    knownClosingBalance: money(numeric(summary.availableMoney) - 640000),
    projectedClosingBalance: money(
      numeric(summary.availableMoney) - 640000 - 950000,
    ),
    lowestProjectedBalance: {
      date: dateOnly(end),
      amount: money(numeric(summary.availableMoney) - 1590000),
    },
    historyDays: 365,
    daysRemaining: Math.max(
      0,
      Math.ceil((end.getTime() - current.getTime()) / 86_400_000),
    ),
    assumptions: [
      'Los pagos recurrentes conocidos se mantienen.',
      'El gasto variable se estima a partir del historial.',
    ],
    limitations: [],
    timeline: [
      {
        date: dateOnly(current),
        projectedBalance: summary.availableMoney,
        events: [],
      },
      {
        date: dateOnly(end),
        projectedBalance: money(numeric(summary.availableMoney) - 1590000),
        events: [],
      },
    ],
  }
  return {
    period: {
      type: 'MONTH_END',
      dateFrom: dateOnly(current),
      dateTo: dateOnly(end),
      generatedAt: nowIso(),
      timezone: demoWorkspace.timezone,
    },
    baseCurrency: 'COP',
    primary,
    byCurrency: [primary],
    configuredIncome: null,
    methodology: {
      version: 'demo-v1',
      description: 'Proyección local basada en los datos de la cuenta demo.',
    },
  }
}

const listWithPagination = <T>(items: T[], search: URLSearchParams) => {
  const page = Number(search.get('page') ?? 1)
  const limit = Number(search.get('limit') ?? 25)
  const start = Math.max(0, (page - 1) * limit)
  return {
    items: items.slice(start, start + limit),
    page,
    limit,
    total: items.length,
    totalPages: Math.max(1, Math.ceil(items.length / limit)),
  }
}

export async function handleDemoRequest<TResponse, TBody = unknown>(
  path: string,
  options: HttpRequestOptions<TBody> = {},
): Promise<TResponse> {
  const url = new URL(path, 'https://demo.fynar.local')
  const pathname = url.pathname
  const method = options.method ?? 'GET'
  const body = (options.body ?? {}) as Record<string, unknown>
  const db = readDb()
  const parts = pathParts(pathname)

  if (pathname === '/auth/me') return success(demoUser) as TResponse
  if (
    pathname === '/auth/logout' ||
    pathname === '/auth/logout-all' ||
    pathname === '/auth/change-password'
  )
    return undefined as TResponse

  if (pathname === '/workspaces')
    return success([demoWorkspace]) as TResponse

  if (pathname === '/users/me/preferences') {
    if (method === 'PATCH') {
      db.preferences = { ...db.preferences, ...body, updatedAt: nowIso() }
      saveDb(db)
    }
    return success(db.preferences) as TResponse
  }

  if (pathname.endsWith('/select') && pathname.includes('/workspaces/'))
    return success({
      workspace: demoWorkspace,
      defaultWorkspaceId: demoWorkspace.id,
      updatedAt: nowIso(),
    }) as TResponse

  const workspaceIndex = parts.indexOf('workspaces')
  const workspaceId =
    workspaceIndex >= 0 ? parts[workspaceIndex + 1] : undefined
  const resource =
    workspaceIndex >= 0 ? parts[workspaceIndex + 2] : undefined
  const resourceId =
    workspaceIndex >= 0 ? parts[workspaceIndex + 3] : undefined

  if (workspaceId !== demoWorkspace.id)
    return success(null) as TResponse

  if (resource === 'accounts') {
    if (method === 'GET' && resourceId) {
      const account = db.accounts.find((item) => item.id === resourceId)
      return success(account ?? null) as TResponse
    }
    if (method === 'GET') {
      const archived = url.searchParams.get('archived') === 'true'
      const favorite = url.searchParams.get('favorite') === 'true'
      const rows = db.accounts.filter(
        (item) =>
          (archived ? !item.isActive : item.isActive) &&
          (!favorite || item.isFavorite),
      )
      return success(rows) as TResponse
    }
    if (method === 'POST' && resourceId === undefined) {
      const opening = String(body.openingBalance ?? '0')
      const account: Account = {
        id: id('demo-account'),
        name: String(body.name ?? 'Nueva cuenta'),
        type: (body.type as Account['type']) ?? 'SAVINGS',
        nature: (body.nature as Account['nature']) ?? 'ASSET',
        institutionName: body.institutionName
          ? String(body.institutionName)
          : null,
        currency: String(body.currency ?? 'COP'),
        openingBalance: opening,
        currentBalance: opening,
        reservedForGoals: '0.00',
        availableBalance: opening,
        creditLimit: body.creditLimit ? String(body.creditLimit) : null,
        billingDay: body.billingDay ? Number(body.billingDay) : null,
        paymentDueDay: body.paymentDueDay
          ? Number(body.paymentDueDay)
          : null,
        color: null,
        icon: null,
        isFavorite: Boolean(body.isFavorite),
        isActive: true,
        includeInNetWorth: body.includeInNetWorth !== false,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      }
      db.accounts.push(account)
      saveDb(db)
      return success(account) as TResponse
    }
    const account = db.accounts.find((item) => item.id === resourceId)
    if (account) {
      if (method === 'PATCH') {
        if (parts.at(-1) === 'favorite')
          account.isFavorite = Boolean(body.isFavorite)
        else Object.assign(account, body, { updatedAt: nowIso() })
      }
      if (method === 'POST' && parts.at(-1) === 'archive')
        account.isActive = false
      if (method === 'POST' && parts.at(-1) === 'restore')
        account.isActive = true
      if (method === 'DELETE') account.isActive = false
      saveDb(db)
      return success(account) as TResponse
    }
  }

  if (resource === 'categories') {
    if (method === 'GET') {
      const includeArchived =
        url.searchParams.get('includeArchived') === 'true' ||
        url.searchParams.get('status') === 'ALL'
      const status = url.searchParams.get('status')
      return success(
        db.categories.filter(
          (item) =>
            (includeArchived ||
              (status === 'ARCHIVED' ? !item.isActive : item.isActive)) &&
            (status !== 'ARCHIVED' || !item.isActive),
        ),
      ) as TResponse
    }
    if (method === 'POST' && !resourceId) {
      const category: Category = {
        id: id('demo-category'),
        parentId: body.parentId ? String(body.parentId) : null,
        name: String(body.name ?? 'Nueva categoría'),
        type: (body.type as Category['type']) ?? 'EXPENSE',
        icon: body.icon ? String(body.icon) : null,
        color: body.color ? String(body.color) : null,
        scope: 'CUSTOM',
        isSystem: false,
        isActive: true,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      }
      db.categories.push(category)
      saveDb(db)
      return success(category) as TResponse
    }
    const category = db.categories.find((item) => item.id === resourceId)
    if (category) {
      if (method === 'PATCH')
        Object.assign(category, body, { updatedAt: nowIso() })
      if (method === 'DELETE') category.isActive = false
      if (method === 'POST' && parts.at(-1) === 'restore')
        category.isActive = true
      saveDb(db)
      return success(category) as TResponse
    }
  }

  if (resource === 'transactions') {
    if (method === 'GET' && resourceId) {
      return success(
        db.transactions.find((item) => item.id === resourceId) ?? null,
      ) as TResponse
    }
    if (method === 'GET') {
      let rows = [...db.transactions]
      const type = url.searchParams.get('type')
      const accountId = url.searchParams.get('accountId')
      const categoryId = url.searchParams.get('categoryId')
      const search = url.searchParams.get('search')?.toLocaleLowerCase('es')
      if (type) rows = rows.filter((item) => item.type === type)
      if (accountId)
        rows = rows.filter(
          (item) =>
            item.accountId === accountId ||
            item.destinationAccountId === accountId,
        )
      if (categoryId)
        rows = rows.filter((item) => item.categoryId === categoryId)
      if (search)
        rows = rows.filter((item) =>
          (item.description ?? '').toLocaleLowerCase('es').includes(search),
        )
      const page = Number(url.searchParams.get('page') ?? 1)
      const limit = Number(url.searchParams.get('limit') ?? 25)
      const start = (page - 1) * limit
      return success({
        items: rows.slice(start, start + limit),
        page,
        limit,
        total: rows.length,
        totalPages: Math.max(1, Math.ceil(rows.length / limit)),
        nextCursor: null,
      }) as TResponse
    }
    if (
      method === 'POST' &&
      ['income', 'expense', 'transfer'].includes(String(resourceId))
    ) {
      const type = String(resourceId).toUpperCase() as
        | 'INCOME'
        | 'EXPENSE'
        | 'TRANSFER'
      const transaction = createMovement(db, type, body)
      saveDb(db)
      return success(transaction) as TResponse
    }
    const transaction = db.transactions.find(
      (item) => item.id === resourceId,
    )
    if (transaction && method === 'PATCH') {
      Object.assign(transaction, body, {
        version: transaction.version + 1,
        updatedAt: nowIso(),
      })
      saveDb(db)
      return success(transaction) as TResponse
    }
    if (transaction && method === 'DELETE') {
      transaction.status = 'CANCELLED'
      transaction.version += 1
      updateAccountForTransaction(db, transaction, -1)
      recalculateBudgets(db)
      saveDb(db)
      return undefined as TResponse
    }
  }

  if (resource === 'dashboard' && method === 'GET')
    return success(dashboard(db, url.searchParams)) as TResponse

  if (resource === 'budgets') {
    recalculateBudgets(db)
    if (method === 'GET' && resourceId === 'cycle-range') {
      const start = dateOnly(monthDate(0, 1))
      const end = dateOnly(
        new Date(
          Date.UTC(
            today().getUTCFullYear(),
            today().getUTCMonth() + 1,
            0,
          ),
        ),
      )
      return success({
        startsOn: start,
        endsOn: end,
        financialCycleStartDay: 5,
      }) as TResponse
    }
    if (method === 'GET' && resourceId) {
      return success(
        db.budgets.find((item) => item.id === resourceId) ?? null,
      ) as TResponse
    }
    if (method === 'GET') {
      const active =
        url.searchParams.get('status') !== 'ARCHIVED' &&
        url.searchParams.get('includeArchived') !== 'true'
      const rows = db.budgets.filter(
        (item) => (active ? item.isActive : true),
      )
      return success(listWithPagination(rows, url.searchParams)) as TResponse
    }
    if (method === 'POST' && !resourceId) {
      const categoryIds = Array.isArray(body.categoryIds)
        ? body.categoryIds.map(String)
        : []
      const accountIds = Array.isArray(body.accountIds)
        ? body.accountIds.map(String)
        : []
      const budget: Budget = {
        id: id('demo-budget'),
        name: String(body.name ?? 'Nuevo presupuesto'),
        period: (body.period as Budget['period']) ?? 'MONTHLY',
        startsOn: String(body.startsOn ?? dateOnly(monthDate(0, 1))),
        endsOn: String(body.endsOn ?? dateOnly(today())),
        amount: String(body.amount ?? '0'),
        currency: String(body.currency ?? 'COP'),
        alertThreshold: String(body.alertThreshold ?? '80'),
        rolloverEnabled: Boolean(body.rolloverEnabled),
        isActive: true,
        categories: db.categories
          .filter((item) => categoryIds.includes(item.id))
          .map((item) => ({
            id: item.id,
            name: item.name,
            type: 'EXPENSE' as const,
            icon: item.icon,
            color: item.color,
            isSystem: item.isSystem,
            isActive: item.isActive,
          })),
        accounts: db.accounts
          .filter((item) => accountIds.includes(item.id))
          .map((item) => ({
            id: item.id,
            name: item.name,
            type: item.type,
            nature: item.nature,
            currency: item.currency,
            isActive: item.isActive,
          })),
        progress: {
          spent: '0.00',
          remaining: String(body.amount ?? '0'),
          percentage: '0.00',
          status: 'SAFE',
        },
        projection: {
          projectedSpend: '0.00',
          projectedRemaining: String(body.amount ?? '0'),
          projectedPercentage: '0.00',
          projectedStatus: 'SAFE',
        },
        movements: [],
        createdAt: nowIso(),
        updatedAt: nowIso(),
      }
      db.budgets.push(budget)
      recalculateBudgets(db)
      saveDb(db)
      return success(budget) as TResponse
    }
    const budget = db.budgets.find((item) => item.id === resourceId)
    if (budget) {
      if (method === 'PATCH') Object.assign(budget, body, { updatedAt: nowIso() })
      if (method === 'DELETE') budget.isActive = false
      if (method === 'POST' && parts.at(-1) === 'restore')
        budget.isActive = true
      recalculateBudgets(db)
      saveDb(db)
      return success(budget) as TResponse
    }
  }

  if (resource === 'goals') {
    if (method === 'GET' && resourceId) {
      const goal = db.goals.find((item) => item.id === resourceId)
      if (parts.at(-1) === 'projection')
        return success(goal?.progress ?? null) as TResponse
      return success(goal ?? null) as TResponse
    }
    if (method === 'GET') {
      let rows = [...db.goals]
      const status = url.searchParams.get('status')
      const search = url.searchParams.get('search')?.toLocaleLowerCase('es')
      const includeArchived =
        url.searchParams.get('includeArchived') === 'true'
      if (!includeArchived) rows = rows.filter((item) => !item.archivedAt)
      if (status) rows = rows.filter((item) => item.status === status)
      if (search)
        rows = rows.filter((item) =>
          item.name.toLocaleLowerCase('es').includes(search),
        )
      return success(listWithPagination(rows, url.searchParams)) as TResponse
    }
    if (method === 'POST' && !resourceId) {
      const account = db.accounts.find(
        (item) => item.id === String(body.accountId ?? ''),
      )
      const targetAmount = String(body.targetAmount ?? '0')
      const goal: Goal = {
        id: id('demo-goal'),
        name: String(body.name ?? 'Nueva meta'),
        targetAmount,
        savedAmount: '0.00',
        targetDate: body.targetDate ? String(body.targetDate) : null,
        status: 'ACTIVE',
        icon: body.icon ? String(body.icon) : null,
        color: body.color ? String(body.color) : '#154B45',
        account: account
          ? {
              id: account.id,
              name: account.name,
              type: account.type,
              nature: account.nature,
              currency: account.currency,
              isActive: account.isActive,
            }
          : null,
        progress: {
          savedAmount: '0.00',
          targetAmount,
          remainingAmount: targetAmount,
          surplusAmount: '0.00',
          percentage: '0.00',
          suggestedMonthlyAmount: money(numeric(targetAmount) / 6),
          averageMonthlyContribution: null,
          estimatedCompletionDate: null,
          estimationReason: 'INSUFFICIENT_HISTORY',
        },
        contributions: [],
        archivedAt: null,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      }
      db.goals.push(goal)
      saveDb(db)
      return success(goal) as TResponse
    }
    const goal = db.goals.find((item) => item.id === resourceId)
    if (goal) {
      if (method === 'PATCH') Object.assign(goal, body, { updatedAt: nowIso() })
      if (method === 'DELETE') {
        goal.archivedAt = nowIso()
        goal.status = 'CANCELLED'
      }
      if (method === 'POST' && parts.at(-1) === 'restore') {
        goal.archivedAt = null
        goal.status = 'ACTIVE'
      }
      if (method === 'POST' && parts.at(-1) === 'pause') goal.status = 'PAUSED'
      if (method === 'POST' && parts.at(-1) === 'resume') goal.status = 'ACTIVE'
      if (method === 'POST' && parts.at(-1) === 'complete')
        goal.status = 'COMPLETED'
      if (
        method === 'POST' &&
        parts[workspaceIndex + 4] === 'contributions' &&
        parts.length === workspaceIndex + 5
      ) {
        const amount = numeric(String(body.amount ?? '0'))
        goal.savedAmount = money(numeric(goal.savedAmount) + amount)
        const account = db.accounts.find(
          (item) => item.id === String(body.accountId ?? ''),
        )
        if (account) {
          account.reservedForGoals = money(
            numeric(account.reservedForGoals) + amount,
          )
          account.availableBalance = money(
            numeric(account.currentBalance) -
              numeric(account.reservedForGoals),
          )
        }
        goal.contributions.unshift({
          id: id('demo-contribution'),
          transactionId: null,
          accountId: account?.id ?? null,
          account: account
            ? {
                id: account.id,
                name: account.name,
                currency: account.currency,
              }
            : null,
          amount: money(amount),
          direction: 'IN',
          contributedAt: String(body.contributedAt ?? nowIso()),
          createdAt: nowIso(),
        })
      }
      goalProgress(goal)
      saveDb(db)
      return success(goal) as TResponse
    }
  }

  if (resource === 'reports' && method === 'GET') {
    const route = resourceId ?? ''
    return success(reports(db, route, url.searchParams)) as TResponse
  }

  if (resource === 'forecasts' && resourceId === 'month-end')
    return success(monthEndForecast(db)) as TResponse

  if (resource === 'financial-health') {
    const result = financialHealth()
    if (resourceId === 'history')
      return success(result.history) as TResponse
    return success(result) as TResponse
  }

  if (resource === 'upcoming-payments')
    return success(upcoming()) as TResponse

  if (resource === 'debts-summary')
    return success(liabilitySummary()) as TResponse

  if (resource === 'debts') {
    const rows = debts()
    if (method === 'GET' && resourceId)
      return success(rows.find((item) => item.id === resourceId) ?? null) as TResponse
    if (method === 'GET')
      return success({
        items: rows,
        page: 1,
        limit: 25,
        total: rows.length,
        totalPages: 1,
      }) as TResponse
  }

  if (resource === 'cards') {
    const rows = cards()
    if (method === 'GET' && resourceId) {
      if (parts.at(-1) === 'purchases' || parts.at(-1) === 'activity' || parts.at(-1) === 'statements')
        return success([]) as TResponse
      return success(rows.find((item) => item.id === resourceId) ?? null) as TResponse
    }
    if (method === 'GET') return success(rows) as TResponse
  }

  if (resource === 'obligations') {
    const rows = obligations()
    if (method === 'GET' && resourceId)
      return success(rows.find((item) => item.id === resourceId) ?? null) as TResponse
    if (method === 'GET') return success(rows) as TResponse
  }

  if (resource === 'lending') {
    if (resourceId === 'summary')
      return success({
        currencies: [
          {
            currency: 'COP',
            principalPending: '820000.00',
            interestPending: '46000.00',
            interestReceived: '46000.00',
            activeCount: 1,
          },
        ],
        upcoming: [],
      }) as TResponse
    if (resourceId === 'loans') {
      const rows = lendingLoans()
      const loanId = parts[workspaceIndex + 4]
      if (loanId)
        return success(rows.find((item) => item.id === loanId) ?? null) as TResponse
      return success(rows) as TResponse
    }
  }

  if (resource === 'personal-balances') {
    const rows = personalBalances()
    if (resourceId === 'summary')
      return success({
        currencies: [
          {
            currency: 'COP',
            iOwe: '85000.00',
            owedToMe: '365000.00',
            netPosition: '280000.00',
            iOweCount: 1,
            owedToMeCount: 2,
          },
        ],
      }) as TResponse
    if (resourceId === 'people') {
      return success(
        rows.map((item) => ({
          id: item.person.id,
          name: item.person.name,
          relationship: item.person.relationship,
          notes: null,
          isActive: true,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
        })),
      ) as TResponse
    }
    if (method === 'GET' && resourceId)
      return success(rows.find((item) => item.id === resourceId) ?? null) as TResponse
    if (method === 'GET') return success(rows) as TResponse
  }

  if (resource === 'notifications') {
    const visible = db.notifications.filter((item) => !item.dismissedAt)
    if (resourceId === 'summary')
      return success({
        unread: visible.filter((item) => !item.readAt).length,
      }) as TResponse
    if (method === 'GET')
      return success({
        items: visible,
        page: 1,
        limit: Number(url.searchParams.get('limit') ?? 25),
        total: visible.length,
        totalPages: 1,
        unread: visible.filter((item) => !item.readAt).length,
      }) as TResponse
    if (method === 'POST' && resourceId === 'refresh')
      return success({ evaluated: visible.length, created: 0 }) as TResponse
    if (method === 'POST' && resourceId === 'read-all') {
      const stamp = nowIso()
      visible.forEach((item) => {
        item.readAt = stamp
      })
      saveDb(db)
      return success({ updated: visible.length }) as TResponse
    }
    const notification = db.notifications.find(
      (item) => item.id === resourceId,
    )
    if (notification && method === 'POST') {
      const stamp = nowIso()
      if (parts.at(-1) === 'read') notification.readAt = stamp
      if (parts.at(-1) === 'dismiss') notification.dismissedAt = stamp
      saveDb(db)
      return success({
        id: notification.id,
        readAt: notification.readAt,
        dismissedAt: notification.dismissedAt,
      }) as TResponse
    }
  }

  return success(null) as TResponse
}
