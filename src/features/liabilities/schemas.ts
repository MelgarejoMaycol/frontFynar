import { z } from 'zod'
const money = z
  .string()
  .regex(/^\d{1,16}(?:\.\d{1,2})?$/, 'Ingresa un monto válido')
  .refine((value) => Number(value) > 0, 'Ingresa un monto mayor a $0.'),
  optionalMoney = z.union([z.literal(''), money])
export const debtSchema = z
  .object({
    name: z.string().trim().min(1, 'Escribe un nombre').max(150),
    lenderName: z.string().max(150),
    type: z.enum([
      'PERSONAL_LOAN',
      'BANK_LOAN',
      'CREDIT_CARD',
      'MORTGAGE',
      'VEHICLE_LOAN',
      'EDUCATION_LOAN',
      'PURCHASE_FINANCING',
      'INFORMAL_LOAN',
      'OTHER',
    ]),
    currency: z.string().regex(/^[A-Z]{3}$/),
    originalAmount: money,
    currentBalance: optionalMoney,
    interestRate: z
      .string()
      .regex(/^$|^\d{1,3}(?:[.,]\d{1,4})?$/, 'Tasa inválida')
      .refine(
        (value) => !value || Number(value.replace(',', '.')) <= 100,
        'La tasa no puede superar 100 %',
      ),
    interestRateBasis: z.enum([
      'EFFECTIVE_MONTHLY',
      'EFFECTIVE_ANNUAL',
      'NOMINAL_ANNUAL',
      'NOMINAL_MONTHLY',
    ]),
    installmentCount: z
      .string()
      .regex(/^$|^[1-9]\d*$/, 'Ingresa un número de cuotas entre 1 y 600.')
      .refine(
        (value) => !value || Number(value) <= 600,
        'Ingresa un número de cuotas entre 1 y 600.',
      ),
    paymentFrequency: z.enum(['WEEKLY', 'MONTHLY', 'BIMONTHLY', 'SEMIANNUAL']),
    installmentAmount: optionalMoney,
    firstPaymentDate: z.string(),
    notes: z.string().max(5000),
  })
  .superRefine((value, context) => {
    if (
      value.currentBalance &&
      Number(value.currentBalance) > Number(value.originalAmount)
    ) {
      context.addIssue({
        code: 'custom',
        path: ['currentBalance'],
        message: 'El saldo pendiente no puede ser mayor al monto original.',
      })
    }
  })
export type DebtFormValues = z.infer<typeof debtSchema>
export const obligationSchema = z.object({
  name: z.string().trim().min(1),
  expectedAmount: money,
  currency: z.string().regex(/^[A-Z]{3}$/),
  amountType: z.enum(['FIXED', 'VARIABLE']),
  frequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']),
  startsOn: z.string().min(10),
})
export type ObligationFormValues = z.infer<typeof obligationSchema>
