/**
 * MCP stdio environment construction.
 *
 * Two independent filters share one merge path:
 * 1. Credential strip — do not inherit host secrets into the MCP child.
 * 2. Config hijack deny — do not let user-supplied `env` overwrite PATH /
 *    dynamic-linker / runtime-injection variables that would redirect
 *    executable or library lookup.
 *
 * Pattern evidence: goose `ExtensionConfig::Stdio` `Envs::DISALLOWED_KEYS`
 * (Apache-2.0, `e7c33077cd2b`, `crates/goose/src/agents/extension.rs`). Behavior
 * only — no goose source was copied. TEMP/HOME-style paths are intentionally
 * not blocked here; MCP servers may need them, and they are a weaker hijack
 * surface than PATH, LD_PRELOAD-family, or NODE_OPTIONS.
 */

/** Host secrets stripped from the inherited process environment. */
export const MCP_CREDENTIAL_BLOCKED_ENV_VARS = [
  // Craft Agent auth (set by the app itself)
  'ANTHROPIC_API_KEY',
  'CLAUDE_CODE_OAUTH_TOKEN',

  // AWS credentials
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'AWS_SESSION_TOKEN',

  // Common API keys/tokens
  'GITHUB_TOKEN',
  'GH_TOKEN',
  'OPENAI_API_KEY',
  'GOOGLE_API_KEY',
  'STRIPE_SECRET_KEY',
  'NPM_TOKEN',
] as const;

/**
 * Keys that user-supplied MCP `env` must not set or override.
 * The child still inherits these from the host process (e.g. PATH for `npx`).
 */
export const MCP_CONFIG_DISALLOWED_ENV_VARS = [
  // Binary path / Windows executable resolution
  'PATH',
  'PATHEXT',
  'SystemRoot',
  'windir',
  'ComSpec',

  // Dynamic linker hijacking (Linux)
  'LD_LIBRARY_PATH',
  'LD_PRELOAD',
  'LD_AUDIT',
  'LD_DEBUG',
  'LD_BIND_NOW',
  'LD_ASSUME_KERNEL',

  // Dynamic linker hijacking (macOS)
  'DYLD_LIBRARY_PATH',
  'DYLD_INSERT_LIBRARIES',
  'DYLD_FRAMEWORK_PATH',

  // Language runtime injection
  'PYTHONPATH',
  'PYTHONHOME',
  'NODE_OPTIONS',
  'RUBYOPT',
  'GEM_PATH',
  'GEM_HOME',
  'CLASSPATH',
  'GO111MODULE',
  'GOROOT',

  // Windows process / DLL injection
  'APPINIT_DLLS',
  'SESSIONNAME',
] as const;

const credentialBlockedLower = new Set(
  MCP_CREDENTIAL_BLOCKED_ENV_VARS.map((k) => k.toLowerCase()),
);
const configDisallowedLower = new Set(
  MCP_CONFIG_DISALLOWED_ENV_VARS.map((k) => k.toLowerCase()),
);

export function isMcpCredentialBlockedEnvVar(key: string): boolean {
  return credentialBlockedLower.has(key.toLowerCase());
}

export function isMcpConfigDisallowedEnvVar(key: string): boolean {
  return configDisallowedLower.has(key.toLowerCase());
}

/**
 * Build the env map for an MCP stdio subprocess.
 *
 * - Inherits process env minus credential secrets.
 * - Applies user config env on top, skipping hijack keys (case-insensitive).
 * - User config may intentionally set API keys the server needs.
 */
export function buildMcpStdioEnv(
  configEnv?: Record<string, string>,
  processEnv: NodeJS.ProcessEnv = process.env,
): Record<string, string> {
  const result: Record<string, string> = {};

  for (const [key, value] of Object.entries(processEnv)) {
    if (value !== undefined && !isMcpCredentialBlockedEnvVar(key)) {
      result[key] = value;
    }
  }

  if (configEnv) {
    for (const [key, value] of Object.entries(configEnv)) {
      if (isMcpConfigDisallowedEnvVar(key)) {
        continue;
      }
      result[key] = value;
    }
  }

  return result;
}
