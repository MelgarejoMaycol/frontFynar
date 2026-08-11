import { z } from 'zod'

const envSchema = z.object({
  VITE_API_BASE_URL: z.url('VITE_API_BASE_URL debe ser una URL válida'),
})

const parsed = envSchema.safeParse(import.meta.env)

if (!parsed.success) {
  throw new Error(
    'Configuración inválida: define VITE_API_BASE_URL según el archivo .env.example',
  )
}

export const env = Object.freeze({
  apiBaseUrl: parsed.data.VITE_API_BASE_URL.replace(/\/$/, ''),
})
