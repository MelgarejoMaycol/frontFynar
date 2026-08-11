import { ApiError } from '@/services/http'
export function getReportErrorMessage(error: unknown): string {
  if (!(error instanceof ApiError))
    return 'Ocurrió un error inesperado al cargar el reporte.'
  if (error.code === 'NETWORK_ERROR')
    return 'No fue posible conectar con el servidor.'
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
