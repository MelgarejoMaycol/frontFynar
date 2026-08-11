import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { WorkspaceGate } from '@/features/workspace/components/WorkspaceGate'
import { WorkspaceSelector } from '@/features/workspace/components/WorkspaceSelector'
import { workspaceApi } from '@/features/workspace/api/workspace.api'
import {
  hasPermission,
  resolveActiveWorkspaceId,
} from '@/features/workspace/workspace.resolution'
import { useWorkspaceStore } from '@/features/workspace/store/workspace.store'
import type { Workspace } from '@/features/workspace/types/workspace.types'
import { useAuthStore } from '@/features/auth/store/auth.store'

const personal: Workspace = {
  id: 'workspace-personal',
  name: 'Personal',
  type: 'PERSONAL',
  baseCurrency: 'COP',
  timezone: 'America/Bogota',
  isActive: true,
  role: 'OWNER',
  membershipStatus: 'ACTIVE',
  permissions: ['accounts.read', 'accounts.write'],
  isDefault: true,
}
const family: Workspace = {
  ...personal,
  id: 'workspace-family',
  name: 'Familia con un nombre especialmente largo para probar truncamiento',
  type: 'FAMILY',
  role: 'MEMBER',
  permissions: ['accounts.read'],
  isDefault: false,
}

const renderWithClient = (children: React.ReactNode) => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  vi.restoreAllMocks()
  useAuthStore.getState().setStatus('authenticated')
  useWorkspaceStore.getState().clearWorkspace()
})

describe('contexto de workspace', () => {
  it('resuelve uno, conserva una selección válida y corrige una inválida', () => {
    expect(resolveActiveWorkspaceId([personal], null)).toBe(personal.id)
    expect(resolveActiveWorkspaceId([personal, family], family.id)).toBe(
      family.id,
    )
    expect(resolveActiveWorkspaceId([personal, family], 'invalid')).toBe(
      personal.id,
    )
    expect(resolveActiveWorkspaceId([], 'invalid')).toBeNull()
  })

  it('comprueba permisos sin convertir el frontend en autoridad', () => {
    expect(hasPermission(personal.permissions, 'accounts.write')).toBe(true)
    expect(hasPermission(undefined, 'accounts.write')).toBe(false)
  })

  it('muestra loading, error, empty y ready desde WorkspaceGate', async () => {
    const pending = vi
      .spyOn(workspaceApi, 'list')
      .mockReturnValueOnce(new Promise(() => {}))
    const first = renderWithClient(
      <Routes>
        <Route element={<WorkspaceGate />}>
          <Route index element={<p>Contenido listo</p>} />
        </Route>
      </Routes>,
    )
    expect(
      screen.getByRole('status', { name: 'Cargando página' }),
    ).toBeVisible()
    first.unmount()

    pending.mockRejectedValueOnce(new Error('network'))
    const second = renderWithClient(
      <Routes>
        <Route element={<WorkspaceGate />}>
          <Route index element={<p>Contenido listo</p>} />
        </Route>
      </Routes>,
    )
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No pudimos cargar tus espacios',
    )
    second.unmount()

    pending.mockResolvedValueOnce({ success: true, data: [] })
    const third = renderWithClient(
      <Routes>
        <Route element={<WorkspaceGate />}>
          <Route index element={<p>Contenido listo</p>} />
        </Route>
      </Routes>,
    )
    expect(
      await screen.findByText('No encontramos un espacio financiero'),
    ).toBeVisible()
    third.unmount()

    pending.mockResolvedValueOnce({ success: true, data: [personal] })
    renderWithClient(
      <Routes>
        <Route element={<WorkspaceGate />}>
          <Route index element={<p>Contenido listo</p>} />
        </Route>
      </Routes>,
    )
    expect(await screen.findByText('Contenido listo')).toBeVisible()
  })

  it('selecciona un workspace real y actualiza el contexto', async () => {
    vi.spyOn(workspaceApi, 'list').mockResolvedValue({
      success: true,
      data: [personal, family],
    })
    const select = vi.spyOn(workspaceApi, 'select').mockResolvedValue({
      success: true,
      data: {
        workspace: { ...family, isDefault: true },
        defaultWorkspaceId: family.id,
        updatedAt: '2026-08-07T00:00:00.000Z',
      },
    })
    const user = userEvent.setup()
    renderWithClient(<WorkspaceSelector />)
    const selector = await screen.findByRole('combobox', {
      name: 'Workspace activo',
    })
    await user.selectOptions(selector, family.id)
    await waitFor(() => expect(select).toHaveBeenCalledWith(family.id))
    await waitFor(() =>
      expect(useWorkspaceStore.getState().activeWorkspaceId).toBe(family.id),
    )
    expect(
      screen.getByRole('option', { name: /Familia con un nombre/ }),
    ).toBeVisible()
  })
})
