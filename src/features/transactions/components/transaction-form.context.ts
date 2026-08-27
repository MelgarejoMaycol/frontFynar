import type { Account } from '@/features/accounts/types/account.types'
import type { TransactionFormValues } from '../schemas/transaction.schemas'

export type TransactionFormContext =
  | 'NORMAL_INCOME'
  | 'NORMAL_EXPENSE'
  | 'NORMAL_TRANSFER'
  | 'CARD_PAYMENT'
  | 'CARD_PURCHASE'
  | 'CARD_ADVANCE'
  | 'DEBT_INSTALLMENT_PAYMENT'
  | 'DEBT_EXTRA_PAYMENT'

export function getTransactionFormContext({
  type,
  source,
  destination,
  hasDebt,
  debtOperation,
}: {
  type: TransactionFormValues['type']
  source?: Account
  destination?: Account
  hasDebt: boolean
  debtOperation?: TransactionFormValues['debtOperation']
}): TransactionFormContext {
  if (hasDebt)
    return debtOperation === 'EXTRA_PAYMENT'
      ? 'DEBT_EXTRA_PAYMENT'
      : 'DEBT_INSTALLMENT_PAYMENT'
  if (type === 'ADVANCE') return 'CARD_ADVANCE'
  if (
    (type === 'INCOME' && source?.type === 'CREDIT_CARD') ||
    (type === 'TRANSFER' && destination?.type === 'CREDIT_CARD')
  )
    return 'CARD_PAYMENT'
  if (type === 'EXPENSE' && source?.type === 'CREDIT_CARD')
    return 'CARD_PURCHASE'
  if (type === 'INCOME') return 'NORMAL_INCOME'
  if (type === 'EXPENSE') return 'NORMAL_EXPENSE'
  return 'NORMAL_TRANSFER'
}

export const formContextPresentation = (context: TransactionFormContext) => {
  switch (context) {
    case 'NORMAL_INCOME':
      return {
        description: 'Ej. Pago de nómina de agosto',
        counterparty: {
          label: 'Origen del ingreso',
          placeholder: 'Ej. Empresa ABC',
        },
      }
    case 'NORMAL_EXPENSE':
    case 'CARD_PURCHASE':
      return {
        description: 'Ej. Almuerzo',
        counterparty: {
          label: 'Comercio o establecimiento',
          placeholder: 'Ej. Éxito',
        },
      }
    case 'NORMAL_TRANSFER':
      return { description: 'Ej. Transferencia a Nequi', counterparty: null }
    case 'DEBT_INSTALLMENT_PAYMENT':
      return {
        description: 'Ej. Pago de cuota de septiembre',
        counterparty: null,
      }
    case 'DEBT_EXTRA_PAYMENT':
      return { description: 'Ej. Abono extraordinario', counterparty: null }
    case 'CARD_PAYMENT':
      return { description: 'Ej. Pago de tarjeta', counterparty: null }
    case 'CARD_ADVANCE':
      return { description: 'Ej. Adelanto a cuenta propia', counterparty: null }
  }
}

export const contextNeedsCategory = (context: TransactionFormContext) =>
  context === 'NORMAL_INCOME' ||
  context === 'NORMAL_EXPENSE' ||
  context === 'CARD_PURCHASE'
