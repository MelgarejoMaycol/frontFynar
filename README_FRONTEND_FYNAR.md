# Fynar Frontend Web

Frontend web de **Fynar**, una plataforma de finanzas personales orientada a ayudar al usuario a entender:

1. **Dónde está su dinero.**
2. **En qué se está gastando.**
3. **Qué puede pasar con sus finanzas.**

Este documento es la fuente principal de contexto para cualquier desarrollador o agente de IA que trabaje en el frontend. Antes de modificar el proyecto, debe leerse completo.

---

## 1. Estado actual del proyecto

- El backend del MVP ya tiene una base funcional.
- El proyecto frontend con React, TypeScript y Vite ya fue creado.
- El desarrollo del frontend comienza en la **Fase 0 — Base técnica**.
- No se deben crear todavía pantallas financieras completas ni inventar datos.
- La primera integración funcional posterior a la base técnica será autenticación.
- Antes de instalar, eliminar o reemplazar una dependencia, se debe revisar el `package.json` real.
- No se debe avanzar a una fase nueva hasta terminar y validar la anterior.

### Backend local

```text
http://localhost:3000
```

### Prefijo de la API

```text
/api/v1
```

### Endpoints ya probados

```http
GET  /api/v1/health/live
GET  /api/v1/health/ready
POST /api/v1/auth/register
POST /api/v1/auth/login
```

También pueden existir o incorporarse durante la integración:

```http
POST /api/v1/auth/refresh
POST /api/v1/auth/logout
POST /api/v1/auth/logout-all
GET  /api/v1/auth/me
POST /api/v1/auth/forgot-password
POST /api/v1/auth/reset-password
```

Codex debe verificar las rutas y contratos reales del backend antes de implementar cada consumo. No debe deducir respuestas, nombres de campos o mecanismos de almacenamiento sin revisar el backend.

---

## 2. Objetivo del producto

Fynar es una aplicación web y móvil para administrar finanzas personales desde una misma cuenta.

El MVP debe permitir:

- Registro e inicio de sesión.
- Persistencia y renovación segura de sesión.
- Gestión de cuentas financieras.
- Gestión de categorías.
- Registro de ingresos.
- Registro de gastos.
- Registro de transferencias.
- Historial con búsqueda, filtros, edición y eliminación.
- Dashboard con información financiera real.
- Presupuestos mensuales simples.
- Reportes básicos.
- Perfil y preferencias esenciales.
- Experiencia responsive y accesible.

El frontend no es una aplicación contable tradicional. Debe sentirse como un **copiloto financiero claro, moderno y fácil de usar**.

---

## 3. Alcance del MVP

### Incluido

#### Autenticación

- Registro.
- Inicio de sesión.
- Renovación de sesión.
- Cierre de sesión.
- Consulta del usuario actual.
- Recuperación de contraseña cuando el backend la exponga.
- Rutas públicas y privadas.

#### Dashboard

- Dinero disponible.
- Ingresos del mes.
- Gastos del mes.
- Flujo neto.
- Saldos por cuenta.
- Últimos movimientos.
- Presupuesto restante.
- Próximo pago cuando el backend lo soporte.

#### Cuentas financieras

- Crear.
- Consultar.
- Editar.
- Marcar como favorita.
- Archivar o eliminar lógicamente.
- Diferenciar activos y pasivos.

Ejemplos:

- Efectivo.
- Cuenta bancaria.
- Cuenta de ahorros.
- Nequi.
- Daviplata.
- Billetera digital.
- Tarjeta de crédito.
- Inversión.
- Préstamo.

#### Categorías

- Listar categorías globales y personalizadas.
- Crear categorías personalizadas.
- Editar.
- Archivar.
- Seleccionar icono y color.
- Separar por tipo.

Tipos:

```text
INCOME
EXPENSE
TRANSFER
INVESTMENT
```

#### Movimientos

- Ingreso.
- Gasto.
- Transferencia.
- Historial.
- Filtros.
- Búsqueda.
- Paginación.
- Consulta de detalle.
- Edición.
- Eliminación o cancelación según la API.

#### Presupuestos

- Crear presupuesto mensual.
- Asociar categorías.
- Mostrar monto.
- Mostrar gastado.
- Mostrar disponible.
- Mostrar porcentaje utilizado.
- Mostrar estado normal, advertencia o excedido.

#### Reportes básicos

- Ingresos frente a gastos.
- Gastos por categoría.
- Gastos por mes.
- Flujo de caja.
- Saldos por cuenta.

