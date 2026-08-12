import { z } from 'zod'

const email = z
  .string()
  .trim()
  .toLowerCase()
  .max(254, 'El correo es demasiado largo')
  .email('Ingresa un correo válido')
const password = z
  .string()
  .min(10, 'La contraseña debe tener al menos 10 caracteres')
  .max(128, 'La contraseña no puede superar 128 caracteres')
const name = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} es obligatorio`)
    .max(80, `${label} no puede superar 80 caracteres`)

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'La contraseña es obligatoria').max(128),
})
export const registerSchema = z
  .object({
    firstName: name('El nombre'),
    lastName: name('El apellido'),
    email,
    password,
    confirmPassword: z.string().min(1, 'Confirma la contraseña'),
    acceptedTerms: z.boolean().refine(Boolean, {
      message: 'Debes aceptar los términos y la política de privacidad',
    }),
  })
  .refine(({ password, confirmPassword }) => password === confirmPassword, {
    path: ['confirmPassword'],
    message: 'Las contraseñas no coinciden',
  })
export const forgotPasswordSchema = z.object({ email })
export const resetPasswordSchema = z
  .object({
    password,
    confirmPassword: z.string().min(1, 'Confirma la contraseña'),
  })
  .refine(({ password, confirmPassword }) => password === confirmPassword, {
    path: ['confirmPassword'],
    message: 'Las contraseñas no coinciden',
  })

export type LoginValues = z.infer<typeof loginSchema>
export type RegisterValues = z.infer<typeof registerSchema>
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>
