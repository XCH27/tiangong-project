/**
 * 分层缓存存储 — L2 Exact + L3 Panel（+ L2 Semantic 占位）
 *
 * 单一真相：docs/03 §6
 *
 * 与 MemoryStore 同级的本地存储，不依赖外部服务。
 * 失效策略：TTL / git HEAD 变 / 删记忆 / 改 tool 集 / 改 panel 成分 / 手动清。
 */

import { createHash } from 'crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync, unlinkSync, statSync } from 'fs'
import { join } from 'path'
import type { CacheKey, CacheLookupResult, CacheEntry, CacheLayer, PanelMember } from './fusion-types.ts'

// ---------------------------------------------------------------------------
// 路径
// ---------------------------------------------------------------------------

const CACHE_DIR = join(process.env.HOME || process.env.USERPROFILE || '.', '.craft-agent', 'cache')
const EXACT_DIR = join(CACHE_DIR, 'exact')
const PANEL_DIR = join(CACHE_DIR, 'panel')
const SEMANTIC_DB = join(CACHE_DIR, 'semantic', 'index.db')

// 默认 TTL（毫秒）
const DEFAULT_TTL_EXACT = 30 * 60 * 1000   // 30 min
const DEFAULT_TTL_PANEL = 15 * 60 * 1000   // 15 min（短于 L2）
const DEFAULT_TTL_SEMANTIC = 60 * 60 * 1000 // 60 min

function ensureDirs(): void {
  for (const dir of [CACHE_DIR, EXACT_DIR, PANEL_DIR, join(CACHE_DIR, 'semantic')]) {
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  }
}

// ---------------------------------------------------------------------------
// Key 构建
// ---------------------------------------------------------------------------

/** 构建 L2 Exact 缓存键 hash。 */
export function buildExactCacheKey(key: CacheKey): string {
  const parts = [
    key.workspaceId,
    key.connectionSlug,
    key.modelId,
    key.taskType,
    key.toolSetHash,
    key.memoryInjectionHash,
    key.permissionMode,
    key.normalizedMessage,
    key.attachmentHashes.join(','),
  ]
  return createHash('sha256').update(parts.join('\u0001')).digest('hex')
}

/** 构建 L3 Panel 缓存键 hash。 */
export function buildPanelCacheKey(
  panelModelId: string,
  stableSystemPrefixHash: string,
  normalizedTaskPrompt: string,
  webSearchScope?: string,
): string {
  const parts = [panelModelId, stableSystemPrefixHash, normalizedTaskPrompt, webSearchScope ?? '']
  return createHash('sha256').update(parts.join('\u0001')).digest('hex')
}

// ---------------------------------------------------------------------------
// 通用读写
// ---------------------------------------------------------------------------

function entryPath(layer: CacheLayer, keyHash: string): string {
  switch (layer) {
    case 'l2-exact': return join(EXACT_DIR, `${keyHash}.json`)
    case 'l3-panel': return join(PANEL_DIR, `${keyHash}.json`)
    case 'l2-semantic': return SEMANTIC_DB
  }
}

function readEntry(layer: CacheLayer, keyHash: string): CacheEntry | null {
  if (layer === 'l2-semantic') return null // Semantic 占位，P5+ 实现
  const path = entryPath(layer, keyHash)
  if (!existsSync(path)) return null
  try {
    const raw = readFileSync(path, 'utf-8')
    return JSON.parse(raw) as CacheEntry
  } catch {
    return null
  }
}

function writeEntry(layer: CacheLayer, entry: CacheEntry): void {
  if (layer === 'l2-semantic') return // 占位
  ensureDirs()
  const path = entryPath(layer, entry.key)
  writeFileSync(path, JSON.stringify(entry, null, 2), 'utf-8')
}

function isExpired(entry: CacheEntry): boolean {
  return Date.now() > entry.expiresAt
}

// ---------------------------------------------------------------------------
// L2 Exact
// ---------------------------------------------------------------------------

/** 查 L2 Exact 缓存。 */
export function lookupExact(key: CacheKey, options?: { currentGitHead?: string }): CacheLookupResult {
  const keyHash = buildExactCacheKey(key)
  const entry = readEntry('l2-exact', keyHash)
  if (!entry) return { hit: false }
  if (isExpired(entry)) {
    try { unlinkSync(entryPath('l2-exact', keyHash)) } catch { /* ignore */ }
    return { hit: false }
  }
  if (
    entry.invalidators.gitHead
    && options?.currentGitHead
    && entry.invalidators.gitHead !== options.currentGitHead
  ) {
    return { hit: false }
  }
  return { hit: true, entry, layer: 'l2-exact' }
}

