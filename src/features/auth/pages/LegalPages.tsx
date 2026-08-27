import { Link } from 'react-router'
import type { ReactNode } from 'react'
import { BrandLogo, Card, PageHeader } from '@/components/ui'
import styles from '../components/auth.module.css'
import { legalConfig } from '@/config/legal'

function LegalPage({
  title,
  sections,
  children,
}: {
  title: string
  sections: { id: string; label: string }[]
  children: ReactNode
}) {
  return (
    <main className={styles.legalPage}>
      <BrandLogo />
      <PageHeader
        title={title}
        description={`Versión ${legalConfig.version} · Vigente desde ${legalConfig.effectiveDate}.`}
      />
      <div className={styles.legalLayout}>
        <nav className={styles.legalIndex} aria-label={`Índice de ${title}`}>
          <strong>En esta página</strong>
          {sections.map((section) => (
            <a key={section.id} href={`#${section.id}`}>
              {section.label}
            </a>
          ))}
        </nav>
        <Card className={styles.legalContent}>
          <dl className={styles.legalMetadata}>
            <div>
              <dt>Responsable</dt>
              <dd>{legalConfig.responsibleName}</dd>
            </div>
            <div>
              <dt>País</dt>
              <dd>{legalConfig.country}</dd>
            </div>
            <div>
              <dt>Contacto</dt>
              <dd>{legalConfig.contactEmail}</dd>
            </div>
          </dl>
          {children}
          <aside className={styles.legalNotice}>
            <strong>
              REQUIERE REVISIÓN LEGAL ANTES DEL LANZAMIENTO PÚBLICO.
            </strong>{' '}
            Este texto describe el funcionamiento técnico actual de la beta y no
            sustituye asesoría jurídica.
          </aside>
        </Card>
      </div>
      <div className={styles.legalActions}>
        <Link to="/register">Volver a crear cuenta</Link>
        <Link to="/login">Ir a iniciar sesión</Link>
      </div>
    </main>
  )
}
const termsSections = [
  ['terms-scope', 'Objeto y alcance'],
  ['terms-account', 'Cuenta y seguridad'],
  ['terms-use', 'Uso permitido'],
  ['terms-beta', 'Disponibilidad y beta'],
  ['terms-third-parties', 'Servicios de terceros'],
  ['terms-ending', 'Terminación y cambios'],
  ['terms-contact', 'Contacto'],
].map(([id, label]) => ({ id, label }))
const privacySections = [
  ['privacy-data', 'Datos recopilados'],
  ['privacy-purposes', 'Finalidades'],
  ['privacy-storage', 'Almacenamiento y terceros'],
  ['privacy-cookies', 'Cookies y sesiones'],
  ['privacy-security', 'Seguridad'],
  ['privacy-retention', 'Conservación y eliminación'],
  ['privacy-rights', 'Derechos'],
  ['privacy-changes', 'Cambios y contacto'],
].map(([id, label]) => ({ id, label }))

export const TermsPage = () => (
  <LegalPage title="Términos y Condiciones" sections={termsSections}>
    <h2 id="terms-scope">Objeto y alcance</h2>
    <p>
      Fynar es una herramienta de organización financiera personal. Sus
      cálculos, proyecciones y recordatorios son informativos y no constituyen
      asesoría financiera, contable, tributaria o legal.
    </p>
    <h2 id="terms-account">Cuenta y seguridad</h2>
    <p>
      Debes proporcionar información válida, proteger tus credenciales y
      notificarnos si detectas acceso no autorizado. Eres responsable de revisar
      la exactitud de los movimientos y saldos que registras.
    </p>
    <h2 id="terms-use">Uso permitido</h2>
    <p>
      No puedes utilizar Fynar para vulnerar sistemas, acceder a espacios
      ajenos, cargar contenido malicioso ni infringir derechos de terceros.
      Podemos limitar cuentas ante abuso, fraude o riesgos de seguridad.
    </p>
    <h2 id="terms-beta">Disponibilidad y beta</h2>
    <p>
      La beta puede presentar interrupciones, cambios y funcionalidades
      incompletas. Procuramos proteger la integridad de los datos, pero debes
      conservar los soportes financieros que necesites por obligaciones
      personales o legales.
    </p>
    <h2 id="terms-third-parties">Servicios de terceros</h2>
    <p>
      Algunas funciones dependen de proveedores de alojamiento, base de datos,
      correo, autenticación e imágenes. Su disponibilidad también está sujeta a
      las condiciones de esos proveedores.
    </p>
    <h2 id="terms-ending">Terminación y cambios</h2>
    <p>
      Puedes dejar de usar el servicio y solicitar la eliminación de tu cuenta.
      Los cambios materiales de estos términos deberán publicarse con una nueva
      versión y, cuando corresponda, requerir una nueva aceptación.
    </p>
    <h2 id="terms-contact">Contacto</h2>
    <p>
      Antes del lanzamiento público deberá publicarse un canal de soporte y la
      identificación legal del responsable del servicio.
    </p>
  </LegalPage>
)
export const PrivacyPage = () => (
  <LegalPage title="Política de Privacidad" sections={privacySections}>
    <h2 id="privacy-data">Datos recopilados</h2>
    <p>
      Fynar trata datos de registro y perfil, preferencias, sesiones, espacios
      de trabajo, cuentas financieras ingresadas por el usuario, movimientos,
      presupuestos, deudas, obligaciones y archivos de perfil. No solicita
      credenciales bancarias para los flujos actuales.
    </p>
    <h2 id="privacy-purposes">Finalidades</h2>
    <p>
      Los datos se usan para autenticarte, prestar las funciones financieras,
      mantener seguridad y sesiones, enviar comunicaciones solicitadas,
      diagnosticar errores y mejorar la estabilidad del producto.
    </p>
    <h2 id="privacy-storage">Almacenamiento y terceros</h2>
    <p>
      La aplicación utiliza proveedores de infraestructura para frontend,
      backend, PostgreSQL, correo, inicio de sesión con Google e imágenes. Solo
      se deben configurar los proveedores necesarios y con credenciales
      gestionadas fuera del código.
    </p>
    <h2 id="privacy-cookies">Cookies y sesiones</h2>
    <p>
      Fynar utiliza mecanismos de sesión y tokens para mantener el acceso
      seguro. Las cookies de autenticación se configuran desde el backend y no
      deben emplearse para publicidad comportamental.
    </p>
    <h2 id="privacy-security">Seguridad</h2>
    <p>
      Se aplican controles de acceso por workspace, permisos, validación de
      entradas, rotación de sesiones y filtrado de información sensible en logs.
      Ningún sistema puede garantizar seguridad absoluta.
    </p>
    <h2 id="privacy-retention">Conservación y eliminación</h2>
    <p>
      Los registros financieros pueden conservarse de forma lógica cuando son
      necesarios para mantener consistencia e historial. La eliminación completa
      o anonimización de una cuenta debe ejecutarse mediante el procedimiento
      habilitado por Fynar y una política de retención aprobada.
    </p>
    <h2 id="privacy-rights">Derechos</h2>
    <p>
      Puedes solicitar acceso, corrección, actualización o eliminación de tus
      datos, sujeto a obligaciones de conservación aplicables. Antes del
      lanzamiento público debe publicarse el canal y procedimiento formal para
      ejercer estos derechos.
    </p>
    <h2 id="privacy-changes">Cambios y contacto</h2>
    <p>
      Las modificaciones materiales se identificarán mediante una nueva versión.
      La identidad del responsable, jurisdicción y correo oficial de privacidad
      deben completarse antes del lanzamiento público.
    </p>
  </LegalPage>
)
