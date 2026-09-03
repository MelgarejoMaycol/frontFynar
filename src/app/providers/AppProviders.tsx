import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, type PropsWithChildren } from 'react'
import { ApiError } from '@/services/http/httpErrors'
import { SessionInitializer } from '@/features/auth/components/SessionInitializer'
import { ToastProvider } from '@/components/feedback/ToastProvider'

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        // Estrategia stale-while-revalidate: conserva la caché para mostrar datos al instante,
        // pero vuelve a consultar en segundo plano al entrar a una pantalla, recuperar el foco
        // o reconectarse. Así la UI no queda mostrando información financiera desactualizada.
        staleTime: 30_000,
        gcTime: 30 * 60_000,
        refetchOnMount: 'always',
        refetchOnWindowFocus: true,
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
