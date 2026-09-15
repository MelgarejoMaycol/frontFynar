import { ApiError } from '@/services/http'
export function getReportErrorMessage(error: unknown): string {
  if (!(error instanceof ApiError))
    return 'Ocurrió un error inesperado al cargar el reporte.'
  if (['NETWORK_ERROR', 'REQUEST_TIMEOUT'].includes(error.code))
    return 'La solicitud está tardando más de lo esperado. El servidor puede estar iniciando o la red puede estar lenta; inténtalo nuevamente en unos segundos.'
  if (error.status === 400)
    return 'Revisa los filtros y el periodo seleccionado.'
  if (error.status === 401)
    return 'Tu sesión ya no es válida. Inicia sesión nuevamente.'
  if (error.status === 403) return 'No tienes permiso para consultar reportes.'
  if (error.status === 404)
    return 'La cuenta, categoría o workspace ya no está disponible.'
  if (error.status >= 500)
    return 'El servidor no pudo preparar el reporte. Inténtalo nuevamente.'
  return 'No pudimos cargar el reporte.'
}
