/**
 * 真实 stdio 传输：spawn 一个本机 CLI 进程，把它的 stdin/stdout 当成 ACP 管道。
 * 测试用 mock transport，不走这里。任何关闭路径都 kill 子进程（不留僵尸）。
 */

import { spawn, type ChildProcess } from 'node:child_process'
import type { AcpTransport } from './acp-connection'

export interface AcpStdioSpawnOptions {
  command: string
  args: string[]
  env?: Record<string, string>
  cwd: string
}

export interface AcpStdioTransport {
  transport: AcpTransport
  child: ChildProcess
  /** stderr 收集（诊断用，错误时写 timeline）。 */
  readStderrTail(): string
}

const STDERR_TAIL = 2000

export function createAcpStdioTransport(options: AcpStdioSpawnOptions): AcpStdioTransport {
  const child = spawn(options.command, options.args, {
    cwd: options.cwd,
    env: { ...process.env, ...(options.env ?? {}) },
    stdio: ['pipe', 'pipe', 'pipe'],
  })

  let stderrBuf = ''
  child.stderr?.on('data', (chunk: Buffer) => {
    stderrBuf += chunk.toString()
    if (stderrBuf.length > STDERR_TAIL) stderrBuf = stderrBuf.slice(-STDERR_TAIL)
  })

  const transport: AcpTransport = {
    send: line => {
      if (child.stdin && !child.stdin.destroyed) child.stdin.write(line)
    },
    onMessage: cb => {
      child.stdout?.on('data', (chunk: Buffer) => cb(chunk.toString()))
    },
    onClose: cb => {
      child.on('exit', () => cb())
      child.on('error', (error: Error) => cb(error))
    },
    close: () => {
      try {
        child.stdin?.end()
        child.kill('SIGKILL')
      } catch {
        // already gone
      }
    },
  }

  return { transport, child, readStderrTail: () => stderrBuf }
}
