import { Component, type PropsWithChildren } from 'react'
import { ErrorState } from './ErrorState'

interface ErrorBoundaryState {
  hasError: boolean
}

export class ErrorBoundary extends Component<
  PropsWithChildren,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch() {
    // La integración con observabilidad se definirá después del MVP base.
  }

  render() {
    if (this.state.hasError) {
      return (
        <main>
          <ErrorState
            title="Ocurrió un error inesperado"
            message="Recarga la aplicación para intentarlo nuevamente."
            actionLabel="Recargar"
            onRetry={() => window.location.reload()}
          />
        </main>
      )
    }

    return this.props.children
  }
}
