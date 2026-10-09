/**
 * Pipe-stdio process opener for CLI executors.
 *
 * HostTurnKernel remains the permission authority. This opener does not grant
 * permission and it does not fall back to a PTY when spawn fails.
 */

import { spawn as nodeSpawn, type ChildProcess } from 'node:child_process'
import type { LineStream } from './line-stream'

export interface StdioCommand {
  command: string
  args: readonly string[]
  cwd?: string
}

export interface StdioSpawnOptions {
  cwd?: string
  stdio: ['pipe', 'pipe', 'pipe']
  shell: false
  windowsHide: true
}

export interface StdioChild {
  stdin: { write(chunk: string): void } | null
  stdout: { on(event: 'data', listener: (chunk: Buffer | string) => void): void } | null
  on(event: 'exit', listener: () => void): void
  on(event: 'error', listener: (error: Error) => void): void
}

export type StdioSpawn = (
  command: string,
  args: readonly string[],
  options: StdioSpawnOptions,
) => StdioChild

export const CODEX_APP_SERVER_COMMAND: StdioCommand = {
  command: 'codex',
  args: ['app-server', '--stdio'],
}

export function stdioSpawnOptions(cwd?: string): StdioSpawnOptions {
  return {
    cwd,
    stdio: ['pipe', 'pipe', 'pipe'],
    shell: false,
    windowsHide: true,
  }
}

function asStdioChild(child: ChildProcess): StdioChild {
  return {
    stdin: child.stdin
      ? { write: (chunk: string) => { child.stdin?.write(chunk) } }
      : null,
    stdout: child.stdout
      ? { on: (event, listener) => { child.stdout?.on(event, listener) } }
      : null,
    on: (event, listener) => {
      if (event === 'exit') child.on('exit', listener)
      else child.on('error', listener)
    },
  }
}

const defaultSpawn: StdioSpawn = (command, args, options) => asStdioChild(nodeSpawn(command, [...args], options))

export function openStdioJsonRpc(spec: StdioCommand, spawnImpl: StdioSpawn = defaultSpawn): LineStream {
  const child = spawnImpl(spec.command, spec.args, stdioSpawnOptions(spec.cwd))
  if (!child.stdin || !child.stdout) {
    throw new Error('stdio_pipes_unavailable')
  }
  const listeners: Array<(line: string) => void> = []
  let buffer = ''
  let closed = false
  child.stdout.on('data', (chunk) => {
    buffer += typeof chunk === 'string' ? chunk : chunk.toString('utf8')
    let newline = buffer.indexOf('\n')
    while (newline >= 0) {
      const line = buffer.slice(0, newline).replace(/\r$/, '')
      buffer = buffer.slice(newline + 1)
      for (const listener of [...listeners]) listener(line)
      newline = buffer.indexOf('\n')
    }
  })
  const close = () => {
    closed = true
  }
  child.on('exit', close)
  child.on('error', close)
  return {
    send(line: string) {
      if (closed) return
      child.stdin?.write(`${line}\n`)
    },
    onLine(listener: (line: string) => void) {
      listeners.push(listener)
      return () => {
        const index = listeners.indexOf(listener)
        if (index >= 0) listeners.splice(index, 1)
      }
    },
    close,
  }
}
