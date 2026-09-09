import { useEffect, useRef, type ReactNode } from 'react'
import clsx from 'clsx'
import styles from './HorizontalScrollArea.module.css'

type Props = { label: string; className?: string; children: ReactNode }
const edgeTolerance = 2

export function HorizontalScrollArea({ label, className, children }: Props) {
  const viewportRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return

    const handleWheel = (event: WheelEvent) => {
      const delta =
        Math.abs(event.deltaX) > Math.abs(event.deltaY)
          ? event.deltaX
          : event.deltaY
      if (!delta) return

      const maximum = viewport.scrollWidth - viewport.clientWidth
      const canMoveInDirection =
        (delta < 0 && viewport.scrollLeft > edgeTolerance) ||
        (delta > 0 && viewport.scrollLeft < maximum - edgeTolerance)
      if (!canMoveInDirection) return

      event.preventDefault()
      viewport.scrollLeft += delta
    }

    viewport.addEventListener('wheel', handleWheel, { passive: false })
    return () => viewport.removeEventListener('wheel', handleWheel)
  }, [])

  return (
    <div className={styles.root}>
      <div
        ref={viewportRef}
        className={clsx(styles.viewport, className)}
        role="region"
        aria-label={label}
        tabIndex={0}
      >
        {children}
      </div>
    </div>
  )
}
