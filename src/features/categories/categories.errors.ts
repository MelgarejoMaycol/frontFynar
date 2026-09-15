import { ApiError } from '@/services/http'

export function getCategoryErrorMessage(error: unknown): string {
  if (!(error instanceof ApiError))
    return 'Ocurrió un error inesperado. Inténtalo nuevamente.'
  if (['NETWORK_ERROR', 'REQUEST_TIMEOUT'].includes(error.code))
    return 'La solicitud está tardando más de lo esperado. El servidor puede estar iniciando o la red puede estar lenta; inténtalo nuevamente en unos segundos.'
  switch (error.status) {
    case 400:
      return 'Revisa los datos de la categoría.'
    case 401:
      return 'Tu sesión ya no es válida. Inicia sesión nuevamente.'
    case 403:
      return 'No tienes permiso para modificar categorías.'
    case 404:
      return 'La categoría ya no existe o no está disponible.'
    case 409:
      return 'Ya existe una categoría con ese nombre o hay un conflicto con sus datos.'
    default:
      return 'No pudimos guardar la categoría. Inténtalo nuevamente.'
  }
}
