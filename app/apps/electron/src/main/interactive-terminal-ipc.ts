/**
 * Interactive terminal IPC bridge (main process).
 * ===============================================
 *
 * Wires the renderer's bottom terminal panel (`BottomTerminalPanel.tsx`) to a
 * Python PTY host (`resources/scripts/terminal_pty_host.py`). This is the
 * **human-facing local shell** — it is intentionally separate from the CLI
 * Runtime / ACP path (docs/23), which handles Agent send routing.
 *
 * Lifecycle (docs/37): show panel → fresh PTY; hide/unmount → kill PTY.
 * No stale reconnect across panel remounts.
 */

import { type ChildProcessWithoutNullStreams, spawn } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { app, ipcMain, type WebContents } from 'electron'

import { mainLog } from './logger'

interface TerminalStartOptions {
  cwd?: string | null
  size?: { cols?: number; rows?: number }
}

interface TerminalRecord {
  id: string
  webContents: WebContents
  buffer: string
  alive: boolean
}

const MAX_BUFFER_CHARS = 200_000

let hostProcess: ChildProcessWithoutNullStreams | null = null
let hostStdoutBuffer = ''
const terminals = new Map<string, TerminalRecord>()
const terminalByWindow = new WeakMap<WebContents, string>()

function resolvePythonHostScript(): string | null {
  const resourcesBase = process.env.CRAFT_RESOURCES_BASE
  const candidates = [
    resourcesBase ? join(resourcesBase, 'resources', 'scripts', 'terminal_pty_host.py') : null,
    join(__dirname, '..', 'resources', 'scripts', 'terminal_pty_host.py'),
    join(__dirname, '..', '..', 'resources', 'scripts', 'terminal_pty_host.py'),
  ].filter((value): value is string => Boolean(value))
  return candidates.find((candidate) => existsSync(candidate)) ?? null
}

function ensureHost(): ChildProcessWithoutNullStreams | null {
  if (hostProcess && !hostProcess.killed) return hostProcess

  const script = resolvePythonHostScript()
  if (!script) {
    mainLog.error('[terminal] PTY host script not found')
    return null
  }

  const pythonBin = process.platform === 'win32' ? 'python' : 'python3'
  const child = spawn(pythonBin, [script], {
    cwd: app.isPackaged ? app.getAppPath() : process.cwd(),
    env: {
      ...process.env,
      TERM: 'xterm-256color',
      COLORTERM: 'truecolor',
    },
    stdio: ['pipe', 'pipe', 'pipe'],
  })

  child.stdout.setEncoding('utf8')
  child.stdout.on('data', (chunk: string) => {
    hostStdoutBuffer += chunk
    let newlineIndex = hostStdoutBuffer.indexOf('\n')
    while (newlineIndex >= 0) {
      const line = hostStdoutBuffer.slice(0, newlineIndex).trim()
      hostStdoutBuffer = hostStdoutBuffer.slice(newlineIndex + 1)
      if (line) handleHostMessage(line)
      newlineIndex = hostStdoutBuffer.indexOf('\n')
    }
  })

  child.stderr.on('data', (chunk: Buffer | string) => {
    mainLog.warn('[terminal-host]', String(chunk).trim())
  })

  child.on('exit', (code) => {
    mainLog.warn('[terminal] PTY host exited', { code })
    for (const record of terminals.values()) {
      if (!record.webContents.isDestroyed()) {
        record.webContents.send('terminal:exit', { id: record.id, code: null, signal: null })
      }
    }
    terminals.clear()
    hostProcess = null
    hostStdoutBuffer = ''
  })

  hostProcess = child
  mainLog.info('[terminal] PTY host started', { script })
  return child
}

