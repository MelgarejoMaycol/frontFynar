import {
  ArrowLeftRight,
  ArrowRight,
  BarChart3,
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  Gauge,
  HandCoins,
  Landmark,
  LineChart,
  PiggyBank,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  WalletCards,
} from 'lucide-react'
import { Navigate, Link } from 'react-router'
import { BrandLogo } from '@/components/ui'
import { useAuthStore } from '@/features/auth/store/auth.store'
import styles from './demo.module.css'

const capabilities = [
  {
    Icon: WalletCards,
    title: 'Cuentas y dinero disponible',
    description:
      'Centraliza efectivo, bancos y billeteras, y diferencia el saldo total de lo que realmente puedes usar.',
  },
  {
    Icon: CircleDollarSign,
    title: 'Movimientos y categorías',
    description:
      'Registra ingresos, egresos y transferencias, filtra tu historial y entiende en qué se mueve tu dinero.',
  },
  {
    Icon: Target,
    title: 'Presupuestos y metas',
    description:
      'Controla límites mensuales y convierte objetivos de ahorro en avances medibles conectados con tus finanzas.',
  },
  {
    Icon: HandCoins,
    title: 'Créditos, deudas y préstamos',
    description:
      'Organiza obligaciones, dinero entre personas, pagos esperados y préstamos que has otorgado.',
  },
  {
    Icon: CalendarClock,
    title: 'Pagos recurrentes',
    description:
      'Mantén visibles compromisos periódicos para anticipar lo que viene antes de que afecte tu disponible.',
  },
  {
    Icon: ArrowLeftRight,
    title: 'Divisas',
    description:
      'Convierte montos entre monedas con tasas de referencia y consulta la fecha de la tasa sin alterar tus saldos.',
  },
  {
    Icon: TrendingUp,
    title: 'Inversiones',
    description:
      'Simula crecimiento, compara escenarios, guarda planes y registra aportes reales cuando decidas ejecutarlos.',
  },
  {
    Icon: Gauge,
    title: 'Análisis y salud financiera',
    description:
      'Convierte movimientos, compromisos y tendencias en señales más fáciles de interpretar para tomar decisiones.',
  },
]

