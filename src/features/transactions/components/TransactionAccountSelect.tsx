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
    if (context === 'SOURCE' && account.type === 'CREDIT_CARD') {
      const available = Math.max(
        0,
        Number(account.creditLimit ?? 0) - Number(account.currentBalance),
      )
      return `Disponible: ${formatMoney(available.toFixed(2), account.currency)} · Deuda actual: ${formatMoney(account.currentBalance, account.currency)}`
    }
    if (context === 'SOURCE' && account.nature === 'ASSET') {
      const available = account.availableBalance ?? account.currentBalance
      const reserved = account.reservedForGoals ?? '0.00'
      return Number(reserved) > 0
        ? `Disponible: ${formatMoney(available, account.currency)} · En metas: ${formatMoney(reserved, account.currency)} · Saldo: ${formatMoney(account.currentBalance, account.currency)}`
        : `Disponible: ${formatMoney(available, account.currency)}`
    }
    return `Saldo actual: ${formatMoney(account.currentBalance, account.currency)}`
  }
  return <Select {...props}>
    <option value="">Selecciona una cuenta</option>
    {accounts.map((account) => <option key={account.id} value={account.id}>{account.name} · {detail(account)}</option>)}
  </Select>
}
