import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process'
import { createInterface, type Interface as ReadlineInterface } from 'node:readline'
import type { CliRuntimeEffort, CliRuntimeLaunch } from './cli-runtime-types'

export interface CliRuntimeAcpPromptOptions {
  sessionId: string
  modelId?: string
  effort?: CliRuntimeEffort
}

export function buildPromptParams(
  text: string,
  options: CliRuntimeAcpPromptOptions,
): Record<string, unknown> {
  const modelId = options.modelId?.trim()
  return {
    sessionId: options.sessionId,
    prompt: [{ type: 'text', text }],
    ...(modelId && modelId.toLowerCase() !== 'auto' ? { modelId } : {}),
    ...(options.effort ? { reasoningEffort: options.effort } : {}),
  }
}

interface PendingRequest {
  resolve: (value: unknown) => void
  reject: (error: Error) => void
  timer: ReturnType<typeof setTimeout>
}

export class CliRuntimeAcpStdioClient {
  private child: ChildProcessWithoutNullStreams | null = null
  private stdout: ReadlineInterface | null = null
  private nextId = 1
  private pending = new Map<number, PendingRequest>()
  private stdoutTail = ''
  private stderrTail = ''

  constructor(
    private readonly launch: CliRuntimeLaunch,
    private readonly opts: { timeoutMs?: number; cwd?: string } = {},
  ) {}

  get diagnostics(): { stdoutTail: string; stderrTail: string } {
    return {
      stdoutTail: this.stdoutTail,
      stderrTail: this.stderrTail,
    }
  }

  start(): void {
    if (this.child) return

    this.child = spawn(this.launch.command, this.launch.args, {
      cwd: this.opts.cwd,
      env: { ...process.env, ...this.launch.env },
      stdio: ['pipe', 'pipe', 'pipe'],
    })

    this.stdout = createInterface({ input: this.child.stdout })
    this.stdout.on('line', (line) => this.handleStdoutLine(line))
    this.child.stderr.on('data', (chunk) => {
      this.stderrTail = tail(`${this.stderrTail}${String(chunk)}`)
    })
    this.child.on('exit', (code, signal) => {
      const error = new Error(`ACP runtime exited before completing request (code=${code ?? 'null'}, signal=${signal ?? 'null'})`)
      for (const [id, pending] of this.pending) {
        clearTimeout(pending.timer)
        pending.reject(error)
        this.pending.delete(id)
      }
    })
  }

  async initialize(): Promise<unknown> {
    return this.request('initialize', {
      protocolVersion: 1,
      clientInfo: { name: 'Fleet', version: '0.1.0' },
    })
  }

  async createSession(cwd = process.cwd()): Promise<string> {
    const result = await this.request('session/new', { cwd, mcpServers: [] }) as { sessionId?: string }
    if (!result.sessionId?.trim()) {
      throw new Error('ACP session/new did not return a sessionId')
    }
    return result.sessionId
  }

  async prompt(text: string, options: CliRuntimeAcpPromptOptions): Promise<unknown> {
    return this.request('session/prompt', buildPromptParams(text, options))
  }

  async request(method: string, params: Record<string, unknown>): Promise<unknown> {
    this.start()
    if (!this.child) throw new Error('ACP runtime did not start')

    const id = this.nextId++
    const timeoutMs = this.opts.timeoutMs ?? 10_000

    const promise = new Promise<unknown>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id)
        reject(new Error(`ACP request timed out: ${method}`))
      }, timeoutMs)
      this.pending.set(id, { resolve, reject, timer })
    })

    this.child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n')
    return promise
  }

  dispose(): void {
    for (const [id, pending] of this.pending) {
      clearTimeout(pending.timer)
      pending.reject(new Error('ACP runtime disposed'))
      this.pending.delete(id)
    }
    this.stdout?.close()
    this.stdout = null
    if (this.child && !this.child.killed) {
      this.child.kill()
    }
    this.child = null
  }

  private handleStdoutLine(line: string): void {
    this.stdoutTail = tail(`${this.stdoutTail}${line}\n`)

    let message: { id?: number; result?: unknown; error?: unknown }
    try {
      message = JSON.parse(line)
    } catch {
      return
    }

    if (typeof message.id !== 'number') return
    const pending = this.pending.get(message.id)
    if (!pending) return

    clearTimeout(pending.timer)
    this.pending.delete(message.id)

    if (message.error) {
      pending.reject(new Error(typeof message.error === 'string' ? message.error : JSON.stringify(message.error)))
      return
    }
    pending.resolve(message.result)
  }
}

function tail(value: string, max = 4000): string {
  return value.length > max ? value.slice(value.length - max) : value
}
