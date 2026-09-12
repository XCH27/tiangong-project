/**
 * Where a conversation runs — "this computer", or a named remote one.
 *
 * A Workspace already decides where its sessions execute: a local folder runs here, a
 * Workspace with a `remoteServer` runs on that machine. What was missing is the
 * grouping: `workspaces.filter(ws => ws.remoteServer)` treats every paired Workspace
 * as a separate device, so one computer with three projects read as three computers.
 *
 * This projects the Workspace list into the thing a person actually chooses between —
 * a computer — with that computer's projects underneath. One authority still: these
 * are views over the existing Workspace records, never a second store.
 */

export interface RunTargetWorkspace {
  id: string;
  name: string;
  /** The Workspace id on the host. Absent for local workspaces. */
  remoteWorkspaceId?: string;
  /** Last known live session count on that Workspace, when the host has been asked. */
  activeSessions?: number;
}

export interface RunTarget {
  /** `local` is always present and always first. */
  kind: 'local' | 'remote';
  /** Stable host id; null for this computer and for pre-device records. */
  deviceId: string | null;
  /** Grouping key — stable id when known, else the endpoint host, so nothing merges wrongly. */
  key: string;
  name: string;
  /** Endpoint used to reach it, for the status line. Absent for local. */
  url?: string;
  workspaces: RunTargetWorkspace[];
  /** True when the host answered recently. Unknown (undefined) until something asks. */
  online?: boolean;
}

export interface RunTargetWorkspaceInput {
  id: string;
  name: string;
  remoteServer?: {
    url: string;
    remoteWorkspaceId: string;
    deviceId?: string;
    deviceName?: string;
  };
}

export interface BuildRunTargetsOptions {
  /** Label for this computer; the caller supplies it so this stays free of i18n. */
  localName: string;
  /** Per-device liveness, keyed by the same `key` the targets carry. */
  online?: Record<string, boolean>;
  /** Per-remote-Workspace live session counts, keyed by `remoteWorkspaceId`. */
  activeSessions?: Record<string, number>;
}

/** Hostname of a `ws://host:port` endpoint — the fallback grouping key. */
export function endpointHost(url: string): string {
  try {
    return new URL(url).host.toLowerCase();
  } catch {
    return url.trim().toLowerCase();
  }
}

export function buildRunTargets(
  workspaces: readonly RunTargetWorkspaceInput[],
  options: BuildRunTargetsOptions,
): RunTarget[] {
  const local: RunTarget = {
    kind: 'local',
    deviceId: null,
    key: 'local',
    name: options.localName,
    workspaces: [],
    online: true,
  };
  const remotes = new Map<string, RunTarget>();

  for (const workspace of workspaces) {
    const remote = workspace.remoteServer;
    if (!remote) {
      local.workspaces.push({ id: workspace.id, name: workspace.name });
      continue;
    }
    const key = remote.deviceId ?? `host:${endpointHost(remote.url)}`;
    let target = remotes.get(key);
    if (!target) {
      target = {
        kind: 'remote',
        deviceId: remote.deviceId ?? null,
        key,
        // Prefer the name the user gave the machine; fall back to its address so a
        // pre-device record is still recognisable rather than blank.
        name: remote.deviceName?.trim() || endpointHost(remote.url),
        url: remote.url,
        workspaces: [],
        online: options.online?.[key],
      };
      remotes.set(key, target);
    }
    target.workspaces.push({
      id: workspace.id,
      name: workspace.name,
      remoteWorkspaceId: remote.remoteWorkspaceId,
      activeSessions: options.activeSessions?.[remote.remoteWorkspaceId],
    });
  }

  const sortByName = (a: RunTarget, b: RunTarget) => a.name.localeCompare(b.name);
  return [local, ...[...remotes.values()].sort(sortByName)];
}

/** Total live sessions a target is known to be running, or undefined when unasked. */
export function targetActiveSessions(target: RunTarget): number | undefined {
  const counted = target.workspaces
    .map((workspace) => workspace.activeSessions)
    .filter((count): count is number => typeof count === 'number');
  if (counted.length === 0) return undefined;
  return counted.reduce((sum, count) => sum + count, 0);
}

/** The Workspace a new conversation should be created in for this target. */
export function defaultWorkspaceFor(target: RunTarget): RunTargetWorkspace | null {
  return target.workspaces[0] ?? null;
}
