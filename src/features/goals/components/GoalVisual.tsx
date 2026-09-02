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
import type { Goal, GoalStatus } from '../types/goal.types'
import styles from './goals.module.css'

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

export const goalStatusLabel: Record<GoalStatus, string> = {
  ACTIVE: 'Activa',
  PAUSED: 'Pausada',
  COMPLETED: 'Completada',
  CANCELLED: 'Archivada',
}

const statusClass: Record<GoalStatus, string> = {
  ACTIVE: styles.statusActive,
  PAUSED: styles.statusPaused,
  COMPLETED: styles.statusCompleted,
  CANCELLED: styles.statusArchived,
}

export function GoalIcon({ goal, size = 22 }: { goal: Pick<Goal, 'icon' | 'color'>; size?: number }) {
  const Icon = iconMap[goal.icon ?? 'target'] ?? Target
  return (
    <span
      className={styles.goalIcon}
      style={{ '--goal-color': goal.color ?? '#154B45' } as React.CSSProperties}
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

export function formatGoalDate(value: string | null) {
  if (!value) return null
  return new Intl.DateTimeFormat('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${value}T12:00:00Z`))
}
