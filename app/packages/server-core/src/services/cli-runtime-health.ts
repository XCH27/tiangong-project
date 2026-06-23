/**
 * CLI Runtime 健康测试（docs/23 健康分级）。
 *
 * 分级：available / fail_cli（启动失败）/ fail_acp（能启动但非 ACP 协议）/ disabled。
 * 保留阶段、原因、stdout/stderr tail。真实 CLI 依赖本机安装/登录，spawn 探测只做 opt-in；
 * 分类逻辑 `classifyHealthFromProbe` 是纯函数，单测覆盖。
 */

import { spawn } from 'node:child_process'
import type { CliRuntimeDefinition, CliRuntimeHealthResult } from '@craft-agent/shared/protocol'

const HANDSHAKE_TIMEOUT_MS = 5000
const TAIL_LEN = 600

/** ACP 用 JSON-RPC 2.0；发一个 initialize 探测握手。 */
function initializeMessage(): string {
  return JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: 1, clientCapabilities: {} } }) + '\n'
}

/** 一行/一段输出像不像 JSON-RPC 响应（宽松：smoke 探测，不做严格协议校验）。 */
export function looksLikeJsonRpc(text: string): boolean {
  if (!text.includes('jsonrpc')) return false
  for (const line of text.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed.startsWith('{')) continue
    try {
      const parsed = JSON.parse(trimmed) as Record<string, unknown>
      if (parsed.jsonrpc === '2.0' && ('result' in parsed || 'error' in parsed || 'method' in parsed)) return true
    } catch {
      // 半行/未结束的 JSON，忽略
    }
  }
  return false
}

export interface ProbeOutcome {
  spawnError?: { code?: string; message: string }
  gotJsonRpcResponse: boolean
  exitedBeforeResponse: boolean
  stdoutTail?: string
  stderrTail?: string
}

/** 纯分类逻辑（可单测）。disabled 不在这里判，由调用方先挡。 */
export function classifyHealthFromProbe(outcome: ProbeOutcome): Pick<CliRuntimeHealthResult, 'health' | 'stage' | 'reason'> {
  if (outcome.spawnError) {
    const code = outcome.spawnError.code
    const reason = code === 'ENOENT'
      ? 'CLI 启动失败：找不到可执行命令（检查是否已安装、PATH 是否正确）'
      : `CLI 启动失败：${outcome.spawnError.message}`
    return { health: 'fail_cli', stage: 'spawn', reason }
  }
  if (outcome.gotJsonRpcResponse) {
    return { health: 'available', stage: 'ok' }
  }
  if (outcome.exitedBeforeResponse) {
    return { health: 'fail_acp', stage: 'handshake', reason: 'ACP 握手失败：进程在返回 JSON-RPC 响应前退出' }
  }
  return { health: 'fail_acp', stage: 'handshake', reason: 'ACP 握手失败：超时未收到 JSON-RPC 响应（命令可能不是 ACP runtime）' }
}

function tail(text: string): string {
  return text.length > TAIL_LEN ? text.slice(-TAIL_LEN) : text
}

/**
 * 真实 spawn 探测（opt-in smoke：依赖本机已安装 CLI）。普通 CI 不应依赖它。
 * 任何路径都保证子进程被清理（dispose）。
 */
export async function probeCliRuntimeHealth(
  runtime: Pick<CliRuntimeDefinition, 'id' | 'command' | 'args' | 'env'>,
  timeoutMs: number = HANDSHAKE_TIMEOUT_MS,
): Promise<CliRuntimeHealthResult> {
  const outcome = await new Promise<ProbeOutcome>(resolve => {
    let stdoutBuf = ''
    let stderrBuf = ''
    let settled = false
    let child: ReturnType<typeof spawn> | null = null

    const finish = (partial: Partial<Omit<ProbeOutcome, 'stdoutTail' | 'stderrTail'>>) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      try { child?.kill('SIGKILL') } catch { /* already gone */ }
      resolve({
        spawnError: partial.spawnError,
        gotJsonRpcResponse: partial.gotJsonRpcResponse ?? false,
        exitedBeforeResponse: partial.exitedBeforeResponse ?? false,
        stdoutTail: tail(stdoutBuf),
        stderrTail: tail(stderrBuf),
      })
    }

    const timer = setTimeout(() => finish({ gotJsonRpcResponse: false, exitedBeforeResponse: false }), timeoutMs)

    try {
      child = spawn(runtime.command, runtime.args, {
        env: { ...process.env, ...(runtime.env ?? {}) },
        stdio: ['pipe', 'pipe', 'pipe'],
      })
    } catch (error) {
      finish({ spawnError: { message: error instanceof Error ? error.message : String(error) } })
      return
    }

    child.on('error', (error: NodeJS.ErrnoException) => {
      finish({ spawnError: { code: error.code, message: error.message } })
    })
    child.stdout?.on('data', (chunk: Buffer) => {
      stdoutBuf += chunk.toString()
      if (looksLikeJsonRpc(stdoutBuf)) finish({ gotJsonRpcResponse: true, exitedBeforeResponse: false })
    })
    child.stderr?.on('data', (chunk: Buffer) => { stderrBuf += chunk.toString() })
    child.on('exit', () => {
      finish({ gotJsonRpcResponse: looksLikeJsonRpc(stdoutBuf), exitedBeforeResponse: !looksLikeJsonRpc(stdoutBuf) })
    })

    try {
      child.stdin?.write(initializeMessage())
    } catch { /* stdin may already be closed; handled by exit/timeout */ }
  })

  return {
    runtimeId: runtime.id,
    ...classifyHealthFromProbe(outcome),
    stdoutTail: outcome.stdoutTail,
    stderrTail: outcome.stderrTail,
    checkedAt: Date.now(),
  }
}
