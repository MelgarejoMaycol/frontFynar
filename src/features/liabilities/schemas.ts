import { z } from 'zod'
const money = z
    .string()
    .regex(/^\d{1,16}(?:\.\d{1,2})?$/, 'Ingresa un monto válido'),
  optionalMoney = z.union([z.literal(''), money])
export const debtSchema = z.object({
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
  interestRate: z.string().regex(/^$|^\d{1,3}(?:\.\d{1,7})?$/, 'Tasa inválida'),
  interestRateBasis: z.enum([
    'EFFECTIVE_MONTHLY',
    'EFFECTIVE_ANNUAL',
    'NOMINAL_ANNUAL',
    'NOMINAL_MONTHLY',
  ]),
  termMonths: z.string().regex(/^$|^[1-9]\d*$/, 'Plazo inválido'),
  installmentAmount: optionalMoney,
  firstPaymentDate: z.string(),
  notes: z.string().max(5000),
})
export type DebtFormValues = z.infer<typeof debtSchema>
export const obligationSchema = z.object({
  name: z.string().trim().min(1),
  expectedAmount: money,
  currency: z.string().regex(/^[A-Z]{3}$/),
  amountType: z.enum(['FIXED', 'VARIABLE']),
  frequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']),
  startsOn: z.string().min(10),
  dayOfMonth: z.string().regex(/^$|^(?:[1-9]|[12]\d|3[01])$/),
})
export type ObligationFormValues = z.infer<typeof obligationSchema>
