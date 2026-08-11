import { ApiError } from '@/services/http'

export const accountErrorMessage = (error: unknown): string => {
  if (error instanceof ApiError && error.status === 409)
    return 'Ya existe una cuenta con ese nombre. Restaura la cuenta anterior o utiliza otro nombre.'
  if (error instanceof ApiError && error.status === 403)
    return 'No tienes permiso para modificar cuentas.'
  return 'No pudimos guardar la cuenta. Revisa los datos e inténtalo nuevamente.'
}
