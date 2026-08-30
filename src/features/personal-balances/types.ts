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
}

export type PersonalBalance = {
  id: string
  counterpartyName: string
  direction: PersonalBalanceDirection
  originalAmount: string
  currentBalance: string
  currency: string
  description: string | null
  occurredOn: string
  dueOn: string | null
  status: PersonalBalanceStatus
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
  counterpartyName: string
  direction: PersonalBalanceDirection
  amount: string
  currency: string
  description?: string | null
  occurredOn?: string
  dueOn?: string | null
  notes?: string | null
}

export type UpdatePersonalBalanceInput = {
  counterpartyName?: string
  description?: string | null
  dueOn?: string | null
  notes?: string | null
}

export type PersonalBalanceEntryInput = {
  type: 'INCREASE' | 'PAYMENT'
  amount: string
  notes?: string | null
  occurredAt?: string
}
