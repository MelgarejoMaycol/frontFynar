import type { ReactNode } from 'react'
import styles from './feedback.module.css'

interface EmptyStateProps {
  title: string
  message?: string
  description?: string
  action?: ReactNode
}

export function EmptyState({ title, message, description, action }: EmptyStateProps) {
  return (
    <section className={styles.centered}>
      <div className={styles.panel}>
        <h2>{title}</h2>
        <p>{message ?? description ?? ''}</p>
        {action}
      </div>
    </section>
  )
}
