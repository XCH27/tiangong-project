/**
 * Cindy Phase A SSH remote — list/add/connect/disconnect/remove hosts.
 * Managed aliases live in ~/.ssh/fleet.conf via @craft-agent/remote-ssh.
 */
import { app, ipcMain, BrowserWindow } from 'electron'
import path from 'node:path'
import {
  ConnectionPool,
  FileHostKeyStore,
  addManagedHostWithInclude,
  defaultManagedSshConfigPath,
  defaultSshConfigPath,
  expandHome,
  effectiveAuthenticationFingerprint,
  readSshConfigDetailed,
  redactSshSensitiveText,
  removeManagedHost,
  updateManagedHostFields,
  MANAGED_CONFIG_CONCURRENT_MODIFICATION_CODE,
  MANAGED_CONFIG_OWNERSHIP_REQUIRED_CODE,
  MANAGED_CONFIG_WRITE_TOKEN_REQUIRED_CODE,
  type AddHostInput,
  type HostConfig,
  type HostSnapshot,
  type ManagedConfigWriteToken,
  type ManagedHostAddReceipt,
  type ReadSshConfigResult,
  type SshConfigDiagnostic,
} from '@craft-agent/remote-ssh'
import { mainLog } from '../logger'
import { classifyConnectFailure } from './connect-failure'
import { RemoteHostHydrationQueue } from './hydration-queue'
import {
  getSshHostAutoConnect,
  getSshHostDisplayName,
  patchSshHostPref,
  removeSshHostPref,
  setSshHostAutoConnect,
} from './ssh-host-prefs-store'
import {
  addKeyToAgent,
  buildInstallCommand,
  generateNewKey,
  listLocalSshKeys,
  readPubkey,
} from './ssh-keys'

const log = mainLog

export const REMOTE_SSH_INVOKE = {
  LIST: '__remote-ssh:list',
  RELOAD_CONFIG: '__remote-ssh:reload-config',
  ADD: '__remote-ssh:add',
  UPDATE: '__remote-ssh:update',
  REMOVE: '__remote-ssh:remove',
  CONNECT: '__remote-ssh:connect',
  DISCONNECT: '__remote-ssh:disconnect',
  SET_AUTO_CONNECT: '__remote-ssh:set-auto-connect',
  LIST_LOCAL_KEYS: '__remote-ssh:list-local-keys',
  GENERATE_KEY: '__remote-ssh:generate-key',
  READ_PUBKEY: '__remote-ssh:read-pubkey',
  BUILD_INSTALL_CMD: '__remote-ssh:build-install-cmd',
  BUILD_INSTALL_CMD_INLINE: '__remote-ssh:build-install-cmd-inline',
  ADD_KEY_TO_AGENT: '__remote-ssh:add-key-to-agent',
} as const

export const REMOTE_SSH_PUSH = {
  STATUS_CHANGED: '__remote-ssh:status-changed',
} as const

const SSH_CONFIG_READ_FAILED_MESSAGE =
  'Unable to read SSH configuration. Check file permissions and Include paths, then refresh.'
const SSH_CONFIG_WRITE_FAILED_MESSAGE =
  'Unable to write SSH configuration. Check file permissions, then try again.'

class SshHostOwnershipConflictError extends Error {
  constructor(readonly aliases: readonly string[]) {
    super(`SSH host ownership changed while adding: ${aliases.join(', ')}`)
    this.name = 'SshHostOwnershipConflictError'
  }
}

function ipcFail(code: string, message: string): never {
  const err = new Error(message) as Error & { code: string }
  err.code = code
  throw err
}

function requireObject(raw: unknown, label = 'payload'): Record<string, unknown> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    ipcFail('INVALID_PARAMS', `${label} must be an object`)
  }
  return raw as Record<string, unknown>
}

function requireString(value: unknown, label: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    ipcFail('INVALID_PARAMS', `${label} is required`)
  }
  return value.trim()
}

