import { isAbsolute, relative, resolve } from 'path'
import { join } from 'path'
import { homedir } from 'os'
import { execFile } from 'child_process'
import { promisify } from 'util'
import { RPC_CHANNELS } from '@craft-agent/shared/protocol'
import { getWorkspaceByNameOrId, getGitBashPath, setGitBashPath, clearGitBashPath } from '@craft-agent/shared/config'
import { classifyExternalUrl, formatBlockedUrlError } from '@craft-agent/shared/utils/url-safety'
import { isUsableGitBashPath, validateGitBashPath } from '@craft-agent/server-core/services'
import { validateFilePath, getWorkspaceAllowedDirs } from '@craft-agent/server-core/handlers'
import type { RpcServer } from '@craft-agent/server-core/transport'
import type { HandlerDeps } from '../handler-deps'
import {
  requestClientOpenExternal,
  requestClientOpenPath,
  requestClientShowInFolder,
  requestClientOpenFileDialog,
} from '@craft-agent/server-core/transport'
import { handshakeCliRuntimes } from '../../services/cli-runtime-handshake'

export const CORE_HANDLED_CHANNELS = [
  RPC_CHANNELS.theme.GET_SYSTEM_PREFERENCE,
  RPC_CHANNELS.system.VERSIONS,
  RPC_CHANNELS.system.HOME_DIR,
  RPC_CHANNELS.system.IS_DEBUG_MODE,
  RPC_CHANNELS.debug.LOG,
  RPC_CHANNELS.shell.OPEN_URL,
  RPC_CHANNELS.shell.OPEN_FILE,
  RPC_CHANNELS.shell.SHOW_IN_FOLDER,
  RPC_CHANNELS.releaseNotes.GET,
  RPC_CHANNELS.releaseNotes.GET_LATEST_VERSION,
  RPC_CHANNELS.git.GET_BRANCH,
  RPC_CHANNELS.git.GET_WORKING_TREE,
  RPC_CHANNELS.git.GET_FILE_DIFF,
  RPC_CHANNELS.terminal.RUN_COMMAND,
  RPC_CHANNELS.terminal.HANDSHAKE_RUNTIMES,
  RPC_CHANNELS.gitbash.CHECK,
  RPC_CHANNELS.gitbash.BROWSE,
  RPC_CHANNELS.gitbash.SET_PATH,
] as const

interface ParsedInternalDeepLink {
  navigation?: {
    view?: string
    action?: string
    actionParams?: Record<string, string>
  }
  workspaceId?: string
  /** Use client shell.openExternal fallback (e.g. window=focused links). */
  requiresExternalOpen?: boolean
  /** True when URL is intentionally consumed without navigation (auth callbacks). */
  handledNoop?: boolean
}

const COMPOUND_ROUTE_PREFIXES = new Set([
  'allSessions',
  'flagged',
  'state',
  'sources',
  'settings',
  'skills',
])

function collectDeepLinkParams(parsed: URL, pathId?: string): Record<string, string> | undefined {
  const params: Record<string, string> = {}
  if (pathId) params.id = pathId

  parsed.searchParams.forEach((value, key) => {
    if (key === 'window' || key === 'sidebar') return
    params[key] = value
  })

  return Object.keys(params).length > 0 ? params : undefined
}

