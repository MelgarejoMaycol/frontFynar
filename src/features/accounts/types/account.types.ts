export const accountTypes = [
  'CASH',
  'CHECKING',
  'SAVINGS',
  'E_WALLET',
  'CREDIT_CARD',
  'INVESTMENT',
  'LOAN',
  'OTHER',
] as const
export const accountNatures = ['ASSET', 'LIABILITY'] as const
export type AccountType = (typeof accountTypes)[number]
export type AccountNature = (typeof accountNatures)[number]

export interface Account {
  id: string
  name: string
  type: AccountType
  nature: AccountNature
  institutionName: string | null
  currency: string
  openingBalance: string
  currentBalance: string
  creditLimit: string | null
  billingDay: number | null
  paymentDueDay: number | null
  color: string | null
  icon: string | null
  isFavorite: boolean
  isActive: boolean
  includeInNetWorth: boolean
  createdAt: string
  updatedAt: string
}

export interface AccountInput {
  name: string
  type: AccountType
  nature: AccountNature
  institutionName?: string | null
  currency: string
  openingBalance: string
  creditLimit?: string | null
  billingDay?: number | null
  paymentDueDay?: number | null
  includeInNetWorth?: boolean
  isFavorite?: boolean
}
export type UpdateAccountInput = Partial<AccountInput>
