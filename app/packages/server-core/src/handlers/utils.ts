import { basename, dirname, isAbsolute, join, normalize, sep } from 'path'
import { homedir, tmpdir } from 'os'
import { realpath } from 'fs/promises'
import { getWorkspaceByNameOrId, type Workspace } from '@craft-agent/shared/config'
import { loadWorkspaceConfig } from '@craft-agent/shared/workspaces'
import type { PlatformServices } from '../runtime/platform'
import type { RequestContext } from '../transport/types'
import type { HandlerDeps } from './handler-deps'

/**
 * Get workspace by ID or name, throwing if not found.
 * Use this when a workspace must exist for the operation to proceed.
 */
export function getWorkspaceOrThrow(workspaceId: string): Workspace {
  const workspace = getWorkspaceByNameOrId(workspaceId)
  if (!workspace) {
    throw new Error(`Workspace not found: ${workspaceId}`)
  }
  return workspace
}

/**
 * Prefer the host-registered window workspace over client-declared
 * `ctx.workspaceId`. On a headless/remote server (no window registry) the
 * declared workspace remains the only available scope.
 *
 * Returns null when the caller is a real desktop window with no workspace
 * binding — callers should treat null as "do not trust the client claim".
 */
export function resolveCallerWorkspaceId(
  ctx: { workspaceId: string | null; webContentsId: number | null },
  deps: Pick<HandlerDeps, 'windowManager'>,
): string | null {
  if (ctx.webContentsId != null && deps.windowManager) {
    const hostWs = deps.windowManager.getWorkspaceForWindow(ctx.webContentsId)
    if (hostWs) return hostWs
    // Real desktop window with no workspace binding — do not trust the claim.
    if (deps.windowManager.getWindowByWebContentsId(ctx.webContentsId)) {
      return null
    }
  }
  return ctx.workspaceId
}

/**
 * Assert that the calling client is bound to the requested workspace.
 *
 * Desktop windows resolve via the host window registry (authoritative).
 * Headless/remote clients fall back to their declared workspaceId.
 * Throws when the caller cannot prove binding to `requestedWorkspaceId`.
 */
export function assertCallerWorkspaceBound(
  ctx: RequestContext,
  deps: Pick<HandlerDeps, 'windowManager'>,
  requestedWorkspaceId: string,
): void {
  const callerWorkspaceId = resolveCallerWorkspaceId(ctx, deps)
  if (callerWorkspaceId !== requestedWorkspaceId) {
    throw new Error('Workspace not bound to this client')
  }
}

export function buildBackendHostRuntimeContext(platform: PlatformServices) {
  return {
    appRootPath: platform.appRootPath,
    resourcesPath: platform.resourcesPath,
    isPackaged: platform.isPackaged,
  }
}

/**
 * Sanitizes a filename to prevent path traversal and filesystem issues.
 * Removes dangerous characters and limits length.
 */
