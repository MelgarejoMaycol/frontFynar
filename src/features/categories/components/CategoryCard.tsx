import { createElement } from 'react'
import { Badge, Button, Card } from '@/components/ui'
import {
  categoryTypeLabels,
  categoryContrastColor,
  getCategoryIcon,
  safeCategoryColor,
} from '../categories.constants'
import type { Category } from '../types/category.types'
import styles from './categories.module.css'

export function CategoryCard({
  category,
  parent,
  canWrite,
  onEdit,
  onArchive,
  onRestore = () => undefined,
  busy = false,
}: {
  category: Category
  parent?: Category
  canWrite: boolean
  onEdit: () => void
  onArchive: () => void
  onRestore?: () => void
  busy?: boolean
}) {
  const Icon = getCategoryIcon(category.icon)
  return (
    <Card
      className={`${styles.card} ${!category.isActive ? styles.archivedCard : ''}`}
    >
      <div className={styles.cardMain}>
        <div
          className={styles.icon}
          style={
            {
              '--category-color': safeCategoryColor(category.color),
              '--category-contrast': categoryContrastColor(category.color),
            } as React.CSSProperties
          }
        >
          {createElement(Icon, { 'aria-hidden': true })}
        </div>
        <div className={styles.cardCopy}>
          <h2>{category.name}</h2>
          <p>
            {categoryTypeLabels[category.type]}
            {parent ? ` · ${parent.name}` : ''}
          </p>
          <div className={styles.cardBadges}>
            <Badge>{category.isSystem ? 'Sistema' : 'Personalizada'}</Badge>
            {!category.isActive && <Badge tone="neutral">Archivada</Badge>}
          </div>
        </div>
      </div>
      <div className={styles.cardSide}>
        {canWrite && !category.isSystem && (
          <div className={styles.actions}>
            {category.isActive ? (
              <>
                <Button variant="ghost" disabled={busy} onClick={onEdit}>
                  Editar
                </Button>
                <Button variant="secondary" disabled={busy} onClick={onArchive}>
                  Archivar
                </Button>
              </>
            ) : (
              <Button variant="secondary" loading={busy} onClick={onRestore}>
                Restaurar
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}
