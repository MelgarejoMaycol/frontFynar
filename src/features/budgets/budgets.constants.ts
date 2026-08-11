import type { BudgetPeriod, BudgetStatus } from './types/budget.types'

export const budgetPeriodLabels: Record<BudgetPeriod, string> = {
  WEEKLY: 'Semanal',
  MONTHLY: 'Mensual',
  YEARLY: 'Anual',
  CUSTOM: 'Personalizado',
}
export const budgetStatusLabels: Record<BudgetStatus, string> = {
  SAFE: 'Dentro del presupuesto',
  WARNING: 'Cerca del límite',
  EXCEEDED: 'Excedido',
}

const iso = (date: Date) => date.toISOString().slice(0, 10)
export function rangeForPeriod(period: BudgetPeriod, anchor: string) {
  const safeAnchor = /^\d{4}-\d{2}-\d{2}$/.test(anchor)
    ? anchor
    : iso(new Date())
  const [year, month, day] = safeAnchor.split('-').map(Number)
  if (period === 'MONTHLY')
    return {
      start: `${year}-${String(month).padStart(2, '0')}-01`,
      end: iso(new Date(Date.UTC(year!, month!, 0))),
    }
  if (period === 'YEARLY')
    return { start: `${year}-01-01`, end: `${year}-12-31` }
  if (period === 'WEEKLY') {
    const start = new Date(Date.UTC(year!, month! - 1, day!))
    const end = new Date(start)
    end.setUTCDate(end.getUTCDate() + 6)
    return { start: iso(start), end: iso(end) }
  }
  return { start: safeAnchor, end: safeAnchor }
}