function handleHostMessage(line: string): void {
  let message: { type?: string; id?: string; data?: string; code?: number | null; signal?: number | null; message?: string }
  try {
    message = JSON.parse(line)
  } catch {
    return
  }

  if (!message.id || message.id === '*') return
  const record = terminals.get(message.id)
  if (!record) return

  switch (message.type) {
    case 'data': {
      const decoded = Buffer.from(message.data ?? '', 'base64').toString('utf8')
      record.buffer = (record.buffer + decoded).slice(-MAX_BUFFER_CHARS)
      if (!record.webContents.isDestroyed()) {
        record.webContents.send('terminal:data', { id: record.id, data: decoded })
      }
      break
    }
    case 'exit': {
      record.alive = false
      if (!record.webContents.isDestroyed()) {
        record.webContents.send('terminal:exit', {
          id: record.id,
          code: message.code ?? null,
          signal: message.signal != null ? String(message.signal) : null,
        })
      }
      terminals.delete(record.id)
      if (terminalByWindow.get(record.webContents) === record.id) {
        terminalByWindow.delete(record.webContents)
      }
      break
    }
    case 'error': {
      record.alive = false
      const errorText = message.message ?? 'Terminal error'
      mainLog.error('[terminal]', errorText, { id: record.id })
      if (!record.webContents.isDestroyed()) {
        record.webContents.send('terminal:data', {
          id: record.id,
          data: `\r\n\x1b[31m${errorText}\x1b[0m\r\n`,
        })
        record.webContents.send('terminal:exit', {
          id: record.id,
          code: 1,
          signal: null,
        })
      }
      terminals.delete(record.id)
      if (terminalByWindow.get(record.webContents) === record.id) {
        terminalByWindow.delete(record.webContents)
      }
      break
    }
    default:
      break
  }
}

function sendToHost(payload: Record<string, unknown>): boolean {
  const host = ensureHost()
  if (!host) return false
  try {
    host.stdin.write(`${JSON.stringify(payload)}\n`)
    return true
  } catch {
    return false
  }
}

function killTerminalForWindow(webContents: WebContents): void {
  const existingId = terminalByWindow.get(webContents)
  if (existingId) killTerminal(existingId)
}

function startTerminal(webContents: WebContents, options?: TerminalStartOptions): { id: string; buffer?: string; reconnected?: boolean } {
  killTerminalForWindow(webContents)

  const host = ensureHost()
  if (!host) throw new Error('Terminal host is unavailable (python3 or PTY script not found)')

  const id = randomUUID()
  const record: TerminalRecord = { id, webContents, buffer: '', alive: true }
  terminals.set(id, record)
  terminalByWindow.set(webContents, id)

  const sent = sendToHost({
    op: 'spawn',
    id,
    cwd: options?.cwd ?? null,
    cols: options?.size?.cols ?? 80,
    rows: options?.size?.rows ?? 24,
    shell: null,
  })
  if (!sent) {
    terminals.delete(id)
    terminalByWindow.delete(webContents)
    throw new Error('Failed to start terminal host process')
  }

  return { id, buffer: '', reconnected: false }
}

function killTerminal(id: string): boolean {
  const record = terminals.get(id)
  if (record) {
    record.alive = false
    if (terminalByWindow.get(record.webContents) === id) {
      terminalByWindow.delete(record.webContents)
    }
  }
  terminals.delete(id)
  return sendToHost({ op: 'kill', id })
}

export function registerInteractiveTerminalIpc(): void {
  ipcMain.handle('terminal:start', (event, options?: TerminalStartOptions) => {
    return startTerminal(event.sender, options)
  })

  ipcMain.handle('terminal:restart', (event, options?: TerminalStartOptions) => {
    killTerminalForWindow(event.sender)
    return startTerminal(event.sender, options)
  })

  ipcMain.handle('terminal:write', (_event, id: string, data: string) => {
    return sendToHost({ op: 'write', id, data: Buffer.from(data, 'utf8').toString('base64') })
  })

  ipcMain.handle('terminal:resize', (_event, id: string, size: { cols: number; rows: number }) => {
    return sendToHost({ op: 'resize', id, cols: size?.cols ?? 80, rows: size?.rows ?? 24 })
  })

  ipcMain.handle('terminal:kill', (_event, id: string) => {
    return killTerminal(id)
  })

  app.on('before-quit', () => {
    if (hostProcess && !hostProcess.killed) {
      hostProcess.kill()
      hostProcess = null
    }
  })
}