export function LandingPage() {
  const status = useAuthStore((state) => state.status)

  if (status === 'authenticated') return <Navigate to="/app" replace />

  return (
    <div className={styles.landing} data-bs-theme="light">
      <header className={styles.landingHeader}>
        <BrandLogo />
        <nav aria-label="Acceso">
          <a className={styles.landingNavLink} href="#que-es-fynar">
            Qué es Fynar
          </a>
          <a className={styles.landingNavLink} href="#funciones">
            Funciones
          </a>
          <Link to="/login">Iniciar sesión</Link>
          <Link to="/register">Crear cuenta</Link>
          <a className={styles.demoNavCta} href="/demo">
            Probar demo
          </a>
        </nav>
      </header>

      <main className={styles.landingMain}>
        <section className={styles.landingHero}>
          <div className={styles.landingCopy}>
            <span className={styles.eyebrow}>Finanzas personales con contexto</span>
            <h1>Entiende tu dinero antes de tomar decisiones.</h1>
            <p>
              Fynar es una plataforma de finanzas personales que reúne tu dinero,
              tus obligaciones y tus objetivos en un mismo lugar. No se limita a
              registrar gastos: busca ayudarte a entender qué tienes, qué tienes
              comprometido y cómo podrían impactar tus próximas decisiones.
            </p>

            <div className={styles.heroDemoCta}>
              <div className={styles.heroDemoCopy}>
                <span className={styles.heroDemoIcon}>
                  <Sparkles size={18} aria-hidden="true" />
                </span>
                <div>
                  <strong>Prueba Fynar sin registrarte</strong>
                  <span>Explora la aplicación completa y conoce cómo funciona antes de crear tu cuenta.</span>
                </div>
              </div>
              <a className={styles.heroDemoButton} href="/demo">
                <span>Entrar a la demo</span>
                <ArrowRight size={20} aria-hidden="true" />
              </a>
            </div>

            <div className={styles.heroTopics} aria-label="Áreas principales de Fynar">
              <span>Cuentas</span>
              <span>Presupuestos</span>
              <span>Metas</span>
              <span>Divisas</span>
              <span>Inversiones</span>
              <span>Proyecciones</span>
            </div>

            <div className={styles.heroMeta}>
              <Link to="/register">Crear cuenta</Link>
              <span aria-hidden="true">·</span>
              <Link to="/login">Ya tengo una cuenta</Link>
              <span aria-hidden="true">·</span>
              <a href="#funciones">Ver funciones</a>
            </div>

            <span className={styles.localNote}>
              <ShieldCheck size={16} aria-hidden="true" />
              La demo funciona localmente y no necesita datos personales.
            </span>
          </div>

          <a
            className={styles.realPreview}
            href="/demo"
            aria-label="Abrir la demo de Fynar desde la vista real de la aplicación"
          >
            <img
              src="/fynar-demo-dashboard-preview.webp"
              alt="Vista real del inicio de Fynar en modo demo"
              loading="eager"
            />
            <span className={styles.realPreviewHint}>
              <span>Ver Fynar por dentro</span>
              <strong>
                Abrir demo <ArrowRight size={17} aria-hidden="true" />
              </strong>
            </span>
          </a>
        </section>

        <section
          id="que-es-fynar"
          className={styles.storySection}
          aria-labelledby="fynar-story-title"
        >
          <div className={styles.sectionIntro}>
            <span className={styles.eyebrow}>Qué es Fynar</span>
            <h2 id="fynar-story-title">Más que un registro de gastos.</h2>
            <p>
              La idea de Fynar es convertir información financiera dispersa en
              contexto útil. Cada módulo aporta una pieza distinta para que el
              usuario no tenga que interpretar números aislados.
            </p>
          </div>

          <div className={styles.storyGrid}>
            <article className={styles.storyCard}>
              <div className={styles.storyIcon}>
                <Landmark size={22} aria-hidden="true" />
              </div>
              <span>1. Qué tienes</span>
              <h3>¿Dónde está mi dinero?</h3>
              <p>
                Cuentas, efectivo, billeteras, saldos, movimientos y distribución
                del patrimonio en una vista coherente.
              </p>
            </article>
            <article className={styles.storyCard}>
              <div className={styles.storyIcon}>
                <HandCoins size={22} aria-hidden="true" />
              </div>
              <span>2. Qué compromete tu dinero</span>
              <h3>¿Qué debo atender?</h3>
              <p>
                Presupuestos, créditos, préstamos, pagos recurrentes, metas y
                compromisos que reducen tu margen real de decisión.
              </p>
            </article>
            <article className={styles.storyCard}>
              <div className={styles.storyIcon}>
                <Sparkles size={22} aria-hidden="true" />
              </div>
              <span>3. Qué puede pasar después</span>
              <h3>¿Cómo cambia mi situación?</h3>
              <p>
                Proyecciones, salud financiera, simulaciones e inversiones para
                explorar escenarios sin modificar tus datos reales.
              </p>
            </article>
          </div>
        </section>

        <section
          id="funciones"
          className={styles.capabilitySection}
          aria-labelledby="capabilities-title"
        >
          <div className={styles.sectionIntro}>
            <span className={styles.eyebrow}>Una visión completa</span>
            <h2 id="capabilities-title">Todo lo que puedes gestionar desde Fynar.</h2>
            <p>
              Las funciones están conectadas entre sí para que una acción no se
              quede en una pantalla aislada: un movimiento afecta cuentas,
              presupuestos, análisis y la lectura general de tu situación.
            </p>
          </div>

          <div className={styles.featureGrid}>
            {capabilities.map(({ Icon, title, description }) => (
              <article className={styles.featureCard} key={title}>
                <div className={styles.featureIcon}>
                  <Icon size={21} aria-hidden="true" />
                </div>
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.marketSection} aria-labelledby="tools-title">
          <div className={styles.sectionIntro}>
            <span className={styles.eyebrow}>Herramientas para decidir</span>
            <h2 id="tools-title">Divisas e inversiones también forman parte del contexto.</h2>
            <p>
              Fynar no trata estas herramientas como datos aislados: sirven para
              comparar escenarios y entender mejor el impacto de una decisión
              antes de llevarla a tus finanzas reales.
            </p>
          </div>

          <div className={styles.showcaseGrid}>
            <article className={styles.showcaseCard}>
              <div className={styles.showcaseHeader}>
                <div className={styles.showcaseIcon}>
                  <ArrowLeftRight size={24} aria-hidden="true" />
                </div>
                <div>
                  <span>Divisas</span>
                  <h3>Conversor de monedas con tasa de referencia.</h3>
                </div>
              </div>
              <p>
                Selecciona una moneda de origen y otra de destino, introduce un
                monto y consulta el resultado aproximado junto con la tasa usada
                y su fecha de referencia.
              </p>
              <ul className={styles.showcaseList}>
                <li><CheckCircle2 size={16} aria-hidden="true" /> Conversión entre monedas disponibles.</li>
                <li><CheckCircle2 size={16} aria-hidden="true" /> Tasa directa e inversa para dar contexto.</li>
                <li><CheckCircle2 size={16} aria-hidden="true" /> No modifica cuentas, movimientos ni saldos.</li>
              </ul>
            </article>

            <article className={styles.showcaseCard}>
              <div className={styles.showcaseHeader}>
                <div className={styles.showcaseIcon}>
                  <TrendingUp size={24} aria-hidden="true" />
                </div>
                <div>
                  <span>Inversiones</span>
                  <h3>Simula primero y registra aportes cuando sean reales.</h3>
                </div>
              </div>
              <p>
                Prueba monto inicial, aportes periódicos, horizonte, rentabilidad,
                inflación y comisiones. Después puedes guardar el escenario como
                plan y comparar su evolución con lo que realmente has aportado.
              </p>
              <ul className={styles.showcaseList}>
                <li><CheckCircle2 size={16} aria-hidden="true" /> Escenarios conservador, base y optimista.</li>
                <li><CheckCircle2 size={16} aria-hidden="true" /> Comparación opcional con tu liquidez actual.</li>
                <li><CheckCircle2 size={16} aria-hidden="true" /> Simular nunca mueve dinero por sí solo.</li>
              </ul>
            </article>
          </div>
        </section>

        <section className={styles.flowSection} aria-labelledby="flow-title">
          <div className={styles.sectionIntro}>
            <span className={styles.eyebrow}>De datos a decisiones</span>
            <h2 id="flow-title">La experiencia está pensada para responder rápido.</h2>
          </div>
          <div className={styles.flowGrid}>
            <article className={styles.flowStep}>
              <span className={styles.stepNumber}>01</span>
              <PiggyBank size={22} aria-hidden="true" />
              <h3>Centraliza</h3>
              <p>Registra cuentas, movimientos, metas, deudas y compromisos en un solo lugar.</p>
            </article>
            <article className={styles.flowStep}>
              <span className={styles.stepNumber}>02</span>
              <BarChart3 size={22} aria-hidden="true" />
              <h3>Entiende</h3>
              <p>Compara ingresos, egresos, categorías, presupuestos y señales de salud financiera.</p>
            </article>
            <article className={styles.flowStep}>
              <span className={styles.stepNumber}>03</span>
              <LineChart size={22} aria-hidden="true" />
              <h3>Anticipa</h3>
              <p>Revisa proyecciones y simulaciones antes de tomar decisiones que afecten tu dinero.</p>
            </article>
          </div>
        </section>

        <section className={styles.demoPitch} aria-labelledby="demo-title">
          <div>
            <span className={styles.eyebrow}>Conoce Fynar sin registrarte</span>
            <h2 id="demo-title">Una cuenta completa de ejemplo, lista para explorar.</h2>
            <p>
              Entra a una cuenta de demostración con un año de historial, datos
              realistas y los mismos módulos que usarías en una cuenta normal.
            </p>
            <div className={styles.landingActions}>
              <a className={styles.primaryCta} href="/demo">
                Entrar a la demo
              </a>
              <Link className={styles.secondaryCta} to="/register">
                Crear mi cuenta
              </Link>
            </div>
          </div>
          <ul className={styles.demoPitchList}>
            <li><CheckCircle2 size={17} aria-hidden="true" /> Cinco cuentas con saldos y disponible realista.</li>
            <li><CheckCircle2 size={17} aria-hidden="true" /> Un año de movimientos, ingresos, egresos y transferencias.</li>
            <li><CheckCircle2 size={17} aria-hidden="true" /> Presupuestos, metas, gráficos y proyecciones financieras.</li>
            <li><CheckCircle2 size={17} aria-hidden="true" /> Créditos, pagos recurrentes y préstamos informales.</li>
            <li><CheckCircle2 size={17} aria-hidden="true" /> Conversor de divisas y experiencia de inversiones.</li>
            <li><CheckCircle2 size={17} aria-hidden="true" /> Puedes probar cambios sin afectar datos personales reales.</li>
          </ul>
        </section>
      </main>

      <footer className={styles.landingFooter}>
        <span>Fynar · claridad para tus decisiones financieras.</span>
        <span><Link to="/privacy">Privacidad</Link> · <Link to="/terms">Términos</Link></span>
      </footer>
    </div>
  )
}
