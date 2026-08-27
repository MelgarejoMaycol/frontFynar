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

export const preferencesSchema = z.object({
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
  language: z.literal('es-CO'),
  dateFormat: z.enum(['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD']),
  startScreen: z.enum(['DASHBOARD', 'TRANSACTIONS', 'BUDGETS', 'DEBTS']),
  financialCycleStartDay: z.number().int().min(1).max(28).nullable(),
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
