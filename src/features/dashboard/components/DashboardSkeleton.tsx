import styles from './dashboard.module.css'

export function DashboardSkeleton() {
  return (
    <div
      className={styles.skeletonPage}
      aria-label="Cargando Inicio"
      role="status"
    >
      <div className={styles.skeletonActions} />
      <div className={styles.skeletonGrid}>
        {Array.from({ length: 5 }, (_, index) => (
          <div key={index} className={styles.skeletonCard} />
        ))}
      </div>
      <div className={styles.skeletonRow} />
      <div className={styles.skeletonRow} />
    </div>
  )
}
