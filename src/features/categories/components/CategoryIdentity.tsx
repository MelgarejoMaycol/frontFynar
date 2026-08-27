import { createElement, type ReactNode } from 'react'
import {
  categoryContrastColor,
  categoryTypeLabels,
  getCategoryIcon,
  safeCategoryColor,
} from '../categories.constants'
import type { CategoryType } from '../types/category.types'
import styles from './categories.module.css'

export function CategoryIdentity({ name, type, icon, color, details }: {
  name: string
  type: CategoryType
  icon: string | null
  color: string | null
  details?: ReactNode
}) {
  const Icon = getCategoryIcon(icon)
  return (
    <div className={styles.cardMain}>
      <div
        className={styles.icon}
        data-testid="category-identity-icon"
        data-category-color={safeCategoryColor(color)}
        data-category-icon={icon ?? 'default'}
        style={{
          '--category-color': safeCategoryColor(color),
          '--category-contrast': categoryContrastColor(color),
        } as React.CSSProperties}
      >
        {createElement(Icon, { 'aria-hidden': true })}
      </div>
      <div className={styles.cardCopy}>
        <h2>{name}</h2>
        <p>{categoryTypeLabels[type]}</p>
        {details}
      </div>
    </div>
  )
}
