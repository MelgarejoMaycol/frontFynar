export type LendingMethod = 'FIXED_PAYMENT' | 'FIXED_PRINCIPAL' | 'INTEREST_ONLY'
export type LendingFrequency = 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY'
export type LendingStatus = 'ACTIVE' | 'PAID' | 'OVERDUE' | 'CANCELLED'
export type InstallmentStatus = 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE' | 'CANCELLED'

export interface SimulationInput {
  principal: string
  ratePercent: number
  termCount: number
  method: LendingMethod
  frequency: LendingFrequency
  firstPaymentDate?: string
}
export interface SimulationRow {
  installmentNumber: number
  dueDate: string | null
  openingPrincipal: number
  principalAmount: number
  interestAmount: number
  totalAmount: number
  closingPrincipal: number
}
export interface SimulationResult {
  installmentAmount: number
  totalPrincipal: number
  totalInterest: number
  totalReceivable: number
  schedule: SimulationRow[]
}
export interface CreateLoanInput extends SimulationInput {
  borrowerName: string
  borrowerPhone?: string | null
  borrowerDocument?: string | null
  currency: string
  sourceAccountId?: string | null
  disbursementDate: string
  firstPaymentDate: string
  notes?: string | null
}
export interface LoanListItem {
  id: string
  borrowerName: string
  currency: string
  originalPrincipal: string
  currentPrincipal: string
  ratePercent: string
  method: LendingMethod
  frequency: LendingFrequency
  termCount: number
  installmentAmount: string
  expectedInterest: string
  expectedTotal: string
  interestReceived: string
  principalReceived: string
  nextDueDate: string | null
  estimatedEndDate: string
  status: LendingStatus
}
export interface LoanInstallment {
  id: string
  installmentNumber: number
  dueDate: string
  openingPrincipal: string
  principalAmount: string
  interestAmount: string
  totalAmount: string
  principalPaid: string
  interestPaid: string
  totalPaid: string
  closingPrincipal: string
  status: InstallmentStatus
}
export interface LoanDetail extends Record<string, unknown> {
  id: string
  borrower_name: string
  currency: string
  original_principal: string
  current_principal: string
  rate_percent: string
  installment_amount: string
  expected_interest: string
  expected_total: string
  interest_received: string
  principal_received: string
  status: LendingStatus
  receivableAccountName: string
  sourceAccountName: string | null
  installments: LoanInstallment[]
  payments: Array<Record<string, unknown>>
}
export interface LendingSummary {
  currencies: Array<{
    currency: string
    principalPending: string
    interestPending: string
    interestReceived: string
    activeCount: number
  }>
  upcoming: Array<{
    loanId: string
    borrowerName: string
    installmentId: string
    dueDate: string
    amount: string
    currency: string
  }>
}
export interface LoanPaymentInput {
  receivingAccountId: string
  amount: string
  occurredAt?: string
  notes?: string | null
  idempotencyKey: string
}
