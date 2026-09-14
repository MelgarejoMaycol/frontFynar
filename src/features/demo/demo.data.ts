export type DemoTransactionType = 'INCOME' | 'EXPENSE' | 'TRANSFER'

export type DemoTransaction = {
  id: string
  date: string
  description: string
  category: string
  account: string
  type: DemoTransactionType
  amount: number
}

export type DemoAccount = {
  id: string
  name: string
  institution: string
  kind: string
  balance: number
  available: number
  note: string
}

export type DemoBudget = {
  name: string
  spent: number
  limit: number
}

export type DemoGoal = {
  name: string
  saved: number
  target: number
  targetDate: string
}

export type DemoCommitment = {
  name: string
  kind: string
  amount: number
  dueDate: string
  status: 'PRÓXIMO' | 'PROGRAMADO' | 'AL DÍA'
}

export const demoSummary = {
  ownerName: 'Usuario Demo',
  currency: 'COP',
  totalMoney: 7415500,
  availableMoney: 5815500,
  reservedForGoals: 1600000,
  totalIncome: 5950000,
  totalExpenses: 3485300,
  netCashFlow: 2464700,
  netWorth: 5595500,
  scheduledPayments: 640000,
  healthScore: 82,
}

export const demoAccounts: DemoAccount[] = [
  {
    id: 'bancolombia',
    name: 'Bancolombia',
    institution: 'Bancolombia',
    kind: 'Cuenta de ahorros',
    balance: 3850000,
    available: 2950000,
    note: 'Cuenta principal',
  },
  {
    id: 'nequi',
    name: 'Nequi',
    institution: 'Nequi',
    kind: 'Billetera digital',
    balance: 1120500,
    available: 1120500,
    note: 'Gastos del día a día',
  },
  {
    id: 'daviplata',
    name: 'Daviplata',
    institution: 'Daviplata',
    kind: 'Billetera digital',
    balance: 685000,
    available: 585000,
    note: 'Servicios y transferencias',
  },
  {
    id: 'efectivo',
    name: 'Efectivo',
    institution: 'Personal',
    kind: 'Efectivo',
    balance: 310000,
    available: 310000,
    note: 'Caja personal',
  },
  {
    id: 'ahorro',
    name: 'Ahorro programado',
    institution: 'Bancolombia',
    kind: 'Ahorro',
    balance: 1450000,
    available: 850000,
    note: 'Incluye dinero reservado en metas',
  },
]

export const demoTransactions: DemoTransaction[] = [
  {
    id: 'tx-01',
    date: '2026-09-13',
    description: 'Mercado semanal',
    category: 'Alimentación',
    account: 'Nequi',
    type: 'EXPENSE',
    amount: 184900,
  },
  {
    id: 'tx-02',
    date: '2026-09-12',
    description: 'Pago freelance',
    category: 'Ingresos extra',
    account: 'Bancolombia',
    type: 'INCOME',
    amount: 850000,
  },
  {
    id: 'tx-03',
    date: '2026-09-12',
    description: 'Gasolina',
    category: 'Transporte',
    account: 'Daviplata',
    type: 'EXPENSE',
    amount: 92000,
  },
  {
    id: 'tx-04',
    date: '2026-09-11',
    description: 'Internet hogar',
    category: 'Servicios',
    account: 'Bancolombia',
    type: 'EXPENSE',
    amount: 118000,
  },
  {
    id: 'tx-05',
    date: '2026-09-10',
    description: 'Aporte meta fondo de emergencia',
    category: 'Metas',
    account: 'Bancolombia',
    type: 'TRANSFER',
    amount: 250000,
  },
  {
    id: 'tx-06',
    date: '2026-09-09',
    description: 'Almuerzo',
    category: 'Alimentación',
    account: 'Nequi',
    type: 'EXPENSE',
    amount: 38500,
  },
  {
    id: 'tx-07',
    date: '2026-09-08',
    description: 'Suscripción almacenamiento',
    category: 'Suscripciones',
    account: 'Daviplata',
    type: 'EXPENSE',
    amount: 39900,
  },
  {
    id: 'tx-08',
    date: '2026-09-07',
    description: 'Cobro préstamo a Carlos',
    category: 'Préstamos',
    account: 'Bancolombia',
    type: 'INCOME',
    amount: 180000,
  },
  {
    id: 'tx-09',
    date: '2026-09-06',
    description: 'Compra farmacia',
    category: 'Salud',
    account: 'Nequi',
    type: 'EXPENSE',
    amount: 67500,
  },
  {
    id: 'tx-10',
    date: '2026-09-05',
    description: 'Pago nómina',
    category: 'Salario',
    account: 'Bancolombia',
    type: 'INCOME',
    amount: 4100000,
  },
  {
    id: 'tx-11',
    date: '2026-09-04',
    description: 'Plataformas de streaming',
    category: 'Entretenimiento',
    account: 'Daviplata',
    type: 'EXPENSE',
    amount: 58900,
  },
  {
    id: 'tx-12',
    date: '2026-09-03',
    description: 'Transferencia a Nequi',
    category: 'Transferencia',
    account: 'Bancolombia',
    type: 'TRANSFER',
    amount: 300000,
  },
  {
    id: 'tx-13',
    date: '2026-09-03',
    description: 'Mercado hogar',
    category: 'Alimentación',
    account: 'Bancolombia',
    type: 'EXPENSE',
    amount: 312400,
  },
  {
    id: 'tx-14',
    date: '2026-09-02',
    description: 'Venta equipo usado',
    category: 'Ingresos extra',
    account: 'Nequi',
    type: 'INCOME',
    amount: 420000,
  },
  {
    id: 'tx-15',
    date: '2026-09-02',
    description: 'Taxi',
    category: 'Transporte',
    account: 'Nequi',
    type: 'EXPENSE',
    amount: 26800,
  },
  {
    id: 'tx-16',
    date: '2026-09-01',
    description: 'Arriendo',
    category: 'Hogar',
    account: 'Bancolombia',
    type: 'EXPENSE',
    amount: 1100000,
  },
  {
    id: 'tx-17',
    date: '2026-09-01',
    description: 'Rendimientos ahorro',
    category: 'Rendimientos',
    account: 'Ahorro programado',
    type: 'INCOME',
    amount: 400000,
  },
  {
    id: 'tx-18',
    date: '2026-08-31',
    description: 'Compra ropa',
    category: 'Compras personales',
    account: 'Bancolombia',
    type: 'EXPENSE',
    amount: 247000,
  },
]

