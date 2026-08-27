import type { ReactNode } from 'react'
import styles from './liabilities.module.css'

export function ModulePageHeader({
  title,
  subtitle,
  description,
  icon,
  actions,
}: {
  title: string
  subtitle?: string
  description?: string
  icon?: ReactNode
  actions?: ReactNode
}) {
  const supportingText = subtitle ?? description
  return (
    <header className={styles.moduleHeader}>
      <div className={styles.moduleHeading}>
        {icon}
        <div>
          <h1>{title}</h1>
          {supportingText && <p>{supportingText}</p>}
        </div>
      </div>
      {actions && <div className={styles.moduleActions}>{actions}</div>}
    </header>
  )
}
