export type DebtStatus =
  'ACTIVE' | 'PAID' | 'PAUSED' | 'DEFAULTED' | 'CANCELLED'
export type InstallmentStatus =
  'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE' | 'CANCELLED'
export type DebtType =
  | 'PERSONAL_LOAN'
  | 'BANK_LOAN'
  | 'CREDIT_CARD'
  | 'MORTGAGE'
  | 'VEHICLE_LOAN'
  | 'EDUCATION_LOAN'
  | 'PURCHASE_FINANCING'
  | 'INFORMAL_LOAN'
  | 'OTHER'
export type RateBasis =
  | 'EFFECTIVE_MONTHLY'
  | 'EFFECTIVE_ANNUAL'
  | 'NOMINAL_ANNUAL'
  | 'NOMINAL_MONTHLY'
export interface DebtInstallment {
  id: string
  debtId: string
  installmentNumber: number
  dueDate: string
  openingBalance: string
  principalAmount: string
  interestAmount: string
  insuranceAmount: string
  feeAmount: string
  totalAmount: string
  paidAmount: string
  closingBalance: string
  status: InstallmentStatus
}
export interface Debt {
  id: string
  name: string
  lenderName: string | null
  type: DebtType
  status: DebtStatus
  currency: string
  originalAmount: string
  currentBalance: string
  interestRate: string | null
  interestRateBasis: RateBasis
  interestType: 'FIXED' | 'VARIABLE' | 'NONE'
  termMonths: number | null
  installmentAmount: string | null
  disbursementDate: string | null
  firstPaymentDate: string | null
  estimatedEndDate: string | null
  nextDueDate: string | null
  paymentDay: number | null
  liabilityAccountId: string | null
  notes: string | null
  metadata?: unknown
  debtInstallments?: DebtInstallment[]
  createdAt: string
  updatedAt: string
}
export interface DebtList {
  items: Debt[]
  page: number
  limit: number
  total: number
  totalPages: number
}
export interface DebtInput {
  name: string
  lenderName?: string | null
  type: DebtType
  currency: string
  originalAmount: string
  currentBalance?: string
  interestRate?: string
  interestRateBasis?: RateBasis
  interestType?: 'FIXED' | 'VARIABLE' | 'NONE'
  termMonths?: number | null
  installmentAmount?: string | null
  disbursementDate?: string | null
  firstPaymentDate?: string | null
  paymentDay?: number | null
  liabilityAccountId?: string | null
  notes?: string | null
}
export type EstimationSource =
  'PROVIDED' | 'CALCULATED' | 'ESTIMATED' | 'UNKNOWN'
export type EstimationQuality =
  | 'EXACT'
  | 'HIGH_ESTIMATE'
  | 'MEDIUM_ESTIMATE'
  | 'LOW_ESTIMATE'
  | 'INSUFFICIENT_DATA'
export interface EstimatedValue<T> {
  value: T | null
  source: EstimationSource
  quality: EstimationQuality
  derivedFrom: string[]
}
export interface CreditEstimation {
  originalPrincipal: EstimatedValue<string>
  currentBalance: EstimatedValue<string>
  paymentAmount: EstimatedValue<string>
  periodicRate: EstimatedValue<string>
  totalInstallments: EstimatedValue<number>
  installmentsPaid: EstimatedValue<number>
  remainingInstallments: EstimatedValue<number>
  estimatedEndDate: EstimatedValue<string>
  issues: string[]
  assumptions: string[]
  overallQuality: EstimationQuality
}
export interface PrepaymentSimulation {
  balanceBefore: string
  balanceAfter: string
  installmentsBefore: number
  installmentsAfter: number
  paymentBefore: string
  paymentAfter: string
  remainingInterestBefore: string | null
  remainingInterestAfter: string | null
}
export interface Occurrence {
  id: string
  obligationId: string
  dueDate: string
  amount: string
  paidAmount: string
  status: InstallmentStatus
  paidAt: string | null
}
export interface RecurrenceRule {
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'
  intervalValue: number
  dayOfWeek: number | null
  dayOfMonth: number | null
  startsOn: string
  endsOn: string | null
  nextRunAt: string | null
}
export interface Obligation {
  id: string
  name: string
  description: string | null
  expectedAmount: string
  currency: string
  amountType: 'FIXED' | 'VARIABLE'
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED'
  paymentAccountId: string | null
  categoryId: string | null
  remindersEnabled: boolean
  recurrenceRules: RecurrenceRule
  occurrences: Occurrence[]
}
export interface ObligationInput {
  name: string
  description?: string | null
  expectedAmount: string
  currency: string
  amountType: 'FIXED' | 'VARIABLE'
  paymentAccountId?: string | null
  categoryId?: string | null
  remindersEnabled?: boolean
  frequency: RecurrenceRule['frequency']
  intervalValue?: number
  dayOfWeek?: number | null
  dayOfMonth?: number | null
  startsOn: string
  endsOn?: string | null
}
export interface Card {
  id: string
  name: string
  currency: string
  currentBalance: string
  creditLimit: string | null
  billingDay: number | null
  paymentDueDay: number | null
  usedCredit: string
  availableCredit: string
  utilization: string
}
export interface Statement {
  id: string
  cardAccountId: string
  periodStart: string
  periodEnd: string
  dueDate: string
  previousBalance: string
  purchasesAmount: string
  paymentsAmount: string
  interestAmount: string
  feeAmount: string
  calculatedBalance: string
  reportedBalance: string | null
  minimumPayment: string
  paidAmount: string
  status: 'OPEN' | 'PARTIAL' | 'PAID' | 'CLOSED'
}
export interface CardPurchase {
  id: string
  installmentCount: number
  periodicRate: string
  outstandingBalance: string
  transaction: { description: string; amount: string; occurredAt: string }
  installments: Array<{
    id: string
    installmentNumber: number
    dueDate: string
    principalAmount: string
    interestAmount: string
    totalAmount: string
    status: InstallmentStatus
  }>
}
export interface Upcoming {
  type: 'DEBT_INSTALLMENT' | 'OBLIGATION' | 'CARD_STATEMENT'
  id: string
  resourceId: string
  name: string
  date: string
  amount: string
  currency: string
  status: string
  daysRemaining: number
}
export interface LiabilitiesSummary {
  totalDebt: string
  monthlyCommitments: string
  nextPayment: Upcoming | null
  overdueAmount: string
  principalPaid: string
  interestPaid: string
  activeDebts: number
  activeObligations: number
  cards: {
    creditLimit: string
    used: string
    available: string
    utilization: string
  }
  summariesByCurrency: Array<{
    currency: string
    totalDebt: string
    monthlyCommitments: string
    overdueAmount: string
  }>
  upcoming: Upcoming[]
}
