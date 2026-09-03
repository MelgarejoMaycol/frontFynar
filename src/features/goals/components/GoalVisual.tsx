import type { CSSProperties } from 'react'
import { Target } from 'lucide-react'
import clsx from 'clsx'
import { goalStatusLabel } from '../goals.format'
import { goalIcons } from '../goals.visual'
import type { Goal, GoalStatus } from '../types/goal.types'
import styles from './goals.module.css'

// eslint-disable-next-line react-refresh/only-export-components
export { formatGoalDate } from '../goals.format'

const statusClass: Record<GoalStatus, string> = {
  ACTIVE: styles.statusActive,
  PAUSED: styles.statusPaused,
  COMPLETED: styles.statusCompleted,
  CANCELLED: styles.statusArchived,
}

export function GoalIcon({
  goal,
  size = 22,
}: {
  goal: Pick<Goal, 'icon' | 'color'>
  size?: number
}) {
  const Icon = goalIcons[goal.icon ?? 'target'] ?? Target
  return (
    <span
      className={styles.goalIcon}
      style={{ '--goal-color': goal.color ?? '#154B45' } as CSSProperties}
      aria-hidden="true"
    >
      <Icon size={size} strokeWidth={2} />
    </span>
  )
}

export function GoalStatusPill({ status }: { status: GoalStatus }) {
  return (
    <span className={clsx(styles.status, statusClass[status])}>
      {goalStatusLabel[status]}
    </span>
  )
}
