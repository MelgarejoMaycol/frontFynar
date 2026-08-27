import type { Category } from './types/category.types'

export const orderCategories = (categories: Category[]) =>
  [...categories].sort((a, b) => {
    if (a.isSystem !== b.isSystem) return a.isSystem ? 1 : -1
    if (!a.isSystem && !b.isSystem) {
      const recentFirst = Date.parse(b.createdAt) - Date.parse(a.createdAt)
      return recentFirst || b.id.localeCompare(a.id)
    }
    return 0
  })
