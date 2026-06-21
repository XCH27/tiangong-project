/**
 * ProjectPack delta planner — incremental pack scope from git changes + related imports.
 */

import { execFileSync } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { join, extname } from 'node:path'
import {
  estimateTokensFromText,
  isBinaryPath,
  isDefaultIgnoredDir,
  isEnvFile,
  looksBinaryBuffer,
} from './project-pack-ignore'

export type ProjectPackDeltaExclusionReason =
  | 'env_file'
  | 'binary'
  | 'default_ignore'
  | 'too_large'
  | 'max_files'
  | 'unrelated'
  | 'not_found'

export interface ProjectPackDeltaExcludedEntry {
  relativePath: string
  reason: ProjectPackDeltaExclusionReason
  detail?: string
}

export interface ProjectPackDeltaIncludedEntry {
  relativePath: string
  source: 'git_changed' | 'related'
  bytes?: number
  estimatedTokens?: number
}

export type ProjectPackDeltaMode = 'diff' | 'staged' | 'untracked'

export interface ProjectPackDeltaPlanRequest {
  rootPath: string
  mode?: ProjectPackDeltaMode
  maxRelatedDepth?: number
  maxFiles?: number
  maxFileBytes?: number
}

export interface ProjectPackDeltaPlan {
  rootPath: string
  mode: ProjectPackDeltaMode
  gitChangedFiles: string[]
  relatedFiles: string[]
  included: ProjectPackDeltaIncludedEntry[]
  excluded: ProjectPackDeltaExcludedEntry[]
  estimatedTokens: number
  tokenEstimateKind: 'estimate'
  generatedAt: number
}

const IMPORT_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'])
const DEFAULT_MAX_RELATED_DEPTH = 2
const DEFAULT_MAX_FILES = 200
const DEFAULT_MAX_FILE_BYTES = 512 * 1024

function runGit(cwd: string, args: string[]): string | null {
  try {
    return execFileSync('git', args, {
      cwd,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 15_000,
    }).trim()
  } catch {
    return null
  }
}

function parseGitLines(block: string | null): string[] {
  if (!block) return []
  return block
    .split('\n')
    .map((line) => line.trim().replace(/\\/g, '/'))
    .filter(Boolean)
    .sort()
}

export function listGitChangedFiles(rootPath: string, mode: ProjectPackDeltaMode = 'diff'): string[] {
  switch (mode) {
    case 'staged':
      return parseGitLines(runGit(rootPath, ['diff', '--cached', '--name-only']))
    case 'untracked':
      return parseGitLines(runGit(rootPath, ['ls-files', '--others', '--exclude-standard']))
    case 'diff':
    default: {
      const unstaged = parseGitLines(runGit(rootPath, ['diff', '--name-only']))
      const staged = parseGitLines(runGit(rootPath, ['diff', '--cached', '--name-only']))
      const untracked = parseGitLines(runGit(rootPath, ['ls-files', '--others', '--exclude-standard']))
      return [...new Set([...unstaged, ...staged, ...untracked])].sort()
    }
  }
}

function shouldExcludePath(relativePath: string): ProjectPackDeltaExcludedEntry | null {
  if (isEnvFile(relativePath)) {
    return { relativePath, reason: 'env_file' }
  }
  for (const part of relativePath.split('/')) {
    if (isDefaultIgnoredDir(part)) {
      return { relativePath, reason: 'default_ignore', detail: part }
    }
  }
  if (isBinaryPath(relativePath)) {
    return { relativePath, reason: 'binary' }
  }
  return null
}

function extractImportSpecifiers(content: string): string[] {
  const specs: string[] = []
  const patterns = [
    /\bfrom\s+['"]([^'"]+)['"]/g,
    /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
    /\brequire\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
  ]
  for (const pattern of patterns) {
    for (const match of content.matchAll(pattern)) {
      const spec = match[1]?.trim()
      if (spec && spec.startsWith('.')) specs.push(spec)
    }
  }
  return specs
}

