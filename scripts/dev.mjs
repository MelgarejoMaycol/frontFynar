import { execFileSync, spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const FRONTEND_PORT = 5173
const BACKEND_PORT = 3000
const ports = [FRONTEND_PORT, BACKEND_PORT]
const frontendDirectory = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
)
const backendDirectory = path.resolve(frontendDirectory, '..', 'BackVeloryx')
const npmCli = process.env.npm_execpath

if (!npmCli) {
  console.error('[dev] Ejecute este lanzador mediante "npm run dev".')
  process.exit(1)
}

function processesOnPort(port) {
  try {
    if (process.platform === 'win32') {
      const output = execFileSync('netstat.exe', ['-ano', '-p', 'tcp'], {
        encoding: 'utf8',
      })
      return [
        ...new Set(
          output
            .split(/\r?\n/)
            .map((line) => line.trim().split(/\s+/))
            .filter(
              (columns) =>
                columns.length >= 5 &&
                columns[0] === 'TCP' &&
                columns[1]?.endsWith(`:${port}`) &&
                columns[3] === 'LISTENING',
            )
            .map((columns) => Number(columns[4]))
            .filter((pid) => Number.isInteger(pid) && pid > 0),
        ),
      ]
    }

    const output = execFileSync(
      'lsof',
      ['-ti', `tcp:${port}`, '-sTCP:LISTEN'],
      {
        encoding: 'utf8',
      },
    )
    return output
      .split(/\r?\n/)
      .map(Number)
      .filter((pid) => Number.isInteger(pid) && pid > 0)
  } catch {
    return []
  }
}

function freePort(port) {
  const processIds = processesOnPort(port).filter((pid) => pid !== process.pid)

  if (processIds.length === 0) {
    console.log(`[dev] Puerto ${port} disponible.`)
    return
  }

  for (const pid of processIds) {
    try {
      process.kill(pid, 'SIGTERM')
      console.log(`[dev] Puerto ${port} liberado (PID ${pid}).`)
    } catch (error) {
      console.error(
        `[dev] No se pudo terminar el PID ${pid} del puerto ${port}:`,
        error.message,
      )
      process.exit(1)
    }
  }
}

for (const port of ports) freePort(port)

const services = [
  { name: 'back', directory: backendDirectory, script: 'dev' },
  { name: 'front', directory: frontendDirectory, script: 'dev:front' },
]

let stopping = false

const children = services.map(({ name, directory, script }) => {
  const child = spawn(process.execPath, [npmCli, 'run', script], {
    cwd: directory,
    stdio: 'inherit',
    windowsHide: true,
  })

  child.on('error', (error) => {
    console.error(`[dev] No se pudo iniciar ${name}:`, error.message)
    shutdown(1)
  })

  child.on('exit', (code, signal) => {
    if (!stopping) {
      console.error(`[dev] ${name} se detuvo (${signal ?? `código ${code}`}).`)
      shutdown(code ?? 1)
    }
  })

  return child
})

function shutdown(exitCode = 0) {
  if (stopping) return
  stopping = true

  for (const child of children) {
    if (!child.killed) child.kill('SIGTERM')
  }

  setTimeout(() => process.exit(exitCode), 250)
}

process.on('SIGINT', () => shutdown())
process.on('SIGTERM', () => shutdown())
