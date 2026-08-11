import styles from './feedback.module.css'

interface ErrorStateProps {
  title?: string
  message: string
  actionLabel?: string
  onRetry?: () => void
}

export function ErrorState({
  title = 'No pudimos completar la acción',
  message,
  actionLabel = 'Reintentar',
  onRetry,
}: ErrorStateProps) {
  return (
    <section className={styles.centered} role="alert">
      <div className={styles.panel}>
        <h2>{title}</h2>
        <p>{message}</p>
        {onRetry ? (
          <button className="btn btn-primary" type="button" onClick={onRetry}>
            {actionLabel}
          </button>
        ) : null}
      </div>
    </section>
  )
}
