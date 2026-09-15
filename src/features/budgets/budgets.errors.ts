import { ApiError } from '@/services/http'
export function getBudgetErrorMessage(error: unknown) {
  if (!(error instanceof ApiError)) return 'Ocurrió un error inesperado.'
  if (['NETWORK_ERROR', 'REQUEST_TIMEOUT'].includes(error.code))
    return 'La solicitud está tardando más de lo esperado. El servidor puede estar iniciando o la red puede estar lenta; inténtalo nuevamente en unos segundos.'
  if (error.code === 'CATEGORY_NOT_FOUND')
    return 'Una categoría no está disponible o no es válida.'
  if (error.code === 'ACCOUNT_NOT_FOUND')
    return 'Una cuenta no está disponible o no coincide con la moneda.'
  if (error.status === 400 || error.status === 422)
    return 'Revisa los datos, fechas y monto del presupuesto.'
  if (error.status === 401) return 'Tu sesión ya no es válida.'
  if (error.status === 403)
    return 'No tienes permiso para realizar esta operación.'
  if (error.status === 404) return 'El presupuesto no existe.'
  if (error.status === 409)
    return 'El presupuesto está archivado o contiene una asociación duplicada.'
  if (error.status >= 500) return 'El servidor no pudo procesar el presupuesto.'
  return 'No pudimos guardar el presupuesto.'
}
