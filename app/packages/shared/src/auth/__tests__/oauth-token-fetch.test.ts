import { afterEach, describe, expect, it } from 'bun:test'
import { exchangeClaudeCode, prepareClaudeOAuth, clearOAuthState } from '../claude-oauth.ts'
import { refreshClaudeToken } from '../claude-token.ts'
import {
  exchangeChatGptTokens,
  refreshChatGptTokens,
  exchangeIdTokenForApiKey,
} from '../chatgpt-oauth.ts'
import { setOAuthTokenFetcher } from '../oauth-token-fetch.ts'

afterEach(() => {
  setOAuthTokenFetcher(null)
  clearOAuthState()
})

describe('subscription OAuth token transport', () => {
  it('uses the installed host fetcher for Claude/ChatGPT exchange and refresh', async () => {
    const requestedUrls: string[] = []
    setOAuthTokenFetcher(async (url, init) => {
      requestedUrls.push(url)
      expect(init.method).toBe('POST')
      return new Response(JSON.stringify({
        access_token: 'test-access',
        id_token: 'test-id',
        refresh_token: 'test-refresh',
        expires_in: 3600,
      }), { status: 200, headers: { 'Content-Type': 'application/json' } })
    })

    prepareClaudeOAuth()
    expect((await exchangeClaudeCode('test-code')).accessToken).toBe('test-access')
    expect((await refreshClaudeToken('test-refresh')).accessToken).toBe('test-access')
    expect((await exchangeChatGptTokens('test-code', 'test-verifier')).accessToken).toBe('test-access')
    expect((await refreshChatGptTokens('test-refresh')).accessToken).toBe('test-access')
    expect(await exchangeIdTokenForApiKey('test-id')).toBe('test-access')

    expect(requestedUrls).toEqual([
      'https://platform.claude.com/v1/oauth/token',
      'https://platform.claude.com/v1/oauth/token',
      'https://auth.openai.com/oauth/token',
      'https://auth.openai.com/oauth/token',
      'https://auth.openai.com/oauth/token',
    ])
  })
})