let pool: ConnectionPool | null = null
let initPromise: Promise<void> | null = null
let registered = false
const sshConfigPath = defaultSshConfigPath()
const managedSshConfigPath = defaultManagedSshConfigPath()
const remoteHostHydrationQueue = new RemoteHostHydrationQueue()
let sshConfigWarnings: string[] = []
let sshConfigDiagnostic: SshConfigDiagnostic | null = null
let sharedHostKeyStore: FileHostKeyStore | null = null

function getSharedHostKeyStore(): FileHostKeyStore {
  if (!sharedHostKeyStore) {
    sharedHostKeyStore = new FileHostKeyStore(
      path.join(app.getPath('userData'), 'remote-ssh', 'known-hosts.json'),
    )
  }
  return sharedHostKeyStore
}

const poolLogger = {
  debug: (msg: string, ctx?: Record<string, unknown>) => log.debug(msg, ctx),
  info: (msg: string, ctx?: Record<string, unknown>) => log.info(msg, ctx),
  warn: (msg: string, ctx?: Record<string, unknown>) => log.warn(msg, ctx),
  error: (msg: string, ctx?: Record<string, unknown>) => log.error(msg, ctx),
}

function getPool(): ConnectionPool {
  if (!pool) {
    pool = new ConnectionPool({
      logger: poolLogger,
      hostKeys: getSharedHostKeyStore(),
    })
  }
  return pool
}

export function getRemoteSshPool(): ConnectionPool {
  return getPool()
}

type RendererHostConfig = Pick<HostConfig,
  | 'id'
  | 'displayName'
  | 'hostname'
  | 'port'
  | 'user'
  | 'authMethod'
  | 'source'
  | 'managedByCindy'
> & {
  identityFileConfigured: boolean
  identityFileName?: string
}

export type HostSnapshotWithPrefs = Omit<HostSnapshot, 'config' | 'lastError'> & {
  config: RendererHostConfig
  lastError?: string
  autoConnect: boolean
}

function portableBasename(value: string): string {
  const index = Math.max(value.lastIndexOf('/'), value.lastIndexOf('\\'))
  return index >= 0 ? value.slice(index + 1) : value
}

function redactHostLocalPaths(config: HostConfig, message: string | undefined): string | undefined {
  if (!message) return message
  return redactSshSensitiveText(config, message)
}

function toRendererHostConfig(config: HostConfig): RendererHostConfig {
  return {
    id: config.id,
    ...(config.displayName !== undefined ? { displayName: config.displayName } : {}),
    hostname: config.hostname,
    port: config.port,
    user: config.user,
    authMethod: config.authMethod,
    identityFileConfigured: config.identityFile !== undefined,
    ...(config.identityFile !== undefined
      ? { identityFileName: portableBasename(config.identityFile) }
      : {}),
    source: config.source,
    managedByCindy: config.managedByCindy,
  }
}

function withPrefs(snapshot: HostSnapshot): HostSnapshotWithPrefs {
  const id = snapshot.config.id
  return {
    ...snapshot,
    config: {
      ...toRendererHostConfig(snapshot.config),
      displayName: getSshHostDisplayName(id),
    },
    ...(snapshot.lastError
      ? { lastError: redactHostLocalPaths(snapshot.config, snapshot.lastError) }
      : {}),
    autoConnect: getSshHostAutoConnect(id),
  }
}

function currentRemoteSshListResult() {
  return {
    hosts: getPool().list().map(withPrefs),
    warningCount: sshConfigWarnings.length,
    diagnostic: sshConfigDiagnostic ? { kind: sshConfigDiagnostic.kind } : null,
  }
}

function broadcastStatus(snapshot: HostSnapshot): void {
  const payload = withPrefs(snapshot)
  for (const win of BrowserWindow.getAllWindows()) {
    if (win.isDestroyed()) continue
    win.webContents.send(REMOTE_SSH_PUSH.STATUS_CHANGED, payload)
  }
}

function remoteConnectionFieldsChanged(left: HostConfig, right: HostConfig): boolean {
  return left.hostname !== right.hostname
    || left.port !== right.port
    || left.user !== right.user
    || effectiveAuthenticationFingerprint(left) !== effectiveAuthenticationFingerprint(right)
}

