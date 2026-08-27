import type { SelectHTMLAttributes } from 'react'
import { Select } from '@/components/ui'
import { accountOptionLabel } from '../accounts.format'
import type { Account } from '../types/account.types'

export function AccountSelect({
  accounts,
  placeholder = 'Selecciona una cuenta',
  ...props
}: Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> & {
  accounts: Account[]
  placeholder?: string
}) {
  return (
    <Select {...props}>
      <option value="">{placeholder}</option>
      {accounts.map((account) => (
        <option key={account.id} value={account.id}>
          {accountOptionLabel(account)}
        </option>
      ))}
    </Select>
  )
}