### Fuera del MVP inicial

No implementar hasta que la hoja de ruta lo indique:

- Deudas y cronogramas completos.
- Metas de ahorro.
- Calendario financiero.
- Notificaciones push.
- WebSockets.
- Sincronización en tiempo real.
- Adjuntos.
- Simulaciones financieras.
- Pronósticos.
- Recomendaciones de IA.
- Multiworkspace avanzado.
- Panel administrativo.
- Integraciones bancarias.

La arquitectura puede quedar preparada, pero no se deben construir funcionalidades ficticias o incompletas.

---

## 4. Stack tecnológico

### Base

- **React 19**
- **TypeScript**
- **Vite**

### Navegación

- **React Router**

### Datos remotos

- **TanStack Query**

Responsabilidades:

- Consultas.
- Mutaciones.
- Caché de servidor.
- Reintentos controlados.
- Invalidación de datos.
- Estados de carga y error.

### Estado global

- **Zustand**

Usarlo únicamente para estado global de cliente que realmente deba compartirse.

Ejemplos válidos:

- Estado mínimo de sesión.
- Workspace activo.
- Preferencias locales necesarias.
- Estado global de interfaz justificado.

No duplicar en Zustand datos cuyo dueño natural sea TanStack Query.

### Formularios

- **React Hook Form**
- **Zod**

Todos los formularios deben:

- Tener esquema de validación.
- Mostrar errores por campo.
- Bloquear envíos duplicados.
- Manejar errores del backend.
- Mantener tipado completo.

### UI y estilos

- **Bootstrap**
- **CSS Modules**
- Componentes propios reutilizables.

No mezclar estilos sin una estrategia clara.

Bootstrap puede usarse para:

- Grid.
- Utilidades.
- Estructura responsive.
- Componentes base cuando encajen con el diseño.

CSS Modules debe usarse para:

- Estilos específicos de componentes.
- Variantes visuales propias de Fynar.
- Evitar colisiones de nombres.
- Mantener estilos cercanos a su componente.

### Calidad

- ESLint como herramienta principal de lint si el proyecto ya quedó configurado con ESLint.
- Prettier para formato.
- TypeScript en modo estricto.
- Pruebas proporcionales al riesgo.
- Build limpio antes de cerrar una fase.

No mantener ESLint y Oxlint ejecutando reglas duplicadas sin una justificación explícita.

---

## 5. Identidad visual

### Colores principales

```css
--color-primary: #154b45;
--color-secondary: #5d8c74;
--color-surface-soft: #eaf3ee;
--color-dark: #0d2b28;
```

Estos colores son el punto de partida, no una excusa para usar verde en todos los elementos.

Se deben definir adicionalmente tokens para:

- Fondo.
- Superficie.
- Texto principal.
- Texto secundario.
- Bordes.
- Éxito.
- Advertencia.
- Error.
- Información.
- Estados hover.
- Estados focus.
- Elementos deshabilitados.

### Principios visuales

- Diseño limpio.
- Sensación profesional.
- Jerarquía visual clara.
- Espaciado consistente.
- Tarjetas legibles.
- Formularios simples.
- Gráficas comprensibles.
- Contraste suficiente.
- Estados vacíos útiles.
- Animaciones suaves y breves.
- No depender únicamente del color para comunicar estados.

---

## 6. Principios de experiencia de usuario

### Rapidez

Registrar un gasto debe requerir pocos pasos.

Campos mínimos previstos:

- Monto.
- Cuenta.
- Categoría.
- Fecha.
- Descripción o nota.

El campo monto debe poder recibir foco inicial cuando corresponda.

### Claridad

Cada pantalla debe responder una pregunta concreta.

Ejemplos:

- Dashboard: ¿cómo están mis finanzas?
- Cuentas: ¿dónde está mi dinero?
- Movimientos: ¿qué pasó con mi dinero?
- Presupuestos: ¿cuánto puedo seguir gastando?
- Reportes: ¿cómo ha cambiado mi comportamiento?

### Información accionable

No mostrar números sin contexto.

Ejemplo incorrecto:

```text
80 %
```

Ejemplo correcto:

```text
Has usado el 80 % del presupuesto de alimentación.
Te quedan $120.000 para terminar el mes.
```

### Feedback inmediato

Toda acción debe tener:

- Estado de carga.
- Confirmación.
- Error comprensible.
- Prevención de doble envío.
- Actualización de la información persistida.

Nunca agregar datos locales ficticios para aparentar que una operación fue exitosa.

