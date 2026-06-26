/**
 * Native/subscription CLI one-shot adapter.
 *
 * This is not a second chat store. It runs supported local CLIs once per user
 * turn, then emits normalized CLI runtime events so SessionManager writes the
 * answer into the existing craft timeline.
 */

import { spawn } from 'node:child_process'
import type { CliRuntimeDefinition, CliRuntimePromptResult, CliRuntimeStreamEvent } from '@craft-agent/shared/protocol'

const DEFAULT_TIMEOUT_MS = 10 * 60 * 1000
const MAX_ERROR_TAIL = 1200

export interface NativeCliRuntimeRunOptions {
  runtime: CliRuntimeDefinition
  cwd: string
  prompt: string
  modelId?: string | null
  reasoningEffort?: 'low' | 'medium' | 'high' | null
  emitEvent(event: CliRuntimeStreamEvent): void
  timeoutMs?: number
}

export function hasNativeOneShotAdapter(mappingId: string): boolean {
  return ['codex', 'claude', 'grok', 'antigravity'].includes(mappingId)
}

export async function runNativeCliRuntimeTurn(options: NativeCliRuntimeRunOptions): Promise<CliRuntimePromptResult> {
  const command = buildNativeCommand(options.runtime, options.prompt, options.modelId, options.reasoningEffort)
  if (!command) {
    throw new Error(`${options.runtime.displayName} 还没有 native/subscription 发送 adapter`)
  }

  const stdout = await runProcess({
    ...command,
    cwd: options.cwd,
    env: options.runtime.env,
    timeoutMs: options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
  })

  const text = extractAssistantText(options.runtime, stdout).trim()
  if (text) options.emitEvent({ type: 'text', text })
  options.emitEvent({ type: 'done', stopReason: 'end_turn' })
  return { stopReason: 'end_turn' }
}

export function buildNativeCommand(
  runtime: CliRuntimeDefinition,
  prompt: string,
  modelId?: string | null,
  reasoningEffort?: 'low' | 'medium' | 'high' | null,
): { command: string; args: string[] } | null {
  switch (runtime.mappingId) {
    case 'codex': {
      const args = ['exec', '--color', 'never', '--sandbox', 'workspace-write']
      if (modelId) args.push('--model', modelId)
      if (reasoningEffort) args.push('--reasoning-effort', reasoningEffort)
      args.push(prompt)
      return { command: runtime.command, args }
    }
    case 'claude': {
      const args = ['-p']
      if (modelId) args.push('--model', modelId)
      if (reasoningEffort) args.push('--reasoning-effort', reasoningEffort)
      args.push(prompt)
      return { command: runtime.command, args }
    }
    case 'grok': {
      const args = ['--single']
      if (modelId) args.push('--model', modelId)
      if (reasoningEffort) args.push('--reasoning-effort', reasoningEffort)
      args.push(prompt)
      return { command: runtime.command, args }
    }
    case 'antigravity': {
      const args = ['--print']
      if (modelId) args.push('--model', modelId)
      if (reasoningEffort) args.push('--reasoning-effort', reasoningEffort)
      args.push(prompt)
      return { command: runtime.command, args }
    }
    default:
      return null
  }
}

async function runProcess(options: {
  command: string
  args: string[]
  cwd: string
  env?: Record<string, string>
  timeoutMs: number
}): Promise<string> {
  return new Promise((resolve, reject) => {
    let stdout = ''
    let stderr = ''
    let settled = false
    const child = spawn(options.command, options.args, {
      cwd: options.cwd,
      env: { ...process.env, NO_COLOR: '1', TERM: 'dumb', ...(options.env ?? {}) },
      stdio: ['ignore', 'pipe', 'pipe'],
    })

    const finish = (error?: Error) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      if (error) reject(error)
      else resolve(stdout)
    }

    const timer = setTimeout(() => {
      try { child.kill('SIGKILL') } catch { /* already gone */ }
      finish(new Error(`CLI 执行超时（${Math.round(options.timeoutMs / 1000)}s）`))
    }, options.timeoutMs)

    child.stdout?.on('data', chunk => { stdout += chunk.toString() })
    child.stderr?.on('data', chunk => { stderr += chunk.toString() })
    child.on('error', error => finish(error))
    child.on('exit', code => {
      if (code === 0) {
        finish()
        return
      }
      const tail = stderr.trim().slice(-MAX_ERROR_TAIL) || stdout.trim().slice(-MAX_ERROR_TAIL)
      finish(new Error(`CLI 退出码 ${code}${tail ? `：${tail}` : ''}`))
    })
  })
}

function extractAssistantText(runtime: CliRuntimeDefinition, stdout: string): string {
  if (runtime.mappingId === 'codex') {
    return stdout
      .split('\n')
      .filter(line => !/^\s*(OpenAI Codex|--------|workdir:|model:|provider:|approval:|sandbox:|reasoning effort:)/i.test(line))
      .join('\n')
      .trim()
  }
  return stdout.trim()
}
