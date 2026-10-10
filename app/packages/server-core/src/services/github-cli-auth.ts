import { execFile, spawn, type ChildProcess } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { promisify } from 'node:util'
import type { GitHubCliAuthResult, GitHubCliCommand } from '@craft-agent/shared/protocol'
import { getGitHubCliStatus } from './github-cli-status'

const exec = promisify(execFile)
const LOGIN_TIMEOUT = 15 * 60 * 1000
const failure = (): GitHubCliAuthResult => ({ state: 'error' })
type Flow = {
  clientId: string
  result: GitHubCliAuthResult
  child: ChildProcess
  timeout: ReturnType<typeof setTimeout>
}

/** OpenChamber's start → device code → completion/cancel interaction, using the
 * installed official gh CLI as the ONLY credential owner. No copied OAuth app,
 * token transport, raw stderr response, shell command, or independent vault. */
export class GitHubCliAuth {
  private flow?: Flow
  private mutating = false

  constructor(private readonly launch: () => ChildProcess = () => spawn('gh', [
    'auth', 'login', '--hostname', 'github.com', '--web', '--skip-ssh-key', '--clipboard=false',
  ], {
    stdio: ['ignore', 'ignore', 'pipe'], windowsHide: true,
    env: { ...process.env, GH_PROMPT_DISABLED: '1', NO_COLOR: '1', GH_FORCE_TTY: '' },
  })) {}

  clientDisconnected(clientId: string): void {
    const flow = this.flow
    if (flow?.clientId === clientId && this.pending()) this.finish(flow, 'cancelled', true)
  }

  async command(clientId: string, command: GitHubCliCommand): Promise<GitHubCliAuthResult> {
    if (!command || typeof command !== 'object') return failure()
    if (command.action === 'poll' || command.action === 'cancel') {
      const flow = this.flow
      if (!flow || flow.clientId !== clientId || flow.result.flowId !== command.flowId) return failure()
      if (command.action === 'cancel' && this.pending()) this.finish(flow, 'cancelled', true)
      return { ...flow.result }
    }
    // Environment-provided tokens belong to the launching runtime, not this UI.
    if (process.env.GH_TOKEN || process.env.GITHUB_TOKEN || process.env.GH_ENTERPRISE_TOKEN || process.env.GITHUB_ENTERPRISE_TOKEN) return failure()
    if (this.mutating) return failure()
    if (command.action === 'start') {
      if (this.pending()) return this.flow?.clientId === clientId ? { ...this.flow.result } : failure()
      if (this.flow) clearTimeout(this.flow.timeout)
      let child: ChildProcess
      try { child = this.launch() } catch { return failure() }
      const flow: Flow = {
        clientId, child,
        result: { state: 'starting', flowId: randomUUID() },
        timeout: setTimeout(() => {
          this.finish(flow, 'error', true)
          if (this.flow === flow) this.flow = undefined
        }, LOGIN_TIMEOUT),
      }
      flow.timeout.unref?.()
      this.flow = flow
      let pendingLine = ''
      child.stderr?.setEncoding('utf8')
      child.stderr?.on('data', (chunk: string) => {
        if (!['starting', 'waiting'].includes(flow.result.state)) return
        pendingLine = (pendingLine + chunk).slice(-4096)
        // gh's non-TTY authflow displays this public one-time code on stderr.
        // Whitelist that field; never return logs, token values or arbitrary URLs.
        const code = pendingLine.match(/First copy your one-time code:\s*([A-Z0-9]{4}-[A-Z0-9]{4})/)
        if (code) {
          flow.result = { state: 'waiting', flowId: flow.result.flowId, userCode: code[1] }
          pendingLine = ''
        }
      })
      child.once('error', () => this.finish(flow, 'error', true))
      child.once('close', (code) => this.finish(flow, code === 0 ? 'complete' : 'error'))
      return { ...flow.result }
    }
    if (command.action !== 'switch' && command.action !== 'logout') return failure()
    if (this.pending() || !/^[a-z0-9.-]+$/i.test(command.host) || !/^[a-z0-9-]+$/i.test(command.login)) return failure()
    this.mutating = true
    try {
      const status = await getGitHubCliStatus()
      if (!status.accounts.some(account => account.host === command.host && account.login === command.login)) return failure()
      await exec('gh', ['auth', command.action, '--hostname', command.host, '--user', command.login], {
        timeout: 10000, maxBuffer: 16 * 1024, windowsHide: true,
        env: { ...process.env, GH_PROMPT_DISABLED: '1' },
      })
      return { state: 'complete' }
    } catch { return failure() } finally { this.mutating = false }
  }

  private pending() { return this.flow?.result.state === 'starting' || this.flow?.result.state === 'waiting' }

  private finish(flow: Flow, state: 'complete' | 'cancelled' | 'error', kill = false) {
    if (!['starting', 'waiting'].includes(flow.result.state)) return
    flow.result = { state, flowId: flow.result.flowId }
    if (kill) flow.child.kill()
    clearTimeout(flow.timeout)
    flow.timeout = setTimeout(() => { if (this.flow === flow) this.flow = undefined }, 60000)
    flow.timeout.unref?.()
  }
}

const auth = new GitHubCliAuth()
export const githubCliAuth = (clientId: string, command: GitHubCliCommand) => auth.command(clientId, command)
export const cancelGitHubCliAuthForClient = (clientId: string) => auth.clientDisconnected(clientId)
