import { ApiError } from '@/services/http'
export function getSettingsErrorMessage(error: unknown) {
  if (!(error instanceof ApiError)) return 'Ocurrió un error inesperado.'
  if (error.code === 'NETWORK_ERROR')
    return 'No fue posible conectar con el servidor.'
  if (error.status === 400) return 'Revisa los datos ingresados.'
  if (error.status === 401) return 'Tu sesión ya no es válida.'
  if (error.status === 403)
    return 'No tienes autorización para realizar este cambio.'
  if (error.status === 404)
    return 'Tu perfil o workspace ya no está disponible.'
  if (error.status === 409)
    return 'Los datos cambiaron en otra sesión. Recarga e intenta nuevamente.'
  if (error.status >= 500) return 'El servidor no pudo guardar los cambios.'
  return 'No pudimos guardar los cambios.'
}
