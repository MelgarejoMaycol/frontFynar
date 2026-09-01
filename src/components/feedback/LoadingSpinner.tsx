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
      <svg
        className={styles.loaderLogoImage}
        viewBox="0 0 260 260"
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <linearGradient id="fynar-loader-stroke" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor="#1b3a30" />
            <stop offset="58%" stopColor="#456856" />
            <stop offset="100%" stopColor="#8baa92" />
          </linearGradient>
          <linearGradient id="fynar-loader-fill" x1="0" y1="1" x2="0.35" y2="0">
            <stop offset="0%" stopColor="#456856" />
            <stop offset="100%" stopColor="#8baa92" />
          </linearGradient>
        </defs>

        <path
          className={styles.loaderOutline}
          d="M118 34 H73 C43 34 26 54 26 84 V177 C26 211 48 232 82 232 H171 C203 232 226 211 226 177 V112"
        />

        <rect className={`${styles.loaderBar} ${styles.loaderBar1}`} x="68" y="158" width="25" height="55" rx="12.5" />
        <rect className={`${styles.loaderBar} ${styles.loaderBar2}`} x="110" y="131" width="25" height="82" rx="12.5" />
        <rect className={`${styles.loaderBar} ${styles.loaderBar3}`} x="152" y="101" width="25" height="112" rx="12.5" />

        <path className={styles.loaderStem} d="M226 177 V104" />
        <path
          className={`${styles.loaderLeaf} ${styles.loaderLeafLeft}`}
          d="M222 105 C198 101 184 85 183 62 C207 64 224 78 228 99 C228 102 226 104 222 105Z"
        />
        <path
          className={`${styles.loaderLeaf} ${styles.loaderLeafRight}`}
          d="M229 104 C232 69 249 46 258 43 C259 76 247 99 232 108 C230 108 229 106 229 104Z"
        />
      </svg>
    </span>
  )
}
