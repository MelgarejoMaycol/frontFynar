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

const LOADER_ASSET = '/fynar-logo-loader-fluido.svg?v=20260901-desktop-1'

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
      <object
        className={styles.loaderLogoImage}
        data={LOADER_ASSET}
        type="image/svg+xml"
        aria-hidden="true"
        tabIndex={-1}
      >
        <img
          className={styles.loaderLogoImage}
          src={LOADER_ASSET}
          alt=""
          aria-hidden="true"
          draggable={false}
        />
      </object>
    </span>
  )
}
