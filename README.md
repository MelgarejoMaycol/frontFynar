<div align="center">

# Fynar — Frontend Web

### Plataforma de gestión financiera personal construida con React + TypeScript

[![Demo](https://img.shields.io/badge/Demo-fynar.vercel.app-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://fynar.vercel.app)
[![Backend](https://img.shields.io/badge/API-BackFynar-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/MelgarejoMaycol/BackFynar)

![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=flat-square&logo=vite&logoColor=white)
![Tests](https://img.shields.io/badge/Tests-Vitest-6E9F18?style=flat-square&logo=vitest&logoColor=white)

</div>

## Sobre Fynar

**Fynar** es una aplicación Full Stack orientada a centralizar y comprender las finanzas personales. Permite trabajar con cuentas, movimientos, presupuestos, reportes y obligaciones financieras desde una interfaz moderna, manteniendo las reglas financieras sensibles en el backend para evitar duplicar lógica de negocio entre clientes.

Este repositorio contiene el **cliente web** del proyecto. No se limita a ser una interfaz visual: implementa manejo de sesión, caché por workspace, formularios tipados, validación, estados asíncronos, pruebas automatizadas y una arquitectura organizada por funcionalidades.

> El objetivo técnico es que el frontend se encargue de la experiencia de usuario y que la API sea la fuente de verdad para saldos, agregados y reglas financieras.

## Funcionalidades principales

Actualmente el código está organizado alrededor de módulos funcionales reales del producto:

- **Autenticación:** registro, inicio de sesión, recuperación y restauración de sesión.
- **Dashboard:** resumen financiero y acceso rápido a información relevante.
- **Cuentas:** administración y consulta de cuentas financieras.
- **Categorías:** categorías del sistema y personalizadas para clasificar movimientos.
- **Movimientos:** ingresos, gastos, transferencias, historial, filtros y detalle.
- **Presupuestos:** creación y seguimiento del uso de presupuesto.
- **Pasivos y obligaciones:** deudas, tarjetas de crédito, cuotas, extractos, obligaciones recurrentes y próximos pagos.
- **Reportes:** visualización de información financiera agregada.
- **Preferencias y seguridad:** configuración de perfil, tema y sesión.
- **Workspaces:** aislamiento de la información financiera por espacio activo.

El módulo de pasivos contempla además modelos para estimaciones de crédito, simulaciones de prepago, cuotas, compras a crédito y estados de extracto.

## Qué demuestra este proyecto

Fynar está pensado como un producto mantenible y no como una colección de pantallas independientes. Entre las decisiones técnicas más importantes se encuentran:

- Arquitectura **feature-first** para mantener cada dominio aislado y escalable.
- Estado remoto administrado con **TanStack Query**.
- Estado local liviano con **Zustand**.
- Formularios con **React Hook Form + Zod**.
- Cliente HTTP centralizado con **Axios**.
- Tipado estricto con **TypeScript**.
- Separación entre lógica de presentación y reglas financieras del backend.
- Pruebas unitarias y de integración con **Vitest + Testing Library**.
- Pipeline de calidad con formato, lint, typecheck, tests y build de producción.

## Arquitectura del frontend

```text
src/
├── components/       # UI compartida
├── features/         # Dominios funcionales del producto
│   ├── accounts/
│   ├── auth/
│   ├── budgets/
│   ├── categories/
│   ├── dashboard/
│   ├── liabilities/
│   ├── reports/
│   ├── settings/
│   ├── transactions/
│   └── workspace/
├── layouts/          # Estructuras de navegación y página
└── services/         # Cliente HTTP y servicios compartidos
```

La comunicación sigue una dirección clara:

```text
Usuario
  ↓
React / UI
  ↓
Feature + hooks
  ↓
TanStack Query
  ↓
Axios / REST
  ↓
Fynar API
  ↓
PostgreSQL
```

## Seguridad de sesión

La estrategia de autenticación evita almacenar credenciales sensibles en el navegador:

- El **access token** se mantiene únicamente en memoria.
- El **refresh token** viaja mediante cookie `HttpOnly` y no se guarda en `localStorage` ni `sessionStorage`.
- La restauración de sesión utiliza refresh controlado para evitar solicitudes duplicadas.
- `logout` y `logout-all` limpian sesión, workspace y caché privada.
- Las consultas financieras incorporan el workspace activo para evitar mezclar información entre espacios.

## Stack técnico

| Área | Tecnologías |
| --- | --- |
| UI | React 19, Bootstrap, CSS Modules, Lucide |
| Lenguaje | TypeScript 6 |
| Build | Vite 8 |
| Routing | React Router |
| Datos remotos | TanStack Query, Axios |
| Estado local | Zustand |
| Formularios | React Hook Form |
| Validación | Zod |
| Testing | Vitest, Testing Library |
| Calidad | ESLint, Prettier, TypeScript |
| Deploy | Vercel |

## Calidad y automatización

El proyecto incluye un workflow de GitHub Actions y un comando único para validar el frontend antes de publicar cambios:

```bash
npm run check
```

Ese comando ejecuta:

```text
Prettier → ESLint → TypeScript → Tests → Build
```

Scripts principales:

```bash
npm run dev          # frontend + backend local
npm run dev:front    # solo Vite
npm run test         # pruebas automatizadas
npm run lint         # análisis estático
npm run typecheck    # validación de tipos
npm run build        # build de producción
npm run check        # pipeline completo de calidad
```

## Instalación local

### Requisitos

- Node.js 22 recomendado
- npm
- Backend de Fynar disponible localmente o mediante una URL pública

### Ejecutar

```bash
git clone https://github.com/MelgarejoMaycol/frontFynar.git
cd frontFynar
npm ci
copy .env.example .env
npm run dev
```

Por defecto:

```text
Frontend: http://localhost:5173
Backend:  http://localhost:3000
```

Variable pública requerida:

```dotenv
VITE_API_BASE_URL=http://localhost:3000/api/v1
```

> Las variables `VITE_*` son visibles desde el navegador. Nunca deben contener secretos, contraseñas, credenciales de base de datos ni claves JWT.

## Producción

El frontend está preparado para desplegarse en Vercel. `vercel.json` incluye el fallback necesario para una SPA y permite refrescar directamente rutas internas sin obtener un 404.

Antes de desplegar:

```bash
npm ci
npm run check
npm run build
```

### Aplicación

**Demo pública:** https://fynar.vercel.app

### Backend

El servidor y la lógica financiera se encuentran en:

**https://github.com/MelgarejoMaycol/BackFynar**

## Estado del proyecto

Fynar se encuentra en **desarrollo activo**. La arquitectura se diseñó para permitir que nuevas funcionalidades financieras se incorporen sin concentrar toda la lógica en componentes gigantes ni duplicar reglas entre frontend y backend.

La especificación histórica ampliada del cliente se conserva en [`README_FRONTEND_FYNAR.md`](./README_FRONTEND_FYNAR.md).

---

<div align="center">

Desarrollado por **Maycol Melgarejo**

[GitHub](https://github.com/MelgarejoMaycol) · [Portafolio](https://melgarejomaycol.vercel.app/)

</div>
