import type { CSSProperties } from 'react'
import {
  Bike,
  Car,
  House,
  Laptop,
  Plane,
  ShieldCheck,
  Sparkles,
  Target,
  type LucideIcon,
} from 'lucide-react'
import clsx from 'clsx'
import { goalStatusLabel } from '../goals.format'
import type { Goal, GoalStatus } from '../types/goal.types'
import styles from './goals.module.css'

// eslint-disable-next-line react-refresh/only-export-components
export { formatGoalDate } from '../goals.format'

const iconMap: Record<string, LucideIcon> = {
  target: Target,
  bike: Bike,
  car: Car,
  laptop: Laptop,
  plane: Plane,
  house: House,
  shield: ShieldCheck,
  sparkles: Sparkles,
}

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
  const Icon = iconMap[goal.icon ?? 'target'] ?? Target
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
