import { LoadingSpinner } from './LoadingSpinner'
import styles from './feedback.module.css'

export function PageLoader() {
  return (
    <div className={`${styles.centered} ${styles.fullPage}`}>
      <LoadingSpinner label="Cargando página" />
    </div>
  )
}