async function hydrateRemoteHostsUnqueued(
  alreadyInvalidated: Set<string> = new Set(),
  preserveExistingEndpoints = false,
  requiredManagedAliases: Set<string> = new Set(),
): Promise<void> {
  let result: ReadSshConfigResult
  try {
    result = await readSshConfigDetailed(sshConfigPath, {
      managedConfigPath: managedSshConfigPath,
    })
  } catch (error) {
    sshConfigDiagnostic = {
      path: sshConfigPath,
      kind: 'io',
      message: error instanceof Error ? error.message : String(error),
      recoveryHint: 'Check SSH config permissions and Include paths, then refresh.',
    }
    throw error
  }
  sshConfigWarnings = result.warnings
  if (result.diagnostic) {
    sshConfigDiagnostic = result.diagnostic
    throw new Error(result.diagnostic.message)
  }
  sshConfigDiagnostic = null

  const nextById = new Map(result.hosts.map((host) => [host.id, host]))
  const ownershipConflicts = Array.from(requiredManagedAliases).filter(
    (alias) => nextById.get(alias)?.managedByCindy !== true,
  )
  if (ownershipConflicts.length > 0) {
    throw new SshHostOwnershipConflictError(ownershipConflicts)
  }
  const changedOrRemoved: string[] = []
  for (const current of getPool().list()) {
    const next = nextById.get(current.config.id)
    if ((!next || remoteConnectionFieldsChanged(current.config, next))
      && !alreadyInvalidated.has(current.config.id)) {
      changedOrRemoved.push(current.config.id)
    }
  }
  if (preserveExistingEndpoints && changedOrRemoved.length > 0) {
    throw new Error(
      `SSH config changed for existing aliases during add: ${changedOrRemoved.join(', ')}`,
    )
  }
  await Promise.all(changedOrRemoved.map((hostId) => getPool().disconnect(hostId)))
  await getPool().hydrate(result.hosts)
  log.info('ssh hosts hydrated', {
    count: result.hosts.length,
    warnings: result.warnings.length,
  })
}

function hydrateRemoteHosts(): Promise<void> {
  return remoteHostHydrationQueue.run(hydrateRemoteHostsUnqueued)
}

async function ensureHydrated(): Promise<void> {
  if (initPromise) return initPromise
  initPromise = hydrateRemoteHosts().catch((err) => {
    log.warn('failed to read SSH config (keeping last valid pool)', { error: String(err) })
    initPromise = null
  })
  return initPromise
}

async function readLatestSshConfigOrThrow(): Promise<ReadSshConfigResult> {
  try {
    const latest = await readSshConfigDetailed(sshConfigPath, {
      managedConfigPath: managedSshConfigPath,
    })
    if (latest.diagnostic) throw new Error(latest.diagnostic.message)
    return latest
  } catch (error) {
    log.warn('failed to re-read SSH config', { error: String(error) })
    ipcFail('SSH_CONFIG_IO_FAILED', SSH_CONFIG_READ_FAILED_MESSAGE)
  }
}

function managedWriteTokenOrThrow(result: ReadSshConfigResult): ManagedConfigWriteToken {
  if (result.managedConfigWriteToken) return result.managedConfigWriteToken
  ipcFail('INTERNAL', 'Unable to prepare a safe SSH configuration update. No changes were made.')
}

function throwManagedConfigWriteError(action: 'update' | 'remove', error: unknown): never {
  const code = (error as { code?: unknown }).code
  if (code === MANAGED_CONFIG_CONCURRENT_MODIFICATION_CODE) {
    ipcFail('SSH_CONFIG_CONCURRENT_MODIFICATION', 'The SSH configuration changed on disk. Reload it and try again.')
  }
  if (code === MANAGED_CONFIG_OWNERSHIP_REQUIRED_CODE) {
    ipcFail('SSH_CONFIG_OWNERSHIP_REQUIRED', 'This SSH host is not uniquely managed here. Reload before editing.')
  }
  if (code === MANAGED_CONFIG_WRITE_TOKEN_REQUIRED_CODE) {
    ipcFail('INTERNAL', 'Unable to prepare a safe SSH configuration update. No changes were made.')
  }
  log.warn('managed SSH config write failed', { action, error: String(error) })
  ipcFail('SSH_CONFIG_IO_FAILED', SSH_CONFIG_WRITE_FAILED_MESSAGE)
}

