import {
  type ReactNode,
  type WheelEvent,
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import clsx from 'clsx'
import styles from './HorizontalScrollArea.module.css'

type Props = { label: string; className?: string; children: ReactNode }
const edgeTolerance = 2

export function HorizontalScrollArea({ label, className, children }: Props) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const [canMove, setCanMove] = useState({ previous: false, next: false })

  const updateControls = useCallback(() => {
    const viewport = viewportRef.current
    if (!viewport) return
    const maximum = Math.max(0, viewport.scrollWidth - viewport.clientWidth)
    setCanMove({
      previous: viewport.scrollLeft > edgeTolerance,
      next: viewport.scrollLeft < maximum - edgeTolerance,
    })
  }, [])

  useLayoutEffect(() => {
    updateControls()
    const viewport = viewportRef.current
    if (!viewport || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(updateControls)
    observer.observe(viewport)
    for (const child of viewport.children) observer.observe(child)
    return () => observer.disconnect()
  }, [children, updateControls])

  const move = (direction: -1 | 1) => {
    const viewport = viewportRef.current
    if (!viewport) return
    viewport.scrollBy({
      left: direction * Math.max(viewport.clientWidth * 0.8, 240),
      behavior: 'smooth',
    })
  }

  const handleWheel = (event: WheelEvent<HTMLDivElement>) => {
    const viewport = event.currentTarget
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

  return (
    <div className={styles.root}>
      <div
        ref={viewportRef}
        className={clsx(styles.viewport, className)}
        role="region"
        aria-label={label}
        tabIndex={0}
        onScroll={updateControls}
        onWheel={handleWheel}
      >
        {children}
      </div>
      {canMove.previous && (
        <button
          type="button"
          className={clsx(styles.control, styles.previous)}
          aria-label={`Desplazar ${label} a la izquierda`}
          onClick={() => move(-1)}
        >
          <ChevronLeft aria-hidden="true" />
        </button>
      )}
      {canMove.next && (
        <button
          type="button"
          className={clsx(styles.control, styles.next)}
          aria-label={`Desplazar ${label} a la derecha`}
          onClick={() => move(1)}
        >
          <ChevronRight aria-hidden="true" />
        </button>
      )}
    </div>
  )
}
