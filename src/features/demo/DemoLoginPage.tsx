import { Database, LogIn, RefreshCw, ShieldCheck } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { Button, Card, PageHeader } from '@/components/ui'
import { activateDemoSession } from './demo-session'
import { resetDemoDatabase } from './demo-backend'
import styles from './demo-login.module.css'

export function DemoLoginPage() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const enterDemo = () => {
    resetDemoDatabase()
    activateDemoSession(queryClient)
    navigate('/app/dashboard', { replace: true })
  }

  return (
    <section className={styles.page}>
      <PageHeader
        title="Entrar a la cuenta demo"
        description="Accede a Fynar como si fuera una cuenta real, con un año de historial y datos completamente locales."
      />
      <Card raised className={styles.card}>
        <div className={styles.demoIdentity}>
          <span className={styles.avatar}>AD</span>
          <div>
            <strong>Andrea Demo</strong>
            <span>demo@fynar.app</span>
          </div>
          <span className={styles.badge}>
            <ShieldCheck size={15} aria-hidden="true" />
            Cuenta de demostración
          </span>
        </div>

        <div className={styles.infoGrid}>
          <div>
            <Database size={18} aria-hidden="true" />
            <span>
              <strong>Datos locales</strong>
              Nada de lo que hagas en la demo modifica cuentas reales.
            </span>
          </div>
          <div>
            <RefreshCw size={18} aria-hidden="true" />
            <span>
              <strong>Demo completa</strong>
              Incluye cuentas, movimientos, categorías, presupuestos, metas,
              deudas, análisis y un año de actividad.
            </span>
          </div>
        </div>

        <Button className={styles.enterButton} onClick={enterDemo}>
          <LogIn size={19} aria-hidden="true" />
          Entrar al demo
        </Button>
        <p className={styles.hint}>
          Puedes crear cuentas, registrar movimientos y probar los módulos. Al
          volver a entrar desde aquí se restauran los datos originales de la demo.
        </p>
      </Card>
    </section>
  )
}
