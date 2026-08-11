import type { Workspace } from './types/workspace.types'

export const resolveActiveWorkspaceId = (
  workspaces: readonly Workspace[],
  currentWorkspaceId: string | null,
): string | null => {
  if (
    currentWorkspaceId &&
    workspaces.some(({ id }) => id === currentWorkspaceId)
  ) {
    return currentWorkspaceId
  }
  return (
    workspaces.find(({ isDefault }) => isDefault)?.id ??
    workspaces[0]?.id ??
    null
  )
}

export const hasPermission = (
  permissions: readonly string[] | undefined,
  permission: string,
): boolean => permissions?.includes(permission) ?? false
