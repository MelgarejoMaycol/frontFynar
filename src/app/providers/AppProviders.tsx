import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, type PropsWithChildren } from 'react'
import { ApiError } from '@/services/http/httpErrors'
import { SessionInitializer } from '@/features/auth/components/SessionInitializer'
import { ToastProvider } from '@/components/feedback/ToastProvider'

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        // Mantiene datos recientes disponibles al navegar entre pantallas para evitar
        // solicitudes repetidas y loaders innecesarios. Las mutaciones existentes
        // siguen invalidando sus queries cuando cambian datos financieros.
        staleTime: 2 * 60_000,
        gcTime: 30 * 60_000,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        placeholderData: (previousData: unknown) => previousData,
        retry: (failureCount, error) =>
          failureCount < 1 &&
          (!(error instanceof ApiError) || ![401, 403].includes(error.status)),
      },
      mutations: { retry: false },
    },
  })

export function AppProviders({ children }: PropsWithChildren) {
  const [queryClient] = useState(createQueryClient)

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <SessionInitializer>{children}</SessionInitializer>
      </ToastProvider>
    </QueryClientProvider>
  )
}