### Responsive

La aplicación debe funcionar desde 320 px hasta escritorio.

- Escritorio: sidebar y header.
- Tablet: navegación adaptable.
- Móvil: navegación compacta y acciones principales accesibles.

---

## 7. Arquitectura del frontend

El frontend debe organizarse por funcionalidades, no como una colección de carpetas genéricas llenas de archivos sin relación.

### Estructura recomendada

```text
src/
├── app/
│   ├── providers/
│   ├── router/
│   └── store/
├── assets/
│   ├── icons/
│   ├── images/
│   └── logos/
├── components/
│   ├── feedback/
│   ├── layout/
│   └── ui/
├── features/
│   ├── auth/
│   ├── accounts/
│   ├── categories/
│   ├── transactions/
│   ├── dashboard/
│   ├── budgets/
│   ├── reports/
│   └── profile/
├── hooks/
├── lib/
├── services/
├── styles/
├── types/
└── main.tsx
```

### Estructura interna sugerida por feature

```text
features/auth/
├── api/
│   └── auth.api.ts
├── components/
├── hooks/
├── pages/
├── schemas/
│   └── auth.schemas.ts
├── types/
│   └── auth.types.ts
└── index.ts
```

Esta estructura puede adaptarse según el tamaño real del módulo. No se deben crear archivos vacíos solo por cumplir una plantilla.

### Responsabilidades

#### `app/`

Configuración global:

- Providers.
- Router.
- Store global.
- Arranque de la aplicación.

#### `components/ui/`

Componentes genéricos y reutilizables:

- Button.
- Input.
- Select.
- Modal.
- Card.
- Badge.
- Tooltip.
- Dropdown.
- Table.

No deben contener reglas financieras.

#### `components/feedback/`

- Spinner.
- Skeleton.
- EmptyState.
- ErrorState.
- Toast o alertas.
- Confirmación.

#### `components/layout/`

- AuthLayout.
- AppLayout.
- Sidebar.
- Header.
- MobileNavigation.

#### `features/`

Todo lo específico de cada dominio.

#### `services/`

Infraestructura compartida:

- Cliente HTTP.
- Gestión central de tokens si aplica.
- Adaptadores generales.

#### `lib/`

Utilidades sin dependencia visual:

- Formateo de moneda.
- Formateo de fechas.
- Validaciones comunes.
- Constantes.
- Helpers.

---

## 8. Reglas de separación de responsabilidades

### Componentes de presentación

Deben:

- Recibir propiedades.
- Renderizar UI.
- Emitir eventos.
- Tener poca o ninguna lógica de acceso a datos.

### Hooks

Deben:

- Orquestar comportamiento reutilizable.
- Encapsular queries o mutaciones cuando sea útil.
- No convertirse en servicios gigantes.

### Servicios de API

Deben:

- Conocer rutas HTTP.
- Enviar request.
- Recibir response.
- Tipar contratos.
- No mostrar notificaciones.
- No navegar.
- No contener JSX.

### TanStack Query

Debe:

- Administrar datos provenientes del backend.
- Mantener caché.
- Invalidar recursos relacionados.
- Manejar estados remotos.

### Zustand

Debe:

- Mantener solo estado global de cliente.
- Tener una responsabilidad concreta.
- Evitar almacenar listas financieras que ya estén en TanStack Query.

### Páginas

Deben:

- Componer componentes.
- Conectar comportamiento.
- Resolver el flujo de pantalla.
- Evitar acumular toda la lógica en un único archivo.

---

## 9. Integración con la API

### Variable de entorno

```env
VITE_API_BASE_URL=http://localhost:3000/api/v1
```

Crear también:

```text
.env.example
```

Nunca incluir secretos en variables que comiencen por `VITE_`, porque quedan expuestas en el navegador.

### Cliente HTTP centralizado

Debe existir un único punto principal para:

- URL base.
- Encabezados comunes.
- Credenciales cuando aplique.
- Identificador de solicitud cuando sea útil.
- Tratamiento uniforme de errores.
- Renovación de sesión.
- Prevención de bucles de refresh.

No se deben distribuir llamadas `fetch` o clientes HTTP configurados por todas las pantallas.

### Contratos

No asumir que el backend retorna directamente el recurso.

El backend puede usar una estructura similar a:

```json
{
  "success": true,
  "data": {},
  "meta": {}
}
```