export const demoBudgets: DemoBudget[] = [
  { name: 'Alimentación', spent: 720000, limit: 850000 },
  { name: 'Transporte', spent: 390000, limit: 500000 },
  { name: 'Entretenimiento', spent: 310000, limit: 350000 },
  { name: 'Hogar', spent: 560000, limit: 700000 },
  { name: 'Suscripciones', spent: 148000, limit: 180000 },
  { name: 'Salud', spent: 90000, limit: 250000 },
]

export const demoGoals: DemoGoal[] = [
  {
    name: 'Fondo de emergencia',
    saved: 4800000,
    target: 8000000,
    targetDate: 'Diciembre 2026',
  },
  {
    name: 'Viaje',
    saved: 2250000,
    target: 5000000,
    targetDate: 'Junio 2027',
  },
  {
    name: 'Portátil nuevo',
    saved: 2400000,
    target: 4500000,
    targetDate: 'Marzo 2027',
  },
]

export const demoCommitments: DemoCommitment[] = [
  {
    name: 'Tarjeta Visa',
    kind: 'Tarjeta de crédito',
    amount: 320000,
    dueDate: '15 sep',
    status: 'PRÓXIMO',
  },
  {
    name: 'Internet hogar',
    kind: 'Pago recurrente',
    amount: 118000,
    dueDate: '18 sep',
    status: 'PROGRAMADO',
  },
  {
    name: 'Crédito celular',
    kind: 'Crédito',
    amount: 142000,
    dueDate: '22 sep',
    status: 'PROGRAMADO',
  },
  {
    name: 'Plan móvil',
    kind: 'Pago recurrente',
    amount: 60000,
    dueDate: '25 sep',
    status: 'AL DÍA',
  },
]

export const demoInformalBalances = [
  {
    person: 'Camila',
    relation: 'Amiga',
    direction: 'Te debe',
    amount: 240000,
    due: 'Sin fecha límite',
  },
  {
    person: 'Andrés',
    relation: 'Hermano',
    direction: 'Tú debes',
    amount: 85000,
    due: '20 sep',
  },
  {
    person: 'Laura',
    relation: 'Compañera',
    direction: 'Te debe',
    amount: 125000,
    due: '30 sep',
  },
]

export const demoLoans = [
  {
    person: 'Carlos',
    principal: 1200000,
    pending: 820000,
    installment: 180000,
    nextPayment: '7 oct',
    rate: '1,5 % mensual',
  },
]

export const demoMonthlyFlow = [
  { month: 'Abr', income: 5100000, expenses: 3680000 },
  { month: 'May', income: 5250000, expenses: 3410000 },
  { month: 'Jun', income: 4930000, expenses: 3790000 },
  { month: 'Jul', income: 5580000, expenses: 3550000 },
  { month: 'Ago', income: 5360000, expenses: 3620000 },
  { month: 'Sep', income: 5950000, expenses: 3485300 },
]

export const demoExpenseCategories = [
  { name: 'Hogar', amount: 1100000 },
  { name: 'Alimentación', amount: 720000 },
  { name: 'Transporte', amount: 390000 },
  { name: 'Entretenimiento', amount: 310000 },
  { name: 'Compras personales', amount: 247000 },
  { name: 'Servicios', amount: 218300 },
  { name: 'Suscripciones', amount: 148000 },
  { name: 'Salud', amount: 90000 },
]
