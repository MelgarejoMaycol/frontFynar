import { z } from 'zod'
import { categoryIconOptions } from '../categories.constants'
import { categoryTypes } from '../types/category.types'
export const categoryFormSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es obligatorio').max(100),
  type: z.enum(categoryTypes),
  parentId: z.string(),
  icon: z.enum(categoryIconOptions as [string, ...string[]]).or(z.literal('')),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Usa un color #RRGGBB'),
})
export type CategoryFormValues = z.infer<typeof categoryFormSchema>
