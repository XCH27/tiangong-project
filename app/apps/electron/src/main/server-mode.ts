import { randomUUID } from 'node:crypto'
import { readFileSync } from 'node:fs'
import {
  authenticateRemoteCredential,
  parseInviteCredential,
  DeviceMintLedger,
  type RemoteAccessStore,
} from '@craft-agent/shared/remote'
import {
  hashRemoteSecret,
  loadRemoteAccessStore,
  newRemoteId,
  newRemoteSecret,
  saveRemoteAccessStore,
} from '@craft-agent/shared/remote/node'
import type { ServerConfig } from '@craft-agent/shared/config/server-config'
import type {
  WsRpcPublicListenerInfo,
  WsRpcPublicListenerOptions,
  WsRpcTlsOptions,
} from '@craft-agent/server-core/transport'

export interface PublicListenerTransport {
  listenPublic(
    host: string,
    port: number,
    options: WsRpcPublicListenerOptions,
  ): Promise<WsRpcPublicListenerInfo>
  closePublic(): void
}

export interface RunningServerModeState {
  enabled: boolean
  host: string
  port: number
  protocol: 'ws' | 'wss'
  auth: { token: string }
  tlsCertPath?: string
  tlsKeyPath?: string
}

/** How the listener reaches the device authority. Injectable so tests never touch CONFIG_DIR. */
export interface RemoteAccessGateway {
  load: () => RemoteAccessStore
  save: (store: RemoteAccessStore) => void
  newDeviceId: () => string
  newDeviceToken: () => string
}

export const defaultRemoteAccessGateway: RemoteAccessGateway = {
  load: loadRemoteAccessStore,
  save: saveRemoteAccessStore,
  newDeviceId: newRemoteId,
  newDeviceToken: newRemoteSecret,
}

/**
 * In-memory, process-wide: the grant a just-redeemed invite produced, waiting to be
 * claimed once by the device that redeemed it. Never persisted.
 */
export const deviceMintLedger = new DeviceMintLedger()

interface ApplyServerModeOptions {
  transport: PublicListenerTransport
  current: RunningServerModeState
  config: ServerConfig
  persist: (config: ServerConfig) => void
  host?: string
  createToken?: () => string
  readFile?: (path: string) => Buffer
  remoteAccess?: RemoteAccessGateway
}

export function createStoppedServerModeState(token = ''): RunningServerModeState {
  return {
    enabled: false,
    host: '127.0.0.1',
    port: 0,
    protocol: 'ws',
    auth: { token },
  }
}

function loadTls(
  config: ServerConfig,
  readFile: (path: string) => Buffer,
): WsRpcTlsOptions | undefined {
  const certPath = config.tlsCertPath?.trim()
  const keyPath = config.tlsKeyPath?.trim()
  if (Boolean(certPath) !== Boolean(keyPath)) {
    throw new Error('TLS certificate and private key must be configured together')
  }
  if (!certPath || !keyPath) return undefined
  return { cert: readFile(certPath), key: readFile(keyPath) }
}

/**
 * Apply one server-mode update transactionally around the listener bind.
 * A failed bind never mutates the running state or persists the candidate config.
 */
export async function applyServerModeConfig({
  transport,
  current,
  config,
  persist,
  host = '0.0.0.0',
  createToken = randomUUID,
  readFile = readFileSync,
  remoteAccess = defaultRemoteAccessGateway,
}: ApplyServerModeOptions): Promise<RunningServerModeState> {
  if (!Number.isInteger(config.port) || config.port < 1024 || config.port > 65535) {
    throw new Error(`Port must be between 1024 and 65535, got ${config.port}`)
  }

  if (!config.enabled) {
    const token = config.token?.trim() || current.auth.token
    const normalized = token ? { ...config, token } : { ...config }
    persist(normalized)
    transport.closePublic()
    return createStoppedServerModeState(token)
  }

  const tls = loadTls(config, readFile)
  const token = config.token?.trim() || current.auth.token || createToken()
  const normalized = { ...config, token }
  const protocol = tls ? 'wss' : 'ws'
  const sameListener = current.enabled
    && current.host === host
    && current.port === config.port
    && current.protocol === protocol
    && current.tlsCertPath === config.tlsCertPath
    && current.tlsKeyPath === config.tlsKeyPath

  if (sameListener) {
    persist(normalized)
    current.auth.token = token
    return { ...current }
  }

  const auth = { token }
  const listener = await transport.listenPublic(host, config.port, {
    tls,
    // P7: a remote client authenticates as a **device**, never with this machine's
    // own server token. Either it presents the per-device grant it was minted at
    // pairing time, or it presents a one-time invite and is minted one now. The
    // local renderer's bearer token is not accepted here at all.
    validateToken: async (candidate) => {
      const outcome = authenticateRemoteCredential(remoteAccess.load(), candidate, {
        hash: hashRemoteSecret,
        newDeviceId: remoteAccess.newDeviceId,
        newDeviceToken: remoteAccess.newDeviceToken,
        // Craft's own credential stays admitted: a craft-cli, a thin client started
        // with CRAFT_SERVER_TOKEN, and a pre-device `ws://host:port#token` link all
        // hold it and nothing else. Removing it hardened nothing the user chose — it
        // just cut off clients that already worked.
        serverToken: token,
      })
      if (!outcome.ok) return false
      if (outcome.kind === 'server-token') return true
      remoteAccess.save(outcome.store)
      if (outcome.mintedToken) {
        // The invite it presented stops working now, so hold the new grant for the
        // one claim this device gets (remote:claimDeviceToken).
        const invite = parseInviteCredential(candidate)
        if (invite) {
          deviceMintLedger.remember(invite.enrollmentId, outcome.device.id, outcome.mintedToken)
        }
      }
      return true
    },
  })
  persist(normalized)

  return {
    enabled: true,
    host: listener.host,
    port: listener.port,
    protocol: listener.protocol,
    auth,
    tlsCertPath: config.tlsCertPath,
    tlsKeyPath: config.tlsKeyPath,
  }
}
