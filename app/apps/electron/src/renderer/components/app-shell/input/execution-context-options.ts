export interface ExecutionWorkspaceLike {
  id: string
  name: string
  rootPath?: string
  remoteServer?: {
    url: string
    token: string
    remoteWorkspaceId: string
  } | null
}

export type ExecutionTarget =
  | { id: 'local'; kind: 'local' }
  | { id: `remote:${string}`; kind: 'remote'; url: string }

function normalizeRemoteUrl(url: string): string {
  return url.trim().replace(/\/+$/, '')
}

export function getExecutionTargetId(
  workspace: ExecutionWorkspaceLike | null | undefined,
): ExecutionTarget['id'] {
  if (!workspace?.remoteServer) return 'local'
  return `remote:${normalizeRemoteUrl(workspace.remoteServer.url)}`
}

export function deriveExecutionTargets(
  workspaces: readonly ExecutionWorkspaceLike[],
): ExecutionTarget[] {
  // Local is an execution capability, not a projection of an existing folder.
  // Keep it available even before the user has opened a local project.
  const targets: ExecutionTarget[] = [{ id: 'local', kind: 'local' }]

  const seenRemoteUrls = new Set<string>()
  for (const workspace of workspaces) {
    if (!workspace.remoteServer) continue
    const url = normalizeRemoteUrl(workspace.remoteServer.url)
    if (!url || seenRemoteUrls.has(url)) continue
    seenRemoteUrls.add(url)
    targets.push({ id: `remote:${url}`, kind: 'remote', url })
  }

  return targets
}

export function filterWorkspacesForExecutionTarget<T extends ExecutionWorkspaceLike>(
  workspaces: readonly T[],
  targetId: ExecutionTarget['id'],
): T[] {
  return workspaces.filter((workspace) => getExecutionTargetId(workspace) === targetId)
}

export function resolveWorkspaceForExecutionTarget<T extends ExecutionWorkspaceLike>(
  workspaces: readonly T[],
  targetId: ExecutionTarget['id'],
  currentWorkspaceId?: string,
): T | undefined {
  const candidates = filterWorkspacesForExecutionTarget(workspaces, targetId)
  return candidates.find((workspace) => workspace.id === currentWorkspaceId) ?? candidates[0]
}

export function resolveExecutionWorkspaceById<T extends ExecutionWorkspaceLike>(
  workspaces: readonly T[],
  workspaceId: string,
  newlyCreatedWorkspace?: T,
): T | undefined {
  if (newlyCreatedWorkspace?.id === workspaceId) return newlyCreatedWorkspace
  return workspaces.find((workspace) => workspace.id === workspaceId)
}

export function getRemoteTargetDisplayName(url: string): string {
  try {
    return new URL(url).host || url
  } catch {
    return url
  }
}
