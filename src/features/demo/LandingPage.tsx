import {
  BarChart3,
  CheckCircle2,
  Gauge,
  HandCoins,
  Landmark,
  ShieldCheck,
  Target,
  WalletCards,
} from 'lucide-react'
import { Navigate, Link } from 'react-router'
import { BrandLogo } from '@/components/ui'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { demoSummary } from './demo.data'
import styles from './demo.module.css'

const money = (value: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value)

export function LandingPage() {
  const status = useAuthStore((state) => state.status)

  if (status === 'authenticated') return <Navigate to="/app" replace />

  return (
    <div className={styles.landing} data-bs-theme="light">
      <header className={styles.landingHeader}>
        <BrandLogo />
        <nav aria-label="Acceso">
          <Link to="/login">Iniciar sesión</Link>
          <Link to="/register">Crear cuenta</Link>
        </nav>
      </header>

      <main className={styles.landingMain}>
        <section className={styles.landingHero}>
          <div className={styles.landingCopy}>
            <span className={styles.eyebrow}>Finanzas personales con contexto</span>
            <h1>Entiende tu dinero antes de tomar decisiones.</h1>
            <p>
              Fynar reúne cuentas, movimientos, presupuestos, metas, créditos,
              deudas y proyecciones en una sola experiencia para que sepas qué
              tienes, qué debes y qué puedes usar.
            </p>
            <div className={styles.landingActions}>
              <a className={styles.primaryCta} href="/demo">
                Explorar demo
              </a>
              <Link className={styles.secondaryCta} to="/register">
                Crear cuenta
              </Link>
            </div>
            <span className={styles.localNote}>
              <ShieldCheck size={16} aria-hidden="true" />
              La demo carga localmente y no necesita cuenta ni datos personales.
            </span>
          </div>

          <article className={styles.previewCard} aria-label="Vista previa de Fynar">
            <div className={styles.previewTop}>
              <span>Vista previa del Inicio</span>
              <span className={styles.demoBadge}>
                <ShieldCheck size={14} aria-hidden="true" />
                Demo
              </span>
            </div>
            <div className={styles.previewMoney}>
              <span>Disponible para usar</span>
              <strong>{money(demoSummary.availableMoney)}</strong>
              <small>Datos ficticios de septiembre de 2026</small>
            </div>
            <div className={styles.previewMiniGrid}>
              <div>
                <span>Ingresos</span>
                <strong>{money(demoSummary.totalIncome)}</strong>
              </div>
              <div>
                <span>Egresos</span>
                <strong>{money(demoSummary.totalExpenses)}</strong>
              </div>
              <div>
                <span>Salud financiera</span>
                <strong>{demoSummary.healthScore}/100</strong>
              </div>
            </div>
          </article>
        </section>

        <section className={styles.demoPitch} aria-labelledby="demo-title">
          <div>
            <span className={styles.eyebrow}>Conoce Fynar sin registrarte</span>
            <h2 id="demo-title">Una cuenta completa de ejemplo, lista para explorar.</h2>
            <p>
              Entra a una experiencia de demostración con información suficiente
              para ver cómo se comportaría Fynar después de varios meses de uso.
            </p>
            <div className={styles.landingActions}>
              <a className={styles.primaryCta} href="/demo">
                Entrar a la demo
              </a>
            </div>
          </div>
          <ul className={styles.demoPitchList}>
            <li><CheckCircle2 size={17} aria-hidden="true" /> Cinco cuentas con saldos y disponible realista.</li>
            <li><CheckCircle2 size={17} aria-hidden="true" /> Movimientos con búsqueda y filtros.</li>
            <li><CheckCircle2 size={17} aria-hidden="true" /> Presupuestos, metas y gráficos financieros.</li>
            <li><CheckCircle2 size={17} aria-hidden="true" /> Créditos, pagos recurrentes y préstamos informales.</li>
            <li><CheckCircle2 size={17} aria-hidden="true" /> Todo funciona con datos locales del frontend.</li>
          </ul>
        </section>

        <section className={styles.featureGrid} aria-label="Funciones principales">
          <article className={styles.featureCard}>
            <WalletCards size={22} aria-hidden="true" />
            <h3>Dinero disponible</h3>
            <p>Diferencia lo que tienes de lo que realmente puedes usar después de reservas y compromisos.</p>
          </article>
          <article className={styles.featureCard}>
            <BarChart3 size={22} aria-hidden="true" />
            <h3>Actividad y tendencias</h3>
            <p>Compara ingresos, egresos y categorías para entender cómo se mueve tu dinero.</p>
          </article>
          <article className={styles.featureCard}>
            <Target size={22} aria-hidden="true" />
            <h3>Metas y presupuestos</h3>
            <p>Planea ahorro y controla límites mensuales sin perder de vista el saldo de tus cuentas.</p>
          </article>
          <article className={styles.featureCard}>
            <HandCoins size={22} aria-hidden="true" />
            <h3>Deudas y préstamos</h3>
            <p>Gestiona créditos, dinero entre personas, pagos esperados y préstamos que has otorgado.</p>
          </article>
          <article className={styles.featureCard}>
            <Gauge size={22} aria-hidden="true" />
            <h3>Salud financiera</h3>
            <p>Convierte tus datos en señales prácticas para saber qué tan estable está tu situación.</p>
          </article>
          <article className={styles.featureCard}>
            <Landmark size={22} aria-hidden="true" />
            <h3>Todo en un solo lugar</h3>
            <p>Centraliza cuentas y obligaciones para tener una visión coherente de tu patrimonio.</p>
          </article>
        </section>
      </main>

      <footer className={styles.landingFooter}>
        <span>Fynar · claridad para tus decisiones financieras.</span>
        <span><Link to="/privacy">Privacidad</Link> · <Link to="/terms">Términos</Link></span>
      </footer>
    </div>
  )
}
