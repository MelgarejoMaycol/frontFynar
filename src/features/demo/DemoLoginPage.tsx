import { Database, Eye, LogIn, RefreshCw, ShieldCheck } from 'lucide-react'
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
        title="Iniciar sesión en la demo"
        description="Entra a una cuenta de Fynar preparada como una cuenta real, con un año de historial y datos completamente locales."
      />

      <Card raised className={styles.card}>
        <div className={styles.demoIdentity}>
          <span className={styles.avatar}>AD</span>
          <div>
            <strong>Andrea Demo</strong>
            <span>Cuenta personal de demostración</span>
          </div>
          <span className={styles.badge}>
            <ShieldCheck size={15} aria-hidden="true" />
            Modo demo seguro
          </span>
        </div>

        <div className={styles.loginPreview} aria-label="Credenciales de la cuenta demo">
          <label>
            <span>Correo electrónico</span>
            <input value="demo@fynar.app" readOnly aria-label="Correo electrónico demo" />
          </label>
          <label>
            <span>Contraseña</span>
            <div className={styles.passwordPreview}>
              <input value="fynar-demo-2026" type="password" readOnly aria-label="Contraseña demo" />
              <Eye size={18} aria-hidden="true" />
            </div>
          </label>
        </div>

        <Button className={styles.enterButton} onClick={enterDemo}>
          <LogIn size={21} aria-hidden="true" />
          Iniciar sesión en la cuenta demo
        </Button>

        <div className={styles.infoGrid}>
          <div>
            <Database size={18} aria-hidden="true" />
            <span>
              <strong>La aplicación real, con datos locales</strong>
              Después de entrar verás el mismo Inicio, Cuentas, Movimientos,
              Categorías, Presupuestos, Metas y Análisis que usa una cuenta normal.
            </span>
          </div>
          <div>
            <RefreshCw size={18} aria-hidden="true" />
            <span>
              <strong>Un año de actividad para explorar</strong>
              La cuenta incluye ingresos, egresos, varias cuentas, categorías,
              presupuestos, metas, compromisos y movimientos históricos para que
              las gráficas y reportes tengan información útil desde el primer momento.
            </span>
          </div>
        </div>

        <p className={styles.hint}>
          Dentro de la demo puedes crear cuentas y movimientos con los formularios
          normales de Fynar. Los cambios se guardan solo en este navegador y no
          afectan ninguna cuenta real. Al volver a entrar desde esta pantalla se
          restauran los datos iniciales de demostración.
        </p>
      </Card>
    </section>
  )
}
