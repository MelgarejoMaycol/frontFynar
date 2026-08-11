import { z } from 'zod'
import { transactionTypes } from '../types/transaction.types'
export const transactionFormSchema = z
  .object({
    type: z.enum(transactionTypes),
    amount: z
      .string()
      .regex(/^(?:0|[1-9]\d{0,15})(?:\.\d{1,2})?$/, 'Ingresa un monto válido')
      .refine((x) => Number(x) > 0, 'El monto debe ser mayor que cero'),
    accountId: z.string().min(1, 'Selecciona una cuenta'),
    destinationAccountId: z.string(),
    categoryId: z.string().min(1, 'Selecciona una categoría'),
    occurredAt: z.string().min(1, 'Selecciona una fecha'),
    description: z.string().trim().max(250),
    notes: z.string().trim().max(5000),
    merchantName: z.string().trim().max(150),
  })
  .superRefine((value, context) => {
    if (value.type === 'TRANSFER' && !value.destinationAccountId)
      context.addIssue({
        code: 'custom',
        path: ['destinationAccountId'],
        message: 'Selecciona una cuenta destino',
      })
    if (
      value.type === 'TRANSFER' &&
      value.accountId === value.destinationAccountId
    )
      context.addIssue({
        code: 'custom',
        path: ['destinationAccountId'],
        message: 'Las cuentas deben ser distintas',
      })
  })
export type TransactionFormValues = z.infer<typeof transactionFormSchema>
