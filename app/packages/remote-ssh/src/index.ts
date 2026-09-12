/**
 * @craft-agent/remote-ssh — Cindy's SSH remote host management, admitted into Fleet.
 *
 * Phase A: connection lifecycle + OpenSSH discovery/managed writes + credential resolution.
 * Managed hosts live in ~/.ssh/fleet.conf (not Cindy's cindy.conf).
 */

export { RemoteHost, isAuthFailure, authFailureHint, DEFAULT_REMOTE_FORWARD_PORT_BASE } from './RemoteHost.ts'
export type {
  RemoteHostDeps,
  StatusListener,
  ExecOpts,
  ExecResult,
  ExecStreamOpts,
  ExecStreamHandle,
  RemoteForward,
  RemoteForwardSpec,
} from './RemoteHost.ts'

export { ConnectionPool } from './ConnectionPool.ts'
export type { ConnectionPoolDeps } from './ConnectionPool.ts'

export {
  FileHostKeyStore,
  hostKeyFingerprint,
  hostKeyId,
  decideHostKey,
} from './hostKeys.ts'
export type { HostKeyStore, HostKeyDecision } from './hostKeys.ts'

export {
  addManagedHost,
  addManagedHostWithInclude,
  defaultManagedSshConfigPath,
  defaultSshConfigPath,
  ensureManagedConfigInclude,
  readSshConfig,
  readSshConfigDetailed,
  removeManagedHost,
  updateManagedHostFields,
  upsertHost,
  updateHostFields,
  removeHost,
  expandHome,
  MANAGED_CONFIG_MARKER,
  MANAGED_CONFIG_CONCURRENT_MODIFICATION_CODE,
  MANAGED_CONFIG_OWNERSHIP_REQUIRED_CODE,
  MANAGED_CONFIG_WRITE_TOKEN_REQUIRED_CODE,
} from './sshConfig.ts'
export type {
  ManagedHostAddReceipt,
  ManagedConfigWriteToken,
  ReadSshConfigOptions,
  ReadSshConfigResult,
  SshConfigDiagnostic,
} from './sshConfig.ts'

export {
  resolveAuth,
  KEY_FILE_NOT_FOUND_CODE,
  KEY_FILE_UNREADABLE_CODE,
  PINNED_AGENT_FAILED_CODE,
  SSH_CONFIG_AUTH_UNSUPPORTED_CODE,
} from './credentials.ts'
export type { ResolvedAuth } from './credentials.ts'

export {
  CINDY_DEFAULT_IDENTITY_NAMES,
  defaultAgentEndpoint,
  effectiveAuthenticationFingerprint,
  previewAgentEndpoint,
  resolveAgentEndpoint,
  resolveIdentityFingerprints,
  SSH_AGENT_UNAVAILABLE_CODE,
} from './sshAuthentication.ts'

export { redactSshSensitiveText } from './sshRedaction.ts'

export type {
  AddHostInput,
  AuthMethod,
  HostConfig,
  HostSnapshot,
  HostSource,
  RemoteStatus,
  SshAuthenticationMetadata,
} from './types.ts'
