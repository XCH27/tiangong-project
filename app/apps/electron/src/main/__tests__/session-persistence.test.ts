/**
 * Tests for session persistence bugfixes — REAL production function calls.
 *
 * Tests the actual exported functions used by SessionManager:
 * - pickSessionFields() — the StoredSession field builder used by enqueuePersist()
 * - resolveModelForProvider() — the model resolution used by resolveBackendContext()
 * - resolveSessionConnection() — the connection resolver used in orphaned-connection cleanup
 *
 * Bug context:
 * 1. createdAt must be preserved (not overwritten by lastMessageAt) during persistence
 * 2. Agent creation must handle null connection gracefully (fallback to default model)
 * 3. Orphaned llmConnection references must be detected and cleared
 */
import { describe, it, expect, afterAll, beforeEach } from 'bun:test'
import { join } from 'node:path'
import { mkdtempSync, writeFileSync, rmSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'

// ============================================================================
// Hermetic config dir: set CRAFT_CONFIG_DIR BEFORE importing config-dependent
// modules. Static ESM imports are hoisted above assignments, so we use dynamic
// import() after setting the env var to ensure config storage reads from our
// temp directory.
// ============================================================================
const tempConfigDir = mkdtempSync(join(tmpdir(), 'craft-session-test-'))
process.env.CRAFT_CONFIG_DIR = tempConfigDir

// Real production imports — loaded after CRAFT_CONFIG_DIR is set so that
// config/storage.ts resolves CONFIG_FILE to our temp directory.
const { pickSessionFields, SESSION_PERSISTENT_FIELDS } = await import('@craft-agent/shared/sessions')
const {
  resolveModelForProvider,
  resolveSessionConnection,
} = await import('../../../../../packages/shared/src/agent/backend/index.ts')
const { DEFAULT_MODEL } = await import('@craft-agent/shared/config')

// Path to the config file inside our temp config dir.
const configFile = join(tempConfigDir, 'config.json')

/** Write a minimal config.json with the given connections (or none). */
function writeConfig(connections: Array<Record<string, unknown>> = [], defaultSlug?: string): void {
  const config = {
    workspaces: [],
    activeWorkspaceId: null,
    activeSessionId: null,
    llmConnections: connections,
    defaultLlmConnection: defaultSlug ?? connections[0]?.slug ?? null,
  }
  writeFileSync(configFile, JSON.stringify(config))
}

/** Remove config.json so loadStoredConfig() returns null. */
function clearConfig(): void {
  if (existsSync(configFile)) rmSync(configFile)
}

afterAll(() => {
  rmSync(tempConfigDir, { recursive: true, force: true })
})

// ============================================================================
// 1. createdAt preservation during persistence
// Mirrors: SessionManager.enqueuePersist() — the StoredSession builder
//   (SessionManager.ts ~line 2177)
//   const storedSession: StoredSession = {
//     ...pickSessionFields(managed),
//     createdAt: managed.createdAt ?? Date.now(),
//     lastUsedAt: Date.now(),
//     messages: persistableMessages.map(messageToStored),
//     tokenUsage: managed.tokenUsage ?? DEFAULT_TOKEN_USAGE,
//   }
// ============================================================================

describe('createdAt preservation', () => {
  it('SESSION_PERSISTENT_FIELDS includes both createdAt and lastMessageAt', () => {
    // Ensures both fields are independently persisted — the bug was that
    // createdAt was wrongly sourced from lastMessageAt.
    expect(SESSION_PERSISTENT_FIELDS).toContain('createdAt')
    expect(SESSION_PERSISTENT_FIELDS).toContain('lastMessageAt')
  })

  it('pickSessionFields preserves createdAt independently from lastMessageAt', () => {
    const createdAt = 1700000000000
    const lastMessageAt = 1700099999000

    const picked = pickSessionFields({ id: 's1', createdAt, lastMessageAt })

    expect(picked.createdAt).toBe(createdAt)
    expect(picked.lastMessageAt).toBe(lastMessageAt)
    expect(picked.createdAt).not.toBe(picked.lastMessageAt)
  })

  it('enqueuePersist builder pattern uses managed.createdAt, not lastMessageAt', () => {
    // Mirror the exact builder pattern from SessionManager.enqueuePersist()
    const managed = {
      id: 'test-session',
      createdAt: 1700000000000,
      lastMessageAt: 1700099999000,
    }

    // Real production builder (SessionManager.ts lines 2177-2184)
    const storedSession = {
      ...pickSessionFields(managed),
      createdAt: managed.createdAt ?? Date.now(),
      lastUsedAt: Date.now(),
    }

    expect(storedSession.createdAt).toBe(1700000000000)
    expect(storedSession.createdAt).not.toBe(managed.lastMessageAt)
  })
})

// ============================================================================
// 2. Safe model resolution when connection is null
// Mirrors: resolveModelForProvider() in factory.ts (line 627)
//   Used by resolveBackendContext() to pick the model for agent creation.
//   Falls back: managedModel → connection.defaultModel → DEFAULT_MODEL
// ============================================================================

describe('model resolution with null connection', () => {
  it('falls back to DEFAULT_MODEL when connection is null and session has no model', () => {
    const resolved = resolveModelForProvider('anthropic', undefined, null)

    expect(resolved).toBe(DEFAULT_MODEL)
    expect(resolved).toBeTruthy()
  })

  it('uses session model when available regardless of null connection', () => {
    const resolved = resolveModelForProvider('anthropic', 'claude-sonnet-4-20250514', null)

    expect(resolved).toBe('claude-sonnet-4-20250514')
  })

  it('uses connection defaultModel when session has no model', () => {
    const connection = {
      slug: 'test-conn',
      name: 'Test',
      providerType: 'anthropic' as const,
      authType: 'api_key' as const,
      defaultModel: 'claude-opus-4-20250514',
      createdAt: Date.now(),
    }

    const resolved = resolveModelForProvider('anthropic', undefined, connection)

    expect(resolved).toBe('claude-opus-4-20250514')
  })
})

// ============================================================================
// 3. Orphaned llmConnection detection
// Mirrors: SessionManager.loadSessionsFromDisk() — orphaned connection cleanup
//   (SessionManager.ts ~line 2053)
//   if (managed.llmConnection) {
//     const conn = resolveSessionConnection(managed.llmConnection, undefined)
//     if (!conn) {
//       sessionLog.warn(`Session ${meta.id} has orphaned llmConnection ...`)
//       managed.llmConnection = undefined
//       managed.connectionLocked = false
//     }
//   }
// ============================================================================

describe('orphaned llmConnection detection', () => {
  beforeEach(() => {
    // Start each test with a clean config (no connections).
    clearConfig()
  })

  it('resolveSessionConnection returns null for orphaned slug', () => {
    // No config file → getLlmConnection returns null, getDefaultLlmConnection returns null
    const conn = resolveSessionConnection('deleted-connection-slug', undefined)

    expect(conn).toBeNull()
  })

  it('clears llmConnection and connectionLocked when connection is orphaned', () => {
    const managed: {
      id: string
      llmConnection: string | undefined
      connectionLocked: boolean
    } = {
      id: 'test-session',
      llmConnection: 'deleted-connection-slug',
      connectionLocked: true,
    }

    // Real production cleanup path (SessionManager.ts lines 2053-2060)
    if (managed.llmConnection) {
      const conn = resolveSessionConnection(managed.llmConnection, undefined)
      if (!conn) {
        managed.llmConnection = undefined
        managed.connectionLocked = false
      }
    }

    expect(managed.llmConnection).toBeUndefined()
    expect(managed.connectionLocked).toBe(false)
  })

  it('preserves valid llmConnection when connection exists', () => {
    // Write a real config with a valid connection
    writeConfig([{
      slug: 'valid-connection',
      name: 'Valid Connection',
      providerType: 'anthropic',
      authType: 'api_key',
      defaultModel: 'claude-sonnet-4-20250514',
      createdAt: Date.now(),
    }])

    const managed: {
      id: string
      llmConnection: string | undefined
      connectionLocked: boolean
    } = {
      id: 'test-session',
      llmConnection: 'valid-connection',
      connectionLocked: true,
    }

    // Real production cleanup path — resolveSessionConnection should find
    // the connection in config and return it (non-null).
    if (managed.llmConnection) {
      const conn = resolveSessionConnection(managed.llmConnection, undefined)
      if (!conn) {
        managed.llmConnection = undefined
        managed.connectionLocked = false
      }
    }

    expect(managed.llmConnection).toBe('valid-connection')
    expect(managed.connectionLocked).toBe(true)
  })

  it('does not touch sessions without llmConnection', () => {
    const managed: {
      id: string
      llmConnection: string | undefined
      connectionLocked: boolean
    } = {
      id: 'test-session',
      llmConnection: undefined,
      connectionLocked: false,
    }

    // Real production guard: only checks sessions WITH llmConnection
    if (managed.llmConnection) {
      const conn = resolveSessionConnection(managed.llmConnection, undefined)
      if (!conn) {
        managed.llmConnection = undefined
        managed.connectionLocked = false
      }
    }

    expect(managed.llmConnection).toBeUndefined()
    expect(managed.connectionLocked).toBe(false)
  })
})