Y para errores puede usar una estructura uniforme con campos como:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "La información enviada no es válida",
    "details": []
  }
}
```

Codex debe confirmar el contrato real en el backend antes de escribir adaptadores o tipos definitivos.

### Regla sobre errores

Los errores deben transformarse en un modelo usable por la UI.

La pantalla necesita poder distinguir:

- Error de validación.
- Credenciales inválidas.
- Sesión vencida.
- Recurso no encontrado.
- Conflicto.
- Falta de permisos.
- Error de red.
- Error interno.

No mostrar al usuario trazas, detalles internos ni mensajes técnicos del servidor.

---

## 10. Autenticación y seguridad de sesión

La estrategia exacta depende del backend real.

Antes de implementar persistencia, Codex debe verificar:

- Si el refresh token está en cookie `HttpOnly`.
- Si el access token se entrega en respuesta.
- Si el access token vive solo en memoria.
- Si la API requiere `credentials: include`.
- Cómo funciona la rotación.
- Qué retorna `/auth/me`.
- Qué ocurre al cerrar sesión.

### Reglas obligatorias

- Nunca almacenar contraseñas.
- No imprimir tokens en consola.
- No registrar información financiera sensible.
- No hacer refresh más de una vez para la misma respuesta 401.
- Evitar ciclos infinitos.
- No mostrar el área privada hasta resolver el estado inicial de sesión.
- Al cerrar sesión, limpiar:
  - Usuario.
  - Tokens administrados por el cliente.
  - Workspace activo.
  - Cachés financieras.
  - Estado privado de interfaz.

### Flujo inicial esperado

```text
Cargar aplicación
        ↓
Resolver sesión
        ↓
¿Sesión válida?
   ├── Sí → consultar usuario y workspace → área privada
   └── No → área pública
```

---

## 11. Workspace y aislamiento de datos

Toda la información financiera vive dentro de un `workspace`.

Al registrarse, el backend crea normalmente:

```text
Usuario
└── Workspace personal
    └── Membresía OWNER