export function sanitizeFilename(name: string): string {
  return name
    // Remove path separators and traversal patterns
    .replace(/[/\\]/g, '_')
    // Remove Windows-forbidden characters: < > : " | ? *
    .replace(/[<>:"|?*]/g, '_')
    // Remove control characters (ASCII 0-31)
    .replace(/[\x00-\x1f]/g, '')
    // Collapse multiple dots (prevent hidden files and extension tricks)
    .replace(/\.{2,}/g, '.')
    // Remove leading/trailing dots and spaces (Windows issues)
    .replace(/^[.\s]+|[.\s]+$/g, '')
    // Limit length (200 chars is safe for all filesystems)
    .slice(0, 200)
    // Fallback if name is empty after sanitization
    || 'unnamed'
}

/**
 * Resolve allowed directories for a workspace: its root path and configured
 * working directory (if set). Returns an empty array if the workspace is
 * unknown or has no relevant paths.
 */
export function getWorkspaceAllowedDirs(workspaceId?: string | null): string[] {
  if (!workspaceId) return []
  const workspace = getWorkspaceByNameOrId(workspaceId)
  if (!workspace) return []

  const dirs: string[] = [workspace.rootPath]
  const config = loadWorkspaceConfig(workspace.rootPath)
  if (config?.defaults?.workingDirectory) {
    dirs.push(config.defaults.workingDirectory)
  }
  return dirs
}

async function canonicalizePath(path: string): Promise<string> {
  let candidate = normalize(path)
  const missingSegments: string[] = []

  while (true) {
    try {
      const resolved = await realpath(candidate)
      return normalize(join(resolved, ...missingSegments.reverse()))
    } catch {
      const parent = dirname(candidate)
      if (parent === candidate) return normalize(path)
      missingSegments.push(basename(candidate))
      candidate = parent
    }
  }
}

/**
 * Validates that a file path is within allowed directories to prevent path traversal attacks.
 *
 * Allowed directories: /tmp (system temp) and any additional dirs passed by the caller
 * (e.g. workspace root, workspace working directory).
 *
 * The user's home directory is **not** a default allowed root — callers must explicitly
 * pass it via `additionalAllowedDirs` when home-directory access is genuinely required.
 * This prevents cross-workspace data leakage when a workspace's own root is the only
 * intended scope.
 */
export async function validateFilePath(
  filePath: string,
  additionalAllowedDirs?: string[],
): Promise<string> {
  // Normalize the path to resolve . and .. components
  let normalizedPath = normalize(filePath)

  // Expand ~ to home directory
  if (normalizedPath.startsWith('~')) {
    normalizedPath = normalizedPath.replace(/^~/, homedir())
  }

  // Must be an absolute path
  if (!isAbsolute(normalizedPath)) {
    throw new Error('Only absolute file paths are allowed')
  }

  // Resolve every existing prefix so containment checks remain correct even
  // when the final path does not exist yet.
  const realFilePath = await canonicalizePath(normalizedPath)

  // Define allowed base directories.
  // NOTE: homedir() is intentionally excluded from the default set to enforce
  // workspace-scoped access. Callers that genuinely need home-directory access
  // (e.g. credential management) must pass it explicitly via additionalAllowedDirs.
  const allowedDirs = [
    tmpdir(),
    ...(additionalAllowedDirs ?? []),
  ].filter(Boolean)

  // Canonicalize the allowed roots as well as the requested path. On macOS,
  // for example, /var resolves to /private/var; comparing a canonical target
  // against an uncanonicalized root would reject valid temporary paths.
  const canonicalAllowedDirs = await Promise.all(allowedDirs.map(canonicalizePath))

  // Check if the real path is within an allowed directory (cross-platform)
  const isAllowed = canonicalAllowedDirs.some(normalizedDir => {
    const normalizedReal = normalize(realFilePath)
    return normalizedReal.startsWith(normalizedDir + sep) || normalizedReal === normalizedDir
  })

  if (!isAllowed) {
    throw new Error('Access denied: file path is outside allowed directories')
  }

  // Block sensitive files even within allowed directories.
  // Use [\\/] to match both Unix / and Windows \ separators.
  const sensitivePatterns = [
    /\.ssh[\\/]/,
    /\.gnupg[\\/]/,
    /\.aws[\\/]credentials/,
    /\.config[\\/]gcloud/,
    /\.env$/,
    /\.env\./,
    /credentials\.json$/,
    /secrets?\./i,
    /\.pem$/,
    /\.key$/,
    /id_rsa/,
    /id_ecdsa/,
    /id_ed25519/,
    // Shell history may contain pasted passwords/tokens
    /\.bash_history$/,
    /\.zsh_history$/,
    /\.sh_history$/,
    // Package manager credentials
    /\.npmrc$/,
    /\.pypirc$/,
    /\.netrc$/,
    // VCS and container credentials
    /\.gitconfig$/,
    /\.docker[\\/]config\.json$/,
    /\.kube[\\/]config$/,
    /\.config[\\/]gh[\\/]hosts\.yml$/,
  ]

  if (sensitivePatterns.some(pattern => pattern.test(realFilePath))) {
    throw new Error('Access denied: cannot read sensitive files')
  }

  return realFilePath
}
