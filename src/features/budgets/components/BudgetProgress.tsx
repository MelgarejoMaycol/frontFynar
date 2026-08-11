import type { BudgetProgress as Progress } from '../types/budget.types'
import styles from './budgets.module.css'
const labels = {
  SAFE: 'Normal',
  WARNING: 'Advertencia',
  EXCEEDED: 'Excedido',
} as const
export function BudgetProgress({ progress }: { progress: Progress }) {
  const value = Math.max(0, Math.min(100, Number(progress.percentage)))
  return (
    <div className={styles.progressBlock}>
      <div className={styles.progressLabels}>
        <span>{progress.percentage} % utilizado</span>
        <strong>{labels[progress.status]}</strong>
      </div>
      <div
        className={styles.progress}
        role="progressbar"
        aria-label={`${progress.percentage} % utilizado, estado ${labels[progress.status]}`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={value}
      >
        <span style={{ width: `${value}%` }} />
      </div>
    </div>
  )
}