```

Valores iniciales previstos:

```text
Moneda: COP
Zona horaria: America/Bogota
Tipo de workspace: PERSONAL
```

El frontend debe:

- Resolver el workspace activo.
- Conservar su identificador de forma segura.
- Enviarlo en las consultas que lo exijan.
- Limpiar su estado al cerrar sesión.
- Preparar un selector, aunque en el MVP normalmente exista uno solo.

Nunca asumir que un recurso pertenece al usuario únicamente porque se conoce su identificador. El backend es la autoridad y debe validar siempre el `workspaceId`.

---

## 12. Modelos principales que el frontend debe conocer

El frontend no reproduce la base de datos. Solo define los contratos necesarios para la interfaz.

### Usuario

Información visible esperada:

- `id`
- `email`
- `firstName`
- `lastName`
- `phone`
- `avatarUrl`
- `isEmailVerified`
- `lastLoginAt`

### Workspace

- `id`
- `name`
- `type`
- `baseCurrency`
- `timezone`
- `role`
- `permissions`

### Cuenta financiera

- `id`
- `name`
- `type`
- `nature`
- `openingBalance`
- `currentBalance`
- `currency`
- `creditLimit`
- `billingDay`
- `paymentDueDay`
- `includeInNetWorth`
- `isFavorite`
- `isActive`

`currentBalance` es calculado y administrado por el backend. El frontend no debe permitir editarlo directamente.

### Categoría

- `id`
- `name`
- `type`
- `icon`
- `color`
- `parentId`
- `isSystem`
- `isActive`

### Movimiento

- `id`
- `type`
- `status`
- `amount`
- `accountId`
- `destinationAccountId`
- `categoryId`
- `occurredAt`
- `description`
- `notes`
- `merchantName`
- `version`

### Presupuesto

- `id`
- `name`
- `period`
- `startDate`
- `endDate`
- `amount`
- `spent`
- `available`
- `percentage`
- `alertThreshold`
- `status`

Los nombres definitivos deben copiarse de la API real, no de este resumen.

---

## 13. Formateo de dinero y fechas

### Moneda

Para Colombia:

```ts
new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})
```

No concatenar manualmente `$` y separadores.

### Fechas

Usar `Intl.DateTimeFormat` o una utilidad central.

La zona horaria inicial del producto es:

```text
America/Bogota
```

No realizar conversiones improvisadas dentro de componentes.

### Cantidades monetarias

- No perder precisión.
- No usar lógica financiera compleja en React.
- No recalcular saldos oficiales.
- Mostrar los valores proporcionados por el backend.
- Confirmar cómo llegan los decimales desde Prisma/PostgreSQL.

---

## 14. Rutas previstas

### Públicas

```text
/login
/register
/forgot-password
/reset-password
```

### Privadas

```text
/app/dashboard
/app/accounts
/app/categories
/app/transactions
/app/budgets
/app/reports
/app/settings
```

### Generales

```text
/
*
```

La ruta raíz debe decidir su destino según la sesión.

La ruta `*` debe mostrar una página 404 coherente.

No habilitar una pantalla como funcional si todavía no existe integración real. Puede mostrarse un estado “próximamente” únicamente si está claramente identificado y no simula datos.

---

## 15. Manejo de estados

Toda pantalla de datos debe contemplar:

### Loading

- Skeleton cuando la estructura sea conocida.
- Spinner para acciones puntuales.
- Botones deshabilitados mientras se envía.

### Empty

Debe explicar:

- Qué falta.
- Por qué la pantalla está vacía.
- Qué acción puede realizar el usuario.

### Error

Debe:

- Explicar el problema en lenguaje claro.
- Permitir reintentar cuando tenga sentido.
- Mantener contexto.
- No culpar al usuario.
- No exponer detalles internos.

### Success

Debe:

- Confirmar acciones.
- Reflejar datos realmente guardados.
- Actualizar la caché correspondiente.

---

## 16. Accesibilidad

Requisitos mínimos:

- HTML semántico.
- `label` asociado a cada campo.
- Navegación por teclado.
- Foco visible.
- Contraste suficiente.
- Mensajes de error asociados al campo.
- Botones con nombres accesibles.
- Iconos decorativos ocultos para lectores de pantalla.
- Iconos funcionales con etiqueta.
- No depender únicamente del color.
- Modales con foco controlado.
- Tablas con encabezados correctos.
- Gráficas con alternativa textual o tabular.

---

## 17. Rendimiento

- Lazy loading por rutas.
- No descargar todos los movimientos para calcular reportes.
- No duplicar consultas.
- Configurar `staleTime` según el tipo de dato.
- Invalidar únicamente consultas relacionadas.
- Evitar renders innecesarios.
- Dividir componentes grandes.
- Cargar imágenes optimizadas.
- Evitar dependencias pesadas sin necesidad.
- No optimizar prematuramente sacrificando claridad.

---

## 18. Pruebas

La estrategia exacta se definirá en la Fase 0 según las dependencias existentes.

Mínimos recomendados:

### Unitarias

- Formateadores.
- Validadores.
- Mappers.
- Utilidades de errores.
- Stores críticos.

### Componentes

- Formularios.
- Estados de carga.
- Estados de error.
- Rutas protegidas.
- Confirmaciones.

### Integración

- Registro.
- Login.
- Consulta de usuario.
- Crear cuenta.
- Crear categoría.
- Registrar gasto.

### End-to-end

Flujos críticos:

```text
Registro → sesión → área privada
Login → dashboard
Crear cuenta → verla en listado
Crear categoría → usarla en gasto
Registrar gasto → verlo en historial y dashboard
Logout → impedir acceso privado
```

No es obligatorio llenar el proyecto de pruebas triviales. Se deben cubrir riesgos reales.

---

## 19. Scripts esperados

Los nombres definitivos deben adaptarse al proyecto real.

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "check": "npm run lint && npm run typecheck && npm run test && npm run build"
  }
}
```

No modificar los scripts sin revisar primero la configuración actual.

---

## 20. Convenciones de código

### TypeScript

- Evitar `any`.
- Preferir `unknown` y validación.
- Tipar requests y responses.
- Usar uniones discriminadas cuando representen estados.
- No duplicar interfaces equivalentes.
- No usar `as` para ocultar errores de tipado.
- No usar `@ts-ignore` salvo caso excepcional documentado.

### Componentes

- Un componente debe tener una responsabilidad clara.
- Evitar archivos gigantes.
- Extraer lógica repetida.
- No crear abstracciones prematuras.
- Props tipadas.
- Eventos con nombres claros.

### Nombres

- Componentes: `PascalCase`.
- Hooks: `useSomething`.
- Funciones y variables: `camelCase`.
- Constantes: `UPPER_SNAKE_CASE` cuando sean verdaderamente globales.
- Archivos de componentes: convención consistente en todo el proyecto.
- Tipos: nombres del dominio, no nombres genéricos como `Data` o `Item`.

### Imports

Usar alias configurados:

