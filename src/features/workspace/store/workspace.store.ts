import { create } from 'zustand'

interface WorkspaceState {
  activeWorkspaceId: string | null
  setActiveWorkspaceId: (workspaceId: string | null) => void
  clearWorkspace: () => void
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  activeWorkspaceId: null,
  setActiveWorkspaceId: (activeWorkspaceId) => set({ activeWorkspaceId }),
  clearWorkspace: () => set({ activeWorkspaceId: null }),
}))
