import { z } from 'zod'
import { accountNatures, accountTypes } from '../types/account.types'

const money = z
  .string()
  .regex(
    /^-?(?:0|[1-9]\d{0,15})(?:\.\d{1,2})?$/,
    'Ingresa un monto válido con máximo dos decimales',
  )
const optionalText = z.string().trim().max(120)
const optionalPositiveMoney = z
  .string()
  .refine(
    (value) =>
      value === '' ||
      (/^(?:0|[1-9]\d{0,15})(?:\.\d{1,2})?$/.test(value) && Number(value) > 0),
    'Debe ser un monto positivo',
  )
const optionalDay = z
  .string()
  .refine(
    (value) =>
      value === '' ||
      (/^\d+$/.test(value) && Number(value) >= 1 && Number(value) <= 31),
    'Debe estar entre 1 y 31',
  )

export const accountFormSchema = z
  .object({
    name: z.string().trim().min(1, 'El nombre es obligatorio').max(120),
    type: z.enum(accountTypes),
    nature: z.enum(accountNatures),
    institutionName: optionalText,
    currency: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z]{3}$/, 'Usa un código ISO de tres letras'),
    openingBalance: money,
    creditLimit: optionalPositiveMoney,
    billingDay: optionalDay,
    paymentDueDay: optionalDay,
    includeInNetWorth: z.boolean(),
    isFavorite: z.boolean(),
  })
  .superRefine((value, context) => {
    const assetTypes = ['CASH', 'CHECKING', 'SAVINGS', 'E_WALLET', 'INVESTMENT']
    const liabilityTypes = ['CREDIT_CARD', 'LOAN']
    if (assetTypes.includes(value.type) && value.nature !== 'ASSET')
      context.addIssue({
        code: 'custom',
        path: ['nature'],
        message: 'Este tipo requiere naturaleza Activo',
      })
    if (liabilityTypes.includes(value.type) && value.nature !== 'LIABILITY')
      context.addIssue({
        code: 'custom',
        path: ['nature'],
        message: 'Este tipo requiere naturaleza Pasivo',
      })
  })
export type AccountFormValues = z.infer<typeof accountFormSchema>
