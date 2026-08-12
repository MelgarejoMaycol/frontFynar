import { Link } from 'react-router'
import type { ReactNode } from 'react'
import { BrandLogo, Card, PageHeader } from '@/components/ui'
import styles from '../components/auth.module.css'

function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return <main className={styles.legalPage}><BrandLogo /><PageHeader title={title} description="Contenido inicial pendiente de revisión jurídica definitiva." /><Card className={styles.legalContent}>{children}</Card><Link to="/register">Volver a crear cuenta</Link></main>
}
export const TermsPage = () => <LegalPage title="Términos y Condiciones"><h2>Uso de la plataforma</h2><p>Esta página identifica la ubicación destinada a los términos aplicables al uso de Fynar. El texto jurídico definitivo será incorporado y versionado antes de su publicación formal.</p><h2>Aceptación</h2><p>Al crear una cuenta, la plataforma registra la fecha y versión asociadas a la aceptación expresa.</p></LegalPage>
export const PrivacyPage = () => <LegalPage title="Política de Privacidad"><h2>Tratamiento de información</h2><p>Esta página identifica la ubicación destinada a la política de privacidad de Fynar. Las finalidades, bases legales, plazos y derechos deberán completarse con contenido jurídico aprobado.</p><h2>Contacto y derechos</h2><p>La información oficial de contacto y el procedimiento para ejercer derechos se incorporarán en la versión jurídica definitiva.</p></LegalPage>