```ts
import { Button } from '@/components/ui/Button'
import { useSession } from '@/features/auth/hooks/useSession'
```

Evitar rutas profundas como:

```ts
../../../../components/ui/Button
```

### Comentarios

Comentar:

- Decisiones no obvias.
- Reglas de negocio.
- Workarounds temporales.
- Razones de seguridad.

No comentar lo que el código ya expresa claramente.

---

## 21. Reglas para Codex

Antes de hacer cambios:

1. Leer este README.
2. Revisar `package.json`.
3. Revisar la estructura real.
4. Revisar configuración de TypeScript.
5. Revisar configuración de lint y formato.
6. Revisar `.env.example` si existe.
7. Revisar contratos del backend relacionados con la tarea.
8. Identificar la fase actual.
9. Proponer un plan breve.
10. Modificar únicamente lo necesario.

Durante la implementación:

- No cambiar diseño, arquitectura o dependencias fuera del alcance sin justificarlo.
- No avanzar a módulos posteriores.
- No borrar código funcional sin comprobar su uso.
- No inventar endpoints.
- No inventar respuestas.
- No usar datos ficticios en el flujo principal.
- No duplicar estado.
- No guardar secretos.
- No ocultar errores de TypeScript.
- No dejar imports rotos.
- No dejar archivos muertos.
- No alterar el backend desde el repositorio frontend.
- Mantener compatibilidad con Windows.
- Mantener el MVP como prioridad.

Después de implementar:

1. Ejecutar lint.
2. Ejecutar typecheck.
3. Ejecutar pruebas.
4. Ejecutar build.
5. Informar archivos creados.
6. Informar archivos modificados.
7. Explicar decisiones.
8. Reportar comandos ejecutados.
9. Reportar resultados reales.
10. Indicar cualquier pendiente sin ocultarlo.

---

## 22. Fases del frontend

### Fase 0 — Base técnica

Objetivo: dejar el proyecto estable, organizado y listo para crear funcionalidades.

Tareas:

- Confirmar React, TypeScript y Vite.
- Revisar ESLint/Oxlint y elegir una estrategia única.
- Mantener Prettier.
- Configurar alias.
- Crear `.env.example`.
- Definir `VITE_API_BASE_URL`.
- Instalar o validar React Router.
- Instalar o validar TanStack Query.
- Instalar o validar Zustand.
- Instalar o validar React Hook Form.
- Instalar o validar Zod.
- Configurar Bootstrap.
- Definir CSS global y CSS Modules.
- Crear estructura de carpetas.
- Crear cliente HTTP.
- Crear providers.
- Crear router base.
- Crear manejo global de errores.
- Crear estados de feedback.
- Definir scripts.
- Verificar build.

**No crear todavía el diseño completo de login ni implementar módulos financieros.**

### Fase 1 — Sistema visual y navegación

- Tokens.
- Tipografía.
- Componentes base.
- AuthLayout.
- AppLayout.
- Sidebar.
- Header.
- Navegación responsive.
- Rutas públicas y privadas.
- 404.
- Feedback visual.

### Fase 2 — Autenticación y sesión

- Registro.
- Login.
- Refresh.
- `/auth/me`.
- Logout.
- Protección de rutas.
- Errores.
- Persistencia correcta.

### Fase 3 — Usuario y workspace

- Perfil.
- Preferencias.
- Workspace activo.
- Moneda y zona horaria.
- Contexto financiero.

### Fase 4 — Cuentas

- Listado.
- Crear.
- Editar.
- Detalle.
- Favorita.
- Archivar.

### Fase 5 — Categorías

- Listado.
- Crear.
- Editar.
- Archivar.
- Selector reutilizable.

### Fase 6 — Movimientos

- Ingreso.
- Gasto.
- Transferencia.
- Historial.
- Filtros.
- Edición.
- Eliminación.

### Fase 7 — Dashboard

- Resúmenes.
- Gráficas.
- Movimientos recientes.
- Acciones rápidas.

### Fase 8 — Presupuestos

- CRUD permitido por la API.
- Progreso.
- Alertas.
- Integración con movimientos.

### Fase 9 — Reportes

- Gráficas.
- Filtros.
- Tablas alternativas.
- Datos derivados desde endpoints de reportes.

### Fase 10 — Perfil y preferencias

- Datos personales.
- Tema.
- Moneda.
- Zona horaria.
- Sesiones.

### Fase 11 — Calidad y producción

- Pruebas.
- Accesibilidad.
- Rendimiento.
- CI.
- Vercel.
- CORS.
- Monitoreo.

