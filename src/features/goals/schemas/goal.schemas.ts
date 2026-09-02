import { z } from 'zod'

const money = z
  .string()
  .regex(/^(?:0|[1-9]\d{0,15})(?:\.\d{1,2})?$/, 'Monto inválido')
  .refine((value) => Number(value) > 0, 'Debe ser mayor que cero')

export const goalFormSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es obligatorio').max(150),
  targetAmount: money,
  targetDate: z.union([z.iso.date(), z.literal('')]),
  accountId: z.string(),
  icon: z.string().max(80),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Selecciona un color válido'),
})

export type GoalFormValues = z.infer<typeof goalFormSchema>

export const contributionFormSchema = z.object({
  amount: money,
  contributedAt: z.string().min(1, 'La fecha es obligatoria'),
  transactionId: z.string(),
})

export type ContributionFormValues = z.infer<typeof contributionFormSchema>
