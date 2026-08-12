import type { ReactNode } from 'react'
import { Card, PageHeader } from '@/components/ui'
import { APP_NAME } from '@/config/brand'
import { ForgotPasswordForm } from '../components/ForgotPasswordForm'
import { LoginForm } from '../components/LoginForm'
import { RegisterForm } from '../components/RegisterForm'
import { ResetPasswordForm } from '../components/ResetPasswordForm'
import styles from '../components/auth.module.css'

function AuthPage({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <section className={styles.page}>
      <PageHeader title={title} description={description} />
      <Card raised>{children}</Card>
    </section>
  )
}
export const LoginPage = () => (
  <AuthPage
    title="Iniciar sesión"
    description="Accede de forma segura a tu espacio financiero."
  >
    <LoginForm />
  </AuthPage>
)
export const RegisterPage = () => (
  <AuthPage
    title="Crear cuenta"
    description={`Crea tu acceso personal a ${APP_NAME}.`}
  >
    <RegisterForm />
  </AuthPage>
)
export const ForgotPasswordPage = () => (
  <AuthPage
    title="Recuperar contraseña"
    description="Recibe instrucciones para recuperar tu acceso."
  >
    <ForgotPasswordForm />
  </AuthPage>
)
export const ResetPasswordPage = () => (
  <AuthPage
    title="Restablecer contraseña"
    description="Define una nueva contraseña para tu cuenta."
  >
    <ResetPasswordForm />
  </AuthPage>
)