function throwReloadRequired(action: string, error: unknown): never {
  log.warn('SSH config mutation committed but refresh failed', {
    action,
    error: error instanceof Error ? error.message : String(error),
  })
  ipcFail(
    'SSH_CONFIG_RELOAD_REQUIRED',
    `${action} was written to SSH config, but refresh failed. Reload SSH configuration.`,
  )
}

function normalizeAddInput(
  raw: unknown,
  options: { allowIdentityFileUnchanged?: boolean } = {},
): AddHostInput & { displayName?: string; identityFileUnchanged?: boolean } {
  const obj = requireObject(raw, 'host')
  const id = requireString(obj.id, 'id')
  if (!/^[A-Za-z0-9._-]+$/.test(id)) {
    ipcFail('INVALID_PARAMS', 'id must be a valid SSH alias')
  }
  const hostname = requireString(obj.hostname, 'hostname')
  const user = requireString(obj.user, 'user')
  const portRaw = obj.port
  const port = portRaw === undefined || portRaw === null || portRaw === ''
    ? 22
    : Number(portRaw)
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    ipcFail('INVALID_PARAMS', 'port must be an integer 1–65535')
  }
  const authMethod = obj.authMethod === 'key' ? 'key' : 'agent'
  const displayName = typeof obj.displayName === 'string' ? obj.displayName.trim() : undefined
  const identityFileUnchanged = obj.identityFileUnchanged === true
  if (identityFileUnchanged && !options.allowIdentityFileUnchanged) {
    ipcFail('INVALID_PARAMS', 'identityFileUnchanged is only valid when updating a host')
  }
  const identityFile = typeof obj.identityFile === 'string' && obj.identityFile.trim()
    ? expandHome(obj.identityFile.trim())
    : undefined
  if (identityFileUnchanged && identityFile !== undefined) {
    ipcFail('INVALID_PARAMS', 'identityFile and identityFileUnchanged are mutually exclusive')
  }
  if (authMethod === 'key' && !identityFile && !identityFileUnchanged) {
    ipcFail('INVALID_PARAMS', 'identityFile required when authMethod is "key"')
  }
  return { id, hostname, port, user, authMethod, identityFile, displayName, identityFileUnchanged }
}

async function autoConnectEnabledHosts(): Promise<void> {
  await ensureHydrated()
  for (const snap of getPool().list()) {
    if (!getSshHostAutoConnect(snap.config.id)) continue
    if (snap.status === 'ready' || snap.status === 'connecting' || snap.status === 'authenticating') continue
    void getPool().connect(snap.config.id).catch((err) => {
      log.warn('autoConnect failed', { hostId: snap.config.id, error: String(err) })
    })
  }
}