---

## 23. Definición de terminado

Una fase no está terminada solo porque se vea bien.

Debe cumplir:

- Funciona con la API real cuando aplique.
- No depende de datos simulados en el flujo principal.
- Maneja loading.
- Maneja empty.
- Maneja error.
- Maneja success.
- Es responsive.
- Tiene accesibilidad básica.
- Cumple validaciones.
- No contiene errores de TypeScript.
- No contiene errores de lint.
- Tiene pruebas proporcionales al riesgo.
- El build termina correctamente.
- Respeta la arquitectura.
- Se puede probar desde el flujo completo.

---

## 24. Checklist obligatorio por feature

```text
[ ] Carpeta del feature creada o validada.
[ ] Tipos de request y response definidos.
[ ] Esquemas Zod definidos.
[ ] Servicio de API creado.
[ ] Queries y mutaciones configuradas.
[ ] Componentes de presentación creados.
[ ] Formularios validados.
[ ] Estados loading, empty, error y success.
[ ] Permisos y visibilidad considerados.
[ ] Responsive verificado.
[ ] Accesibilidad básica verificada.
[ ] Pruebas creadas.
[ ] Integración real con backend probada.
[ ] Typecheck correcto.
[ ] Lint correcto.
[ ] Build correcto.
```

---

## 25. Estado de implementación

La Fase 0 de base técnica y la Fase 1 de sistema visual y navegación están
completadas. El título del encabezado se resuelve desde la configuración única
de navegación tanto para rutas exactas como para futuras subrutas.

La Fase 2 de autenticación y sesión está completada. Incorpora los contratos reales del backend para registro, login,
usuario actual, refresh, logout y recuperación de contraseña; formularios con
React Hook Form y Zod; sesión en Zustand; caché remota en TanStack Query;
guards públicos y privados; y renovación concurrente coordinada.

`VITE_API_BASE_URL` contiene la raíz versionada `/api/v1`. Por ello, todas las
rutas consumidas por el cliente HTTP son relativas a esa raíz (`/auth/login`,
`/auth/register`, `/auth/refresh`, etc.) y no deben volver a incluir `/api/v1`.

El access token se conserva exclusivamente en memoria. El refresh token se
transporta mediante una cookie `HttpOnly` administrada por el backend y nunca
se guarda en Zustand, `localStorage`, `sessionStorage` ni IndexedDB. Axios usa
`withCredentials` y, al arrancar la aplicación, `SessionInitializer` ejecuta
`POST /auth/refresh`, recibe un nuevo access token y consulta `/auth/me`. La
rotación mantiene un único refresh concurrente; logout revoca la sesión actual
y logout all revoca todas las sesiones antes de limpiar los datos privados.

La identidad visual utiliza los recursos oficiales disponibles en `public` a
través del componente reutilizable `BrandLogo`.

La composición responsive fue verificada en Chrome a 320, 375, 768, 1024,
1366 y 1920 px sobre todas las rutas públicas e internas preparatorias. Las
pantallas financieras siguen siendo placeholders y no se implementó la Fase 3.

## 26. Cierre de la Fase 2

La restauración tras recarga y pestaña nueva, el logout de la sesión actual y
el logout de todas las sesiones fueron comprobados con frontend, backend y
PostgreSQL reales. También se verificaron la cookie `HttpOnly`, la ausencia de
tokens persistentes en el navegador y las rutas protegidas. **FASE 2 FRONTEND:
COMPLETADA.** No se inició la Fase 3.

## 27. Fase 3 — usuario, workspace y contexto activo

El usuario autenticado se obtiene mediante `/auth/me`. Los datos remotos de
contexto se mantienen en TanStack Query: `GET /workspaces` usa la clave
`['workspaces']` y `GET /users/me/preferences` usa
`['users', 'me', 'preferences']`. El frontend no duplica perfil, preferencias,
lista de workspaces, roles ni permisos dentro de Zustand.

Zustand conserva solamente `activeWorkspaceId` en memoria. La fuente persistente
es el backend: cada workspace indica `isDefault` y la selección se guarda con
`POST /workspaces/:workspaceId/select`. Tras F5, la sesión se restaura mediante
la cookie HttpOnly, se consultan los workspaces y se selecciona primero el ID
actual si sigue siendo válido, luego el workspace predeterminado y finalmente el
primer workspace disponible. No se utiliza `localStorage` para esta selección.

