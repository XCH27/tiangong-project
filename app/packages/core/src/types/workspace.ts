/**
 * Workspace and authentication types
 */

/**
 * How MCP server should be authenticated (workspace-level)
 * Note: Different from SourceMcpAuthType which uses 'oauth' | 'bearer' | 'none' for individual sources
 */
export type McpAuthType = 'workspace_oauth' | 'workspace_bearer' | 'public';

/**
 * Configuration for a user-owned remote Fleet instance.
 * When set on a workspace, handler calls are proxied over WebSocket.
 */
export interface RemoteServerConfig {
  url: string;              // last endpoint that worked; tried first next time
  token: string;            // this device's grant on that host (legacy: a shared token)
  remoteWorkspaceId: string; // ID of the workspace on the remote server
  /**
   * Stable id of the machine this Workspace lives on. Every Workspace paired to the
   * same computer carries the same value, which is what lets the UI show one device
   * instead of one device per Workspace. Absent on records paired before devices
   * existed — those fall back to grouping by the endpoint host.
   */
  deviceId?: string;
  /** What the user calls that machine. */
  deviceName?: string;
  /**
   * Every address the host advertised, in try order (P9-rev). `url` is whichever one
   * last worked; keeping the whole list is what makes a move between networks
   * recoverable without re-pairing.
   */
  endpoints?: string[];
}

/**
 * Client-facing workspace DTO — safe to send over RPC to remote clients.
 * Does not expose server-internal filesystem paths.
 */
export interface WorkspaceInfo {
  id: string;
  name: string;
  slug: string;              // Server-computed from rootPath basename
  lastAccessedAt?: number;
  iconUrl?: string;
  mcpUrl?: string;
  mcpAuthType?: McpAuthType;
  remoteServer?: RemoteServerConfig;
}

/**
 * Full workspace with server-internal details.
 * Used by server code and local Electron renderer (LOCAL_ONLY channels).
 */
export interface Workspace extends WorkspaceInfo {
  rootPath: string;        // Absolute path to local workspace folder (metadata, config). Auto-created for remote workspaces.
  createdAt: number;
}

/**
 * Authentication type for AI provider
 * - api_key: Anthropic API key
 * - oauth_token: Claude Max OAuth (Anthropic)
 * - codex_oauth: ChatGPT Plus OAuth via Codex app-server
 * - codex_api_key: OpenAI API key via Codex (OpenRouter, Vercel AI Gateway compatible)
 */
export type AuthType = 'api_key' | 'oauth_token' | 'codex_oauth' | 'codex_api_key';

/**
 * OAuth credentials from a fresh authentication flow.
 * Used for temporary state in UI components before saving to credential store.
 */
export interface OAuthCredentials {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
  clientId: string;
  tokenType: string;
}

// Config stored in JSON file (credentials stored in encrypted file, not here)
export interface StoredConfig {
  authType?: AuthType;
  workspaces: Workspace[];
  activeWorkspaceId: string | null;
  activeSessionId: string | null;  // Currently active session (primary scope)
  model?: string;
}

