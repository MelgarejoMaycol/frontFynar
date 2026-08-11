import { useState } from 'react'
import styles from './surfaces.module.css'

type Props = { name: string; src?: string }
export function Avatar({ name, src }: Props) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
  return (
    <span className={styles.avatar} aria-label={name}>
      {src && src !== failedSrc ? (
        <img
          src={src}
          alt={`Foto de perfil de ${name}`}
          onError={() => setFailedSrc(src)}
        />
      ) : (
        initials
      )}
    </span>
  )
}
