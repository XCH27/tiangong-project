/**
 * rtk capability adapter — resolves executable via System Tools, compresses command output
 * with before/after token/char savings. Does not auto-install hooks or rewrite shell config.
 */

import { spawnSync } from 'node:child_process'
import type { SystemToolsRegistry } from './system-tools-registry'
import { resolveContextAdapterTool } from './context-adapter-registry'
import { buildCompressionStats } from './context-adapter-compression-stats'
import type { ContextAdapterCompressionResult } from './context-adapter-types'

export interface RtkCompressOptions {
  /** Raw shell/command output to compress. */
  input: string
  forceRedetect?: boolean
}

export type RtkSidecarRunner = (
  executable: string,
  input: string,
  env?: Record<string, string | undefined>,
) => { ok: boolean; output?: string; error?: string }

export interface RtkAdapterOptions {
  registry: SystemToolsRegistry
  runSidecar?: RtkSidecarRunner
}

export const defaultRtkSidecarRunner: RtkSidecarRunner = (executable, input, env) => {
  const res = spawnSync(executable, ['compress', '--stdin'], {
    shell: false,
    encoding: 'utf-8',
    input,
    env: env ?? process.env,
    timeout: 10_000,
    stdio: ['pipe', 'pipe', 'pipe'],
    maxBuffer: 1024 * 1024,
  })
  if (res.error || res.status !== 0) {
    return {
      ok: false,
      error: String(res.error?.message ?? res.stderr ?? 'rtk compress failed'),
    }
  }
  const stdout = (res.stdout ?? '').trimEnd()
  if (!stdout && input.trim()) {
    return { ok: false, error: 'rtk returned empty output' }
  }
  return { ok: true, output: stdout || input }
}

/** Deterministic Fleet-side reducer when rtk sidecar is unavailable or spawn fails. */
export function compressCommandOutputFallback(input: string): string {
  const lines = input.split(/\r?\n/)
  const out: string[] = []
  let blankRun = 0
  let lastLine: string | null = null
  let dupRun = 0

  for (const raw of lines) {
    const line = raw.length > 240 ? `${raw.slice(0, 237)}...` : raw
    if (!line.trim()) {
      blankRun += 1
      if (blankRun <= 1) out.push('')
      continue
    }
    blankRun = 0
    if (line === lastLine) {
      dupRun += 1
      if (dupRun <= 2) out.push(line)
      continue
    }
    lastLine = line
    dupRun = 0
    out.push(line)
  }

  return out.join('\n').trimEnd()
}

export async function compressWithRtkAdapter(
  opts: RtkAdapterOptions,
  request: RtkCompressOptions,
): Promise<ContextAdapterCompressionResult> {
  const runSidecar = opts.runSidecar ?? defaultRtkSidecarRunner
  const availability = await resolveContextAdapterTool(opts.registry, 'rtk', request.forceRedetect ?? false)

  if (!availability.available) {
    const output = compressCommandOutputFallback(request.input)
    return {
      toolKind: 'rtk',
      availability,
      input: request.input,
      output,
      stats: buildCompressionStats(request.input, output),
      applied: false,
      note: 'rtk 不可用；使用 Fleet 内置命令输出压缩启发式。',
    }
  }

  const env = availability.resolvedPathEnv
    ? { ...process.env, PATH: availability.resolvedPathEnv }
    : process.env
  const sidecar = runSidecar(availability.path, request.input, env)
  if (sidecar.ok && sidecar.output !== undefined) {
    return {
      toolKind: 'rtk',
      availability,
      input: request.input,
      output: sidecar.output,
      stats: buildCompressionStats(request.input, sidecar.output),
      applied: true,
      note: '已通过 System Tools 解析的 rtk 路径执行压缩。',
    }
  }

  const output = compressCommandOutputFallback(request.input)
  return {
    toolKind: 'rtk',
    availability,
    input: request.input,
    output,
    stats: buildCompressionStats(request.input, output),
    applied: false,
    note: sidecar.error
      ? `rtk 已检测到但 sidecar 调用失败（${sidecar.error}）；已降级到 Fleet 启发式。`
      : 'rtk 已检测到但 sidecar 未返回有效输出；已降级到 Fleet 启发式。',
  }
}
