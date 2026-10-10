import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

import type { GitHubCliAccount, GitHubCliStatus } from '@craft-agent/shared/protocol'
export type { GitHubCliAccount, GitHubCliStatus } from '@craft-agent/shared/protocol'

/** gh CLI is the credential owner. Keep only the public account identity in the
 * renderer; never request or transport a token. */
export function parseGitHubCliStatus(output: string): GitHubCliStatus {
  const parsed: unknown = JSON.parse(output)
  if (!parsed || typeof parsed !== 'object' || !('hosts' in parsed)) {
    throw new Error('Invalid GitHub CLI response')
  }
  const hosts = (parsed as { hosts: unknown }).hosts
  if (!hosts || typeof hosts !== 'object' || Array.isArray(hosts)) {
    throw new Error('Invalid GitHub CLI host list')
  }
  const accounts: GitHubCliAccount[] = []
  for (const [host, entries] of Object.entries(hosts)) {
    if (!Array.isArray(entries)) continue
    for (const entry of entries) {
      if (!entry || typeof entry !== 'object') continue
      const row = entry as Record<string, unknown>
      if (row.state !== 'success' || typeof row.login !== 'string' || !row.login.trim()) continue
      accounts.push({ host, login: row.login.trim(), active: row.active === true })
    }
  }
  return { state: accounts.length ? 'connected' : 'disconnected', accounts }
}

export async function getGitHubCliStatus(): Promise<GitHubCliStatus> {
  try {
    const { stdout } = await execFileAsync('gh', ['auth', 'status', '--json', 'hosts'], {
      encoding: 'utf8',
      timeout: 5000,
      maxBuffer: 256 * 1024,
      windowsHide: true,
    })
    return parseGitHubCliStatus(stdout)
  } catch (error) {
    const code = (error as NodeJS.ErrnoException)?.code
    return { state: code === 'ENOENT' ? 'unavailable' : 'error', accounts: [] }
  }
}
