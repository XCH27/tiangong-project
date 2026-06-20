/**
 * ProjectPackService — 本地项目打包（T-PROJECTPACK v1）。
 *
 * 把 repo / git diff / 指定目录打包为 AI-friendly Markdown，写入 Fleet 数据目录。
 * 仅本地操作：不外发、不上传；token 为估算值。
 */

import { createHash, randomUUID } from 'node:crypto'
import { readdirSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'
import type {
  ProjectPackRequest,
  ProjectPackResult,
  ProjectPackSummary,
  ProjectPackExcludedEntry,
  ProjectPackFileEntry,
  ProjectPackScope,
} from '@craft-agent/shared/protocol'
import {
  estimateTokensFromText,
  inferFenceLang,
  isBinaryPath,
  isDefaultIgnoredDir,
  isEnvFile,
  looksBinaryBuffer,
  normalizeRelativePath,
  resolveScopeRoot,
} from './project-pack-ignore'
import { scanFilesForSecrets } from './project-pack-secret-scan'

const DEFAULT_MAX_FILE_BYTES = 512 * 1024
const DEFAULT_MAX_FILES = 500
const PREVIEW_LINES = 40

export function getProjectPackDataDir(): string {
  return join(homedir(), '.craft-agent', 'fleet', 'project-packs')
}

interface CandidateFile {
  relativePath: string
  absolutePath: string
}

interface PackedFile {
  relativePath: string
  content: string
  bytes: number
  sha256: string
}

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

function getGitMeta(rootPath: string): Pick<ProjectPackSummary, 'gitCommit' | 'gitBranch' | 'gitDirty'> {
  const commit = runGit(rootPath, ['rev-parse', 'HEAD'])
  const branch = runGit(rootPath, ['rev-parse', '--abbrev-ref', 'HEAD'])
  const dirty = runGit(rootPath, ['status', '--porcelain']) !== ''
  return {
    gitCommit: commit,
    gitBranch: branch,
    gitDirty: dirty,
  }
}

function listDiffFiles(rootPath: string): string[] {
  const out = runGit(rootPath, ['diff', '--name-only', 'HEAD'])
  const staged = runGit(rootPath, ['diff', '--cached', '--name-only'])
  const untracked = runGit(rootPath, ['ls-files', '--others', '--exclude-standard'])
  const set = new Set<string>()
  for (const block of [out, staged, untracked]) {
    if (!block) continue
    for (const line of block.split('\n')) {
      const trimmed = line.trim()
      if (trimmed) set.add(trimmed)
    }
  }
  return [...set].sort()
}

function listRepoFiles(rootPath: string): string[] {
  const tracked = runGit(rootPath, ['ls-files'])
  const untracked = runGit(rootPath, ['ls-files', '--others', '--exclude-standard'])
  const set = new Set<string>()
  for (const block of [tracked, untracked]) {
    if (!block) continue
    for (const line of block.split('\n')) {
      const trimmed = line.trim()
      if (trimmed) set.add(trimmed)
    }
  }
  if (set.size > 0) return [...set].sort()

  return walkDirectorySync(rootPath, rootPath)
}

function walkDirectorySync(rootPath: string, dirPath: string, acc: string[] = [], prefix = ''): string[] {
  let entries
  try {
    entries = readdirSync(dirPath, { withFileTypes: true })
  } catch {
    return acc
  }
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (isDefaultIgnoredDir(entry.name)) continue
      if (entry.name.startsWith('.') && entry.name !== '.github') continue
      walkDirectorySync(rootPath, join(dirPath, entry.name), acc, prefix ? `${prefix}/${entry.name}` : entry.name)
      continue
    }
    if (!entry.isFile()) continue
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name
    acc.push(rel)
  }
  return acc
}

function listDirectoryScopeFiles(rootPath: string, scopeRoot: string): string[] {
  const relPrefix = normalizeRelativePath(rootPath, scopeRoot)
  if (relPrefix === '.') {
    return walkDirectorySync(scopeRoot, scopeRoot).sort()
  }
  return walkDirectorySync(scopeRoot, scopeRoot)
    .map((p) => `${relPrefix}/${p}`)
    .sort()
}

function collectCandidates(request: ProjectPackRequest): CandidateFile[] {
  const { rootPath, scope, relativePath } = request
  const scopeRoot = resolveScopeRoot(rootPath, relativePath)
  let relativePaths: string[]

  switch (scope) {
    case 'diff':
      relativePaths = listDiffFiles(rootPath)
      break
    case 'directory':
      relativePaths = listDirectoryScopeFiles(rootPath, scopeRoot)
      break
    case 'repo':
    default:
      relativePaths = listRepoFiles(rootPath)
      break
  }

  return relativePaths.map((relativePath) => ({
    relativePath,
    absolutePath: join(rootPath, relativePath),
  }))
}

function shouldExclude(relativePath: string): ProjectPackExcludedEntry | null {
  if (isEnvFile(relativePath)) {
    return { relativePath, reason: 'env_file' }
  }
  for (const part of relativePath.split('/')) {
    if (isDefaultIgnoredDir(part)) {
      return { relativePath, reason: 'default_ignore' }
    }
  }
  if (isBinaryPath(relativePath)) {
    return { relativePath, reason: 'binary' }
  }
  return null
}

