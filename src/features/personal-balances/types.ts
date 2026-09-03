export type PersonalBalanceDirection = 'PAYABLE' | 'RECEIVABLE'
export type PersonalBalanceStatus = 'OPEN' | 'PARTIAL' | 'SETTLED' | 'CANCELLED'

export type PersonalBalanceEntry = {
  id: string
  balanceId: string
  type: 'OPENING' | 'INCREASE' | 'PAYMENT' | 'ADJUSTMENT'
  amount: string
  resultingBalance: string
  occurredAt: string
  notes: string | null
  createdAt: string
  accountId: string | null
  accountName: string | null
  transactionId: string | null
  reversedAt: string | null
}

export type FinancialPerson = {
  id: string
  name: string
  relationship: string | null
  notes: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export type PersonalBalance = {
  id: string
  counterpartyName: string
  personId: string
  person: Pick<FinancialPerson, 'id' | 'name' | 'relationship'>
  direction: PersonalBalanceDirection
  originalAmount: string
  currentBalance: string
  currency: string
  description: string | null
  occurredOn: string
  dueOn: string | null
  status: PersonalBalanceStatus
  settledAt: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
  entries?: PersonalBalanceEntry[]
}

export type PersonalBalanceSummary = {
  currencies: Array<{
    currency: string
    iOwe: string
    owedToMe: string
    netPosition: string
    iOweCount: number
    owedToMeCount: number
  }>
}

export type CreatePersonalBalanceInput = {
  personId: string
  direction: PersonalBalanceDirection
  amount: string
  currency: string
  sourceAccountId?: string | null
  description?: string | null
  occurredOn?: string
  dueOn?: string | null
  notes?: string | null
}

export type UpdatePersonalBalanceInput = {
  personId?: string
  originalAmount?: string
  sourceAccountId?: string | null
  description?: string | null
  dueOn?: string | null
  notes?: string | null
}

export type PersonalBalanceEntryInput =
  | { type: 'INCREASE'; amount: string; notes?: string | null; occurredAt?: string }
  | { type: 'PAYMENT'; amount: string; accountId: string; notes?: string | null; occurredAt?: string }

export type PersonInput = { name: string; relationship?: string | null; notes?: string | null }
