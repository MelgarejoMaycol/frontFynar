import { z } from 'zod'
export const profileSchema = z.object({
  firstName: z.string().trim().min(1, 'Escribe tu nombre.').max(80),
  lastName: z.string().trim().max(80),
  phone: z
    .string()
    .trim()
    .refine(
      (value) => !value || /^\+?[0-9 ()-]{7,30}$/.test(value),
      'Teléfono inválido.',
    ),
})
export type ProfileValues = z.infer<typeof profileSchema>

export const preferencesSchema = z
  .object({
    theme: z.enum(['LIGHT', 'DARK', 'SYSTEM']),
    currency: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z]{3}$/, 'Usa una moneda ISO de tres letras.'),
    timezone: z
      .string()
      .trim()
      .min(1)
      .max(60)
      .refine((value) => {
        try {
          new Intl.DateTimeFormat('es-CO', { timeZone: value }).format()
          return true
        } catch {
          return false
        }
      }, 'Selecciona una zona horaria IANA válida.'),
    language: z.enum(['es-CO', 'en-US']),
    dateFormat: z.enum(['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD']),
    startScreen: z.enum(['DASHBOARD', 'TRANSACTIONS', 'BUDGETS', 'DEBTS']),
    financialCycleStartDay: z.number().int().min(1).max(28).nullable(),
    projectionMode: z.enum(['MONTH_END', 'CYCLE_END']),
    salaryEnabled: z.boolean(),
    expectedMonthlyIncome: z
      .string()
      .nullable()
      .refine(
        (value) => value === null || /^\d+(?:\.\d{1,2})?$/.test(value),
        'Escribe un monto válido.',
      ),
    salaryPayDay: z.number().int().min(1).max(28).nullable(),
  })
  .superRefine((value, context) => {
    if (value.projectionMode === 'CYCLE_END' && !value.financialCycleStartDay) {
      context.addIssue({
        code: 'custom',
        path: ['projectionMode'],
        message: 'Configura primero el día de inicio de tu ciclo financiero.',
      })
    }
    if (!value.salaryEnabled) return
    if (!value.expectedMonthlyIncome || Number(value.expectedMonthlyIncome) <= 0) {
      context.addIssue({
        code: 'custom',
        path: ['expectedMonthlyIncome'],
        message: 'Indica cuánto esperas recibir cada mes.',
      })
    }
    if (!value.salaryPayDay) {
      context.addIssue({
        code: 'custom',
        path: ['salaryPayDay'],
        message: 'Indica el día en que normalmente recibes este ingreso.',
      })
    }
  })
export type PreferencesValues = z.infer<typeof preferencesSchema>

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Escribe tu contraseña actual.'),
    newPassword: z
      .string()
      .min(10, 'Debe tener al menos 10 caracteres.')
      .max(128),
    confirmPassword: z.string().min(1, 'Confirma la nueva contraseña.'),
  })
  .refine((value) => value.newPassword !== value.currentPassword, {
    message: 'Debe ser diferente de la contraseña actual.',
    path: ['newPassword'],
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    message: 'Las contraseñas no coinciden.',
    path: ['confirmPassword'],
  })
export type ChangePasswordValues = z.infer<typeof changePasswordSchema>
