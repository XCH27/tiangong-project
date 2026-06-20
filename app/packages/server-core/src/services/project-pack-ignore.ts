/**
 * Ignore rules and path helpers for ProjectPack v1.
 */

import { extname, isAbsolute, relative, resolve, sep } from 'node:path'

const DEFAULT_DIR_IGNORE = new Set([
  '.git',
  'node_modules',
  'dist',
  'build',
  '.next',
  'coverage',
  '__pycache__',
  '.turbo',
  '.cache',
  'target',
  'vendor',
  '.idea',
  '.vscode',
  '.craft-agent',
])

const BINARY_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico', '.bmp', '.svg',
  '.pdf', '.zip', '.tar', '.gz', '.bz2', '.7z', '.rar',
  '.woff', '.woff2', '.ttf', '.eot', '.otf',
  '.mp3', '.mp4', '.mov', '.avi', '.mkv', '.wav', '.flac',
  '.wasm', '.exe', '.dll', '.so', '.dylib', '.bin', '.dat',
  '.sqlite', '.db', '.lockb',
])

const ENV_FILE_NAMES = new Set(['.env', '.env.local', '.env.production', '.env.development'])

export function normalizeRelativePath(rootPath: string, absolutePath: string): string {
  return relative(rootPath, absolutePath).split(sep).join('/')
}

export function isEnvFile(relativePath: string): boolean {
  const base = relativePath.split('/').pop() ?? relativePath
  if (ENV_FILE_NAMES.has(base)) return true
  if (base.startsWith('.env.')) return true
  return false
}

export function isBinaryPath(relativePath: string): boolean {
  return BINARY_EXTENSIONS.has(extname(relativePath).toLowerCase())
}

export function isDefaultIgnoredDir(name: string): boolean {
  return DEFAULT_DIR_IGNORE.has(name)
}

export function looksBinaryBuffer(buf: Buffer): boolean {
  const sample = buf.subarray(0, Math.min(buf.length, 8192))
  let nonText = 0
  for (const byte of sample) {
    if (byte === 0) return true
    if (byte < 9 || (byte > 13 && byte < 32)) nonText++
  }
  return nonText / sample.length > 0.3
}

export function inferFenceLang(relativePath: string): string {
  const ext = extname(relativePath).slice(1).toLowerCase()
  const map: Record<string, string> = {
    ts: 'typescript',
    tsx: 'tsx',
    js: 'javascript',
    jsx: 'jsx',
    py: 'python',
    rs: 'rust',
    go: 'go',
    md: 'markdown',
    json: 'json',
    yaml: 'yaml',
    yml: 'yaml',
    sh: 'bash',
    bash: 'bash',
    zsh: 'bash',
    css: 'css',
    html: 'html',
    sql: 'sql',
  }
  return map[ext] ?? (ext || 'text')
}

export function resolveScopeRoot(rootPath: string, relativePath?: string): string {
  const root = resolve(rootPath)
  if (!relativePath) return root

  const target = isAbsolute(relativePath)
    ? resolve(relativePath)
    : resolve(root, relativePath)
  const fromRoot = relative(root, target)
  if (fromRoot.startsWith('..') || isAbsolute(fromRoot)) {
    throw new Error('ProjectPack directory scope must stay inside rootPath')
  }
  return target
}

export function estimateTokensFromText(text: string): number {
  return Math.ceil(text.length / 4)
}
