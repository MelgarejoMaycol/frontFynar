import { useEffect, useRef, useState } from 'react'
import { Outlet, useLocation } from 'react-router'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import styles from './layouts.module.css'
import { usePreferences } from '@/features/workspace'
export function AppLayout() {
  usePreferences()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
        menuButtonRef.current?.focus()
      }
    }
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [open])
  return (
    <div className={styles.shell}>
      <a className={styles.skipLink} href="#main-content">
        Saltar al contenido principal
      </a>
      <Sidebar open={open} onClose={() => setOpen(false)} />
      <div className={styles.appArea}>
        <Header
          menuOpen={open}
          onMenu={() => setOpen((value) => !value)}
          menuButtonRef={menuButtonRef}
        />
        <main id="main-content" className={styles.main} tabIndex={-1}>
          <div key={location.pathname} className={styles.routeTransition}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
