import type { ReactNode } from 'react'
import styles from './surfaces.module.css'
export function SectionHeader({
  title,
  description,
  actions,
}: {
  title: string
  description?: string
  actions?: ReactNode
}) {
  return (
    <header className={styles.sectionHeader}>
      <div>
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {actions}
    </header>
  )
}
