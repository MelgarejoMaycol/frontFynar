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
})

const REFRESH_EXCLUDED_ROUTES = new Set<string>([
  AUTH_ROUTES.login,
  AUTH_ROUTES.register,
  AUTH_ROUTES.refresh,
  AUTH_ROUTES.logout,
  AUTH_ROUTES.logoutAll,
])

export const isRefreshExcludedRoute = (url: string): boolean =>
  REFRESH_EXCLUDED_ROUTES.has(url.split(/[?#]/, 1)[0] ?? '')
