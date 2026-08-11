import type { UserPreferences } from './types/workspace.types'

const THEME_CACHE_KEY = 'veloryx-theme'

export function applyCachedTheme() {
  const cached = localStorage.getItem(THEME_CACHE_KEY)
  if (cached === 'LIGHT' || cached === 'DARK' || cached === 'SYSTEM')
    applyTheme(cached)
}

export function resolveTheme(
  theme: UserPreferences['theme'],
): 'light' | 'dark' {
  if (theme === 'SYSTEM')
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light'
  return theme === 'DARK' ? 'dark' : 'light'
}

export function applyTheme(theme: UserPreferences['theme']) {
  document.documentElement.dataset.bsTheme = resolveTheme(theme)
  localStorage.setItem(THEME_CACHE_KEY, theme)
}

export function subscribeTheme(theme: UserPreferences['theme']) {
  applyTheme(theme)
  if (theme !== 'SYSTEM' || typeof window.matchMedia !== 'function')
    return () => undefined
  const media = window.matchMedia('(prefers-color-scheme: dark)')
  const update = () => applyTheme('SYSTEM')
  media.addEventListener('change', update)
  return () => media.removeEventListener('change', update)
}
