import { describe, expect, it } from 'bun:test'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'
import type { ServerConfig } from '@craft-agent/shared/config/server-config'
import type { WsRpcPublicListenerOptions } from '@craft-agent/server-core/transport'
import {
  applyServerModeConfig,
  createStoppedServerModeState,
  type PublicListenerTransport,
  type RemoteAccessGateway,
} from '../server-mode'
import {
  EMPTY_REMOTE_ACCESS_STORE,
  formatInviteCredential,
  issueEnrollment,
  revokeDevice,
  type RemoteAccessStore,
} from '@craft-agent/shared/remote'
import { hashRemoteSecret } from '@craft-agent/shared/remote/node'

/** An in-memory device authority, so no test reads or writes the real CONFIG_DIR. */
function gateway(initial: RemoteAccessStore = EMPTY_REMOTE_ACCESS_STORE): RemoteAccessGateway & {
  current: () => RemoteAccessStore
} {
  let store = initial
  return {
    load: () => store,
    save: (next) => { store = next },
    newDeviceId: () => 'dev-1',
    newDeviceToken: () => 'device-token-1',
    current: () => store,
  }
}

function config(overrides: Partial<ServerConfig> = {}): ServerConfig {
  return { enabled: true, port: 9100, ...overrides }
}

describe('server mode application', () => {
  it('keeps running state and persisted config unchanged when a replacement bind fails', async () => {
    const current = {
      enabled: true,
      host: '0.0.0.0',
      port: 9100,
      protocol: 'ws' as const,
      auth: { token: 'old-token' },
    }
    let persisted: ServerConfig | undefined
    const transport: PublicListenerTransport = {
      listenPublic: async () => { throw new Error('EADDRINUSE') },
      closePublic: () => { throw new Error('must not close') },
    }

    await expect(applyServerModeConfig({
      transport,
      current,
      config: config({ port: 9200, token: 'new-token' }),
      persist: (next) => { persisted = next },
    })).rejects.toThrow('EADDRINUSE')

    expect(current).toEqual({
      enabled: true,
      host: '0.0.0.0',
      port: 9100,
      protocol: 'ws',
      auth: { token: 'old-token' },
    })
    expect(persisted).toBeUndefined()
  })

  it('forwards TLS and persists the generated remote token only after binding', async () => {
    const calls: string[] = []
    let listenerOptions: WsRpcPublicListenerOptions | undefined
    let persisted: ServerConfig | undefined
    const transport: PublicListenerTransport = {
      listenPublic: async (host, port, options) => {
        calls.push('bind')
        listenerOptions = options
        return { host, port, protocol: options.tls ? 'wss' : 'ws' }
      },
      closePublic: () => {},
    }

    const result = await applyServerModeConfig({
      transport,
      current: createStoppedServerModeState(),
      config: config({ tlsCertPath: '/cert.pem', tlsKeyPath: '/key.pem' }),
      createToken: () => 'generated-remote-token',
      remoteAccess: gateway(),
      readFile: (path) => Buffer.from(path),
      persist: (next) => {
        calls.push('persist')
        persisted = next
      },
    })

    expect(calls).toEqual(['bind', 'persist'])
    expect(listenerOptions?.tls).toEqual({
      cert: Buffer.from('/cert.pem'),
      key: Buffer.from('/key.pem'),
    })
    // The configured server token stays admitted — a craft-cli, a thin client, and a
    // pre-device `ws://host:port#token` link hold it and nothing else. Any other
    // credential that is not a device grant is still refused.
    expect(await listenerOptions?.validateToken('generated-remote-token')).toBe(true)
    expect(await listenerOptions?.validateToken('some-other-token')).toBe(false)
    expect(persisted?.token).toBe('generated-remote-token')
    expect(result.protocol).toBe('wss')
  })

  it('persists disable before closing the active listener', async () => {
    const calls: string[] = []
    const transport: PublicListenerTransport = {
      listenPublic: async () => { throw new Error('not used') },
      closePublic: () => { calls.push('close') },
    }
    const current = {
      enabled: true,
      host: '0.0.0.0',
      port: 9100,
      protocol: 'ws' as const,
      auth: { token: 'remote-token' },
    }

    const result = await applyServerModeConfig({
      transport,
      current,
      config: config({ enabled: false, token: undefined }),
      persist: () => { calls.push('persist') },
    })

    expect(calls).toEqual(['persist', 'close'])
    expect(result.enabled).toBe(false)
    expect(result.auth.token).toBe('remote-token')
  })
})

/**
 * The public listener is the one socket a stranger on the LAN can reach. It must
 * carry validateToken and the configured TLS on every bind, which is only true if
 * applyServerModeConfig stays its single writer. A direct `listenPublic(host, port)`
 * elsewhere in the main process drops both arguments silently — that regression
 * shipped once already, so it is guarded at the source level.
 */
describe('applyServerModeConfig is the only public-listener writer', () => {
  const mainRoot = resolve(import.meta.dir, '..')

  function walk(dir: string): string[] {
    const out: string[] = []
    for (const entry of readdirSync(dir)) {
      if (entry === '__tests__' || entry === 'node_modules') continue
      const full = join(dir, entry)
      if (statSync(full).isDirectory()) out.push(...walk(full))
      else if (full.endsWith('.ts')) out.push(full)
    }
    return out
  }

  it('no main-process file calls listenPublic outside server-mode.ts', () => {
    const offenders = walk(mainRoot)
      .filter(f => !f.endsWith('/server-mode.ts'))
      .filter(f => /\.listenPublic\s*\(/.test(readFileSync(f, 'utf8')))
      .map(f => f.slice(mainRoot.length + 1))
    expect(offenders).toEqual([])
  })
})

describe('the public listener admits devices, not tokens', () => {
  async function validatorWith(store: RemoteAccessStore) {
    let options: WsRpcPublicListenerOptions | undefined
    const gate = gateway(store)
    await applyServerModeConfig({
      transport: {
        listenPublic: async (host, port, opts) => {
          options = opts
          return { host, port, protocol: 'ws' as const }
        },
        closePublic: () => {},
      },
      current: createStoppedServerModeState(),
      config: config(),
      persist: () => {},
      remoteAccess: gate,
    })
    if (!options?.validateToken) throw new Error('no validator installed')
    return { validate: options.validateToken, gate }
  }

  const invited = () => issueEnrollment(EMPTY_REMOTE_ACCESS_STORE, {
    deviceName: 'Studio Mac', secret: 'sec-1', id: 'inv-1', now: Date.now(),
  }, hashRemoteSecret).store

  it('redeems a one-time invite, then accepts the minted device token', async () => {
    const { validate, gate } = await validatorWith(invited())
    expect(await validate(formatInviteCredential({ enrollmentId: 'inv-1', secret: 'sec-1' }))).toBe(true)
    expect(gate.current().devices[0]!.name).toBe('Studio Mac')
    expect(await validate('device-token-1')).toBe(true)
  })

  it('refuses the same invite twice', async () => {
    const { validate } = await validatorWith(invited())
    const credential = formatInviteCredential({ enrollmentId: 'inv-1', secret: 'sec-1' })
    expect(await validate(credential)).toBe(true)
    expect(await validate(credential)).toBe(false)
  })

  it('refuses a revoked device and an empty credential', async () => {
    const { validate, gate } = await validatorWith(invited())
    expect(await validate(formatInviteCredential({ enrollmentId: 'inv-1', secret: 'sec-1' }))).toBe(true)
    gate.save(revokeDevice(gate.current(), 'dev-1', Date.now()))
    expect(await validate('device-token-1')).toBe(false)
    expect(await validate('')).toBe(false)
  })
})
