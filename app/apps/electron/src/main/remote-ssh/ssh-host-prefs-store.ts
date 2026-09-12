/**
 * Per-host local prefs (displayName + autoConnect). Independent of ~/.ssh/config.
 * Cindy design: <userData>/ssh-host-prefs.json.
 */
import { app } from 'electron'
import fs from 'node:fs'
import path from 'node:path'
import { mainLog } from '../logger'

const prefsLog = mainLog

export interface SshHostPref {
  displayName?: string
  autoConnect: boolean
}

export type SshHostPrefs = Record<string, SshHostPref>

function settingsFilePath(): string {
  return path.join(app.getPath('userData'), 'ssh-host-prefs.json')
}

function normalize(raw: unknown): SshHostPrefs {
  if (!raw || typeof raw !== 'object') return {}
  const out: SshHostPrefs = {}
  for (const [hostId, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!value || typeof value !== 'object') continue
    const v = value as Record<string, unknown>
    out[hostId] = {
      ...(typeof v.displayName === 'string' && v.displayName.trim()
        ? { displayName: v.displayName.trim() }
        : {}),
      autoConnect: v.autoConnect === true,
    }
  }
  return out
}

let cached: SshHostPrefs | null = null

export function readSshHostPrefs(): SshHostPrefs {
  if (cached) return cached
  const file = settingsFilePath()
  try {
    if (fs.existsSync(file)) {
      cached = normalize(JSON.parse(fs.readFileSync(file, 'utf-8')))
      return cached
    }
  } catch (err) {
    prefsLog.warn('ssh-host-prefs.json read failed', {
      error: err instanceof Error ? err.message : String(err),
    })
    try { fs.unlinkSync(file) } catch { /* ignore */ }
  }
  cached = {}
  return cached
}

function writePrefs(prefs: SshHostPrefs): void {
  const file = settingsFilePath()
  const tmp = `${file}.tmp`
  fs.writeFileSync(tmp, JSON.stringify(prefs, null, 2), 'utf-8')
  fs.renameSync(tmp, file)
  cached = prefs
}

export function getSshHostDisplayName(hostId: string): string {
  return readSshHostPrefs()[hostId]?.displayName?.trim() || hostId
}

export function getSshHostAutoConnect(hostId: string): boolean {
  return readSshHostPrefs()[hostId]?.autoConnect === true
}

export function patchSshHostPref(
  hostId: string,
  patch: { displayName?: string },
): void {
  const current = { ...readSshHostPrefs() }
  const next: SshHostPref = {
    autoConnect: current[hostId]?.autoConnect === true,
    ...(current[hostId]?.displayName ? { displayName: current[hostId].displayName } : {}),
  }
  if (patch.displayName !== undefined) {
    const normalized = patch.displayName.trim()
    if (normalized && normalized !== hostId) next.displayName = normalized
    else delete next.displayName
  }
  current[hostId] = next
  writePrefs(current)
}

export function setSshHostAutoConnect(hostId: string, autoConnect: boolean): void {
  const current = { ...readSshHostPrefs() }
  current[hostId] = { ...current[hostId], autoConnect }
  writePrefs(current)
}

export function removeSshHostPref(hostId: string): void {
  const current = readSshHostPrefs()
  if (!(hostId in current)) return
  const next = { ...current }
  delete next[hostId]
  writePrefs(next)
}