export function registerRemoteSshIpc(): void {
  if (registered) return
  registered = true

  getPool().onAnyStatus((snap) => {
    broadcastStatus(snap)
  })

  ipcMain.handle(REMOTE_SSH_INVOKE.LIST, async () => {
    await ensureHydrated()
    return currentRemoteSshListResult()
  })

  ipcMain.handle(REMOTE_SSH_INVOKE.RELOAD_CONFIG, async () => {
    try {
      await hydrateRemoteHosts()
    } catch (err) {
      log.warn('failed to reload SSH config', { error: String(err) })
    }
    return currentRemoteSshListResult()
  })

  ipcMain.handle(REMOTE_SSH_INVOKE.ADD, async (_event, rawHost: unknown) => {
    const input = normalizeAddInput(rawHost)
    await ensureHydrated()
    return remoteHostHydrationQueue.run(async () => {
      if (getPool().get(input.id)) {
        ipcFail('ALREADY_EXISTS', `host already exists: ${input.id}`)
      }
      const latest = await readLatestSshConfigOrThrow()
      if (latest.hosts.some((host) => host.id === input.id)) {
        ipcFail('ALREADY_EXISTS', `host already exists: ${input.id}`)
      }
      const cfg: HostConfig = {
        id: input.id,
        hostname: input.hostname,
        port: input.port ?? 22,
        user: input.user,
        authMethod: input.authMethod ?? 'agent',
        identityFile: input.identityFile,
        source: 'ssh-config',
        managedByCindy: true,
      }
      let addReceipt: ManagedHostAddReceipt
      try {
        addReceipt = await addManagedHostWithInclude(cfg, sshConfigPath, managedSshConfigPath)
      } catch (err) {
        if ((err as { code?: string }).code === MANAGED_CONFIG_OWNERSHIP_REQUIRED_CODE) {
          ipcFail('SSH_CONFIG_OWNERSHIP_REQUIRED', 'The existing managed SSH config is not owned by Fleet.')
        }
        log.warn('failed to write SSH config while adding host', { error: String(err) })
        ipcFail('SSH_CONFIG_IO_FAILED', SSH_CONFIG_WRITE_FAILED_MESSAGE)
      }
      let refreshError: unknown
      try {
        await hydrateRemoteHostsUnqueued(new Set(), true, new Set([cfg.id]))
      } catch (err) {
        if (err instanceof SshHostOwnershipConflictError) {
          try { await addReceipt.rollback() } catch { /* ignore */ }
          ipcFail('PRECONDITION_FAILED', 'SSH configuration changed while adding the host; reload and try again.')
        }
        refreshError = err
      }
      patchSshHostPref(cfg.id, { displayName: input.displayName })
      if (refreshError !== undefined) throwReloadRequired('New host', refreshError)
      const host = getPool().get(cfg.id)
      if (!host) throwReloadRequired('New host', new Error('host missing after refresh'))
      return { host: withPrefs(host.snapshot()) }
    })
  })

  ipcMain.handle(REMOTE_SSH_INVOKE.UPDATE, async (_event, rawHost: unknown) => {
    const input = normalizeAddInput(rawHost, { allowIdentityFileUnchanged: true })
    await ensureHydrated()
    return remoteHostHydrationQueue.run(async () => {
      const existing = getPool().get(input.id)
      if (!existing) ipcFail('SSH_HOST_NOT_FOUND', `unknown host: ${input.id}`)
      const cfg: HostConfig = {
        id: input.id,
        hostname: input.hostname,
        port: input.port ?? 22,
        user: input.user,
        authMethod: input.authMethod ?? 'agent',
        identityFile: input.identityFileUnchanged
          ? existing.config.identityFile
          : input.identityFile,
        source: 'ssh-config',
        managedByCindy: existing.config.managedByCindy,
      }
      const connectionChanged = remoteConnectionFieldsChanged(existing.config, cfg)
      if (connectionChanged) {
        if (!existing.config.managedByCindy) {
          ipcFail('SSH_CONFIG_OWNERSHIP_REQUIRED', 'Connection details from SSH config are read-only here.')
        }
        const latest = await readLatestSshConfigOrThrow()
        const token = managedWriteTokenOrThrow(latest)
        try {
          await updateManagedHostFields(cfg, managedSshConfigPath, token)
        } catch (err) {
          throwManagedConfigWriteError('update', err)
        }
        await getPool().disconnect(input.id)
        await hydrateRemoteHostsUnqueued(new Set([input.id]))
      }
      patchSshHostPref(cfg.id, { displayName: input.displayName })
      const refreshed = getPool().get(cfg.id)
      if (!refreshed) throwReloadRequired('Host update', new Error('host missing after refresh'))
      return { host: withPrefs(refreshed.snapshot()) }
    })
  })

  ipcMain.handle(REMOTE_SSH_INVOKE.REMOVE, async (_event, args: unknown) => {
    const id = requireString(requireObject(args).id, 'id')
    await ensureHydrated()
    return remoteHostHydrationQueue.run(async () => {
      const host = getPool().get(id)
      if (!host) ipcFail('SSH_HOST_NOT_FOUND', `unknown host: ${id}`)
      if (!host.config.managedByCindy) {
        ipcFail('SSH_CONFIG_OWNERSHIP_REQUIRED', 'Only Fleet-managed hosts can be removed here.')
      }
      const latest = await readLatestSshConfigOrThrow()
      const token = managedWriteTokenOrThrow(latest)
      try {
        await removeManagedHost(id, managedSshConfigPath, token)
      } catch (err) {
        throwManagedConfigWriteError('remove', err)
      }
      await getPool().remove(id)
      removeSshHostPref(id)
      await hydrateRemoteHostsUnqueued(new Set([id]))
      return { ok: true as const }
    })
  })

  ipcMain.handle(REMOTE_SSH_INVOKE.CONNECT, async (_event, args: unknown) => {
    const id = requireString(requireObject(args).id, 'id')
    await ensureHydrated()
    const host = getPool().get(id)
    if (!host) ipcFail('SSH_HOST_NOT_FOUND', `unknown ssh host: ${id}`)
    try {
      await getPool().connect(id)
    } catch (err) {
      const { code, msg } = classifyConnectFailure(err)
      ipcFail(code, redactHostLocalPaths(host.config, msg) ?? msg)
    }
    const connected = getPool().get(id)
    return { host: connected ? withPrefs(connected.snapshot()) : null }
  })

  ipcMain.handle(REMOTE_SSH_INVOKE.DISCONNECT, async (_event, args: unknown) => {
    const id = requireString(requireObject(args).id, 'id')
    await getPool().disconnect(id)
    const host = getPool().get(id)
    return { host: host ? withPrefs(host.snapshot()) : null }
  })

  ipcMain.handle(REMOTE_SSH_INVOKE.SET_AUTO_CONNECT, async (_event, args: unknown) => {
    const obj = requireObject(args)
    const id = requireString(obj.id, 'id')
    setSshHostAutoConnect(id, obj.autoConnect === true)
    const host = getPool().get(id)
    return { host: host ? withPrefs(host.snapshot()) : null }
  })

  ipcMain.handle(REMOTE_SSH_INVOKE.LIST_LOCAL_KEYS, async () => {
    return { keys: await listLocalSshKeys() }
  })

  ipcMain.handle(REMOTE_SSH_INVOKE.GENERATE_KEY, async (_event, args: unknown) => {
    const obj = args && typeof args === 'object' ? args as Record<string, unknown> : {}
    return generateNewKey({
      comment: typeof obj.comment === 'string' ? obj.comment : undefined,
    })
  })

  ipcMain.handle(REMOTE_SSH_INVOKE.READ_PUBKEY, async (_event, args: unknown) => {
    const pubkeyPath = requireString(requireObject(args).pubkeyPath, 'pubkeyPath')
    return { content: await readPubkey(pubkeyPath) }
  })

  ipcMain.handle(REMOTE_SSH_INVOKE.BUILD_INSTALL_CMD, async (_event, args: unknown) => {
    const obj = requireObject(args)
    const id = requireString(obj.id, 'id')
    const pubkeyPath = requireString(obj.pubkeyPath, 'pubkeyPath')
    const host = getPool().get(id)
    if (!host) ipcFail('SSH_HOST_NOT_FOUND', `unknown host: ${id}`)
    return {
      command: buildInstallCommand(host.config.user, host.config.hostname, host.config.port, pubkeyPath),
    }
  })

  ipcMain.handle(REMOTE_SSH_INVOKE.BUILD_INSTALL_CMD_INLINE, async (_event, args: unknown) => {
    const obj = requireObject(args)
    return {
      command: buildInstallCommand(
        requireString(obj.user, 'user'),
        requireString(obj.hostname, 'hostname'),
        typeof obj.port === 'number' ? obj.port : undefined,
        requireString(obj.pubkeyPath, 'pubkeyPath'),
      ),
    }
  })

  ipcMain.handle(REMOTE_SSH_INVOKE.ADD_KEY_TO_AGENT, async (_event, args: unknown) => {
    const privateKeyPath = requireString(requireObject(args).privateKeyPath, 'privateKeyPath')
    await addKeyToAgent({ privateKeyPath })
    return { ok: true as const }
  })

  void autoConnectEnabledHosts()
}
