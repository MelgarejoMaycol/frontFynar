import { createElement, useEffect, useId, useMemo } from 'react'
import { Select } from '@/components/ui'
import {
  categoryContrastColor,
  getCategoryIcon,
  safeCategoryColor,
} from '../categories.constants'
import { useCategories } from '../hooks/categories.hooks'
import type { CategoryType } from '../types/category.types'
import styles from './categories.module.css'
export function CategorySelector({
  workspaceId,
  type,
  value,
  onChange,
  disabled,
  label = 'Categoría',
  allowEmpty = false,
  error,
}: {
  workspaceId: string
  type: CategoryType
  value: string
  onChange: (id: string) => void
  disabled?: boolean
  label?: string
  allowEmpty?: boolean
  error?: string
}) {
  const selectId = useId()
  const q = useCategories(workspaceId)
  const items = useMemo(
    () => (q.data ?? []).filter((x) => x.type === type && x.isActive),
    [q.data, type],
  )
  const selected = items.find((item) => item.id === value)
  useEffect(() => {
    if (value && !selected && !q.isPending) onChange('')
  }, [onChange, q.isPending, selected, value])
  const SelectedIcon = getCategoryIcon(selected?.icon ?? null)
  return (
    <div>
      <label htmlFor={selectId}>{label}</label>
      <Select
        id={selectId}
        aria-invalid={Boolean(error)}
        value={selected?.id ?? ''}
        disabled={disabled || q.isPending || q.isError}
        onChange={(e) => onChange(e.target.value)}
      >
        {(allowEmpty || !selected) && (
          <option value="">
            {allowEmpty ? 'Sin categoría' : 'Selecciona una categoría'}
          </option>
        )}
        {items.map((x) => (
          <option key={x.id} value={x.id}>
            {x.name} · {x.scope === 'SYSTEM' ? 'Sistema' : 'Personalizada'}
          </option>
        ))}
      </Select>
      {q.isPending && <span role="status">Cargando categorías…</span>}
      {q.isError && <span role="alert">No pudimos cargar las categorías.</span>}
      {selected && (
        <span className={styles.selectedPreview}>
          <span
            className={styles.selectedIcon}
            aria-hidden="true"
            style={
              {
                '--category-color': safeCategoryColor(selected.color),
                '--category-contrast': categoryContrastColor(selected.color),
              } as React.CSSProperties
            }
          >
            {createElement(SelectedIcon, { size: 16 })}
          </span>
          {selected.name}
        </span>
      )}
      {error && <span role="alert">{error}</span>}
    </div>
  )
}
