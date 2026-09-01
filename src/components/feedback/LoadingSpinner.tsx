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

const cycle = '1.35s'

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
        <path
          d="M118 34 H73 C43 34 26 54 26 84 V177 C26 211 48 232 82 232 H171 C203 232 226 211 226 177 V112"
          fill="none"
          stroke="#1b3a30"
          strokeWidth="15"
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength="100"
          strokeDasharray="100"
        >
          <animate
            attributeName="stroke-dashoffset"
            values="100;0;0;100"
            keyTimes="0;0.24;0.82;1"
            dur={cycle}
            repeatCount="indefinite"
            begin="0s"
          />
          <animate
            attributeName="opacity"
            values="1;1;1;0"
            keyTimes="0;0.24;0.86;1"
            dur={cycle}
            repeatCount="indefinite"
            begin="0s"
          />
        </path>

        <rect x="68" y="158" width="25" height="55" rx="12.5" fill="#456856" opacity="0">
          <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.08;0.86;1" dur={cycle} repeatCount="indefinite" begin="0s" />
          <animate attributeName="y" values="213;158;158;213" keyTimes="0;0.24;0.86;1" dur={cycle} repeatCount="indefinite" begin="0s" />
          <animate attributeName="height" values="0;55;55;0" keyTimes="0;0.24;0.86;1" dur={cycle} repeatCount="indefinite" begin="0s" />
        </rect>

        <rect x="110" y="131" width="25" height="82" rx="12.5" fill="#5d8c74" opacity="0">
          <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.13;0.86;1" dur={cycle} repeatCount="indefinite" begin="0s" />
          <animate attributeName="y" values="213;131;131;213" keyTimes="0;0.30;0.86;1" dur={cycle} repeatCount="indefinite" begin="0s" />
          <animate attributeName="height" values="0;82;82;0" keyTimes="0;0.30;0.86;1" dur={cycle} repeatCount="indefinite" begin="0s" />
        </rect>

        <rect x="152" y="101" width="25" height="112" rx="12.5" fill="#8baa92" opacity="0">
          <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.18;0.86;1" dur={cycle} repeatCount="indefinite" begin="0s" />
          <animate attributeName="y" values="213;101;101;213" keyTimes="0;0.36;0.86;1" dur={cycle} repeatCount="indefinite" begin="0s" />
          <animate attributeName="height" values="0;112;112;0" keyTimes="0;0.36;0.86;1" dur={cycle} repeatCount="indefinite" begin="0s" />
        </rect>

        <path
          d="M226 177 V104"
          fill="none"
          stroke="#456856"
          strokeWidth="15"
          strokeLinecap="round"
          pathLength="100"
          strokeDasharray="100"
        >
          <animate attributeName="stroke-dashoffset" values="100;100;0;0;100" keyTimes="0;0.22;0.44;0.86;1" dur={cycle} repeatCount="indefinite" begin="0s" />
          <animate attributeName="opacity" values="0;0;1;1;0" keyTimes="0;0.22;0.28;0.86;1" dur={cycle} repeatCount="indefinite" begin="0s" />
        </path>

        <path
          d="M222 105 C198 101 184 85 183 62 C207 64 224 78 228 99 C228 102 226 104 222 105Z"
          fill="#5d8c74"
          opacity="0"
        >
          <animate attributeName="opacity" values="0;0;1;1;0" keyTimes="0;0.34;0.44;0.86;1" dur={cycle} repeatCount="indefinite" begin="0s" />
        </path>

        <path
          d="M229 104 C232 69 249 46 258 43 C259 76 247 99 232 108 C230 108 229 106 229 104Z"
          fill="#8baa92"
          opacity="0"
        >
          <animate attributeName="opacity" values="0;0;1;1;0" keyTimes="0;0.39;0.49;0.86;1" dur={cycle} repeatCount="indefinite" begin="0s" />
        </path>
      </svg>
    </span>
  )
}
