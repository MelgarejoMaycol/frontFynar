import { z } from 'zod'
import { transactionTypes } from '../types/transaction.types'
export const transactionFormSchema = z
  .object({
    type: z.enum([...transactionTypes, 'ADVANCE']),
    amount: z
      .string()
      .regex(/^(?:0|[1-9]\d{0,15})(?:\.\d{1,2})?$/, 'Ingresa un monto válido')
      .refine((x) => Number(x) > 0, 'El monto debe ser mayor que cero'),
    accountId: z.string().min(1, 'Selecciona una cuenta'),
    destinationAccountId: z.string(),
    categoryId: z.string(),
    occurredAt: z.string().min(1, 'Selecciona una fecha'),
    description: z.string().trim().max(250),
    notes: z.string().trim().max(5000),
    merchantName: z.string().trim().max(150),
    installmentCount: z.number().int().min(1).max(120),
    periodicRate: z
      .string()
      .regex(/^$|^\d{1,3}(?:\.\d{1,7})?$/, 'Ingresa una tasa válida'),
    debtOperation: z.enum(['INSTALLMENT_PAYMENT', 'EXTRA_PAYMENT']).optional(),
    debtStrategy: z.enum(['REDUCE_TERM', 'REDUCE_PAYMENT']).optional(),
    loanId: z.string().optional(),
    categoryRequired: z.boolean().optional(),
  })
  .superRefine((value, context) => {
    if (value.type === 'TRANSFER' && !value.destinationAccountId)
      context.addIssue({
        code: 'custom',
        path: ['destinationAccountId'],
        message: 'Selecciona una cuenta destino',
      })
    if ((value.categoryRequired ?? true) && !value.categoryId)
      context.addIssue({
        code: 'custom',
        path: ['categoryId'],
        message: 'Selecciona una categoría',
      })
    if (value.type === 'ADVANCE' && !value.destinationAccountId)
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
