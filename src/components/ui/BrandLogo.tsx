import { Link } from 'react-router'
import clsx from 'clsx'
import styles from './surfaces.module.css'
export function BrandLogo({
  compact = false,
  inverse = false,
}: {
  compact?: boolean
  inverse?: boolean
}) {
  return (
    <Link
      to="/"
      className={clsx(styles.brand, inverse && styles.brandInverse)}
      aria-label="Veloryx, inicio"
    >
      <img
        className={clsx(
          styles.brandSymbol,
          inverse && styles.brandImageInverse,
        )}
        src="/veloryx-symbol.svg"
        alt=""
      />
      {!compact && <span>Veloryx</span>}
    </Link>
  )
}
