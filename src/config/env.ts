import { z } from 'zod'

const envSchema = z.object({
  VITE_API_BASE_URL: z
    .string({
      error: 'VITE_API_BASE_URL no está configurada para este entorno',
    })
    .min(1, 'VITE_API_BASE_URL no está configurada para este entorno')
    .url('VITE_API_BASE_URL debe ser una URL válida'),
  VITE_SENTRY_DSN: z.preprocess(
    (value) => (value === '' ? undefined : value),
    z.string().url().optional(),
  ),
})

const parsed = envSchema.safeParse(import.meta.env)

if (!parsed.success) {
  const apiError = parsed.error.flatten().fieldErrors.VITE_API_BASE_URL?.[0]
  throw new Error(
    `Configuración inválida: ${apiError ?? 'VITE_API_BASE_URL no está configurada para este entorno'}. Define VITE_API_BASE_URL antes del build según FrontFynar/.env.example`,
  )
}

const normalizeApiBaseUrl = (value: string) => {
  const normalized = value.replace(/\/+$/, '')
  return normalized.endsWith('/api/v1') ? normalized : `${normalized}/api/v1`
}

export const env = Object.freeze({
  apiBaseUrl: normalizeApiBaseUrl(parsed.data.VITE_API_BASE_URL),
  sentryDsn: parsed.data.VITE_SENTRY_DSN,
})
