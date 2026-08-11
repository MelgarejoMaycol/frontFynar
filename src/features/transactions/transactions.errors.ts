import { ApiError } from '@/services/http'
export function getTransactionErrorMessage(error: unknown): string {
  if (!(error instanceof ApiError))
    return 'Ocurrió un error inesperado. Inténtalo nuevamente.'
  if (error.code === 'NETWORK_ERROR')
    return 'No fue posible conectar con el servidor.'
  if (error.code === 'ACCOUNT_NOT_FOUND')
    return 'La cuenta ya no existe, está archivada o no está disponible.'
  if (error.code === 'CATEGORY_NOT_FOUND')
    return 'La categoría no corresponde al movimiento o ya no está disponible.'
  if (error.status === 401)
    return 'Tu sesión ya no es válida. Inicia sesión nuevamente.'
  if (error.status === 403)
    return 'No tienes permiso para realizar esta operación.'
  if (error.status === 404)
    return 'El movimiento no existe o no está disponible.'
  if (error.status === 409)
    return error.message.includes('modificado') ||
      error.message.includes('Versión')
      ? 'Este movimiento fue modificado desde otra sesión. Actualiza la información antes de volver a intentarlo.'
      : 'La operación entra en conflicto con el estado actual de las cuentas o del movimiento.'
  if (error.status === 400 || error.status === 422)
    return 'Revisa los datos del movimiento.'
  return 'No pudimos guardar el movimiento. Inténtalo nuevamente.'
}
