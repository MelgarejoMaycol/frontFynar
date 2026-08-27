import { formatCurrency } from '@/features/accounts/accounts.format'
import type { Upcoming } from './types'
export const upcomingResourcePath = (
  item: Pick<Upcoming, 'type' | 'resourceId'>,
) => {
  if (item.type === 'DEBT_INSTALLMENT') return `/app/debts/${item.resourceId}`
  if (item.type === 'OBLIGATION')
    return `/app/debts/obligations/${item.resourceId}`
  return `/app/debts/cards/${item.resourceId}`
}
export const money = (value: string | null | undefined, currency: string) =>
  value == null ? 'No informado' : formatCurrency(value, currency)
export const calendarDate = (value: string | null | undefined) =>
  value
    ? new Intl.DateTimeFormat('es-CO', {
        dateStyle: 'medium',
        timeZone: 'UTC',
      }).format(new Date(value.length === 10 ? `${value}T00:00:00Z` : value))
    : 'No informado'
export const shortCalendarDate = (value: string | null | undefined) =>
  value
    ? new Intl.DateTimeFormat('es-CO', {
        day: 'numeric',
        month: 'long',
        timeZone: 'UTC',
      }).format(new Date(value.length === 10 ? `${value}T00:00:00Z` : value))
    : 'Por confirmar'
export const statusLabel: Record<string, string> = {
  ACTIVE: 'Activo',
  PAID: 'Pagado',
  PENDING: 'Pendiente',
  PARTIAL: 'Parcial',
  OVERDUE: 'Vencido',
  CANCELLED: 'Cancelado',
  DEFAULTED: 'En mora',
  OPEN: 'Abierto',
  CLOSED: 'Cerrado',
  PAUSED: 'Pausado',
  COMPLETED: 'Completado',
}
export const frequencyLabel = (frequency: string, interval = 1) => {
  const labels: Record<string, string> = {
    DAILY: 'Diario',
    WEEKLY: 'Semanal',
    MONTHLY: 'Mensual',
    BIMONTHLY: 'Bimestral',
    QUARTERLY: 'Trimestral',
    SEMIANNUAL: 'Semestral',
    YEARLY: 'Anual',
    ANNUAL: 'Anual',
  }
  const base = labels[frequency] ?? 'Frecuencia no informada'
  return interval > 1 ? `${base} · cada ${interval} períodos` : base
}
export const amountTypeLabel = (type: string) =>
  type === 'VARIABLE' ? 'Variable' : type === 'FIXED' ? 'Fijo' : type
export const upcomingTypeLabel = (type: Upcoming['type']) =>
  type === 'DEBT_INSTALLMENT'
    ? 'Crédito'
    : type === 'OBLIGATION'
      ? 'Pago recurrente'
      : 'Tarjeta'
export const temporalLabel = (
  item: Pick<Upcoming, 'status' | 'daysRemaining'>,
) =>
  item.status === 'OVERDUE' || item.daysRemaining < 0
    ? 'Vencido'
    : item.daysRemaining === 0
      ? 'Hoy'
      : item.daysRemaining === 1
        ? 'Mañana'
        : item.daysRemaining <= 7
          ? 'Esta semana'
          : `En ${item.daysRemaining} días`
export const statusTone = (
  status: string,
): 'neutral' | 'success' | 'warning' | 'error' =>
  status === 'PAID' || status === 'CLOSED'
    ? 'success'
    : status === 'OVERDUE' || status === 'DEFAULTED'
      ? 'error'
      : status === 'PARTIAL'
        ? 'warning'
        : 'neutral'
export const idempotency = () => crypto.randomUUID()
