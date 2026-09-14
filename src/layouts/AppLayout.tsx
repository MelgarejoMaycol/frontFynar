import { useEffect, useRef, useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import styles from './layouts.module.css'
import './final-modules.css'
import { usePreferences } from '@/features/workspace'
import { isDemoSession } from '@/features/demo/demo-mode'

export function AppLayout() {
  usePreferences()
  const location = useLocation()
  const demo = isDemoSession()
  const [open, setOpen] = useState(false)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const routeRef = useRef<HTMLDivElement>(null)

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

  useEffect(() => {
    const route = routeRef.current
    if (!route || typeof route.animate !== 'function') return

    route.getAnimations().forEach((animation) => animation.cancel())
    route.animate(
      [
        {
          opacity: 0,
          transform: 'translateY(32px) scale(0.992)',
          filter: 'blur(2px)',
        },
        {
          opacity: 1,
          transform: 'translateY(0) scale(1)',
          filter: 'blur(0)',
        },
      ],
      {
        duration: 430,
        easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
        fill: 'both',
      },
    )
  }, [location.pathname])

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
          {demo && location.pathname === '/app/dashboard' && (
            <section className={styles.demoGuide} aria-label="Guía del modo demo">
              <div>
                <span className={styles.demoGuideBadge}>Modo demo</span>
                <strong>Explora Fynar como una cuenta real</strong>
                <p>
                  Puedes crear cuentas, registrar, editar y eliminar movimientos
                  y probar los módulos financieros. Solo la información de perfil
                  y seguridad está bloqueada.
                </p>
              </div>
              <div className={styles.demoGuideActions}>
                <Link to="/app/accounts?new=1">Crear una cuenta</Link>
                <Link to="/app/transactions?new=1">Registrar movimiento</Link>
              </div>
            </section>
          )}
          <div
            ref={routeRef}
            key={location.pathname}
            className={styles.routeTransition}
            data-route={location.pathname}
          >
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
