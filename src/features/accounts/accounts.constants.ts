import type { AccountNature, AccountType } from './types/account.types'

export const accountTypeLabels: Record<AccountType, string> = {
  CASH: 'Efectivo',
  CHECKING: 'Cuenta corriente',
  SAVINGS: 'Cuenta de ahorros',
  E_WALLET: 'Billetera digital',
  CREDIT_CARD: 'Tarjeta de crédito',
  INVESTMENT: 'Inversión',
  LOAN: 'Préstamo',
  OTHER: 'Otra',
}
export const accountNatureLabels: Record<AccountNature, string> = {
  ASSET: 'Activo',
  LIABILITY: 'Pasivo',
}