`WorkspaceGate` protege centralmente las rutas financieras preparatorias y
distingue loading, error, empty y ready. Settings permanece accesible para
gestionar la sesión incluso si el usuario no tiene workspace. El header comparte
la query y muestra el workspace real; cuando existen varios permite seleccionarlo
sin recargar la página. Al cambiar se eliminan únicamente cachés financieras
dependientes del workspace y se conservan las queries globales de usuario y
workspaces.

El contrato expone `role`, `permissions`, `baseCurrency` y `timezone` por
workspace. Los permisos solo sirven como ayuda de presentación mediante
`hasPermission`; la autoridad continúa en el middleware de membresía y RBAC del
backend. Settings muestra contexto, moneda y zona horaria del workspace y las
preferencias reales como datos de solo lectura. Logout y logout all eliminan el
ID activo y toda la caché privada para impedir que otro usuario herede contexto.

Las páginas de movimientos, dashboard financiero, presupuestos y reportes no
consumen todavía sus endpoints. Continúan siendo placeholders sin cifras ni
datos simulados. Cuentas y categorías ya consumen exclusivamente el backend
real.

---

## 28. Fase 4 — cuentas financieras

El feature `src/features/accounts` consume exclusivamente las rutas reales bajo
`/workspaces/:workspaceId/accounts`. Las claves `['accounts', workspaceId]` y
`['accounts', workspaceId, accountId]` aíslan listado y detalle entre workspaces.
TanStack Query conserva los datos remotos; Zustand no almacena cuentas.

La interfaz permite listar, crear, consultar, editar, marcar como favorita y
archivar una cuenta cuando la membresía expone `accounts.write`. Los usuarios de
solo lectura mantienen listado y detalle. El backend continúa siendo la autoridad
para `accounts.read`, `accounts.write`, membresía y coherencia de tipo/naturaleza.

Los formularios usan React Hook Form y Zod con los enums reales. Las tarjetas de
crédito muestran cupo, día de corte y día límite; esos campos se limpian para los
demás tipos. La moneda inicial proviene de `baseCurrency` y los montos se envían
como strings decimales. `currentBalance` nunca forma parte de POST o PATCH y solo
se presenta con `Intl.NumberFormat`.

El listado diferencia loading, empty, error y success. Crear, editar, favorito y
archivar invalidan únicamente las claves del workspace correspondiente. El
archivado usa `POST /:accountId/archive`, conserva la fila y la retira del listado
activo. Los conflictos 409 informan que debe restaurarse la cuenta anterior o
usarse otro nombre. El detalle no consulta movimientos y declara expresamente que
se habilitarán en una fase posterior.

La Fase 4 quedó validada con el backend real: alta, persistencia después de
recargar, edición, conflicto de nombre, tarjeta de crédito, favorito, detalle y
archivado. Las mutaciones esperan la invalidación de caché antes de comunicar
éxito y los payloads nunca incluyen `currentBalance`.

---

## 29. Fase 5 — categorías

El feature `src/features/categories` consume las rutas reales bajo
`/workspaces/:workspaceId/categories`. La clave `['categories', workspaceId]`
mantiene aislada la caché remota de cada workspace y se invalida después de
crear, editar o archivar.

La interfaz combina categorías globales del sistema y personalizadas, permite
filtrar por ingreso, gasto, transferencia o inversión y oculta acciones de
escritura sobre categorías del sistema. Los permisos visuales usan
`categories.write`; el backend conserva la autoridad definitiva.

El formulario usa React Hook Form y Zod con enums reales, colores hexadecimales
seguros y un catálogo fijo de iconos Lucide. La edición no envía `type`, porque
es inmutable en PATCH. El selector reutilizable filtra por tipo, excluye
archivadas y admite categorías globales y del workspace. Las relaciones padre
se limitan a raíces activas del mismo tipo.

El archivado es lógico mediante `DELETE /:categoryId`. No se fabrican borrados
locales ni datos de ejemplo. Los conflictos de duplicado, jerarquía o permisos
se presentan con un mensaje público seguro y el backend conserva las reglas de
unicidad y profundidad.

## 30. Criterio principal del proyecto

Fynar se construye como un MVP sólido, no como una demostración visual.

Cada decisión debe priorizar:

1. Funcionamiento real.
2. Seguridad.
3. Mantenibilidad.
4. Claridad.
5. Experiencia de usuario.
6. Rendimiento razonable.
7. Capacidad de crecimiento.

No se busca construir todo desde el principio. Se busca terminar correctamente cada fase antes de continuar.
