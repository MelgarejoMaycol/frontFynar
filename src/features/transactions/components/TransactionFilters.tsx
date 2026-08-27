import { useState, type FormEvent } from 'react'
import { Button, Input, Select } from '@/components/ui'
import type { Account } from '@/features/accounts/types/account.types'
import type { Category } from '@/features/categories/types/category.types'
import {
  isoToWorkspaceDateTimeValue,
  workspaceDateEndToIso,
  workspaceDateStartToIso,
} from '../transactions.format'
import type { TransactionFilters as Filters } from '../types/transaction.types'
import styles from './transactions.module.css'
export function TransactionFilters({
  value,
  accounts,
  categories,
  timezone,
  onChange,
}: {
  value: Filters
  accounts: Account[]
  categories: Category[]
  timezone: string
  onChange: (filters: Filters) => void
}) {
  const [search, setSearch] = useState(value.search ?? '')
  const patch = (next: Partial<Filters>) =>
    onChange({ ...value, ...next, page: undefined, cursor: undefined })
  const submit = (event: FormEvent) => {
    event.preventDefault()
    patch({ search: search.trim() || undefined })
  }
  return (
    <form
      className={styles.filters}
      onSubmit={submit}
      aria-label="Filtros de movimientos"
    >
      <label>
        Buscar
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Descripción, notas o comercio"
        />
      </label>
      <label>
        Tipo
        <Select
          value={value.type ?? ''}
          onChange={(event) =>
            patch({
              type: (event.target.value || undefined) as Filters['type'],
              categoryId: undefined,
            })
          }
        >
          <option value="">Todos</option>
          <option value="INCOME">Ingresos</option>
          <option value="EXPENSE">Gastos</option>
          <option value="TRANSFER">Transferencias</option>
        </Select>
      </label>
      <label>
        Cuenta
        <Select
          value={value.accountId ?? ''}
          onChange={(event) =>
            patch({ accountId: event.target.value || undefined })
          }
        >
          <option value="">Todas</option>
          {accounts
            .filter((x) => x.isActive)
            .map((x) => (
              <option key={x.id} value={x.id}>
                {x.name}
              </option>
            ))}
        </Select>
      </label>
      <label>
        Categoría
        <Select
          value={value.categoryId ?? ''}
          onChange={(event) =>
            patch({ categoryId: event.target.value || undefined })
          }
        >
          <option value="">Todas</option>
          {categories
            .filter((x) => x.isActive && (!value.type || x.type === value.type))
            .map((x) => (
              <option key={x.id} value={x.id}>
                {x.name}
              </option>
            ))}
        </Select>
      </label>
      <label>
        Desde
        <Input
          type="date"
          value={
            value.dateFrom
              ? isoToWorkspaceDateTimeValue(value.dateFrom, timezone).slice(
                  0,
                  10,
                )
              : ''
          }
          onChange={(event) =>
            patch({
              dateFrom: event.target.value
                ? workspaceDateStartToIso(event.target.value, timezone)
                : undefined,
            })
          }
        />
      </label>
      <label>
        Hasta
        <Input
          type="date"
          value={
            value.dateTo
              ? isoToWorkspaceDateTimeValue(value.dateTo, timezone).slice(0, 10)
              : ''
          }
          onChange={(event) =>
            patch({
              dateTo: event.target.value
                ? workspaceDateEndToIso(event.target.value, timezone)
                : undefined,
            })
          }
        />
      </label>
      <div className={styles.filterActions}>
        <Button type="submit">Buscar</Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            setSearch('')
            onChange({ limit: value.limit })
          }}
        >
          Limpiar filtros
        </Button>
      </div>
    </form>
  )
}
