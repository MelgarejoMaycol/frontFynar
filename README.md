# Fynar — Frontend web

Cliente web del MVP de finanzas personales Fynar. Consume los agregados financieros del backend; no recalcula saldos, presupuestos ni reportes en el navegador.

## Stack y requisitos

- React 19, TypeScript, Vite 8 y React Router.
- TanStack Query, React Hook Form, Zod y Zustand.
- Bootstrap y CSS Modules.
- Node.js 22 recomendado y npm.

## Instalación y desarrollo

```bash
npm ci
copy .env.example .env
npm run dev
```

`npm run dev` libera los puertos configurados e inicia frontend y backend. El frontend usa `http://localhost:5173` y el backend `http://localhost:3000` por defecto.

La única variable pública requerida es:

```dotenv
VITE_API_BASE_URL=http://localhost:3000/api/v1
```

En producción debe apuntar por HTTPS al backend desplegado. Nunca se deben colocar secretos, credenciales Neon, claves JWT o contraseñas en variables `VITE_*`.

## Scripts

- `npm run dev`: entorno completo local.
- `npm run dev:front`: solo Vite.
- `npm run format` / `format:check`: Prettier.
- `npm run lint`: ESLint.
- `npm run typecheck`: TypeScript.
- `npm run test`: pruebas unitarias y de integración de componentes.
- `npm run build`: build de producción en `dist/`.
- `npm run check`: formato, lint, tipos, tests y build.

## Arquitectura y autenticación

El código se organiza por features en `src/features`, UI compartida en `src/components`, layouts en `src/layouts` y servicios HTTP en `src/services`.

El access token se mantiene únicamente en memoria. El refresh token viaja en cookie HttpOnly y nunca se guarda en `localStorage` o `sessionStorage`. Las sesiones se restauran mediante refresh single-flight. Logout y logout-all eliminan sesión, workspace y caché privada.

Todas las claves financieras incluyen el workspace activo. Cambiar workspace elimina las cachés dependientes para evitar mezclar información.

## Módulos MVP

- Acceso, registro y recuperación de contraseña.
- Dashboard.
- Cuentas.
- Categorías.
- Movimientos: ingresos, gastos y transferencias.
- Presupuestos.
- Reportes.
- Perfil, preferencias, tema y seguridad.

Fases 0–11: ✅ completadas.

## Producción y Vercel

```bash
npm ci
npm run check
npm run build
```

Vercel debe usar `dist` como output y definir `VITE_API_BASE_URL`. `vercel.json` incluye el fallback SPA para permitir F5 en rutas como `/app/transactions`.

El backend debe configurar:

- `CORS_ORIGINS` con el origen HTTPS exacto del frontend.
- `APP_WEB_URL` con ese mismo origen.
- Credenciales CORS habilitadas.
- Cookies de producción `HttpOnly`, `Secure` y `SameSite=None`, como ya establece el backend.

No se generan source maps de producción y `dist/` está ignorado por Git.

## Calidad

El CI ejecuta `npm ci` y `npm run check` sin depender de Neon. Las pruebas reales contra Neon son un smoke separado para evitar que incidencias externas `P1001`/`P2028` bloqueen la suite unitaria.

## Limitaciones y Post-MVP

No forman parte del MVP web: deudas/créditos, metas, calendario, notificaciones, WebSockets, IA, adjuntos avanzados ni aplicación móvil. `startScreen=DEBTS` se conserva por compatibilidad del backend, pero usa Dashboard como fallback y no se ofrece en la UI.

La especificación histórica ampliada está en [README_FRONTEND_FYNAR.md](./README_FRONTEND_FYNAR.md).
