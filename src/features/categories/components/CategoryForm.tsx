import { zodResolver } from '@hookform/resolvers/zod'
import { createElement } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { Button, FormField, Input, Select } from '@/components/ui'
import {
  categoryColors,
  categoryColorLabels,
  categoryIconLabels,
  categoryIconOptions,
  categoryIcons,
  categoryTypeLabels,
} from '../categories.constants'
import {
  categoryFormSchema,
  type CategoryFormValues,
} from '../schemas/category.schemas'
import {
  categoryTypes,
  type Category,
  type CategoryInput,
} from '../types/category.types'
import styles from './categories.module.css'
import { getCategoryErrorMessage } from '../categories.errors'
export function CategoryForm({
  category,
  categories,
  pending,
  error,
  onSubmit,
  onCancel,
}: {
  category?: Category
  categories: Category[]
  pending: boolean
  error: unknown
  onSubmit: (i: CategoryInput) => void
  onCancel: () => void
}) {
  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: category?.name ?? '',
      type: category?.type ?? 'EXPENSE',
      parentId: category?.parentId ?? '',
      icon: category?.icon ?? '',
      color: category?.color ?? '#64748B',
    },
  })
  const type = useWatch({ control, name: 'type' })
  const icon = useWatch({ control, name: 'icon' })
  const color = useWatch({ control, name: 'color' })
  return (
    <form
      className={styles.form}
      onSubmit={(e) =>
        void handleSubmit((v) =>
          onSubmit({
            name: v.name,
            type: v.type,
            parentId: v.parentId || null,
            icon: v.icon || null,
            color: v.color,
          }),
        )(e)
      }
    >
      {error != null && <p role="alert">{getCategoryErrorMessage(error)}</p>}
      <FormField
        label="Nombre"
        htmlFor="category-name"
        required
        error={errors.name?.message}
      >
        <Input id="category-name" {...register('name')} />
      </FormField>
      <FormField
        label="Tipo"
        htmlFor="category-type"
        required
        error={errors.type?.message}
      >
        <Select
          id="category-type"
          disabled={Boolean(category)}
          {...register('type')}
        >
          {categoryTypes.map((x) => (
            <option key={x} value={x}>
              {categoryTypeLabels[x]}
            </option>
          ))}
        </Select>
      </FormField>
      <fieldset className={styles.pickerField}>
        <legend>Icono</legend>
        <details className={styles.iconPicker}>
          <summary>
            {icon && categoryIcons[icon]
              ? createElement(categoryIcons[icon], { 'aria-hidden': true })
              : null}
            {icon ? categoryIconLabels[icon] : 'Seleccionar icono'}
          </summary>
          <div className={styles.iconGrid} id="category-icon">
            {categoryIconOptions.map((value) => (
              <button
                key={value}
                type="button"
                className={
                  icon === value ? styles.pickerSelected : styles.iconOption
                }
                aria-pressed={icon === value}
                title={categoryIconLabels[value]}
                onClick={() => setValue('icon', value, { shouldDirty: true })}
              >
                {createElement(categoryIcons[value], { 'aria-hidden': true })}
                <span>{categoryIconLabels[value]}</span>
              </button>
            ))}
          </div>
        </details>
      </fieldset>
      <FormField
        label="Color"
        htmlFor="category-color"
        error={errors.color?.message}
      >
        <div
          className={styles.colorGrid}
          id="category-color"
          role="radiogroup"
          aria-label="Color de categoría"
        >
          {categoryColors.map((value, index) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={color === value}
              aria-label={categoryColorLabels[index]}
              title={categoryColorLabels[index]}
              className={
                color === value ? styles.colorSelected : styles.colorOption
              }
              style={{ backgroundColor: value }}
              onClick={() => setValue('color', value, { shouldDirty: true })}
            />
          ))}
        </div>
      </FormField>
      <FormField label="Categoría (opcional)" htmlFor="category-parent">
        <Select id="category-parent" {...register('parentId')}>
          <option value="">Sin categoría</option>
          {categories
            .filter(
              (x) =>
                x.type === type &&
                x.isActive &&
                !x.parentId &&
                x.id !== category?.id,
            )
            .map((x) => (
              <option key={x.id} value={x.id}>
                {x.name}
              </option>
            ))}
        </Select>
      </FormField>
      <div className={styles.actions}>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" loading={pending}>
          {category ? 'Guardar cambios' : 'Crear categoría'}
        </Button>
      </div>
    </form>
  )
}
