import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test';

import { decodeOAuthRelayState, isOAuthRelayState } from '../../auth/oauth-relay.ts';
import { SourceCredentialManager } from '../credential-manager.ts';
import type { LoadedSource, FolderSourceConfig } from '../types.ts';

function createApiSource(overrides: Partial<FolderSourceConfig> = {}): LoadedSource {
  return {
    config: {
      id: 'test-id',
      slug: 'gmail-test',
      name: 'Gmail Test',
      type: 'api',
      provider: 'google',
      enabled: true,
      api: {
        baseUrl: 'https://gmail.googleapis.com/',
        authType: 'bearer',
        googleService: 'gmail',
        googleOAuthClientId: 'test-client-id',
        googleOAuthClientSecret: 'test-client-secret',
      },
      ...overrides,
    } as FolderSourceConfig,
    guide: null,
    folderPath: '/tmp/test/sources/gmail-test',
    workspaceRootPath: '/tmp/test',
    workspaceId: 'test-workspace',
  };
}

function createMcpSource(overrides: Partial<FolderSourceConfig> = {}): LoadedSource {
  return {
    config: {
      id: 'test-mcp-id',
      slug: 'mcp-test',
      name: 'MCP Test',
      type: 'mcp',
      enabled: true,
      mcp: {
        transport: 'http',
        url: 'https://example.com/mcp',
      },
      ...overrides,
    } as FolderSourceConfig,
    guide: null,
    folderPath: '/tmp/test/sources/mcp-test',
    workspaceRootPath: '/tmp/test',
    workspaceId: 'test-workspace',
  };
}

describe('SourceCredentialManager.prepareOAuth relay wrapping', () => {
  const credManager = new SourceCredentialManager();
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    // bun test shares one process across files — a leaked fetch mock breaks
    // later real-HTTP tests (webui http-server).
    globalThis.fetch = originalFetch;
  });

  beforeEach(() => {
    globalThis.fetch = mock((input: string | URL | Request) => {
      const url = typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;
      if (url === 'https://example.com/.well-known/oauth-authorization-server') {
        return Promise.resolve(Response.json({
          authorization_endpoint: 'https://example.com/oauth/authorize',
          token_endpoint: 'https://example.com/oauth/token',
        }));
      }
      return Promise.resolve(new Response('Not Found', { status: 404 }));
    }) as unknown as typeof fetch;
  });

  it('uses the deployment callback directly for WebUI Google flows when no relay is configured', async () => {
    const result = await credManager.prepareOAuth(createApiSource(), {
      callbackUrl: 'https://ghalmos.craftdocs-cf-t1.com/api/oauth/callback',
    });

    expect(result.redirectUri).toBe('https://ghalmos.craftdocs-cf-t1.com/api/oauth/callback');
    expect(result.state).toBeTruthy();

    const authUrl = new URL(result.authUrl);
    expect(authUrl.searchParams.get('redirect_uri')).toBe('https://ghalmos.craftdocs-cf-t1.com/api/oauth/callback');

    // No relay: the provider-facing state is the inner state, not a ca1. envelope.
    const outerState = authUrl.searchParams.get('state');
    expect(outerState).toBe(result.state);
    expect(isOAuthRelayState(outerState!)).toBe(false);
  });

  it('wraps through a user-operated relay when FLEET_OAUTH_RELAY_URL is set', async () => {
    process.env.FLEET_OAUTH_RELAY_URL = 'https://relay.example.test/auth/callback';
    try {
      const result = await credManager.prepareOAuth(createApiSource(), {
        callbackUrl: 'https://ghalmos.craftdocs-cf-t1.com/api/oauth/callback',
      });

      expect(result.redirectUri).toBe('https://relay.example.test/auth/callback');

      const authUrl = new URL(result.authUrl);
      expect(authUrl.searchParams.get('redirect_uri')).toBe('https://relay.example.test/auth/callback');

      const outerState = authUrl.searchParams.get('state');
      expect(outerState).toBeTruthy();
      expect(isOAuthRelayState(outerState!)).toBe(true);
      expect(decodeOAuthRelayState(outerState!)).toEqual({
        returnTo: 'https://ghalmos.craftdocs-cf-t1.com/api/oauth/callback',
        innerState: result.state,
      });
    } finally {
      delete process.env.FLEET_OAUTH_RELAY_URL;
    }
  });

  it('uses a localhost callbackUrl directly (desktop-style URL, no relay configured)', async () => {
    const result = await credManager.prepareOAuth(createApiSource(), {
      callbackUrl: 'http://localhost:6477/callback',
    });

    expect(result.redirectUri).toBe('http://localhost:6477/callback');
    expect(result.state).toBeTruthy();

    const authUrl = new URL(result.authUrl);
    expect(authUrl.searchParams.get('redirect_uri')).toBe('http://localhost:6477/callback');

    const outerState = authUrl.searchParams.get('state');
    expect(outerState).toBe(result.state);
    expect(isOAuthRelayState(outerState!)).toBe(false);
  });

  it('passes the deployment callback into MCP prepare-time metadata flow when no relay is configured', async () => {
    const result = await credManager.prepareOAuth(createMcpSource(), {
      callbackUrl: 'https://ghalmos.craftdocs-cf-t1.com/api/oauth/callback',
    });

    expect(result.redirectUri).toBe('https://ghalmos.craftdocs-cf-t1.com/api/oauth/callback');

    const authUrl = new URL(result.authUrl);
    expect(authUrl.origin + authUrl.pathname).toBe('https://example.com/oauth/authorize');
    expect(authUrl.searchParams.get('redirect_uri')).toBe('https://ghalmos.craftdocs-cf-t1.com/api/oauth/callback');

    const outerState = authUrl.searchParams.get('state');
    expect(outerState).toBe(result.state);
    expect(isOAuthRelayState(outerState!)).toBe(false);
  });
});
