export { WorkspaceGate } from './components/WorkspaceGate'
export { WorkspaceSelector } from './components/WorkspaceSelector'
export { InitialPrivateRedirect } from './components/InitialPrivateRedirect'
export { resolveStartScreen } from './start-screen'
export {
  useActiveWorkspace,
  usePermission,
  usePreferences,
  useSelectWorkspace,
  useUpdatePreferences,
  useWorkspaces,
  workspaceKeys,
} from './hooks/workspace.hooks'
export { useWorkspaceStore } from './store/workspace.store'
export type {
  UserPreferences,
  UpdateUserPreferences,
  Workspace,
  WorkspaceSelection,
  WorkspaceType,
} from './types/workspace.types'
export { hasPermission, resolveActiveWorkspaceId } from './workspace.resolution'
