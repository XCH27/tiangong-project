import { describe, expect, test } from 'bun:test';
import {
  buildMcpStdioEnv,
  isMcpConfigDisallowedEnvVar,
  isMcpCredentialBlockedEnvVar,
  MCP_CONFIG_DISALLOWED_ENV_VARS,
  MCP_CREDENTIAL_BLOCKED_ENV_VARS,
} from '../env.ts';

describe('buildMcpStdioEnv', () => {
  test('strips host credential secrets from the inherited process env', () => {
    const env = buildMcpStdioEnv(undefined, {
      PATH: '/usr/bin',
      ANTHROPIC_API_KEY: 'secret-key',
      OPENAI_API_KEY: 'openai-secret',
      SAFE_HOST: 'keep-me',
    });

    expect(env.PATH).toBe('/usr/bin');
    expect(env.SAFE_HOST).toBe('keep-me');
    expect(env.ANTHROPIC_API_KEY).toBeUndefined();
    expect(env.OPENAI_API_KEY).toBeUndefined();
  });

  test('drops user config hijack keys but keeps intentional API keys', () => {
    const env = buildMcpStdioEnv(
      {
        PATH: '/evil/bin',
        LD_PRELOAD: '/tmp/injected.so',
        DYLD_INSERT_LIBRARIES: '/tmp/injected.dylib',
        NODE_OPTIONS: '--require /tmp/evil.js',
        MY_MCP_TOKEN: 'server-needs-this',
        SAFE_FLAG: '1',
      },
      {
        PATH: '/usr/bin',
        HOME: '/home/user',
      },
    );

    // Host PATH remains; config cannot replace it or inject loaders.
    expect(env.PATH).toBe('/usr/bin');
    expect(env.LD_PRELOAD).toBeUndefined();
    expect(env.DYLD_INSERT_LIBRARIES).toBeUndefined();
    expect(env.NODE_OPTIONS).toBeUndefined();
    expect(env.MY_MCP_TOKEN).toBe('server-needs-this');
    expect(env.SAFE_FLAG).toBe('1');
    expect(env.HOME).toBe('/home/user');
  });

  test('matches disallowed config keys case-insensitively', () => {
    const env = buildMcpStdioEnv(
      {
        path: '/evil',
        Ld_Preload: '/tmp/x.so',
        node_options: '--require /tmp/x.js',
        ok: 'yes',
      },
      { PATH: '/usr/bin' },
    );

    expect(env.PATH).toBe('/usr/bin');
    expect(env.path).toBeUndefined();
    expect(env.Ld_Preload).toBeUndefined();
    expect(env.node_options).toBeUndefined();
    expect(env.ok).toBe('yes');
  });

  test('allows user config to supply credentials the MCP server needs', () => {
    const env = buildMcpStdioEnv(
      { GITHUB_TOKEN: 'user-provided-for-mcp' },
      { GITHUB_TOKEN: 'host-secret', PATH: '/bin' },
    );

    // Host secret stripped, then user config re-supplies intentionally.
    expect(env.GITHUB_TOKEN).toBe('user-provided-for-mcp');
    expect(env.PATH).toBe('/bin');
  });
});

describe('MCP env block lists', () => {
  test('credential and config lists cover the expected high-risk names', () => {
    expect(MCP_CREDENTIAL_BLOCKED_ENV_VARS).toContain('ANTHROPIC_API_KEY');
    expect(MCP_CREDENTIAL_BLOCKED_ENV_VARS).toContain('AWS_SECRET_ACCESS_KEY');
    expect(MCP_CONFIG_DISALLOWED_ENV_VARS).toContain('PATH');
    expect(MCP_CONFIG_DISALLOWED_ENV_VARS).toContain('LD_PRELOAD');
    expect(MCP_CONFIG_DISALLOWED_ENV_VARS).toContain('DYLD_INSERT_LIBRARIES');
    expect(MCP_CONFIG_DISALLOWED_ENV_VARS).toContain('NODE_OPTIONS');
  });

  test('helpers are case-insensitive', () => {
    expect(isMcpCredentialBlockedEnvVar('anthropic_api_key')).toBe(true);
    expect(isMcpConfigDisallowedEnvVar('ld_preload')).toBe(true);
    expect(isMcpConfigDisallowedEnvVar('SAFE_VAR')).toBe(false);
  });
});
