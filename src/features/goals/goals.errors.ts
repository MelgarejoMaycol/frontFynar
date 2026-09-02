import { ApiError } from '@/services/http'

export function getGoalErrorMessage(error: unknown) {
  if (!(error instanceof ApiError)) return 'Ocurrió un error inesperado.'
  if (error.code === 'NETWORK_ERROR')
    return 'No fue posible conectar con el servidor.'
  if (error.code === 'ACCOUNT_NOT_FOUND')
    return 'La cuenta asociada no está disponible para esta meta.'
  if (error.code === 'TRANSACTION_NOT_FOUND')
    return 'El movimiento relacionado ya no está disponible.'
  if (error.code === 'SAVINGS_GOAL_NOT_FOUND')
    return 'La meta de ahorro no existe o ya no está disponible.'
  if (error.code === 'GOAL_CONTRIBUTION_NOT_FOUND')
    return 'El aporte no existe o ya no está disponible.'
  if (error.status === 400 || error.status === 422)
    return error.message || 'Revisa los datos de la meta o del aporte.'
  if (error.status === 401) return 'Tu sesión ya no es válida.'
  if (error.status === 403)
    return 'No tienes permiso para realizar esta operación.'
  if (error.status === 404)
    return 'No encontramos la meta, la cuenta o el movimiento solicitado.'
  if (error.status === 409)
    return error.message || 'La meta cambió de estado y no permite esta acción.'
  if (error.status >= 500)
    return 'El servidor no pudo procesar la meta en este momento.'
  return error.message || 'No pudimos completar la operación.'
}
