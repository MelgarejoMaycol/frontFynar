import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AvatarUploader } from '@/features/settings/components/AvatarUploader'

const mocks = vi.hoisted(() => ({ mutate: vi.fn(), pending: false }))
vi.mock('@/features/settings/hooks/settings.hooks', () => ({
  useUpdateAvatar: () => ({ mutate: mocks.mutate, isPending: mocks.pending }),
}))
vi.mock('@/components/feedback/toast-context', () => ({
  useToast: () => ({ showToast: vi.fn() }),
}))

const user = {
  id: 'u',
  email: 'ana@example.com',
  firstName: 'Ana',
  lastName: 'Rojas',
  phone: null,
  avatarUrl: 'https://example.com/avatar.webp',
  isEmailVerified: true,
  isActive: true,
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
}

describe('AvatarUploader', () => {
  beforeEach(() => {
    mocks.pending = false
    vi.clearAllMocks()
    vi.stubGlobal('URL', {
      ...URL,
      createObjectURL: vi.fn(() => 'blob:preview'),
      revokeObjectURL: vi.fn(),
    })
  })
  it('renderiza avatar existente y fallback por iniciales', () => {
    const { rerender } = render(<AvatarUploader user={user} />)
    expect(document.querySelector('img')).toHaveAttribute('src', user.avatarUrl)
    rerender(<AvatarUploader user={{ ...user, avatarUrl: null }} />)
    expect(screen.getByLabelText('Ana Rojas')).toHaveTextContent('AR')
  })
  it('selecciona y previsualiza una imagen válida', () => {
    render(<AvatarUploader user={user} />)
    const file = new File(['image'], 'foto.jpg', { type: 'image/jpeg' })
    fireEvent.change(screen.getByLabelText('Seleccionar imagen'), {
      target: { files: [file] },
    })
    expect(document.querySelector('img')).toHaveAttribute('src', 'blob:preview')
    fireEvent.click(screen.getByRole('button', { name: 'Guardar foto' }))
    expect(mocks.mutate).toHaveBeenCalledWith(file, expect.any(Object))
  })
  it('acepta arrastrar y soltar una imagen válida', () => {
    render(<AvatarUploader user={user} />)
    const file = new File(['image'], 'foto.webp', { type: 'image/webp' })
    const zone = screen.getByText('Arrastra una imagen aquí').parentElement!
    fireEvent.dragEnter(zone, { dataTransfer: { files: [file] } })
    expect(screen.getByText('Suelta la imagen aquí')).toBeVisible()
    fireEvent.drop(zone, { dataTransfer: { files: [file] } })
    expect(screen.getByText('foto.webp')).toBeVisible()
  })
  it('rechaza tipo inválido y archivos mayores de 5 MB', () => {
    render(<AvatarUploader user={user} />)
    const input = screen.getByLabelText('Seleccionar imagen')
    fireEvent.change(input, {
      target: {
        files: [new File(['pdf'], 'x.pdf', { type: 'application/pdf' })],
      },
    })
    expect(screen.getByRole('alert')).toHaveTextContent('JPG, PNG o WEBP')
    const large = new File(['x'], 'grande.png', { type: 'image/png' })
    Object.defineProperty(large, 'size', { value: 5 * 1024 * 1024 + 1 })
    fireEvent.change(input, { target: { files: [large] } })
    expect(screen.getByRole('alert')).toHaveTextContent('5 MB')
  })
  it('bloquea la selección mientras está subiendo', () => {
    mocks.pending = true
    render(<AvatarUploader user={user} />)
    expect(screen.getByLabelText('Seleccionar imagen')).toBeDisabled()
  })
})
