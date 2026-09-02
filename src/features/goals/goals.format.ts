import type { GoalStatus } from './types/goal.types'

export const goalStatusLabel: Record<GoalStatus, string> = {
  ACTIVE: 'Activa',
  PAUSED: 'Pausada',
  COMPLETED: 'Completada',
  CANCELLED: 'Archivada',
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
