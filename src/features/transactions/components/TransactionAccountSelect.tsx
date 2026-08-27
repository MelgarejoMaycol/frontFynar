import type { SelectHTMLAttributes } from 'react'
import { Select } from '@/components/ui'
import type { Account } from '@/features/accounts/types/account.types'
import { formatMoney } from '../transactions.format'

type Context = 'SOURCE' | 'DESTINATION' | 'ADVANCE_SOURCE'
export function TransactionAccountSelect({ accounts, context, ...props }: Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> & { accounts: Account[]; context: Context }) {
  const detail = (account: Account) => {
    if (context === 'ADVANCE_SOURCE') {
      const available = Math.max(0, Number(account.creditLimit ?? 0) - Number(account.currentBalance))
      return `Cupo disponible: ${formatMoney(available.toFixed(2), account.currency)}`
    }
    if (context === 'DESTINATION' && account.type === 'CREDIT_CARD')
      return `Deuda pendiente: ${formatMoney(account.currentBalance, account.currency)}`
    return `${context === 'SOURCE' ? 'Disponible' : 'Saldo actual'}: ${formatMoney(account.currentBalance, account.currency)}`
  }
  return <Select {...props}>
    <option value="">Selecciona una cuenta</option>
    {accounts.map((account) => <option key={account.id} value={account.id}>{account.name} · {detail(account)}</option>)}
  </Select>
}
