import {
  isAuthFailure,
  KEY_FILE_NOT_FOUND_CODE,
  KEY_FILE_UNREADABLE_CODE,
  PINNED_AGENT_FAILED_CODE,
  SSH_AGENT_UNAVAILABLE_CODE,
  SSH_CONFIG_AUTH_UNSUPPORTED_CODE,
} from '@craft-agent/remote-ssh'

export type ConnectFailureClass =
  | 'SSH_AUTH_FAILED'
  | 'SSH_KEY_FILE_NOT_FOUND'
  | 'SSH_AGENT_UNAVAILABLE'
  | 'SSH_CONFIG_AUTH_UNSUPPORTED'
  | 'SSH_CONNECT_FAILED'

export function classifyConnectFailure(err: unknown): { code: ConnectFailureClass; msg: string } {
  const msg = String((err as Error)?.message ?? err)
  const code = (err as { code?: unknown } | null)?.code
  if (code === SSH_CONFIG_AUTH_UNSUPPORTED_CODE) {
    return { code: 'SSH_CONFIG_AUTH_UNSUPPORTED', msg }
  }
  if (code === SSH_AGENT_UNAVAILABLE_CODE) {
    return { code: 'SSH_AGENT_UNAVAILABLE', msg }
  }
  if (
    code === KEY_FILE_NOT_FOUND_CODE
    || code === KEY_FILE_UNREADABLE_CODE
    || code === PINNED_AGENT_FAILED_CODE
  ) {
    return { code: 'SSH_KEY_FILE_NOT_FOUND', msg }
  }
  if (isAuthFailure(msg)) return { code: 'SSH_AUTH_FAILED', msg }
  return { code: 'SSH_CONNECT_FAILED', msg }
}
