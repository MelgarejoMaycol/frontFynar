import { Badge, Button, Card } from '@/components/ui'
import type { Category } from '../types/category.types'
import { CategoryIdentity } from './CategoryIdentity'
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
  return (
    <Card
      className={`${styles.card} ${!category.isActive ? styles.archivedCard : ''}`}
    >
      <CategoryIdentity
        name={category.name}
        type={category.type}
        icon={category.icon}
        color={category.color}
        details={
          <>
            {parent && <p className={styles.parentName}>{parent.name}</p>}
            <div className={styles.cardBadges}>
              <Badge>{category.isSystem ? 'Sistema' : 'Personalizada'}</Badge>
              {!category.isActive && <Badge tone="neutral">Archivada</Badge>}
            </div>
          </>
        }
      />
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
                Desarchivar
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}
