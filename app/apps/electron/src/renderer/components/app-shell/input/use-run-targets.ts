import * as React from 'react'
import { buildRunTargets, targetActiveSessions, type RunTarget } from '@craft-agent/shared/remote'
import type { Workspace } from '../../../../shared/types'

/**
 * The computers a new conversation can run on, with what this machine currently
 * knows about each of them.
 *
 * "Observe the remote one from here" is a read, not a second store: the host already
 * reports `serverId` and a per-Workspace live session count through `server:getStatus`,
 * so one probe per device fills in the liveness dot and the running-session count
 * without opening that Workspace or mirroring its sessions locally.
 *
 * A device that does not answer is reported as offline rather than removed — the
 * Workspace still exists and the user still needs to see it.
 */
export interface UseRunTargetsResult {
  targets: RunTarget[]
  /** True while the first probe round is still out. */
  probing: boolean
  refresh: () => void
}

interface HostStatus {
  serverId?: string
  workspaces?: Array<{ id: string; activeSessions?: number }>
}

/** One probe per device, not per Workspace: several projects share one connection. */
async function probeDevice(
  url: string,
  token: string,
): Promise<{ online: boolean; activeSessions: Record<string, number> }> {
  try {
    const status = await window.electronAPI.invokeOnServer(
      url,
      token,
      'server:getStatus',
    ) as HostStatus | null
    if (!status) return { online: false, activeSessions: {} }
    const activeSessions: Record<string, number> = {}
    for (const workspace of status.workspaces ?? []) {
      if (typeof workspace.activeSessions === 'number') {
        activeSessions[workspace.id] = workspace.activeSessions
      }
    }
    return { online: true, activeSessions }
  } catch {
    return { online: false, activeSessions: {} }
  }
}

export function useRunTargets(
  workspaces: readonly Workspace[],
  localName: string,
  options?: { probe?: boolean },
): UseRunTargetsResult {
  const shouldProbe = options?.probe !== false
  const [online, setOnline] = React.useState<Record<string, boolean>>({})
  const [activeSessions, setActiveSessions] = React.useState<Record<string, number>>({})
  const [probing, setProbing] = React.useState(false)
  const [round, setRound] = React.useState(0)

  const targets = React.useMemo(
    () => buildRunTargets(workspaces, { localName, online, activeSessions }),
    [workspaces, localName, online, activeSessions],
  )

  // Probe key, not the target objects: re-probing must not be triggered by the
  // state the probe itself writes.
  const probeKey = React.useMemo(() => workspaces
    .filter((workspace) => workspace.remoteServer)
    .map((workspace) => {
      const remote = workspace.remoteServer!
      return `${remote.deviceId ?? remote.url}|${remote.url}|${remote.token}`
    })
    .sort()
    .join(','), [workspaces])

  React.useEffect(() => {
    if (!shouldProbe || probeKey === '') return
    let cancelled = false

    const devices = new Map<string, { url: string; token: string }>()
    for (const workspace of workspaces) {
      const remote = workspace.remoteServer
      if (!remote) continue
      const key = remote.deviceId ?? `host:${remote.url.replace(/^wss?:\/\//i, '').toLowerCase()}`
      if (!devices.has(key)) devices.set(key, { url: remote.url, token: remote.token })
    }

    setProbing(true)
    void Promise.all([...devices].map(async ([key, conn]) => {
      const result = await probeDevice(conn.url, conn.token)
      return [key, result] as const
    })).then((results) => {
      if (cancelled) return
      const nextOnline: Record<string, boolean> = {}
      const nextSessions: Record<string, number> = {}
      for (const [key, result] of results) {
        nextOnline[key] = result.online
        Object.assign(nextSessions, result.activeSessions)
      }
      setOnline(nextOnline)
      setActiveSessions(nextSessions)
    }).finally(() => {
      if (!cancelled) setProbing(false)
    })

    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [probeKey, shouldProbe, round])

  const refresh = React.useCallback(() => setRound((n) => n + 1), [])

  return { targets, probing, refresh }
}

export { targetActiveSessions }
