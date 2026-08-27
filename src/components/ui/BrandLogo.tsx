import { APP_NAME } from '@/config/brand'
import clsx from 'clsx'
import { Link } from 'react-router'
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
      aria-label={`${APP_NAME}, inicio`}
    >
      <img
        className={clsx(
          styles.brandSymbol,
          inverse && styles.brandImageInverse,
        )}
        src="/fynar-symbol.png"
        alt=""
      />
      {!compact && <span>{APP_NAME}</span>}
    </Link>
  )
}
