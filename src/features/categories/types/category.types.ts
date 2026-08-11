export const categoryTypes = [
  'INCOME',
  'EXPENSE',
  'TRANSFER',
  'INVESTMENT',
] as const
export type CategoryType = (typeof categoryTypes)[number]
export interface Category {
  id: string
  parentId: string | null
  name: string
  type: CategoryType
  icon: string | null
  color: string | null
  scope: 'SYSTEM' | 'CUSTOM'
  isSystem: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
}
export interface CategoryInput {
  name: string
  type: CategoryType
  parentId?: string | null
  icon?: string | null
  color?: string | null
}
export type UpdateCategoryInput = Omit<Partial<CategoryInput>, 'type'>
