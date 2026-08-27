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
export type DebtPaymentFrequency =
  | 'WEEKLY'
  | 'MONTHLY'
  | 'BIMONTHLY'
  | 'SEMIANNUAL'
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
export interface DebtPayment {
  id: string
  installmentId: string | null
  installmentNumber: number | null
  paidAt: string
  totalAmount: string
  principalAmount: string
  interestAmount: string
  insuranceAmount: string
  feeAmount: string
  extraPaymentAmount: string
  reversedAt: string | null
  account: { id: string; name: string } | null
}
export interface DebtPaymentInput {
  accountId?: string
  amount: string
  paidAt: string
  idempotencyKey: string
  strategy?: 'REDUCE_TERM' | 'REDUCE_PAYMENT'
}
export interface DebtPaymentResult {
  id: string
  idempotent: boolean
}
export interface Debt {
  id: string
  name: string
  institutionName: string | null
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
  installmentCount: number | null
  paymentFrequency: DebtPaymentFrequency
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
  debtPayments?: DebtPayment[]
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
  installmentCount?: number | null
  paymentFrequency?: DebtPaymentFrequency
  installmentAmount?: string | null
  disbursementDate?: string | null
  firstPaymentDate?: string | null
  paymentDay?: number | null
  liabilityAccountId?: string | null
  notes?: string | null
}
export interface DebtEstimateInput {
  originalPrincipal?: string
  currentBalance?: string
  paymentAmount?: string
  interestRate?: string
  interestRateBasis?: RateBasis
  remainingInstallments?: number
  paymentFrequency?: DebtPaymentFrequency
  firstPaymentDate?: string
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
  institutionName: string | null
  currency: string
  currentBalance: string
  creditLimit: string | null
  billingDay: number | null
  paymentDueDay: number | null
  usedCredit: string
  availableCredit: string
  utilization: string
  nextBillingDate: string | null
  nextPaymentDate: string | null
  nextPayment: {
    amount: string
    originalAmount: string
    paidAmount: string
    minimumPayment: string | null
    source: 'INFORMED' | 'ESTIMATED'
    statementId: string | null
    expectationId: string | null
    reportedTotalBalance: string | null
  } | null
  referencePeriodicRate: string | null
  referenceRateSource: 'INFORMED' | 'ESTIMATED' | null
}
export interface CardActivity {
  id: string
  type: 'PURCHASE' | 'CASH_ADVANCE' | 'PAYMENT' | 'OTHER'
  description: string
  amount: string
  feeAmount: string | null
  occurredAt: string
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
export interface CardPaymentInput {
  sourceAccountId: string
  amount: string
  occurredAt: string
  idempotencyKey: string
  applyToNextPayment?: boolean
}
export interface CardPaymentAllocation {
  totalAmount: string
  appliedToCurrentDue: string
  extraPayment: string
  remainingDue: string
  previousCardBalance: string
  newCardBalance: string
  statementId: string | null
  expectationId: string | null
}
export interface CardPaymentResult extends CardPaymentAllocation {
  transactionId: string
  idempotent: boolean
  nextPayment: {
    amount: string
    dueDate: string
    source: 'INFORMED'
  } | null
}
export interface CardCashAdvanceInput {
  destinationAccountId: string
  amount: string
  feeAmount: string
  occurredAt: string
  periodicRate?: string
  installmentCount?: number
  notes?: string
  idempotencyKey: string
}
export interface CardCashAdvanceResult {
  id: string
  transactionId: string
  idempotent: boolean
}
export interface CardPurchase {
  id: string
  installmentCount: number
  periodicRate: string
  outstandingBalance: string
  trackingStatus: 'ESTIMATED'
  transaction: { description: string; amount: string; occurredAt: string }
  installments: Array<{
    id: string
    installmentNumber: number
    dueDate: string
    principalAmount: string
    interestAmount: string
    totalAmount: string
    status: InstallmentStatus
    trackingStatus: 'ESTIMATED'
  }>
}
export interface Upcoming {
  type:
    | 'DEBT_INSTALLMENT'
    | 'OBLIGATION'
    | 'CARD_STATEMENT'
    | 'CARD_ESTIMATE'
  id: string
  resourceId: string
  name: string
  date: string
  amount: string
  currency: string
  status: string
  daysRemaining: number
  source: 'INFORMED' | 'ESTIMATED' | 'SCHEDULED'
  amountLabel: string
}
export interface LiabilitiesSummary {
  totalDebt: string | null
  monthlyCommitments: string | null
  nextPayment: Upcoming | null
  overdueAmount: string | null
  principalPaid: string | null
  interestPaid: string | null
  activeDebts: number
  activeObligations: number
  cards: {
    creditLimit: string | null
    used: string | null
    available: string | null
    utilization: string | null
  }
  cardsByCurrency: Array<{
    currency: string
    creditLimit: string
    used: string
    available: string
    utilization: string
  }>
  summariesByCurrency: Array<{
    currency: string
    creditDebt: string
    cardDebt: string
    totalDebt: string
    monthlyCommitments: string
    overdueAmount: string
    principalPaid: string
    interestPaid: string
  }>
  upcoming: Upcoming[]
}
