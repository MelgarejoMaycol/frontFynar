import { useEffect, useState, type CSSProperties } from 'react'
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

const STEP_MS = 115
const LAST_PHASE = 8

const transition = `opacity ${STEP_MS}ms ease, transform ${STEP_MS * 1.35}ms cubic-bezier(.2,.8,.2,1)`

function animatedStyle(active: boolean, transform: string, hiddenTransform: string): CSSProperties {
  return {
    opacity: active ? 1 : 0.08,
    transform: active ? transform : hiddenTransform,
    transformOrigin: 'center',
    transition,
  }
}

export function LoadingSpinner({
  label = 'Cargando',
  size = 'medium',
}: LoadingSpinnerProps) {
  const [phase, setPhase] = useState(0)

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setPhase(1))
    const timer = window.setInterval(() => {
      setPhase((current) => (current >= LAST_PHASE ? 1 : current + 1))
    }, STEP_MS)

    return () => {
      window.cancelAnimationFrame(frame)
      window.clearInterval(timer)
    }
  }, [])

  const frameVisible = phase >= 1
  const bar1Visible = phase >= 2
  const bar2Visible = phase >= 3
  const bar3Visible = phase >= 4
  const stemVisible = phase >= 5
  const leftLeafVisible = phase >= 6
  const rightLeafVisible = phase >= 7
  const complete = phase >= 7

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
        style={{
          transform: complete ? 'scale(1.035)' : 'scale(1)',
          transformOrigin: 'center',
          transition: `transform ${STEP_MS * 1.6}ms ease`,
        }}
      >
        {/* Fallback permanente: incluso si una animación del navegador falla, el logo nunca desaparece. */}
        <g opacity="0.16">
          <path
            d="M118 34 H73 C43 34 26 54 26 84 V177 C26 211 48 232 82 232 H171 C203 232 226 211 226 177 V112"
            fill="none"
            stroke="#1b3a30"
            strokeWidth="15"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <rect x="68" y="158" width="25" height="55" rx="12.5" fill="#456856" />
          <rect x="110" y="131" width="25" height="82" rx="12.5" fill="#5d8c74" />
          <rect x="152" y="101" width="25" height="112" rx="12.5" fill="#8baa92" />
          <path
            d="M226 177 V104"
            fill="none"
            stroke="#456856"
            strokeWidth="15"
            strokeLinecap="round"
          />
          <path
            d="M222 105 C198 101 184 85 183 62 C207 64 224 78 228 99 C228 102 226 104 222 105Z"
            fill="#5d8c74"
          />
          <path
            d="M229 104 C232 69 249 46 258 43 C259 76 247 99 232 108 C230 108 229 106 229 104Z"
            fill="#8baa92"
          />
        </g>

        <path
          d="M118 34 H73 C43 34 26 54 26 84 V177 C26 211 48 232 82 232 H171 C203 232 226 211 226 177 V112"
          fill="none"
          stroke="#1b3a30"
          strokeWidth="15"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={animatedStyle(frameVisible, 'scale(1)', 'scale(.94)')}
        />

        <rect
          x="68"
          y="158"
          width="25"
          height="55"
          rx="12.5"
          fill="#456856"
          style={{
            ...animatedStyle(bar1Visible, 'scaleY(1)', 'scaleY(.08)'),
            transformOrigin: '80.5px 213px',
          }}
        />
        <rect
          x="110"
          y="131"
          width="25"
          height="82"
          rx="12.5"
          fill="#5d8c74"
          style={{
            ...animatedStyle(bar2Visible, 'scaleY(1)', 'scaleY(.08)'),
            transformOrigin: '122.5px 213px',
          }}
        />
        <rect
          x="152"
          y="101"
          width="25"
          height="112"
          rx="12.5"
          fill="#8baa92"
          style={{
            ...animatedStyle(bar3Visible, 'scaleY(1)', 'scaleY(.08)'),
            transformOrigin: '164.5px 213px',
          }}
        />

        <path
          d="M226 177 V104"
          fill="none"
          stroke="#456856"
          strokeWidth="15"
          strokeLinecap="round"
          style={{
            ...animatedStyle(stemVisible, 'scaleY(1)', 'scaleY(.08)'),
            transformOrigin: '226px 177px',
          }}
        />
        <path
          d="M222 105 C198 101 184 85 183 62 C207 64 224 78 228 99 C228 102 226 104 222 105Z"
          fill="#5d8c74"
          style={{
            ...animatedStyle(leftLeafVisible, 'scale(1) rotate(0deg)', 'scale(.08) rotate(10deg)'),
            transformOrigin: '224px 103px',
          }}
        />
        <path
          d="M229 104 C232 69 249 46 258 43 C259 76 247 99 232 108 C230 108 229 106 229 104Z"
          fill="#8baa92"
          style={{
            ...animatedStyle(rightLeafVisible, 'scale(1) rotate(0deg)', 'scale(.08) rotate(-10deg)'),
            transformOrigin: '231px 104px',
          }}
        />
      </svg>
    </span>
  )
}
