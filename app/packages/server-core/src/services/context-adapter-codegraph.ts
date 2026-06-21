/**
 * codegraph capability adapter — resolves executable via System Tools and returns structured
 * query output instead of whole-file reads, with before/after savings stats.
 */

import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { SpawnAdapter } from './system-tools-detector'
import { defaultSpawnAdapter } from './system-tools-detector'
import type { SystemToolsRegistry } from './system-tools-registry'
import { resolveContextAdapterTool } from './context-adapter-registry'
import { buildCompressionStats } from './context-adapter-compression-stats'
import type { CodegraphQueryRequest, CodegraphQueryResult } from './context-adapter-types'

export interface CodegraphAdapterOptions {
  registry: SystemToolsRegistry
  spawn?: SpawnAdapter
}

function spawnCodegraphQuery(
  executable: string,
  request: CodegraphQueryRequest,
  resolvedPathEnv: string | undefined,
  spawn: SpawnAdapter,
): { ok: boolean; output?: string; error?: string } {
  const env = resolvedPathEnv ? { ...process.env, PATH: resolvedPathEnv } : process.env
  const args = ['query', request.query, '--json', '--limit', '20']
  const res = spawn.exec(executable, args, {
    env,
    cwd: request.rootPath,
    timeout: 15_000,
  })
  if (res.error || res.status !== 0) {
    return {
      ok: false,
      error: String(res.error?.message ?? res.stderr ?? 'codegraph query failed'),
    }
  }
  const stdout = (res.stdout ?? '').trim()
  if (!stdout) return { ok: false, error: 'codegraph returned empty output' }
  return { ok: true, output: stdout }
}

/** Local fallback: scan a few TS/JS files for symbol-like matches when sidecar unavailable. */
export async function queryCodegraphFallback(request: CodegraphQueryRequest): Promise<string> {
  const scope = request.relativePath
    ? [request.relativePath]
    : ['src/index.ts', 'src/main.ts', 'index.ts', 'app.ts'].filter(Boolean)
  const needle = request.query.trim().toLowerCase()
  const hits: string[] = []

  for (const rel of scope) {
    const abs = join(request.rootPath, rel)
    let content: string
    try {
      content = await readFile(abs, 'utf-8')
    } catch {
      continue
    }
    const lines = content.split(/\r?\n/)
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!
      if (!line.toLowerCase().includes(needle)) continue
      hits.push(`${rel}:${i + 1} ${line.trim()}`)
      if (hits.length >= 12) break
    }
    if (hits.length >= 12) break
  }

  if (hits.length === 0) {
    return JSON.stringify({
      source: 'fleet-fallback',
      query: request.query,
      matches: [],
      note: '未找到符号匹配；codegraph sidecar 不可用或未索引。',
    }, null, 2)
  }

  return JSON.stringify({
    source: 'fleet-fallback',
    query: request.query,
    matches: hits,
  }, null, 2)
}

/** Estimate whole-file read cost for savings comparison. */
async function estimateWholeFileBaseline(request: CodegraphQueryRequest): Promise<string> {
  if (request.relativePath) {
    try {
      return await readFile(join(request.rootPath, request.relativePath), 'utf-8')
    } catch {
      return ''
    }
  }
  const chunks: string[] = []
  for (const rel of ['src/index.ts', 'index.ts']) {
    try {
      chunks.push(await readFile(join(request.rootPath, rel), 'utf-8'))
    } catch {
      // skip
    }
  }
  return chunks.join('\n\n')
}

export async function queryWithCodegraphAdapter(
  opts: CodegraphAdapterOptions,
  request: CodegraphQueryRequest,
  forceRedetect = false,
): Promise<CodegraphQueryResult> {
  const spawn = opts.spawn ?? defaultSpawnAdapter
  const availability = await resolveContextAdapterTool(opts.registry, 'codegraph', forceRedetect)
  const baseline = await estimateWholeFileBaseline(request)

  if (!availability.available) {
    const structuredOutput = await queryCodegraphFallback(request)
    return {
      availability,
      query: request.query,
      structuredOutput,
      stats: buildCompressionStats(baseline || request.query, structuredOutput),
      applied: false,
      note: 'codegraph 不可用；使用 Fleet 本地符号扫描 fallback。',
    }
  }

  const sidecar = spawnCodegraphQuery(availability.path, request, availability.resolvedPathEnv, spawn)
  if (sidecar.ok && sidecar.output) {
    return {
      availability,
      query: request.query,
      structuredOutput: sidecar.output,
      stats: buildCompressionStats(baseline || request.query, sidecar.output),
      applied: true,
      note: '已通过 System Tools 解析的 codegraph 路径执行 query。',
    }
  }

  const structuredOutput = await queryCodegraphFallback(request)
  return {
    availability,
    query: request.query,
    structuredOutput,
    stats: buildCompressionStats(baseline || request.query, structuredOutput),
    applied: false,
    note: sidecar.error
      ? `codegraph 已检测到但 query 失败（${sidecar.error}）；已降级到 Fleet fallback。`
      : 'codegraph 已检测到但 query 未返回有效输出；已降级到 Fleet fallback。',
  }
}
