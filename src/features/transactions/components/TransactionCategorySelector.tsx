import { createElement, useId, useState } from 'react'
import { Button } from '@/components/ui'
import {
  categoryContrastColor,
  getCategoryIcon,
  safeCategoryColor,
} from '@/features/categories/categories.constants'
import { useCategories } from '@/features/categories/hooks/categories.hooks'
import type { CategoryType } from '@/features/categories/types/category.types'
import styles from './transactions.module.css'

export function TransactionCategorySelector({
  workspaceId,
  type,
  value,
  onChange,
  disabled,
  error,
}: {
  workspaceId: string
  type: CategoryType
  value: string
  onChange: (id: string) => void
  disabled?: boolean
  error?: string
}) {
  const id = useId(),
    [open, setOpen] = useState(false)
  const query = useCategories(workspaceId)
  const items = (query.data ?? []).filter(
    (item) => item.type === type && item.isActive,
  )
  const selected = items.find((item) => item.id === value)
  return (
    <div
      className={styles.categorySelector}
      onKeyDown={(event) => {
        if (event.key === 'Escape') setOpen(false)
      }}
    >
      <label id={`${id}-label`}>Categoría</label>
      <Button
        type="button"
        variant="secondary"
        aria-labelledby={`${id}-label`}
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled || query.isPending || items.length === 0}
        onClick={() => setOpen((value) => !value)}
      >
        {selected ? selected.name : 'Selecciona una categoría'}
      </Button>
      {open && (
        <div
          role="listbox"
          aria-labelledby={`${id}-label`}
          className={styles.categoryOptions}
        >
          {items.map((item) => {
            const Icon = getCategoryIcon(item.icon)
            return (
              <button
                key={item.id}
                type="button"
                role="option"
                aria-selected={item.id === value}
                onClick={() => {
                  onChange(item.id)
                  setOpen(false)
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    background: safeCategoryColor(item.color),
                    color: categoryContrastColor(item.color),
                  }}
                >
                  {createElement(Icon, { size: 16 })}
                </span>
                {item.name}
              </button>
            )
          })}
        </div>
      )}
      {!query.isPending && items.length === 0 && (
        <p role="status">
          No tienes categorías activas para este tipo de movimiento.{' '}
          <a href="/app/categories">Crear o activar una categoría</a>.
        </p>
      )}
      {error && <span role="alert">{error}</span>}
    </div>
  )
}