function parseInternalCraftAgentsDeepLink(parsed: URL): ParsedInternalDeepLink | null {
  if (parsed.protocol !== 'craftagents:') return null

  const host = parsed.hostname
  const pathParts = parsed.pathname.split('/').filter(Boolean)
  const windowMode = parsed.searchParams.get('window')

  // Preserve window-specific behavior via OS protocol path.
  if (windowMode === 'focused' || windowMode === 'full') {
    return { requiresExternalOpen: true }
  }

  // OAuth callback links are handled by auth flow code paths.
  if (host === 'auth-callback') {
    return { handledNoop: true }
  }

  if (COMPOUND_ROUTE_PREFIXES.has(host)) {
    const viewRoute = pathParts.length > 0 ? `${host}/${pathParts.join('/')}` : host
    return { navigation: { view: viewRoute } }
  }

  if (host === 'action') {
    const action = pathParts[0]
    if (!action) return null

    const actionParams = collectDeepLinkParams(parsed, pathParts[1])
    return {
      navigation: {
        action,
        actionParams,
      },
    }
  }

  if (host === 'workspace') {
    const workspaceId = pathParts[0]
    if (!workspaceId) return null

    const routeType = pathParts[1]
    if (!routeType) return null

    if (COMPOUND_ROUTE_PREFIXES.has(routeType)) {
      return {
        workspaceId,
        navigation: { view: pathParts.slice(1).join('/') },
      }
    }

    if (routeType === 'action') {
      const action = pathParts[2]
      if (!action) return null

      return {
        workspaceId,
        navigation: {
          action,
          actionParams: collectDeepLinkParams(parsed, pathParts[3]),
        },
      }
    }
  }

  return null
}

/** Guard: reject filesystem-path actions on remote workspaces where local paths are meaningless. */
function assertLocalWorkspace(ctx: { workspaceId: string | null }, action: string): void {
  const ws = getWorkspaceByNameOrId(ctx.workspaceId ?? '')
  if (ws?.remoteServer) {
    throw new Error(`${action} is not available for remote workspaces`)
  }
}

