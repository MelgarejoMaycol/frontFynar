import styles from './feedback.module.css'

interface LoadingSpinnerProps {
  label?: string
  size?: 'small' | 'medium' | 'large'
}

const sizeClass = {
  small: styles.loaderLogoSmall,
  medium: styles.loaderLogoMedium,
  large: styles.loaderLogoLarge,
}

export function LoadingSpinner({
  label = 'Cargando',
  size = 'medium',
}: LoadingSpinnerProps) {
  return (
    <span
      className={`${styles.logoLoader} ${sizeClass[size]}`}
      role="status"
      aria-label={label}
      aria-live="polite"
    >
      <img
        className={styles.loaderLogoImage}
        src="/fynar-logo-loader-fluido.svg"
        alt=""
        aria-hidden="true"
        draggable={false}
      />
    </span>
  )
}
