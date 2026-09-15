import { ApiError } from '@/services/http'
export function getDashboardErrorMessage(error: unknown): string {
  if (!(error instanceof ApiError))
    return 'Ocurrió un error inesperado al cargar el resumen.'
  if (['NETWORK_ERROR', 'REQUEST_TIMEOUT'].includes(error.code))
    return 'La solicitud está tardando más de lo esperado. El servidor puede estar iniciando o la red puede estar lenta; inténtalo nuevamente en unos segundos.'
  if (error.status === 400) return 'Revisa el periodo seleccionado.'
  if (error.status === 401)
    return 'Tu sesión ya no es válida. Inicia sesión nuevamente.'
  if (error.status === 403)
    return 'No tienes permiso para consultar el resumen financiero.'
  if (error.status === 404) return 'El workspace ya no está disponible.'
  if (error.status >= 500)
    return 'El servidor no pudo preparar el resumen. Inténtalo nuevamente.'
  return 'No pudimos cargar el resumen financiero.'
}