/** 写 L2 Exact 缓存。 */
export function writeExact(
  key: CacheKey,
  payload: CacheEntry['payload'],
  ttlMs: number = DEFAULT_TTL_EXACT,
  invalidators?: CacheEntry['invalidators'],
): void {
  const keyHash = buildExactCacheKey(key)
  const entry: CacheEntry = {
    namespace: 'l2-exact',
    key: keyHash,
    createdAt: Date.now(),
    expiresAt: Date.now() + ttlMs,
    workspaceId: key.workspaceId,
    payload,
    invalidators: invalidators ?? { toolSetHash: key.toolSetHash },
  }
  writeEntry('l2-exact', entry)
}

// ---------------------------------------------------------------------------
// L3 Panel
// ---------------------------------------------------------------------------

/** 查 L3 Panel 缓存（单个 panelist）。 */
export function lookupPanel(
  panelModelId: string,
  stableSystemPrefixHash: string,
  normalizedTaskPrompt: string,
  webSearchScope?: string,
): CacheLookupResult {
  const keyHash = buildPanelCacheKey(panelModelId, stableSystemPrefixHash, normalizedTaskPrompt, webSearchScope)
  const entry = readEntry('l3-panel', keyHash)
  if (!entry) return { hit: false }
  if (isExpired(entry)) {
    try { unlinkSync(entryPath('l3-panel', keyHash)) } catch { /* ignore */ }
    return { hit: false }
  }
  return { hit: true, entry, layer: 'l3-panel' }
}

/** 写 L3 Panel 缓存。 */
export function writePanel(
  panelModelId: string,
  stableSystemPrefixHash: string,
  normalizedTaskPrompt: string,
  answer: string,
  member: PanelMember,
  ttlMs: number = DEFAULT_TTL_PANEL,
  webSearchScope?: string,
): void {
  const keyHash = buildPanelCacheKey(panelModelId, stableSystemPrefixHash, normalizedTaskPrompt, webSearchScope)
  const entry: CacheEntry = {
    namespace: 'l3-panel',
    key: keyHash,
    createdAt: Date.now(),
    expiresAt: Date.now() + ttlMs,
    workspaceId: '',
    payload: { answer, panelMeta: [{ member, cacheHit: true }] },
    invalidators: { toolSetHash: stableSystemPrefixHash },
  }
  writeEntry('l3-panel', entry)
}

// ---------------------------------------------------------------------------
// 失效
// ---------------------------------------------------------------------------

/** 按 git HEAD 变化失效所有相关缓存。 */
export function invalidateByGitHead(_workspaceId: string, _newGitHead: string): void {
  // 遍历 exact + panel 目录，删除 invalidators.gitHead != newGitHead 的条目
  for (const dir of [EXACT_DIR, PANEL_DIR]) {
    if (!existsSync(dir)) continue
    for (const file of readdirSync(dir)) {
      if (!file.endsWith('.json')) continue
      const path = join(dir, file)
      try {
        const entry = JSON.parse(readFileSync(path, 'utf-8')) as CacheEntry
        if (entry.invalidators.gitHead && entry.invalidators.gitHead !== _newGitHead) {
          unlinkSync(path)
        }
      } catch { /* ignore corrupt entries */ }
    }
  }
}

/** 手动清空所有缓存。 */
export function clearAll(): void {
  for (const dir of [EXACT_DIR, PANEL_DIR]) {
    if (!existsSync(dir)) continue
    for (const file of readdirSync(dir)) {
      try { unlinkSync(join(dir, file)) } catch { /* ignore */ }
    }
  }
}

/** 统计（供 Token 环/设置页显示）。 */
export function getCacheStats(): { exactCount: number; panelCount: number; totalBytes: number } {
  let exactCount = 0
  let panelCount = 0
  let totalBytes = 0
  for (const [dir, counter] of [[EXACT_DIR, 'exact'] as const, [PANEL_DIR, 'panel'] as const]) {
    if (!existsSync(dir)) continue
    for (const file of readdirSync(dir)) {
      if (!file.endsWith('.json')) continue
      const path = join(dir, file)
      try {
        totalBytes += statSync(path).size
        if (counter === 'exact') exactCount++
        else panelCount++
      } catch { /* ignore */ }
    }
  }
  return { exactCount, panelCount, totalBytes }
}
