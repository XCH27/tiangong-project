/**
 * Session file watch ownership.
 *
 * The server keeps at most one session file watcher per client: a second
 * WATCH_FILES call replaces the first, and UNWATCH_FILES kills whatever is
 * active. Multiple renderer mounts (right sidebar, SessionInfoPopover) share
 * one client, so each mount must NOT watch/unwatch independently. Ownership
 * is refcounted per sessionId here; the last release unwatches (or hands the
 * single server-side watch to the next session that still has owners).
 */

const watchOwnerCounts = new Map<string, number>()
let activeWatchSessionId: string | null = null

export function acquireSessionFilesWatch(sessionId: string): () => void {
  watchOwnerCounts.set(sessionId, (watchOwnerCounts.get(sessionId) ?? 0) + 1)

  if (activeWatchSessionId !== sessionId) {
    activeWatchSessionId = sessionId
    void window.electronAPI.watchSessionFiles(sessionId)
  }

  let released = false
  return () => {
    if (released) return
    released = true

    const remaining = (watchOwnerCounts.get(sessionId) ?? 1) - 1
    if (remaining > 0) {
      watchOwnerCounts.set(sessionId, remaining)
      return
    }
    watchOwnerCounts.delete(sessionId)

    // Another session holds the server-side watch; nothing to clean up.
    if (activeWatchSessionId !== sessionId) return

    const nextOwned = watchOwnerCounts.keys().next()
    activeWatchSessionId = nextOwned.done ? null : nextOwned.value
    if (activeWatchSessionId) {
      void window.electronAPI.watchSessionFiles(activeWatchSessionId)
    } else {
      void window.electronAPI.unwatchSessionFiles()
    }
  }
}

export async function restoreSessionFileWatch(
  sessionId: string,
  reloadFiles: () => Promise<void>
): Promise<void> {
  try {
    activeWatchSessionId = sessionId
    await window.electronAPI.watchSessionFiles(sessionId)
  } catch (error) {
    console.error(`[SessionFiles] Failed to restore file watch for ${sessionId}:`, error)
  }

  try {
    await reloadFiles()
  } catch (error) {
    console.error(`[SessionFiles] Failed to reload files for ${sessionId} after reconnect:`, error)
  }
}
