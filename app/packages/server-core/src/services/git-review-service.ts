import { execFile } from 'node:child_process'
import { stat } from 'node:fs/promises'
import { basename, isAbsolute, relative, resolve, sep } from 'node:path'
import { promisify } from 'node:util'
import type {
  GitBranchSummary,
  GitFileDiffResult,
  GitFileStatus,
  GitReviewState,
  GitRemoteSummary,
} from '@craft-agent/shared/protocol'

const execFileAsync = promisify(execFile)
const GIT_TIMEOUT_MS = 8000
const GH_TIMEOUT_MS = 5000
const MAX_DIFF_BYTES = 800_000

interface ExecResult {
  stdout: string
  stderr: string
}

export class GitReviewService {
  async getReviewState(workspaceRoot: string): Promise<GitReviewState> {
    const rootPath = resolve(workspaceRoot)
    const repositoryRoot = await this.getRepositoryRoot(rootPath)
    if (!repositoryRoot) {
      return {
        isGitRepository: false,
        rootPath,
        files: [],
        branches: [],
        remotes: [],
        github: await this.getGithubCliStatus(),
        totals: { files: 0, staged: 0, unstaged: 0, untracked: 0, additions: 0, deletions: 0 },
      }
    }

    const [currentBranch, branches, remotes, files, github] = await Promise.all([
      this.getCurrentBranch(repositoryRoot),
      this.getBranches(repositoryRoot),
      this.getRemotes(repositoryRoot),
      this.getFileStatuses(repositoryRoot),
      this.getGithubCliStatus(),
    ])

    const totals = files.reduce((acc, file) => {
      acc.files += 1
      if (file.staged) acc.staged += 1
      if (file.unstaged) acc.unstaged += 1
      if (file.untracked) acc.untracked += 1
      acc.additions += file.additions ?? 0
      acc.deletions += file.deletions ?? 0
      return acc
    }, { files: 0, staged: 0, unstaged: 0, untracked: 0, additions: 0, deletions: 0 })

    return {
      isGitRepository: true,
      rootPath,
      repositoryRoot,
      currentBranch: currentBranch ?? undefined,
      files,
      branches,
      remotes,
      github,
      totals,
    }
  }

  async getFileDiff(workspaceRoot: string, filePath: string): Promise<GitFileDiffResult> {
    const rootPath = resolve(workspaceRoot)
    const repositoryRoot = await this.getRepositoryRoot(rootPath)
    if (!repositoryRoot) throw new Error('Workspace is not a git repository')

    const absolutePath = isAbsolute(filePath) ? resolve(filePath) : resolve(repositoryRoot, filePath)
    if (!isWithin(repositoryRoot, absolutePath)) {
      throw new Error('File path escapes git repository')
    }

    const fileInfo = await stat(absolutePath).catch(() => null)
    const relPath = relative(repositoryRoot, absolutePath)
    const diff = await this.runGit(repositoryRoot, ['diff', '--no-ext-diff', '--', relPath], MAX_DIFF_BYTES)
      .then((result) => result.stdout)

    if (diff.length > 0) {
      return { path: relPath, diff, binary: isBinaryDiff(diff), tooLarge: false }
    }

    if (fileInfo?.isFile() && fileInfo.size > MAX_DIFF_BYTES) {
      return { path: relPath, diff: '', binary: true, tooLarge: true }
    }

    return { path: relPath, diff: '', binary: false, tooLarge: false }
  }

  private async getRepositoryRoot(cwd: string): Promise<string | null> {
    try {
      const result = await this.runGit(cwd, ['rev-parse', '--show-toplevel'])
      const root = result.stdout.trim()
      return root || null
    } catch {
      return null
    }
  }

  private async getCurrentBranch(repositoryRoot: string): Promise<string | null> {
    try {
      const result = await this.runGit(repositoryRoot, ['rev-parse', '--abbrev-ref', 'HEAD'])
      const branch = result.stdout.trim()
      return branch && branch !== 'HEAD' ? branch : null
    } catch {
      return null
    }
  }

  private async getBranches(repositoryRoot: string): Promise<GitBranchSummary[]> {
    try {
      const result = await this.runGit(repositoryRoot, ['branch', '--format=%(HEAD)%00%(refname:short)'])
      return result.stdout
        .split('\n')
        .map((line) => line.trimEnd())
        .filter(Boolean)
        .map((line) => {
          const [head, name] = line.split('\0')
          return { name: name || line.replace(/^\*\s*/, ''), current: head === '*' }
        })
        .filter((branch) => Boolean(branch.name))
    } catch {
      return []
    }
  }

  private async getRemotes(repositoryRoot: string): Promise<GitRemoteSummary[]> {
    try {
      const result = await this.runGit(repositoryRoot, ['remote', '-v'])
      const seen = new Set<string>()
      const remotes: GitRemoteSummary[] = []
      for (const line of result.stdout.split('\n')) {
        const match = line.match(/^(\S+)\s+(\S+)\s+\((fetch|push)\)$/)
        if (!match || match[3] !== 'fetch') continue
        const key = `${match[1]}:${match[2]}`
        if (seen.has(key)) continue
        seen.add(key)
        remotes.push({
          name: match[1],
          url: match[2],
          githubRepository: parseGithubRepository(match[2]),
        })
      }
      return remotes
    } catch {
      return []
    }
  }

