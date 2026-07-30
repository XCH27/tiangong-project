import { afterEach, describe, expect, it } from 'bun:test'
import { execFileSync } from 'child_process'
import { mkdtempSync, realpathSync, rmSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { RPC_CHANNELS } from '@craft-agent/shared/protocol'
import type { HandlerFn, RequestContext, RpcServer } from '@craft-agent/server-core/transport'
import type { HandlerDeps } from '../handler-deps'
import { registerSystemCoreHandlers } from './system'

const tempDirectories: string[] = []

afterEach(() => {
  for (const directory of tempDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true })
  }
})

/**
 * Stands in for the Electron main process's real window registry. Only the
 * host can answer these, which is what makes them usable for authorization —
 * unlike the webContentsId/workspaceId a client declares in its handshake.
 */
function createWindowManager(
  windowWorkspaces: Record<number, string> = { 1: 'workspace-1' },
): HandlerDeps['windowManager'] {
  return {
    getWorkspaceForWindow: (webContentsId: number) => windowWorkspaces[webContentsId] ?? null,
    getWindowByWebContentsId: (webContentsId: number) =>
      windowWorkspaces[webContentsId] ? { id: webContentsId } : null,
    updateWindowWorkspace: () => false,
    registerWindow: () => {},
    getAllWindowsForWorkspace: () => [],
  }
}

function createHandlers(
  workingDirectory = tmpdir(),
  // Options object rather than a defaulted positional: passing `undefined` for
  // a defaulted parameter re-applies the default, which would silently give a
  // "headless" case a window registry and make the test vacuous.
  options: { windowManager?: HandlerDeps['windowManager'] } = {},
): Map<string, HandlerFn> {
  const windowManager = 'windowManager' in options ? options.windowManager : createWindowManager()
  const handlers = new Map<string, HandlerFn>()
  const server: RpcServer = {
    handle(channel, handler) {
      handlers.set(channel, handler)
    },
    push() {},
    async invokeClient() {},
    hasClientCapability() { return false },
    findClientsWithCapability() { return [] },
  }
  const deps: HandlerDeps = {
    sessionManager: {
      getSessions(workspaceId?: string) {
        if (workspaceId && workspaceId !== 'workspace-1') return []
        return [{
          id: 'session-1',
          workspaceId: 'workspace-1',
          workingDirectory,
        }]
      },
    } as HandlerDeps['sessionManager'],
    windowManager,
    oauthFlowStore: {} as HandlerDeps['oauthFlowStore'],
    platform: {
      appRootPath: '/',
      resourcesPath: '/',
      isPackaged: false,
      appVersion: '0.0.0-test',
      isDebugMode: true,
      logger: {
        info: () => {},
        warn: () => {},
        error: () => {},
        debug: () => {},
      },
      imageProcessor: {
        getMetadata: async () => null,
        process: async () => Buffer.from(''),
      },
    },
  }
  registerSystemCoreHandlers(server, deps)
  return handlers
}

const ctx: RequestContext = {
  clientId: 'client-1',
  workspaceId: 'workspace-1',
  webContentsId: 1,
}

