import { LoadingSpinner } from './LoadingSpinner'
import styles from './feedback.module.css'

export function PageLoader() {
  return (
    <div className={`${styles.centered} ${styles.fullPage}`}>
      <div className={styles.loaderContent} aria-live="polite">
        <LoadingSpinner size="large" label="Cargando página" />
        <span>Cargando…</span>
      </div>
    </div>
  )
}
