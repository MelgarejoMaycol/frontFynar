import type { UserPreferences } from './types/workspace.types'

let displayPreferences: Pick<UserPreferences, 'language' | 'dateFormat'> = {
  language: 'es-CO',
  dateFormat: 'DD/MM/YYYY',
}

export const setDisplayPreferences = (preferences: UserPreferences) => {
  displayPreferences = preferences
  document.documentElement.lang = preferences.language
}
export const getDisplayLocale = () =>
  displayPreferences.language === 'es' ? 'es' : 'es-CO'
export const getDateFormatOptions = (): Intl.DateTimeFormatOptions => {
  switch (displayPreferences.dateFormat) {
    case 'MM/DD/YYYY':
      return { month: '2-digit', day: '2-digit', year: 'numeric' }
    case 'YYYY-MM-DD':
      return { year: 'numeric', month: '2-digit', day: '2-digit' }
    default:
      return { day: '2-digit', month: '2-digit', year: 'numeric' }
  }
}
