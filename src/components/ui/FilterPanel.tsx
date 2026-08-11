import type { ReactNode } from 'react'
import { SlidersHorizontal } from 'lucide-react'
import styles from './surfaces.module.css'

export function FilterPanel({
  children,
  active = false,
  title = 'Filtros',
}: {
  children: ReactNode
  active?: boolean
  title?: string
}) {
  return (
    <details className={styles.filterPanel}>
      <summary>
        <span>
          <SlidersHorizontal size={18} aria-hidden="true" /> {title}
        </span>
        {active && <span className={styles.filterActive}>Aplicados</span>}
      </summary>
      <div className={styles.filterBody}>{children}</div>
    </details>
  )
}
