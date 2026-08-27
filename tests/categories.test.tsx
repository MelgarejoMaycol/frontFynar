import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { CategoryCard } from '@/features/categories/components/CategoryCard'
import { CategoryForm } from '@/features/categories/components/CategoryForm'
import { CategorySelector } from '@/features/categories/components/CategorySelector'
import { categoriesKeys } from '@/features/categories/hooks/categories.hooks'
import { categoryFormSchema } from '@/features/categories/schemas/category.schemas'
import { categoriesApi } from '@/features/categories/api/categories.api'
import {
  categoryContrastColor,
  getCategoryIcon,
  safeCategoryColor,
} from '@/features/categories/categories.constants'
import type { Category } from '@/features/categories/types/category.types'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { ApiError } from '@/services/http'
import { getCategoryErrorMessage } from '@/features/categories/categories.errors'
import { normalizeCategorySearch } from '@/features/categories/categories.search'
import { orderCategories } from '@/features/categories/categories.order'
const global: Category = {
    id: 'g',
    parentId: null,
    name: 'Alimentación',
    type: 'EXPENSE',
    icon: 'food',
    color: '#FF0000',
    scope: 'SYSTEM',
    isSystem: true,
    isActive: true,
    createdAt: 'x',
    updatedAt: 'x',
  },
  custom: Category = {
    ...global,
    id: 'c',
    name: 'Freelance',
    type: 'INCOME',
    scope: 'CUSTOM',
    isSystem: false,
  }