export function registerSystemCoreHandlers(server: RpcServer, deps: HandlerDeps): void {
  const resolveDesktopSessionDirectory = async (
    ctx: { workspaceId: string | null; webContentsId: number | null },
    sessionId: string,
  ): Promise<string> => {
    // `ctx.webContentsId` / `ctx.workspaceId` arrive in the client's own
    // handshake envelope, so neither can be trusted as an authorization fact:
    // any client that completes the handshake (including an authenticated
    // WebUI/remote one against the headless server) could declare them.
    // Anchor the decision in state only the host itself holds — the window
    // manager, which exists solely in the Electron main process and tracks
    // real BrowserWindows and the workspace each one was registered for.
    const desktopWindows = deps.windowManager
    if (!desktopWindows) {
      throw new Error('Right workbench filesystem actions require a desktop window')
    }
    if (ctx.webContentsId == null) {
      throw new Error('Right workbench filesystem actions require a desktop window')
    }
    if (!desktopWindows.getWindowByWebContentsId(ctx.webContentsId)) {
      throw new Error('Right workbench filesystem actions require a desktop window')
    }

    const windowWorkspaceId = desktopWindows.getWorkspaceForWindow(ctx.webContentsId)
    if (!windowWorkspaceId) {
      throw new Error('Right workbench filesystem actions require a workspace')
    }

    const session = deps.sessionManager
      .getSessions(windowWorkspaceId)
      .find((candidate) => candidate.id === sessionId && candidate.workspaceId === windowWorkspaceId)
    if (!session) throw new Error('Session is not available in the current workspace')
    if (!session.workingDirectory) throw new Error('Session has no working directory')

    return validateFilePath(
      session.workingDirectory,
      getWorkspaceAllowedDirs(session.workspaceId),
    )
  }

  const windowManager = deps.windowManager
  const execFileAsync = promisify(execFile)

  // Get system theme preference (dark = true, light = false)
  server.handle(RPC_CHANNELS.theme.GET_SYSTEM_PREFERENCE, async () => {
    return deps.platform.systemDarkMode?.() ?? false
  })

  // Get runtime versions (previously handled locally in preload via process.versions)
  server.handle(RPC_CHANNELS.system.VERSIONS, async () => {
    return {
      node: process.versions.node,
      chrome: process.versions.chrome ?? undefined,
      electron: process.versions.electron ?? undefined,
    }
  })

  // Get user's home directory
  server.handle(RPC_CHANNELS.system.HOME_DIR, async () => {
    return homedir()
  })

  // Check if running in debug mode (from source)
  server.handle(RPC_CHANNELS.system.IS_DEBUG_MODE, async () => {
    return !deps.platform.isPackaged
  })

  // Release notes
  server.handle(RPC_CHANNELS.releaseNotes.GET, async () => {
    const { getCombinedReleaseNotes } = require('@craft-agent/shared/release-notes') as typeof import('@craft-agent/shared/release-notes')
    return getCombinedReleaseNotes()
  })

  server.handle(RPC_CHANNELS.releaseNotes.GET_LATEST_VERSION, async () => {
    const { getLatestReleaseVersion } = require('@craft-agent/shared/release-notes') as typeof import('@craft-agent/shared/release-notes')
    return getLatestReleaseVersion()
  })

  // Get git branch for a directory (returns null if not a git repo or git unavailable)
  server.handle(RPC_CHANNELS.git.GET_BRANCH, async (ctx, dirPath: string) => {
    try {
      const safePath = await validateFilePath(dirPath, getWorkspaceAllowedDirs(ctx.workspaceId))
      const result = await execFileAsync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], {
        cwd: safePath,
        encoding: 'utf-8',
        timeout: 5000,
        maxBuffer: 1024 * 1024,
      })
      const branch = result.stdout.trim()
      return branch || null
    } catch {
      return null
    }
  })

  // Read-only Git projection for the right-side review module. This never
  // stages, restores, commits, or otherwise mutates the repository.
  //
  // Failure contract (R18 §7):
  // - identity / path / session policy errors throw (renderer shows `failed`)
  // - directory is not a git repo → null (renderer shows `notRepository`)
  server.handle(RPC_CHANNELS.git.GET_WORKING_TREE, async (ctx, sessionId: string) => {
    const safeDirectory = await resolveDesktopSessionDirectory(ctx, sessionId)
    const runGitInDirectory = async (args: string[], maxBuffer?: number) => {
      const result = await execFileAsync('git', args, {
        cwd: safeDirectory,
        encoding: 'utf-8',
        timeout: 8000,
        maxBuffer: maxBuffer ?? 2 * 1024 * 1024,
      })
      return result.stdout.trimEnd()
    }
    const runGitInDirectoryOrNull = async (args: string[]) => {
      try {
        return await runGitInDirectory(args)
      } catch {
        return null
      }
    }

    let repoRoot: string
    try {
      repoRoot = await runGitInDirectory(['rev-parse', '--show-toplevel'])
    } catch {
      // Not a repository (or git missing in PATH for this cwd). Distinct from
      // desktop-identity failures, which throw before this point.
      return null
    }

    try {
      const branch = (await runGitInDirectoryOrNull(['symbolic-ref', '--short', 'HEAD'])) || null
      const status = await runGitInDirectory(['-c', 'core.quotepath=false', 'status', '--short'])
      const files = status
        .split('\n')
        .filter(Boolean)
        .map((line) => ({
          indexStatus: line[0] ?? ' ',
          workingTreeStatus: line[1] ?? ' ',
          path: line.slice(3),
          additions: 0,
          deletions: 0,
        }))

      const fileByPath = new Map(files.map((file) => [file.path, file]))
      const applyNumstat = (numstat: string) => {
        for (const line of numstat.split('\n')) {
          if (!line) continue
          const [added, deleted, ...pathParts] = line.split('\t')
          const path = pathParts.join('\t')
          const file = fileByPath.get(path)
          if (!file) continue
          file.additions += added === '-' ? 0 : Number.parseInt(added, 10) || 0
          file.deletions += deleted === '-' ? 0 : Number.parseInt(deleted, 10) || 0
        }
      }
      applyNumstat(await runGitInDirectory([
        '-c', 'core.quotepath=false', 'diff', '--cached', '--numstat', '--no-renames',
      ]))
      applyNumstat(await runGitInDirectory([
        '-c', 'core.quotepath=false', 'diff', '--numstat', '--no-renames',
      ]))
      const worktreePorcelain = await runGitInDirectoryOrNull(['worktree', 'list', '--porcelain'])
      const worktrees = (worktreePorcelain ?? '').split(/\n\n+/).filter(Boolean).map((block) => {
        const path = block.match(/^worktree (.+)$/m)?.[1]
        if (!path) return null
        const branchRef = block.match(/^branch (.+)$/m)?.[1]
        return {
          path,
          branch: branchRef?.replace(/^refs\/heads\//, '') ?? null,
          bare: /^bare$/m.test(block),
        }
      }).filter((entry): entry is { path: string; branch: string | null; bare: boolean } => !!entry)

      return {
        repoRoot,
        branch,
        files,
        totals: files.reduce(
          (totals, file) => ({
            additions: totals.additions + file.additions,
            deletions: totals.deletions + file.deletions,
          }),
          { additions: 0, deletions: 0 },
        ),
        worktrees,
      }
    } catch (error) {
      throw new Error(
        `Git working tree could not be read: ${error instanceof Error ? error.message : String(error)}`,
      )
    }
  })

  // Load only the file the user selected. The overview stays small even for
  // large repositories and this endpoint remains a read-only projection.
  server.handle(RPC_CHANNELS.git.GET_FILE_DIFF, async (
    ctx,
    sessionId: string,
    requestedPath: string,
  ) => {
    const safeDirectory = await resolveDesktopSessionDirectory(ctx, sessionId)
    let repoRoot: string
    try {
      repoRoot = (await execFileAsync('git', ['rev-parse', '--show-toplevel'], {
        cwd: safeDirectory,
        encoding: 'utf-8',
        timeout: 5000,
      })).stdout.trim()
    } catch {
      return null
    }

    const absolutePath = resolve(repoRoot, requestedPath)
    const relativePath = relative(repoRoot, absolutePath)
    if (
      !requestedPath
      || isAbsolute(requestedPath)
      || relativePath.startsWith('..')
      || isAbsolute(relativePath)
    ) {
      throw new Error('Git file path is outside the repository')
    }

    const runDiff = async (args: string[]) => {
      try {
        return (await execFileAsync('git', args, {
          cwd: repoRoot,
          encoding: 'utf-8',
          timeout: 8000,
          maxBuffer: 2 * 1024 * 1024,
        })).stdout.trimEnd()
      } catch (error) {
        const output = (error as { stdout?: string }).stdout
        if (typeof output === 'string') return output.trimEnd()
        throw error
      }
    }

    const parts = [
      await runDiff([
        '-c', 'core.quotepath=false', 'diff', '--cached', '--no-ext-diff',
        '--unified=3', '--no-renames', '--', relativePath,
      ]),
      await runDiff([
        '-c', 'core.quotepath=false', 'diff', '--no-ext-diff',
        '--unified=3', '--no-renames', '--', relativePath,
      ]),
    ].filter(Boolean)

    if (parts.length === 0) {
      // Untracked files are absent from normal git diff. `--no-index` is still
      // read-only; exit code 1 means "different" and is handled above.
      const nullDevice = process.platform === 'win32' ? 'NUL' : '/dev/null'
      const untracked = await runDiff([
        '-c', 'core.quotepath=false', 'diff', '--no-index', '--no-ext-diff',
        '--unified=3', '--', nullDevice, absolutePath,
      ])
      if (untracked) parts.push(untracked)
    }

    const maxDiffLength = 1_500_000
    const fullDiff = parts.join('\n')
    return {
      path: relativePath,
      diff: fullDiff.slice(0, maxDiffLength),
      truncated: fullDiff.length > maxDiffLength,
    }
  })

  // User-invoked project command runner. Execution stays behind the core RPC
  // boundary and is bounded; the renderer never starts system processes.
  server.handle(RPC_CHANNELS.terminal.RUN_COMMAND, async (ctx, sessionId: string, command: string) => {
    const trimmed = command.trim()
    if (!trimmed) return { output: '', exitCode: 0, timedOut: false }
    if (trimmed.length > 20_000) throw new Error('Command exceeds the 20000 character limit')
    const safeDirectory = await resolveDesktopSessionDirectory(ctx, sessionId)

    const shell = process.platform === 'win32'
      ? (process.env.COMSPEC || 'cmd.exe')
      : (process.env.SHELL || '/bin/zsh')
    const args = process.platform === 'win32'
      ? ['/d', '/s', '/c', trimmed]
      : ['-l', '-c', trimmed]

    try {
      const result = await execFileAsync(shell, args, {
        cwd: safeDirectory,
        encoding: 'utf-8',
        timeout: 30_000,
        maxBuffer: 1_500_000,
      })
      return {
        output: `${result.stdout}${result.stderr}`.trimEnd(),
        exitCode: 0,
        timedOut: false,
      }
    } catch (error) {
      const failure = error as {
        stdout?: string
        stderr?: string
        code?: number | string
        killed?: boolean
      }
      return {
        output: `${failure.stdout ?? ''}${failure.stderr ?? ''}`.trimEnd(),
        exitCode: typeof failure.code === 'number' ? failure.code : 1,
        timedOut: failure.killed === true,
      }
    }
  })

  server.handle(
    RPC_CHANNELS.terminal.HANDSHAKE_RUNTIMES,
    async () => await handshakeCliRuntimes(),
  )

  // Git Bash detection and configuration (Windows only)
  server.handle(RPC_CHANNELS.gitbash.CHECK, async () => {
    const platform = process.platform as 'win32' | 'darwin' | 'linux'

    if (platform !== 'win32') {
      return { found: true, path: null, platform }
    }

    const commonPaths = [
      'C:\\Program Files\\Git\\bin\\bash.exe',
      'C:\\Program Files (x86)\\Git\\bin\\bash.exe',
      join(process.env.LOCALAPPDATA || '', 'Programs', 'Git', 'bin', 'bash.exe'),
      join(process.env.PROGRAMFILES || '', 'Git', 'bin', 'bash.exe'),
    ]

    const persistedPath = getGitBashPath()
    if (persistedPath) {
      if (await isUsableGitBashPath(persistedPath)) {
        process.env.CLAUDE_CODE_GIT_BASH_PATH = persistedPath.trim()
        return { found: true, path: persistedPath, platform }
      }
      clearGitBashPath()
    }

    for (const bashPath of commonPaths) {
      if (await isUsableGitBashPath(bashPath)) {
        process.env.CLAUDE_CODE_GIT_BASH_PATH = bashPath
        setGitBashPath(bashPath)
        return { found: true, path: bashPath, platform }
      }
    }

    try {
      const result = await execFileAsync('where', ['bash'], {
        encoding: 'utf-8',
        timeout: 5000,
        maxBuffer: 1024 * 1024,
      })
      const firstPath = result.stdout.split('\n')[0]?.trim()
      if (firstPath && firstPath.toLowerCase().includes('git') && await isUsableGitBashPath(firstPath)) {
        process.env.CLAUDE_CODE_GIT_BASH_PATH = firstPath
        setGitBashPath(firstPath)
        return { found: true, path: firstPath, platform }
      }
    } catch {
      // where command failed
    }

    delete process.env.CLAUDE_CODE_GIT_BASH_PATH
    return { found: false, path: null, platform }
  })

  server.handle(RPC_CHANNELS.gitbash.BROWSE, async (ctx) => {
    const result = await requestClientOpenFileDialog(server, ctx.clientId, {
      title: 'Select bash.exe',
      filters: [{ name: 'Executable', extensions: ['exe'] }],
      properties: ['openFile'],
      defaultPath: 'C:\\Program Files\\Git\\bin',
    })

    if (result.canceled || result.filePaths.length === 0) {
      return null
    }

    return result.filePaths[0]
  })

  server.handle(RPC_CHANNELS.gitbash.SET_PATH, async (_ctx, bashPath: string) => {
    const validation = await validateGitBashPath(bashPath)
    if (!validation.valid) {
      return { success: false, error: validation.error }
    }

    setGitBashPath(validation.path)
    process.env.CLAUDE_CODE_GIT_BASH_PATH = validation.path
    return { success: true }
  })

  // Debug logging from renderer -> main log file (fire-and-forget, no response)
  server.handle(RPC_CHANNELS.debug.LOG, async (_ctx, ...args: unknown[]) => {
    deps.platform.logger.info('[renderer]', ...args)
  })

  // Shell operations - open URL in external browser (or handle craftagents:// internally)
  server.handle(RPC_CHANNELS.shell.OPEN_URL, async (ctx, url: string) => {
    deps.platform.logger.info('[OPEN_URL] Received request:', url)
    try {
      const classification = classifyExternalUrl(url)
      if (classification.kind === 'dangerous') {
        throw new Error(formatBlockedUrlError(classification))
      }

      const parsed = new URL(url)

      if (classification.kind === 'internal-deeplink') {
        const deepLink = parseInternalCraftAgentsDeepLink(parsed)

        if (deepLink?.handledNoop) {
          deps.platform.logger.info('[OPEN_URL] Ignoring auth-callback deep link in OPEN_URL handler')
          return
        }

        if (deepLink?.navigation?.view || deepLink?.navigation?.action) {
          const target = deepLink.workspaceId && deepLink.workspaceId !== ctx.workspaceId
            ? { to: 'workspace' as const, workspaceId: deepLink.workspaceId }
            : { to: 'client' as const, clientId: ctx.clientId }

          deps.platform.logger.info('[OPEN_URL] Routing craftagents:// URL internally via deeplink:navigate')
          server.push(RPC_CHANNELS.deeplink.NAVIGATE, target, deepLink.navigation)
          return
        }

        // For links requiring window management (e.g. window=focused/full), or
        // unknown deep-link shapes, fall back to the client protocol handler.
        deps.platform.logger.info('[OPEN_URL] Falling back to client openExternal for craftagents:// URL')
        const deepLinkResult = await requestClientOpenExternal(server, ctx.clientId, url)
        if (!deepLinkResult.opened) {
          deps.platform.logger.error(`[OPEN_URL] Client capability failed: ${deepLinkResult.error}`)
          throw new Error(`Cannot open URL on client: ${deepLinkResult.error}`)
        }
        return
      }

      const result = await requestClientOpenExternal(server, ctx.clientId, url)
      if (!result.opened) {
        deps.platform.logger.error(`[OPEN_URL] Client capability failed: ${result.error}`)
        throw new Error(`Cannot open URL on client: ${result.error}`)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      deps.platform.logger.error('openUrl error:', message)
      throw new Error(`Failed to open URL: ${message}`)
    }
  })

  server.handle(RPC_CHANNELS.shell.OPEN_FILE, async (ctx, path: string) => {
    assertLocalWorkspace(ctx, 'Open file')
    try {
      // Expand ~ before resolve() — resolve() treats ~ as a literal path component
      const expanded = path.startsWith('~') ? path.replace(/^~/, homedir()) : path
      const absolutePath = resolve(expanded)
      const safePath = await validateFilePath(absolutePath, getWorkspaceAllowedDirs(ctx.workspaceId))
      const result = await requestClientOpenPath(server, ctx.clientId, safePath)
      if (result.error) throw new Error(result.error)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      deps.platform.logger.error('openFile error:', message)
      throw new Error(`Failed to open file: ${message}`)
    }
  })

  server.handle(RPC_CHANNELS.shell.SHOW_IN_FOLDER, async (ctx, path: string) => {
    assertLocalWorkspace(ctx, 'Show in folder')
    try {
      const expanded = path.startsWith('~') ? path.replace(/^~/, homedir()) : path
      const absolutePath = resolve(expanded)
      const safePath = await validateFilePath(absolutePath, getWorkspaceAllowedDirs(ctx.workspaceId))
      await requestClientShowInFolder(server, ctx.clientId, safePath)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      deps.platform.logger.error('showInFolder error:', message)
      throw new Error(`Failed to show in folder: ${message}`)
    }
  })
}
