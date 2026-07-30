import { describe, expect, it } from 'bun:test'
import { formatDebugRequest } from '../unified-network-interceptor.ts'

describe('interceptor debug logging', () => {
  it('omits request bodies unless sensitive-body logging is explicitly enabled', () => {
    const requestBody = JSON.stringify({
      messages: [{ role: 'user', content: 'private prompt text' }],
    })

    const output = formatDebugRequest('https://example.test/messages?access_token=query-secret', {
      method: 'POST',
      headers: {
        authorization: 'Bearer secret',
        'proxy-authorization': 'Basic proxy-secret',
        'x-auth-token': 'header-token',
      },
      body: requestBody,
    }, false)

    expect(output).not.toContain('private prompt text')
    expect(output).not.toContain('Bearer secret')
    expect(output).not.toContain('proxy-secret')
    expect(output).not.toContain('header-token')
    expect(output).not.toContain('query-secret')
    expect(output).toContain(`[REQUEST BODY OMITTED: ${requestBody.length} chars]`)
  })

  it('does not echo malformed URLs that cannot be safely redacted', () => {
    expect(formatDebugRequest('not a URL?token=query-secret')).not.toContain('query-secret')
  })
})