function resolveRelativeImport(fromFile: string, spec: string): string | null {
  const fromDir = fromFile.includes('/') ? fromFile.slice(0, fromFile.lastIndexOf('/')) : ''
  const joined = fromDir ? `${fromDir}/${spec}` : spec
  const normalized = joined
    .split('/')
    .reduce<string[]>((acc, part) => {
      if (part === '.' || part === '') return acc
      if (part === '..') {
        acc.pop()
        return acc
      }
      acc.push(part)
      return acc
    }, [])
    .join('/')
  return normalized.replace(/^\.\//, '')
}

function candidateImportPaths(relativePath: string): string[] {
  const ext = extname(relativePath)
  const base = ext ? relativePath.slice(0, -ext.length) : relativePath
  const candidates = [relativePath, `${base}.ts`, `${base}.tsx`, `${base}.js`, `${base}/index.ts`, `${base}/index.tsx`]
  return [...new Set(candidates)]
}

export async function discoverRelatedFiles(
  rootPath: string,
  seedFiles: string[],
  maxDepth = DEFAULT_MAX_RELATED_DEPTH,
): Promise<string[]> {
  const related = new Set<string>()
  const queue: Array<{ file: string; depth: number }> = seedFiles.map((file) => ({ file, depth: 0 }))
  const visited = new Set<string>()

  while (queue.length > 0) {
    const current = queue.shift()!
    if (visited.has(current.file)) continue
    visited.add(current.file)
    if (current.depth >= maxDepth) continue

    const ext = extname(current.file).toLowerCase()
    if (!IMPORT_EXTENSIONS.has(ext)) continue

    let content: string
    try {
      content = await readFile(join(rootPath, current.file), 'utf-8')
    } catch {
      continue
    }

    for (const spec of extractImportSpecifiers(content)) {
      const resolved = resolveRelativeImport(current.file, spec)
      if (!resolved) continue
      for (const candidate of candidateImportPaths(resolved)) {
        if (candidate === current.file || seedFiles.includes(candidate)) continue
        try {
          await readFile(join(rootPath, candidate), 'utf-8')
          if (!related.has(candidate)) {
            related.add(candidate)
            queue.push({ file: candidate, depth: current.depth + 1 })
          }
          break
        } catch {
          // try next candidate extension
        }
      }
    }
  }

  return [...related].sort()
}

export async function planProjectPackDelta(request: ProjectPackDeltaPlanRequest): Promise<ProjectPackDeltaPlan> {
  const maxFiles = request.maxFiles ?? DEFAULT_MAX_FILES
  const maxFileBytes = request.maxFileBytes ?? DEFAULT_MAX_FILE_BYTES
  const maxRelatedDepth = request.maxRelatedDepth ?? DEFAULT_MAX_RELATED_DEPTH
  const mode = request.mode ?? 'diff'

  const gitChangedFiles = listGitChangedFiles(request.rootPath, mode)
  const relatedFiles = await discoverRelatedFiles(request.rootPath, gitChangedFiles, maxRelatedDepth)

  const included: ProjectPackDeltaIncludedEntry[] = []
  const excluded: ProjectPackDeltaExcludedEntry[] = []
  const seen = new Set<string>()

  const ordered: Array<{ relativePath: string; source: 'git_changed' | 'related' }> = [
    ...gitChangedFiles.map((relativePath) => ({ relativePath, source: 'git_changed' as const })),
    ...relatedFiles.map((relativePath) => ({ relativePath, source: 'related' as const })),
  ]

  for (const item of ordered) {
    if (seen.has(item.relativePath)) continue
    seen.add(item.relativePath)

    const pre = shouldExcludePath(item.relativePath)
    if (pre) {
      excluded.push(pre)
      continue
    }

    if (included.length >= maxFiles) {
      excluded.push({ relativePath: item.relativePath, reason: 'max_files' })
      continue
    }

    let buf: Buffer
    try {
      buf = Buffer.from(await readFile(join(request.rootPath, item.relativePath)))
    } catch {
      excluded.push({ relativePath: item.relativePath, reason: 'not_found' })
      continue
    }

    if (buf.length > maxFileBytes) {
      excluded.push({ relativePath: item.relativePath, reason: 'too_large' })
      continue
    }
    if (looksBinaryBuffer(buf)) {
      excluded.push({ relativePath: item.relativePath, reason: 'binary' })
      continue
    }

    const text = buf.toString('utf-8')
    included.push({
      relativePath: item.relativePath,
      source: item.source,
      bytes: buf.length,
      estimatedTokens: estimateTokensFromText(text),
    })
  }

  const estimatedTokens = included.reduce((sum, file) => sum + (file.estimatedTokens ?? 0), 0)

  return {
    rootPath: request.rootPath,
    mode,
    gitChangedFiles,
    relatedFiles,
    included,
    excluded,
    estimatedTokens,
    tokenEstimateKind: 'estimate',
    generatedAt: Date.now(),
  }
}
