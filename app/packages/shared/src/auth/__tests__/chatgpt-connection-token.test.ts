import { describe, expect, it } from 'bun:test'
import type { CredentialManager } from '../../credentials/manager.ts'
import type { ChatGptTokens } from '../chatgpt-oauth.ts'
import { getValidChatGptOAuthToken, refreshChatGptOAuthToken } from '../state.ts'

type OAuthCredential = {
  accessToken: string
  idToken?: string
  refreshToken?: string
  expiresAt?: number
}

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
  } as unknown as CredentialManager
  return { manager, credentials, deleted }
}

describe('connection-scoped ChatGPT OAuth', () => {
  it('refreshes the selected account and keeps its ID token for catalog discovery', async () => {
    const { manager, credentials } = createManager({
      chatgpt: {
        accessToken: 'expired-access', idToken: 'old-id', refreshToken: 'refresh-token',
        expiresAt: Date.now() - 1000,
      },
    })
    const result = await getValidChatGptOAuthToken('chatgpt', manager, async (token) => ({
      accessToken: `new-${token}`,
      idToken: 'new-id',
      refreshToken: 'next-refresh',
      expiresAt: Date.now() + 3600_000,
    }))
    expect(result).toMatchObject({ accessToken: 'new-refresh-token', idToken: 'new-id', refreshToken: 'next-refresh' })
    expect(credentials.get('chatgpt')).toMatchObject({ accessToken: 'new-refresh-token', idToken: 'new-id' })
  })

  it('does not overwrite a newer sign-in when an old refresh finishes later', async () => {
    const { manager, credentials } = createManager({
      'chatgpt-race': {
        accessToken: 'old-access', idToken: 'old-id', refreshToken: 'old-refresh',
        expiresAt: Date.now() - 1000,
      },
    })
    let finishRefresh!: (value: ChatGptTokens) => void
    const pending = getValidChatGptOAuthToken('chatgpt-race', manager, async () => {
      return new Promise<ChatGptTokens>((resolve) => { finishRefresh = resolve })
    })
    await Promise.resolve()
    await Promise.resolve()
    credentials.set('chatgpt-race', {
      accessToken: 'new-sign-in', idToken: 'new-id', refreshToken: 'new-refresh',
      expiresAt: Date.now() + 3600_000,
    })
    finishRefresh({ accessToken: 'late-access', idToken: 'late-id', refreshToken: 'late-refresh', expiresAt: Date.now() + 3600_000 })
    expect((await pending).accessToken).toBe('new-sign-in')
    expect(credentials.get('chatgpt-race')?.accessToken).toBe('new-sign-in')
  })

  it('keeps an expired credential after a temporary network failure', async () => {
    const { manager, credentials, deleted } = createManager({
      offline: { accessToken: 'old-access', refreshToken: 'old-refresh', expiresAt: Date.now() - 1000 },
    })
    const result = await getValidChatGptOAuthToken('offline', manager, async () => {
      throw new Error('network timeout')
    })
    expect(result.accessToken).toBeNull()
    expect(credentials.get('offline')?.refreshToken).toBe('old-refresh')
    expect(deleted).toEqual([])
  })

  it('clears only the revoked OAuth connection after an explicit invalid grant', async () => {
    const { manager, credentials, deleted } = createManager({
      revoked: { accessToken: 'expired', refreshToken: 'revoked-refresh', expiresAt: Date.now() - 1000 },
      other: { accessToken: 'other', refreshToken: 'other-refresh', expiresAt: Date.now() + 3600_000 },
    })
    const result = await getValidChatGptOAuthToken('revoked', manager, async () => {
      throw new Error('Token refresh failed (HTTP 400): invalid_grant')
    })
    expect(result.accessToken).toBeNull()
    expect(deleted).toEqual(['revoked'])
    expect(credentials.has('revoked')).toBe(false)
    expect(credentials.get('other')?.accessToken).toBe('other')
  })

  it('coalesces account discovery and forced runtime refresh', async () => {
    const { manager, credentials } = createManager({
      shared: { accessToken: 'expired', idToken: 'old-id', refreshToken: 'shared-refresh', expiresAt: Date.now() - 1000 },
    })
    let finishRefresh!: (value: ChatGptTokens) => void
    let calls = 0
    const refresh = async () => {
      calls++
      return new Promise<ChatGptTokens>((resolve) => { finishRefresh = resolve })
    }
    const discovery = getValidChatGptOAuthToken('shared', manager, refresh)
    await Promise.resolve()
    await Promise.resolve()
    const runtime = refreshChatGptOAuthToken('shared', manager, refresh)
    await Promise.resolve()
    finishRefresh({ accessToken: 'fresh', idToken: '', refreshToken: 'rotated', expiresAt: Date.now() + 3600_000 })
    expect((await discovery).idToken).toBe('old-id')
    expect((await runtime).accessToken).toBe('fresh')
    expect(credentials.get('shared')?.idToken).toBe('old-id')
    expect(calls).toBe(1)
  })

  it('refreshes a token with unknown expiry instead of treating it as permanently valid', async () => {
    const { manager } = createManager({
      unknown: { accessToken: 'possibly-expired', refreshToken: 'refresh-me' },
    })
    const result = await getValidChatGptOAuthToken('unknown', manager, async () => ({
      accessToken: 'fresh', idToken: 'identity', refreshToken: 'next', expiresAt: Date.now() + 3600_000,
    }))
    expect(result.accessToken).toBe('fresh')
  })

  it('does not restore a connection deleted while its refresh was in flight', async () => {
    const { manager, credentials } = createManager({
      removed: { accessToken: 'old', refreshToken: 'old-refresh', expiresAt: Date.now() - 1000 },
    })
    let finishRefresh!: (value: ChatGptTokens) => void
    const pending = getValidChatGptOAuthToken('removed', manager, async () =>
      new Promise<ChatGptTokens>((resolve) => { finishRefresh = resolve }))
    await Promise.resolve()
    await Promise.resolve()
    credentials.delete('removed')
    finishRefresh({ accessToken: 'late', idToken: 'late-id', refreshToken: 'late-refresh' })
    expect((await pending).accessToken).toBeNull()
    expect(credentials.has('removed')).toBe(false)
  })
})
