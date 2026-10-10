import { describe, expect, test } from 'bun:test'
import { parseGitHubCliStatus } from './github-cli-status'

describe('GitHub CLI status projection', () => {
  test('preserves multiple public account identities without exposing credentials', () => {
    const status = parseGitHubCliStatus(JSON.stringify({ hosts: { 'github.com': [
      { state: 'success', active: true, login: 'alice', tokenSource: 'gh-cli', token: 'secret' },
      { state: 'success', active: false, login: 'bob', tokenSource: 'gh-cli', token: 'secret-2' },
      { state: 'failed', active: false, login: 'expired' },
    ] } }))
    expect(status).toEqual({ state: 'connected', accounts: [
      { host: 'github.com', login: 'alice', active: true },
      { host: 'github.com', login: 'bob', active: false },
    ] })
    expect(JSON.stringify(status)).not.toContain('secret')
  })

  test('reports an empty credential set as disconnected', () => {
    expect(parseGitHubCliStatus('{"hosts":{}}')).toEqual({ state: 'disconnected', accounts: [] })
  })
})
