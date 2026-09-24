import { afterEach, describe, expect, it } from 'bun:test'
import type { CredentialManager } from '../../credentials/manager.ts'
import { _resetRefreshMutex, getValidClaudeOAuthToken } from '../state.ts'

type OAuthCredential = { accessToken: string; refreshToken?: string; expiresAt?: number }

function createManager(initial: Record<string, OAuthCredential>) {
  const credentials = new Map(Object.entries(initial))
  const deleted: string[] = []
  const manager = {
    getLlmOAuth: async (slug: string) => credentials.get(slug) ?? null,
    setLlmOAuth: async (slug: string, credential: OAuthCredential) => {
      credentials.set(slug, credential)
    },
    delete: async ({ type, connectionSlug }: { type: string; connectionSlug: string }) => {
      expect(type).toBe('llm_oauth')
      deleted.push(connectionSlug)
      return credentials.delete(connectionSlug)
    },
    getClaudeOAuthCredentials: async () => {
      throw new Error('legacy global Claude credential must not be read')
    },
    setClaudeOAuthCredentials: async () => {
      throw new Error('legacy global Claude credential must not be written')
    },
  } as unknown as CredentialManager
  return { manager, credentials, deleted }
}

afterEach(_resetRefreshMutex)

describe('connection-scoped Claude OAuth', () => {
  it('uses each connection token even when another Claude account exists', async () => {
    const { manager } = createManager({
      first: { accessToken: 'first-token' },
      second: { accessToken: 'second-token' },
    })
    expect((await getValidClaudeOAuthToken('first', manager)).accessToken).toBe('first-token')
    expect((await getValidClaudeOAuthToken('second', manager)).accessToken).toBe('second-token')
    expect((await getValidClaudeOAuthToken('missing', manager)).accessToken).toBeNull()
  })

  it('coalesces refreshes for one connection while keeping two accounts independent', async () => {
    const expired = Date.now() - 1000
    const { manager, credentials } = createManager({
      first: { accessToken: 'old-first', refreshToken: 'refresh-first', expiresAt: expired },
      second: { accessToken: 'old-second', refreshToken: 'refresh-second', expiresAt: expired },
    })
    const calls: string[] = []
    const refresh = async (token: string) => {
      calls.push(token)
      await Promise.resolve()
      return {
        accessToken: `new-${token}`,
        refreshToken: `next-${token}`,
        expiresAt: Date.now() + 3600_000,
      }
    }
    const results = await Promise.all([
      getValidClaudeOAuthToken('first', manager, refresh),
      getValidClaudeOAuthToken('first', manager, refresh),
      getValidClaudeOAuthToken('second', manager, refresh),
    ])
    expect(results.map((result) => result.accessToken)).toEqual([
      'new-refresh-first', 'new-refresh-first', 'new-refresh-second',
    ])
    expect(calls.sort()).toEqual(['refresh-first', 'refresh-second'])
    expect(credentials.get('first')?.refreshToken).toBe('next-refresh-first')
    expect(credentials.get('second')?.refreshToken).toBe('next-refresh-second')
  })

  it('revokes only the rejected connection and preserves the other account', async () => {
    const expired = Date.now() - 1000
    const { manager, credentials, deleted } = createManager({
      first: { accessToken: 'old-first', refreshToken: 'bad', expiresAt: expired },
      second: { accessToken: 'second-token' },
    })
    const refresh = async (): Promise<never> => { throw new Error('invalid_grant') }
    expect((await getValidClaudeOAuthToken('first', manager, refresh)).accessToken).toBeNull()
    expect(deleted).toEqual(['first'])
    expect(credentials.get('second')?.accessToken).toBe('second-token')
  })

  it('does not overwrite a new sign-in when the old refresh finishes later', async () => {
    const { manager, credentials } = createManager({
      first: { accessToken: 'old', refreshToken: 'old-refresh', expiresAt: Date.now() - 1000 },
    })
    let finishRefresh!: (value: OAuthCredential) => void
    const refresh = () => new Promise<OAuthCredential>((resolve) => { finishRefresh = resolve })
    const pending = getValidClaudeOAuthToken('first', manager, refresh)
    await Promise.resolve()
    credentials.set('first', {
      accessToken: 'new-sign-in', refreshToken: 'new-refresh', expiresAt: Date.now() + 3600_000,
    })
    finishRefresh({
      accessToken: 'late-old-refresh', refreshToken: 'rotated-old', expiresAt: Date.now() + 3600_000,
    })
    expect((await pending).accessToken).toBe('new-sign-in')
    expect(credentials.get('first')?.accessToken).toBe('new-sign-in')
  })
})
