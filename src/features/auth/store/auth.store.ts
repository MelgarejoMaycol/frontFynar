import { create } from 'zustand'
export type AuthStatus = 'checking' | 'authenticated' | 'unauthenticated'
interface AuthState {
  status: AuthStatus
  accessToken: string | null
  setAccessToken: (accessToken: string) => void
  setStatus: (status: AuthStatus) => void
  clearSession: () => void
}
export const useAuthStore = create<AuthState>((set) => ({
  status: 'checking',
  accessToken: null,
  setAccessToken: (accessToken) =>
    set({ accessToken, status: 'authenticated' }),
  setStatus: (status) => set({ status }),
  clearSession: () => set({ accessToken: null, status: 'unauthenticated' }),
}))
