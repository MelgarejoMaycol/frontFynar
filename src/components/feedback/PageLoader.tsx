import { LoadingSpinner } from './LoadingSpinner'
import styles from './feedback.module.css'

export function PageLoader() {
  return (
    <div className={`${styles.centered} ${styles.fullPage}`}>
      <div className={styles.loaderContent}>
        <LoadingSpinner size="large" label="Cargando página" />
      </div>
    </div>
  )
}