describe('right workbench core handlers', () => {
  it('projects a Git overview and loads a selected file diff without mutating it', async () => {
    const directory = mkdtempSync(join(tmpdir(), 'craft-workbench-git-'))
    tempDirectories.push(directory)
    execFileSync('git', ['init', '--quiet'], { cwd: directory })
    writeFileSync(join(directory, 'workbench.txt'), 'review me\n')
    execFileSync('git', ['add', 'workbench.txt'], { cwd: directory })

    const handler = createHandlers(directory).get(RPC_CHANNELS.git.GET_WORKING_TREE)
    expect(handler).toBeDefined()
    const snapshot = await handler!(ctx, 'session-1')

    expect(snapshot?.repoRoot).toBe(realpathSync(directory))
    expect(snapshot?.files).toEqual([{
      indexStatus: 'A',
      workingTreeStatus: ' ',
      path: 'workbench.txt',
      additions: 1,
      deletions: 0,
    }])
    expect(snapshot?.totals).toEqual({ additions: 1, deletions: 0 })
    expect(snapshot).not.toHaveProperty('diff')

    const fileDiffHandler = createHandlers(directory).get(RPC_CHANNELS.git.GET_FILE_DIFF)
    expect(fileDiffHandler).toBeDefined()
    const fileDiff = await fileDiffHandler!(ctx, 'session-1', 'workbench.txt')
    expect(fileDiff?.path).toBe('workbench.txt')
    expect(fileDiff?.diff).toContain('+review me')
    expect(fileDiff?.truncated).toBe(false)
    expect(execFileSync('git', ['status', '--short'], { cwd: directory, encoding: 'utf-8' }))
      .toBe('A  workbench.txt\n')
  })

  it('rejects Git diff paths that escape the repository', async () => {
    const directory = mkdtempSync(join(tmpdir(), 'craft-workbench-git-path-'))
    tempDirectories.push(directory)
    execFileSync('git', ['init', '--quiet'], { cwd: directory })

    const handler = createHandlers(directory).get(RPC_CHANNELS.git.GET_FILE_DIFF)
    expect(handler).toBeDefined()
    await expect(handler!(ctx, 'session-1', '../outside.txt')).rejects.toThrow(
      'Git file path is outside the repository',
    )
  })

  it('runs a bounded command in the requested project directory', async () => {
    const directory = mkdtempSync(join(tmpdir(), 'craft-workbench-terminal-'))
    tempDirectories.push(directory)

    const handler = createHandlers(directory).get(RPC_CHANNELS.terminal.RUN_COMMAND)
    expect(handler).toBeDefined()
    const result = await handler!(ctx, 'session-1', 'printf core-terminal-ok')

    expect(result).toEqual({
      output: 'core-terminal-ok',
      exitCode: 0,
      timedOut: false,
    })
  })

  it('rejects terminal working directories outside the existing filesystem policy', async () => {
    const handler = createHandlers('/etc').get(RPC_CHANNELS.terminal.RUN_COMMAND)
    expect(handler).toBeDefined()

    await expect(handler!(ctx, 'session-1', 'pwd')).rejects.toThrow(
      'Access denied: file path is outside allowed directories',
    )
  })

  it('rejects oversized command payloads before starting a process', async () => {
    const handler = createHandlers().get(RPC_CHANNELS.terminal.RUN_COMMAND)
    expect(handler).toBeDefined()

    await expect(handler!(ctx, 'session-1', 'x'.repeat(20_001))).rejects.toThrow(
      'Command exceeds the 20000 character limit',
    )
  })

  it('rejects command execution from clients without an Electron window identity', async () => {
    const handler = createHandlers().get(RPC_CHANNELS.terminal.RUN_COMMAND)
    expect(handler).toBeDefined()

    await expect(handler!({ ...ctx, webContentsId: null }, 'session-1', 'pwd')).rejects.toThrow(
      'Right workbench filesystem actions require a desktop window',
    )
  })

  it('does not expose Git working-tree data to clients without an Electron window identity', async () => {
    const handler = createHandlers().get(RPC_CHANNELS.git.GET_WORKING_TREE)
    expect(handler).toBeDefined()

    await expect(handler!({ ...ctx, webContentsId: null }, 'session-1')).rejects.toThrow(
      'Right workbench filesystem actions require a desktop window',
    )
  })

  it('rejects command execution for a session outside the window workspace', async () => {
    const handler = createHandlers(tmpdir(), { windowManager: createWindowManager({ 1: 'workspace-2' }) })
      .get(RPC_CHANNELS.terminal.RUN_COMMAND)
    expect(handler).toBeDefined()

    await expect(handler!(ctx, 'session-1', 'pwd'))
      .rejects.toThrow('Session is not available in the current workspace')
  })

  it('ignores a client-declared workspace and uses the one the host registered', async () => {
    const directory = mkdtempSync(join(tmpdir(), 'craft-workbench-forged-ws-'))
    tempDirectories.push(directory)

    const handler = createHandlers(directory).get(RPC_CHANNELS.terminal.RUN_COMMAND)
    expect(handler).toBeDefined()

    // The caller claims a different workspace; the window registry still says
    // workspace-1, so the session resolves and the claim changes nothing.
    const result = await handler!(
      { ...ctx, workspaceId: 'workspace-2' },
      'session-1',
      'printf host-workspace-wins',
    )
    expect(result).toEqual({ output: 'host-workspace-wins', exitCode: 0, timedOut: false })
  })

  it('rejects command execution on a host with no window registry (headless server)', async () => {
    const handler = createHandlers(tmpdir(), { windowManager: undefined }).get(RPC_CHANNELS.terminal.RUN_COMMAND)
    expect(handler).toBeDefined()

    // A remote/WebUI client can forge webContentsId, so the headless server
    // must refuse regardless of what the envelope claims.
    await expect(handler!(ctx, 'session-1', 'pwd'))
      .rejects.toThrow('Right workbench filesystem actions require a desktop window')
  })

  it('rejects a forged webContentsId that no real window owns', async () => {
    const handler = createHandlers().get(RPC_CHANNELS.terminal.RUN_COMMAND)
    expect(handler).toBeDefined()

    await expect(handler!({ ...ctx, webContentsId: 4242 }, 'session-1', 'pwd'))
      .rejects.toThrow('Right workbench filesystem actions require a desktop window')
  })

  it('does not expose Git working-tree data to a headless host', async () => {
    const handler = createHandlers(tmpdir(), { windowManager: undefined }).get(RPC_CHANNELS.git.GET_WORKING_TREE)
    expect(handler).toBeDefined()

    await expect(handler!(ctx, 'session-1')).rejects.toThrow(
      'Right workbench filesystem actions require a desktop window',
    )
  })

  it('returns null only when the directory is not a Git repository', async () => {
    const directory = mkdtempSync(join(tmpdir(), 'craft-workbench-not-git-'))
    tempDirectories.push(directory)

    const handler = createHandlers(directory).get(RPC_CHANNELS.git.GET_WORKING_TREE)
    expect(handler).toBeDefined()
    expect(await handler!(ctx, 'session-1')).toBeNull()
  })
})
