import { Link } from 'react-router'
import { BrandLogo } from '@/components/ui'
import styles from './feedback.module.css'
export function NotFoundPage() {
  return (
    <main className={`${styles.centered} ${styles.fullPage}`}>
      <section className={styles.panel} aria-labelledby="not-found-title">
        <BrandLogo />
        <p>404</p>
        <h1 id="not-found-title">Página no encontrada</h1>
        <p>La dirección solicitada no existe o fue movida.</p>
        <Link to="/login">Volver al inicio</Link>
      </section>
    </main>
  )
}
