/**
 * E2E tests for OAuth metadata discovery against real MCP servers.
 *
 * These tests verify that OAuth metadata can be discovered from popular MCP servers.
 * They only check that metadata is discoverable - they don't perform full OAuth flows.
 *
 * **These hit the real network and are opt-in.** Until 2026-09-21 they ran in the default suite,
 * where `discovers OAuth metadata` timed out at bun's 5s default often enough to fail roughly half
 * of all runs — a non-deterministic suite, and a guaranteed failure on an offline machine. The
 * file's own `isReachable` guard never covered that test.
 *
 * Run them deliberately:
 *
 *     CRAFT_E2E_NETWORK=1 bun test packages/shared/src/auth/__tests__/oauth.e2e.test.ts
 */
import { describe, it, expect } from 'bun:test';

/** Opt-in switch. Absent means skip: a unit suite must not depend on a third party being up. */
const NETWORK_E2E = process.env.CRAFT_E2E_NETWORK === '1';
import { discoverOAuthMetadata, getMcpBaseUrl } from '../oauth';

// Helper to check if a URL is reachable
async function isReachable(url: string, timeoutMs = 5000): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response.status < 500;
  } catch {
    return false;
  }
}

// Helper to conditionally skip tests based on server reachability
function describeIfReachable(name: string, mcpUrl: string, fn: () => void) {
  describe(name, () => {
    // Check reachability once - if unreachable, all tests in this describe will run but assertions will be skipped
    let reachable = true;
    it('should be reachable', async () => {
      const origin = getMcpBaseUrl(mcpUrl);
      reachable = await isReachable(origin);
      if (!reachable) {
        console.log(`Skipping ${name}: server unreachable`);
      }
    });
    fn();
  });
}

describe.skipIf(!NETWORK_E2E)('E2E: OAuth Metadata Discovery', () => {
  describe('GitHub MCP (api.githubcopilot.com)', () => {
    const MCP_URL = 'https://api.githubcopilot.com/mcp/';

    it('extracts correct origin', () => {
      expect(getMcpBaseUrl(MCP_URL)).toBe('https://api.githubcopilot.com');
    });

    it('discovers OAuth metadata', async () => {
      const logs: string[] = [];
      const metadata = await discoverOAuthMetadata(MCP_URL, (msg) => logs.push(msg));

      // If we get null, the server might be down or require auth - that's OK for E2E
      if (metadata === null) {
        console.log('GitHub MCP: No metadata discovered (server may require auth or be unavailable)');
        console.log('Discovery logs:', logs);
        return;
      }

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

      if (metadata === null) {
        console.log('Linear MCP: No metadata discovered (server may require auth or be unavailable)');
        console.log('Discovery logs:', logs);
        return;
      }

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

      if (metadata === null) {
        console.log('Ahrefs MCP: No metadata discovered (server may require auth or be unavailable)');
        console.log('Discovery logs:', logs);
        return;
      }

      expect(metadata.authorization_endpoint).toBeTruthy();
      expect(metadata.token_endpoint).toBeTruthy();
      console.log('Ahrefs MCP OAuth metadata:', metadata);
    });
  });

  describe('Multiple path segments', () => {
    it('handles various MCP URL patterns correctly', () => {
      // These are hypothetical URLs to test the origin extraction
      expect(getMcpBaseUrl('https://api.example.com/v1/mcp')).toBe('https://api.example.com');
      expect(getMcpBaseUrl('https://api.example.com/v1/mcp/sse')).toBe('https://api.example.com');
      expect(getMcpBaseUrl('https://mcp.example.com/')).toBe('https://mcp.example.com');
      expect(getMcpBaseUrl('http://localhost:8080/mcp')).toBe('http://localhost:8080');
    });
  });
});