async function readCandidateFile(
  candidate: CandidateFile,
  maxFileBytes: number,
): Promise<{ packed?: PackedFile; excluded?: ProjectPackExcludedEntry }> {
  const pre = shouldExclude(candidate.relativePath)
  if (pre) return { excluded: pre }

  let buf: Buffer
  try {
    buf = await readFile(candidate.absolutePath)
  } catch {
    return { excluded: { relativePath: candidate.relativePath, reason: 'default_ignore' } }
  }

  if (buf.length > maxFileBytes) {
    return { excluded: { relativePath: candidate.relativePath, reason: 'too_large' } }
  }
  if (looksBinaryBuffer(buf)) {
    return { excluded: { relativePath: candidate.relativePath, reason: 'binary' } }
  }

  const content = buf.toString('utf-8')
  const sha256 = createHash('sha256').update(buf).digest('hex')
  return {
    packed: {
      relativePath: candidate.relativePath,
      content,
      bytes: buf.length,
      sha256,
    },
  }
}

function buildMarkdown(
  summary: Omit<ProjectPackSummary, 'bundleId' | 'bundleHash' | 'bundlePath' | 'markdownBytes' | 'createdAt' | 'externalExportAllowed'>,
  files: PackedFile[],
): string {
  const header = [
    '# Project Pack',
    '',
    `- Root: \`${summary.rootPath}\``,
    `- Scope: ${summary.scope}`,
    `- Git commit: ${summary.gitCommit ?? 'n/a'}`,
    `- Git branch: ${summary.gitBranch ?? 'n/a'}`,
    `- Git dirty: ${summary.gitDirty}`,
    `- Files: ${summary.fileCount}`,
    `- Total bytes: ${summary.totalBytes}`,
    `- Estimated tokens: ${summary.estimatedTokens} (${summary.tokenEstimateKind})`,
    `- Secret findings: ${summary.secretScan.findingCount}`,
    '',
    '## Files',
    '',
  ].join('\n')

  const body = files
    .map((file) => {
      const lang = inferFenceLang(file.relativePath)
      return [`### ${file.relativePath}`, '', '```' + lang, file.content, '```', ''].join('\n')
    })
    .join('\n')

  return header + body
}

function buildPreview(markdown: string): string {
  return markdown.split('\n').slice(0, PREVIEW_LINES).join('\n')
}

export class ProjectPackService {
  async pack(request: ProjectPackRequest): Promise<ProjectPackResult> {
    const maxFileBytes = request.maxFileBytes ?? DEFAULT_MAX_FILE_BYTES
    const maxFiles = request.maxFiles ?? DEFAULT_MAX_FILES
    const scope: ProjectPackScope = request.scope
    const gitMeta = getGitMeta(request.rootPath)

    const candidates = collectCandidates(request)
    const excluded: ProjectPackExcludedEntry[] = []
    const packed: PackedFile[] = []

    for (const candidate of candidates) {
      if (packed.length >= maxFiles) {
        excluded.push({ relativePath: candidate.relativePath, reason: 'max_files' })
        continue
      }
      const result = await readCandidateFile(candidate, maxFileBytes)
      if (result.excluded) {
        excluded.push(result.excluded)
        continue
      }
      if (result.packed) packed.push(result.packed)
    }

    const secretFindings = scanFilesForSecrets(
      packed.map((f) => ({ relativePath: f.relativePath, content: f.content })),
    )
    const hasHighSeverity = secretFindings.some((f) => f.severity === 'high')

    const files: ProjectPackFileEntry[] = packed.map((f) => ({
      relativePath: f.relativePath,
      bytes: f.bytes,
      sha256: f.sha256,
    }))

    const totalBytes = packed.reduce((sum, f) => sum + f.bytes, 0)

    const partialSummary = {
      scope,
      rootPath: request.rootPath,
      ...gitMeta,
      fileCount: packed.length,
      totalBytes,
      estimatedTokens: 0,
      tokenEstimateKind: 'estimate' as const,
      excluded,
      files,
      secretScan: {
        scannedFileCount: packed.length,
        findingCount: secretFindings.length,
        findings: secretFindings,
        hasHighSeverity,
      },
    }

    const markdown = buildMarkdown(partialSummary, packed)
    const estimatedTokens = estimateTokensFromText(markdown)
    const bundleId = randomUUID()
    const bundleHash = createHash('sha256').update(markdown).digest('hex')
    const dataDir = getProjectPackDataDir()
    await mkdir(dataDir, { recursive: true })
    const bundlePath = join(dataDir, `${bundleId}.md`)
    await writeFile(bundlePath, markdown, 'utf-8')

    const summary: ProjectPackSummary = {
      ...partialSummary,
      bundleId,
      bundleHash,
      bundlePath,
      estimatedTokens,
      createdAt: Date.now(),
      markdownBytes: Buffer.byteLength(markdown, 'utf-8'),
      externalExportAllowed: !hasHighSeverity,
    }

    const summaryPath = join(dataDir, `${bundleId}.summary.json`)
    await writeFile(summaryPath, JSON.stringify(summary, null, 2), 'utf-8')

    return {
      summary,
      markdownPreview: buildPreview(markdown),
    }
  }

  async getSummary(bundleId: string): Promise<ProjectPackSummary | null> {
    const summaryPath = join(getProjectPackDataDir(), `${bundleId}.summary.json`)
    try {
      const raw = await readFile(summaryPath, 'utf-8')
      return JSON.parse(raw) as ProjectPackSummary
    } catch {
      return null
    }
  }
}

export const projectPackService = new ProjectPackService()
