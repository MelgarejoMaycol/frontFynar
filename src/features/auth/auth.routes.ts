export const AUTH_ROUTES = Object.freeze({
  register: '/auth/register',
  login: '/auth/login',
  refresh: '/auth/refresh',
  logout: '/auth/logout',
  logoutAll: '/auth/logout-all',
  me: '/auth/me',
  forgotPassword: '/auth/forgot-password',
  resetPassword: '/auth/reset-password',
  changePassword: '/auth/change-password',
  verifyEmail: '/auth/verify-email',
  resendVerification: '/auth/resend-verification',
  google: '/auth/google',
  googleComplete: '/auth/google/complete',
})

const REFRESH_EXCLUDED_ROUTES = new Set<string>([
  AUTH_ROUTES.login,
  AUTH_ROUTES.register,
  AUTH_ROUTES.refresh,
  AUTH_ROUTES.logout,
  AUTH_ROUTES.logoutAll,
  AUTH_ROUTES.verifyEmail,
  AUTH_ROUTES.resendVerification,
  AUTH_ROUTES.googleComplete,
])

export const isRefreshExcludedRoute = (url: string): boolean =>
  REFRESH_EXCLUDED_ROUTES.has(url.split(/[?#]/, 1)[0] ?? '')
