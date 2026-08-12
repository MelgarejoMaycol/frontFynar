import { BrandLogo } from '@/components/ui'
import { APP_NAME } from '@/config/brand'
import { NavLink, Outlet } from 'react-router'
import styles from './layouts.module.css'
export function AuthLayout() {
  return (
    <div className={styles.auth} data-bs-theme="light">
      <aside className={styles.authAside} aria-label={`Presentación de ${APP_NAME}`}>
        <BrandLogo inverse />
        <div>
          <h1>Claridad para tus decisiones financieras.</h1>
          <p>
            {APP_NAME} reunirá tus finanzas en una experiencia sencilla, segura
            y enfocada.
          </p>
        </div>
      </aside>
      <main className={styles.authMain}>
        <div className={styles.authContent}>
          <div className={styles.authMainBrand}>
            <BrandLogo />
          </div>
          <Outlet />
          <nav className={styles.authNav} aria-label="Navegación de acceso">
            <NavLink to="/login">Iniciar sesión</NavLink>
            <NavLink to="/register">Crear cuenta</NavLink>
            <NavLink to="/forgot-password">Recuperar contraseña</NavLink>
          </nav>
        </div>
      </main>
    </div>
  )
}