  private async getFileStatuses(repositoryRoot: string): Promise<GitFileStatus[]> {
    const [statusOutput, numstatOutput] = await Promise.all([
      this.runGit(repositoryRoot, ['status', '--porcelain=v1']).then((result) => result.stdout).catch(() => ''),
      this.runGit(repositoryRoot, ['diff', '--numstat', 'HEAD']).then((result) => result.stdout).catch(() => ''),
    ])
    const stats = parseNumstat(numstatOutput)
    return parseStatus(statusOutput).map((file) => ({
      ...file,
      additions: stats.get(file.path)?.additions,
      deletions: stats.get(file.path)?.deletions,
    }))
  }

  private async getGithubCliStatus(): Promise<GitReviewState['github']> {
    try {
      const result = await execFileAsync('gh', ['auth', 'status', '--hostname', 'github.com'], {
        encoding: 'utf8',
        timeout: GH_TIMEOUT_MS,
        maxBuffer: 120_000,
      }) as ExecResult
      return {
        ghInstalled: true,
        authenticated: true,
        username: parseGhUsername(result.stdout || result.stderr),
      }
    } catch (error) {
      const nodeError = error as NodeJS.ErrnoException & { stdout?: string; stderr?: string }
      if (nodeError.code === 'ENOENT') {
        return { ghInstalled: false, authenticated: false, error: 'GitHub CLI is not installed' }
      }
      return {
        ghInstalled: true,
        authenticated: false,
        error: (nodeError.stderr || nodeError.stdout || nodeError.message || 'GitHub CLI is not authenticated').trim(),
      }
    }
  }

  private async runGit(cwd: string, args: string[], maxBuffer = 2_000_000): Promise<ExecResult> {
    return await execFileAsync('git', args, {
      cwd,
      encoding: 'utf8',
      timeout: GIT_TIMEOUT_MS,
      maxBuffer,
    }) as ExecResult
  }
}

function parseStatus(output: string): GitFileStatus[] {
  return output
    .split('\n')
    .map((line) => line.trimEnd())
    .filter(Boolean)
    .map((line): GitFileStatus => {
      const indexStatus = line[0] ?? ' '
      const workingTreeStatus = line[1] ?? ' '
      const rawPath = line.slice(3)
      const renameParts = rawPath.split(' -> ')
      const path = stripGitQuotes(renameParts[renameParts.length - 1] || rawPath)
      const oldPath = renameParts.length > 1 ? stripGitQuotes(renameParts[0]) : undefined
      const untracked = indexStatus === '?' && workingTreeStatus === '?'
      return {
        path,
        oldPath,
        indexStatus,
        workingTreeStatus,
        kind: kindForStatus(indexStatus, workingTreeStatus),
        staged: !untracked && indexStatus !== ' ',
        unstaged: !untracked && workingTreeStatus !== ' ',
        untracked,
      }
    })
}

function parseNumstat(output: string): Map<string, { additions: number; deletions: number }> {
  const stats = new Map<string, { additions: number; deletions: number }>()
  for (const line of output.split('\n')) {
    if (!line.trim()) continue
    const [added, deleted, ...pathParts] = line.split('\t')
    const path = pathParts.join('\t')
    stats.set(path, {
      additions: added === '-' ? 0 : Number.parseInt(added, 10) || 0,
      deletions: deleted === '-' ? 0 : Number.parseInt(deleted, 10) || 0,
    })
  }
  return stats
}

function kindForStatus(indexStatus: string, workingTreeStatus: string): GitFileStatus['kind'] {
  const combined = `${indexStatus}${workingTreeStatus}`
  if (combined === '??') return 'untracked'
  if (combined.includes('U') || combined.includes('A') && combined.includes('D') || combined.includes('D') && combined.includes('A')) return 'conflicted'
  if (indexStatus === 'R' || workingTreeStatus === 'R') return 'renamed'
  if (indexStatus === 'C' || workingTreeStatus === 'C') return 'copied'
  if (indexStatus === 'A' || workingTreeStatus === 'A') return 'added'
  if (indexStatus === 'D' || workingTreeStatus === 'D') return 'deleted'
  if (indexStatus === 'M' || workingTreeStatus === 'M') return 'modified'
  return 'unknown'
}

function parseGithubRepository(remoteUrl: string): string | undefined {
  const sshMatch = remoteUrl.match(/^git@github\.com:(.+?)(?:\.git)?$/)
  if (sshMatch) return sshMatch[1]
  try {
    const parsed = new URL(remoteUrl)
    if (parsed.hostname !== 'github.com') return undefined
    return parsed.pathname.replace(/^\/+/, '').replace(/\.git$/, '') || undefined
  } catch {
    return undefined
  }
}

function parseGhUsername(output: string): string | undefined {
  const match = output.match(/Logged in to github\.com account ([^\s]+)/i)
  return match?.[1]
}

function stripGitQuotes(value: string): string {
  if (value.length >= 2 && value.startsWith('"') && value.endsWith('"')) {
    return value.slice(1, -1)
  }
  return value
}

function isBinaryDiff(diff: string): boolean {
  return diff.includes('Binary files ') || diff.includes('GIT binary patch')
}

function isWithin(root: string, candidate: string): boolean {
  const rel = relative(root, candidate)
  return rel === '' || (!rel.startsWith('..') && !rel.startsWith(`..${sep}`) && !isAbsolute(rel))
}
