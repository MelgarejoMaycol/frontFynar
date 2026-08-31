import { execFileSync, spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const FRONTEND_PORT = 5173
const BACKEND_PORT = 3000
const frontDirectory = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
)
const backDirectory = path.resolve(frontDirectory, '..', 'BackFynar')
const npmCli = process.env.npm_execpath
const children = []
let stopping = false
let watchdog

if (!npmCli) throw new Error('Ejecuta este lanzador mediante "npm run dev".')

function listeners() {
  if (process.platform !== 'win32') return []
  // Sin `-p tcp`: en Windows ese filtro omite TCP/IPv6 (`tcpv6`). Vite
  // resuelve localhost a ::1, por lo que ambas familias son obligatorias.
  const output = execFileSync('netstat.exe', ['-ano'], {
    encoding: 'utf8',
    windowsHide: true,
  })
  return output
    .split(/\r?\n/)
    .map((line) => line.trim().split(/\s+/))
    .filter(
      (parts) =>
        parts.length >= 5 &&
        parts[0] === 'TCP' &&
        ['LISTENING', 'ESCUCHANDO'].includes(parts[3]),
    )
    .map((parts) => {
      const separator = parts[1].lastIndexOf(':')
      return {
        address: parts[1].slice(0, separator).replace(/^\[|\]$/g, ''),
        port: Number(parts[1].slice(separator + 1)),
        pid: Number(parts[4]),
      }
    })
    .filter((item) => item.pid > 0 && Number.isInteger(item.port))
}

function onPort(port) {
  return listeners().filter((item) => item.port === port)
}

function processInfo(pid) {
  try {
    const command = `$p=Get-Process -Id ${pid} -ErrorAction Stop;[pscustomobject]@{Name=$p.ProcessName+'.exe'}|ConvertTo-Json -Compress`
    const output = execFileSync(
      'powershell.exe',
      ['-NoProfile', '-Command', command],
      {
        encoding: 'utf8',
        windowsHide: true,
        stdio: ['ignore', 'pipe', 'ignore'],
      },
    ).trim()
    if (!output) return { name: 'desconocido', commandLine: '' }
    const info = JSON.parse(output)
    return { name: info.Name ?? 'desconocido', commandLine: '' }
  } catch {
    return { name: 'desconocido', commandLine: '' }
  }
}

function assertPortsFree() {
  const occupied = [FRONTEND_PORT, BACKEND_PORT]
    .flatMap((port) => onPort(port))
    .filter(
      (item, index, all) =>
        all.findIndex(
          (candidate) =>
            candidate.port === item.port && candidate.pid === item.pid,
        ) === index,
    )
    .map((item) => ({ ...item, ...processInfo(item.pid) }))
  if (!occupied.length) {
    console.log(`[dev] Puerto frontend ${FRONTEND_PORT} disponible.`)
    console.log(`[dev] Puerto backend ${BACKEND_PORT} disponible.`)
    return
  }
  console.error('\n[dev] No se puede iniciar Fynar.\n')
  for (const item of occupied) {
    console.error(`Puerto ${item.port} ocupado.`)
    console.error(`PID: ${item.pid}`)
    console.error(`Proceso: ${item.name}`)
    console.error(`Dirección: ${item.address}`)
    if (item.commandLine) console.error(`Comando: ${item.commandLine}`)
    console.error('')
  }
  console.error(
    '[dev] No se terminó ningún proceso. Cierra la instancia propietaria e inténtalo de nuevo.',
  )
  throw new Error('Puertos requeridos ocupados')
}

async function existingFynarIsHealthy() {
  if (!onPort(FRONTEND_PORT).length || !onPort(BACKEND_PORT).length)
    return false
  try {
    const [backendResponse, frontendResponse] = await Promise.all([
      fetch('http://127.0.0.1:3000/api/v1/health/live', {
        signal: AbortSignal.timeout(3_000),
      }),
      fetch('http://localhost:5173', {
        signal: AbortSignal.timeout(3_000),
      }),
    ])
    if (!backendResponse.ok || !frontendResponse.ok) return false
    const backend = await backendResponse.json()
    const frontend = await frontendResponse.text()
    return (
      backend?.success === true &&
      backend?.data?.environment === 'test' &&
      frontend.includes('<div id="root">')
    )
  } catch {
    return false
  }
}

async function stopExistingFynar() {
  const processIds = [FRONTEND_PORT, BACKEND_PORT]
    .flatMap((port) => onPort(port).map(({ pid }) => pid))
    .filter((pid, index, all) => all.indexOf(pid) === index)
  for (const pid of processIds) {
    try {
      if (process.platform === 'win32') {
        try {
          execFileSync('taskkill.exe', ['/PID', String(pid), '/T', '/F'], {
            stdio: 'ignore',
            windowsHide: true,
          })
        } catch {
          process.kill(pid, 'SIGTERM')
        }
      } else process.kill(pid, 'SIGTERM')
    } catch {
      // El runner anterior puede haber cerrado el segundo servicio al perder el primero.
    }
  }
  const deadline = Date.now() + 10_000
  while (Date.now() < deadline) {
    if (!onPort(FRONTEND_PORT).length && !onPort(BACKEND_PORT).length) return
    await delay(100)
  }
  throw new Error(
    'Windows no permitió cerrar la instancia anterior. Ciérrala una vez con Ctrl+C y ejecuta npm run dev de nuevo.',
  )
}

