import { ApiError } from '@/services/http/httpErrors'

export function getAuthErrorMessage(
  error: unknown,
  context: 'login' | 'register' | 'reset' | 'general' = 'general',
) {
  if (!(error instanceof ApiError))
    return 'Ocurrió un error inesperado. Inténtalo nuevamente.'
  if (error.code === 'NETWORK_ERROR')
    return 'No fue posible conectar con el servidor.'
  if (error.code === 'VALIDATION_ERROR') return 'Revisa los datos ingresados.'
  if (error.code === 'EMAIL_NOT_VERIFIED')
    return 'Tu correo todavía no ha sido verificado.'
  if (error.code === 'CONFLICT' && context === 'register')
    return 'Ya existe una cuenta asociada a ese correo.'
  if (error.code === 'UNAUTHORIZED' && context === 'login')
    return 'Correo o contraseña incorrectos.'
  if (error.code === 'UNAUTHORIZED' && context === 'reset')
    return 'El enlace es inválido o ha expirado.'
  if (error.status >= 500)
    return 'El servicio no está disponible en este momento.'
  return error.message || 'No fue posible completar la acción.'
}
