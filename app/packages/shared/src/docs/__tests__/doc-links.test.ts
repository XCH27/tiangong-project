import { afterEach, describe, expect, it } from 'bun:test'
import { getDocsMcpUrl } from '../doc-links.ts'

const originalDocsMcpUrl = process.env.FLEET_DOCS_MCP_URL

afterEach(() => {
  if (originalDocsMcpUrl === undefined) delete process.env.FLEET_DOCS_MCP_URL
  else process.env.FLEET_DOCS_MCP_URL = originalDocsMcpUrl
})

describe('getDocsMcpUrl', () => {
  it('does not connect to an upstream docs MCP server by default', () => {
    delete process.env.FLEET_DOCS_MCP_URL
    expect(getDocsMcpUrl()).toBeNull()
  })

  it('uses only an explicitly configured docs MCP server', () => {
    process.env.FLEET_DOCS_MCP_URL = 'https://docs.example.test/mcp'
    expect(getDocsMcpUrl()).toBe('https://docs.example.test/mcp')
  })
})