function killTree(child) {
  if (!child.pid || child.exitCode !== null) return
  try {
    if (process.platform === 'win32')
      execFileSync('taskkill.exe', ['/PID', String(child.pid), '/T', '/F'], {
        stdio: 'ignore',
        windowsHide: true,
      })
    else child.kill('SIGTERM')
  } catch {
    try {
      child.kill('SIGTERM')
    } catch {
      // Ya terminó.
    }
  }
}

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function waitFor(url, child, label, timeoutMs) {
  const startedAt = Date.now()
  const deadline = startedAt + timeoutMs
  let nextProgressAt = startedAt + 10_000
  while (Date.now() < deadline) {
    if (child.exitCode !== null)
      throw new Error(`${label} terminó antes de estar disponible`)
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(1_000) })
      if (response.ok) return
    } catch {
      // Sigue iniciando.
    }
    if (Date.now() >= nextProgressAt) {
      const elapsedSeconds = Math.round((Date.now() - startedAt) / 1_000)
      console.log(
        `[dev] ${label} sigue iniciando (${elapsedSeconds}s); el primer arranque puede tardar por la compilación de TypeScript...`,
      )
      nextProgressAt += 10_000
    }
    await delay(200)
  }
  throw new Error(
    `${label} no respondió en ${Math.round(timeoutMs / 1_000)} segundos`,
  )
}

function start(name, cwd, args) {
  const child = spawn(process.execPath, args, {
    cwd,
    stdio: 'inherit',
    windowsHide: true,
    env: { ...process.env, NO_COLOR: '1', FORCE_COLOR: '0' },
  })
  children.push(child)
  child.on('error', (error) => {
    console.error(`[dev] No se pudo iniciar ${name}: ${error.message}`)
    void shutdown(1)
  })
  child.on('exit', (code, signal) => {
    if (stopping) return
    console.error(`[dev] ${name} se detuvo (${signal ?? `código ${code}`}).`)
    void shutdown(code || 1)
  })
  return child
}

async function shutdown(code = 0) {
  if (stopping) return
  stopping = true
  if (watchdog) clearInterval(watchdog)
  if (!children.length) process.exit(code)
  for (const child of children) killTree(child)
  const deadline = Date.now() + 8_000
  while (Date.now() < deadline) {
    if (!onPort(FRONTEND_PORT).length && !onPort(BACKEND_PORT).length)
      process.exit(code)
    await delay(100)
  }
  console.error('[dev] Un puerto no se liberó dentro del tiempo esperado.')
  process.exit(code || 1)
}

process.on('SIGINT', () => void shutdown(0))
process.on('SIGBREAK', () => void shutdown(0))
process.on('SIGTERM', () => void shutdown(0))
process.on('uncaughtException', (error) => {
  console.error('[dev] Error no controlado:', error)
  void shutdown(1)
})
process.on('unhandledRejection', (error) => {
  console.error('[dev] Promesa rechazada:', error)
  void shutdown(1)
})

startup: {
  try {
    console.log('[dev] Verificando PostgreSQL QA y migraciones...')
    execFileSync(process.execPath, [npmCli, 'run', 'qa:migrate'], {
      cwd: backDirectory,
      stdio: 'inherit',
      env: { ...process.env, NO_COLOR: '1', FORCE_COLOR: '0' },
    })
    console.log('[dev] PostgreSQL QA disponible y migraciones verificadas.')

    // Evita que una comprobación anterior a las migraciones se trate como garantía.
    if (await existingFynarIsHealthy()) {
      console.log(
        '[dev] Reiniciando la instancia anterior de Fynar para conectar los logs a esta terminal...',
      )
      await stopExistingFynar()
    }
    assertPortsFree()

    console.log('[dev] Iniciando backend QA...')
    const backend = start('backend', backDirectory, [
      path.join(backDirectory, 'node_modules', 'tsx', 'dist', 'cli.mjs'),
      'scripts/run-local-qa.ts',
      'server',
    ])
    await waitFor(
      'http://127.0.0.1:3000/api/v1/health/live',
      backend,
      'Backend',
      180_000,
    )
    console.log('[dev] Backend disponible en http://127.0.0.1:3000')

    if (onPort(FRONTEND_PORT).length)
      throw new Error(
        `El puerto ${FRONTEND_PORT} fue ocupado durante el arranque`,
      )

    console.log('[dev] Iniciando frontend...')
    const frontend = start('frontend', frontDirectory, [
      path.join(frontDirectory, 'node_modules', 'vite', 'bin', 'vite.js'),
      '--port',
      String(FRONTEND_PORT),
      '--strictPort',
    ])
    await waitFor('http://localhost:5173', frontend, 'Frontend', 90_000)
    console.log('[dev] Frontend disponible en http://localhost:5173')
    console.log(
      '[dev] Fynar listo. Presiona Ctrl+C para detener todos los servicios.',
    )
    watchdog = setInterval(() => {
      if (stopping) return
      if (!onPort(FRONTEND_PORT).length) {
        console.error('[dev] El listener del frontend desapareció.')
        void shutdown(1)
      } else if (!onPort(BACKEND_PORT).length) {
        console.error('[dev] El listener del backend desapareció.')
        void shutdown(1)
      }
    }, 1_000)
  } catch (error) {
    if (error.message !== 'Puertos requeridos ocupados')
      console.error(`[dev] ${error.message}`)
    await shutdown(1)
  }
}
