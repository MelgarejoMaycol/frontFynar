import { z } from 'zod'
import { budgetPeriods } from '../types/budget.types'
const money = z
  .string()
  .regex(/^(?:0|[1-9]\d{0,15})(?:\.\d{1,2})?$/, 'Monto inválido')
  .refine((x) => Number(x) > 0, 'Debe ser mayor que cero')
export const budgetFormSchema = z
  .object({
    name: z.string().trim().min(1, 'El nombre es obligatorio').max(120),
    period: z.enum(budgetPeriods),
    startsOn: z.iso.date(),
    endsOn: z.iso.date(),
    amount: money,
    currency: z.string().regex(/^[A-Za-z]{3}$/, 'Usa tres letras'),
    alertThreshold: z
      .string()
      .regex(/^(?:0|[1-9]\d?)(?:\.\d{1,2})?$|^100(?:\.0{1,2})?$/)
      .refine((x) => Number(x) > 0),
    rolloverEnabled: z.boolean(),
    categoryIds: z.array(z.string()),
    accountIds: z.array(z.string()),
  })
  .superRefine((v, c) => {
    if (v.startsOn > v.endsOn)
      c.addIssue({
        code: 'custom',
        path: ['endsOn'],
        message: 'Rango de fechas inválido',
      })
    const start = new Date(`${v.startsOn}T00:00:00Z`)
    const end = new Date(`${v.endsOn}T00:00:00Z`)
    const days = Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1
    if (v.period === 'WEEKLY' && days !== 7)
      c.addIssue({
        code: 'custom',
        path: ['endsOn'],
        message: 'La semana debe contener exactamente 7 días',
      })
    if (
      v.period === 'MONTHLY' &&
      (start.getUTCDate() !== 1 ||
        start.getUTCMonth() !== end.getUTCMonth() ||
        start.getUTCFullYear() !== end.getUTCFullYear() ||
        end.getUTCDate() !==
          new Date(
            Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 0),
          ).getUTCDate())
    )
      c.addIssue({
        code: 'custom',
        path: ['endsOn'],
        message: 'Selecciona un mes calendario completo',
      })
    if (
      v.period === 'YEARLY' &&
      (v.startsOn !== `${start.getUTCFullYear()}-01-01` ||
        v.endsOn !== `${start.getUTCFullYear()}-12-31`)
    )
      c.addIssue({
        code: 'custom',
        path: ['endsOn'],
        message: 'Selecciona un año calendario completo',
      })
  })
export type BudgetFormValues = z.infer<typeof budgetFormSchema>
