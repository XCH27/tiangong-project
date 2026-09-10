/**
 * E2E tests for OAuth metadata discovery against real MCP servers.
 *
 * These tests verify that OAuth metadata can be discovered from popular MCP servers.
 * They only check that metadata is discoverable - they don't perform full OAuth flows.
 *
 * Network tests are opt-in because provider availability is outside the unit-test
 * contract. Run with CRAFT_RUN_NETWORK_E2E=1 to execute them; once enabled, a
 * discovery failure is a real failure rather than a silent pass.
 */
import { describe, it, expect } from 'bun:test';
import { discoverOAuthMetadata, getMcpBaseUrl } from '../oauth';

describe('OAuth MCP origin extraction', () => {
  it('handles provider and multi-segment MCP URL patterns', () => {
    expect(getMcpBaseUrl('https://api.githubcopilot.com/mcp/')).toBe('https://api.githubcopilot.com');
    expect(getMcpBaseUrl('https://mcp.linear.app/sse')).toBe('https://mcp.linear.app');
    expect(getMcpBaseUrl('https://api.ahrefs.com/mcp/mcp')).toBe('https://api.ahrefs.com');
    expect(getMcpBaseUrl('https://api.example.com/v1/mcp')).toBe('https://api.example.com');
    expect(getMcpBaseUrl('https://api.example.com/v1/mcp/sse')).toBe('https://api.example.com');
    expect(getMcpBaseUrl('https://mcp.example.com/')).toBe('https://mcp.example.com');
    expect(getMcpBaseUrl('http://localhost:8080/mcp')).toBe('http://localhost:8080');
  });
});

describe.skipIf(process.env.CRAFT_RUN_NETWORK_E2E !== '1')('Network E2E: OAuth Metadata Discovery', () => {
  describe('GitHub MCP (api.githubcopilot.com)', () => {
    const MCP_URL = 'https://api.githubcopilot.com/mcp/';

    it('extracts correct origin', () => {
      expect(getMcpBaseUrl(MCP_URL)).toBe('https://api.githubcopilot.com');
    });

    it('discovers OAuth metadata', async () => {
      const logs: string[] = [];
      const metadata = await discoverOAuthMetadata(MCP_URL, (msg) => logs.push(msg));

      expect(metadata, `Discovery logs: ${logs.join('\n')}`).not.toBeNull();
      if (metadata === null) return;

      expect(metadata.authorization_endpoint).toBeTruthy();
      expect(metadata.token_endpoint).toBeTruthy();
      console.log('GitHub MCP OAuth metadata:', metadata);
    });
  });

  describe('Linear MCP (mcp.linear.app)', () => {
    const MCP_URL = 'https://mcp.linear.app/sse';

    it('extracts correct origin', () => {
      expect(getMcpBaseUrl(MCP_URL)).toBe('https://mcp.linear.app');
    });

    it('discovers OAuth metadata', async () => {
      const logs: string[] = [];
      const metadata = await discoverOAuthMetadata(MCP_URL, (msg) => logs.push(msg));

      expect(metadata, `Discovery logs: ${logs.join('\n')}`).not.toBeNull();
      if (metadata === null) return;

      expect(metadata.authorization_endpoint).toBeTruthy();
      expect(metadata.token_endpoint).toBeTruthy();
      console.log('Linear MCP OAuth metadata:', metadata);
    });
  });

  describe('Ahrefs MCP (api.ahrefs.com/mcp/mcp)', () => {
    const MCP_URL = 'https://api.ahrefs.com/mcp/mcp';

    it('extracts correct origin (the bug we are fixing)', () => {
      // This was the original bug - the old regex would return https://api.ahrefs.com/mcp
      expect(getMcpBaseUrl(MCP_URL)).toBe('https://api.ahrefs.com');
    });

    it('discovers OAuth metadata', async () => {
      const logs: string[] = [];
      const metadata = await discoverOAuthMetadata(MCP_URL, (msg) => logs.push(msg));

      expect(metadata, `Discovery logs: ${logs.join('\n')}`).not.toBeNull();
      if (metadata === null) return;

      expect(metadata.authorization_endpoint).toBeTruthy();
      expect(metadata.token_endpoint).toBeTruthy();
      console.log('Ahrefs MCP OAuth metadata:', metadata);
    });
  });
});
