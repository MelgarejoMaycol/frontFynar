import { formatCurrency } from '@/features/accounts/accounts.format'
export const money = (value: string | null | undefined, currency: string) =>
  value == null ? 'No informado' : formatCurrency(value, currency)
export const calendarDate = (value: string | null | undefined) =>
  value
    ? new Intl.DateTimeFormat('es-CO', {
        dateStyle: 'medium',
        timeZone: 'UTC',
      }).format(new Date(value.length === 10 ? `${value}T00:00:00Z` : value))
    : 'No informado'
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
}
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