const wrap = (x: React.ReactNode) => (
  <QueryClientProvider
    client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
  >
    <MemoryRouter>{x}</MemoryRouter>
  </QueryClientProvider>
)
describe('categorías', () => {
  it('busca sin distinguir mayúsculas ni tildes', () => {
    expect(normalizeCategorySearch('Educación')).toBe('educacion')
    expect(normalizeCategorySearch('SALARIO')).toBe('salario')
  })
  it('diferencia conflictos, permisos y red sin filtrar detalles internos', () => {
    expect(
      getCategoryErrorMessage(new ApiError('Prisma P2002', 409, 'CONFLICT')),
    ).toContain('Ya existe')
    expect(
      getCategoryErrorMessage(new ApiError('interno', 403, 'FORBIDDEN')),
    ).toContain('permiso')
    expect(
      getCategoryErrorMessage(new ApiError('socket', 0, 'NETWORK_ERROR')),
    ).not.toContain('socket')
  })
  it('valida enum y color', () => {
    expect(
      categoryFormSchema.safeParse({
        name: 'Comida',
        type: 'EXPENSE',
        parentId: '',
        icon: 'food',
        color: '#AABBCC',
      }).success,
    ).toBe(true)
    expect(
      categoryFormSchema.safeParse({
        name: 'X',
        type: 'OTHER',
        parentId: '',
        icon: '',
        color: 'red',
      }).success,
    ).toBe(false)
  })
  it('muestra preview real reactiva y no envía categoría padre', async () => {
    const user = userEvent.setup()
    const submit = vi.fn()
    render(
      wrap(
        <CategoryForm
          pending={false}
          error={null}
          onSubmit={submit}
          onCancel={vi.fn()}
        />,
      ),
    )
    expect(screen.queryByText('Categoría (opcional)')).not.toBeInTheDocument()
    expect(screen.queryByRole('combobox', { name: /Categoría/ })).not.toBeInTheDocument()
    const preview = screen.getByRole('region', { name: 'Vista previa de categoría' })
    await user.type(screen.getByRole('textbox', { name: /Nombre/ }), 'Universidad')
    await user.click(screen.getAllByRole('button', { name: 'Educación' })[0]!)
    await user.click(screen.getByRole('radio', { name: /^Verde$/ }))
    expect(within(preview).getByRole('heading', { name: 'Universidad' })).toBeVisible()
    expect(within(preview).getByTestId('category-identity-icon')).toHaveAttribute('data-category-color', '#38A169')
    await user.click(screen.getByRole('radio', { name: 'Azul' }))
    await user.click(screen.getByRole('radio', { name: 'Violeta' }))
    expect(within(preview).getByTestId('category-identity-icon')).toHaveAttribute('data-category-color', '#6B46C1')
    expect(within(preview).getByTestId('category-identity-icon')).toHaveAttribute('data-category-icon', 'education')
    await user.click(screen.getByRole('button', { name: 'Crear categoría' }))
    expect(submit).toHaveBeenCalledWith(expect.not.objectContaining({ parentId: expect.anything() }))
  }, 10_000)
  it('ordena personalizadas nuevas primero y conserva el orden del sistema', () => {
    const old = { ...custom, id: 'old', createdAt: '2026-01-01T00:00:00Z' }
    const recent = { ...custom, id: 'recent', createdAt: '2026-02-01T00:00:00Z' }
    const systemSecond = { ...global, id: 'system-second', name: 'Sistema 2' }
    expect(orderCategories([global, old, systemSecond, recent]).map((item) => item.id)).toEqual([
      'recent', 'old', 'g', 'system-second',
    ])
  })
  it('normaliza color y usa fallback seguro', () => {
    expect(safeCategoryColor('red')).toBe('#64748B')
    expect(getCategoryIcon('arbitrary')).toBeTruthy()
    expect(categoryContrastColor('#F6D365')).toBe('#10211D')
    expect(categoryContrastColor('#154B45')).toBe('#FFFFFF')
  })
  it('aísla query por workspace', () =>
    expect(categoriesKeys.all('a')).not.toEqual(categoriesKeys.all('b')))
  it('protege sistema y permite acciones personalizadas', () => {
    const { rerender } = render(
      wrap(
        <CategoryCard
          category={global}
          canWrite
          onEdit={vi.fn()}
          onArchive={vi.fn()}
        />,
      ),
    )
    expect(
      screen.queryByRole('button', { name: 'Editar' }),
    ).not.toBeInTheDocument()
    rerender(
      wrap(
        <CategoryCard
          category={custom}
          canWrite
          onEdit={vi.fn()}
          onArchive={vi.fn()}
        />,
      ),
    )
    expect(screen.getByRole('button', { name: 'Editar' })).toBeVisible()
  })
  it('selector filtra tipo, mezcla ámbitos y excluye archivadas', async () => {
    useAuthStore.getState().setStatus('authenticated')
    vi.spyOn(categoriesApi, 'list').mockResolvedValue({
      success: true,
      data: [
        global,
        custom,
        { ...global, id: 'old', name: 'Archivada', isActive: false },
      ],
    })
    render(
      wrap(
        <CategorySelector
          workspaceId="w"
          type="EXPENSE"
          value=""
          onChange={vi.fn()}
          allowEmpty
        />,
      ),
    )
    expect(
      await screen.findByRole('option', { name: /Alimentación/ }),
    ).toBeVisible()
    expect(
      screen.queryByRole('option', { name: /Freelance/ }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('option', { name: /Archivada/ }),
    ).not.toBeInTheDocument()
  })
  it('limpia un categoryId que pertenece a otro tipo', async () => {
    useAuthStore.getState().setStatus('authenticated')
    vi.spyOn(categoriesApi, 'list').mockResolvedValue({
      success: true,
      data: [global, custom],
    })
    const onChange = vi.fn()
    render(
      wrap(
        <CategorySelector
          workspaceId="category-reset"
          type="EXPENSE"
          value={custom.id}
          onChange={onChange}
        />,
      ),
    )
    expect(
      await screen.findByRole('option', { name: /Alimentación/ }),
    ).toBeVisible()
    expect(screen.getByRole('combobox')).toHaveValue('')
    expect(onChange).toHaveBeenCalledWith('')
  })
})
