import { ApiError } from '@/services/http'

export function getCategoryErrorMessage(error: unknown): string {
  if (!(error instanceof ApiError))
    return 'Ocurrió un error inesperado. Inténtalo nuevamente.'
  if (error.code === 'NETWORK_ERROR')
    return 'No fue posible conectar con el servidor. Revisa tu conexión.'
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
