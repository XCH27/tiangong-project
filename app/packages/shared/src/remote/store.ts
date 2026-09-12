/**
 * Persistence for the remote device authority.
 *
 * Kept in its own file under CONFIG_DIR rather than inside `config.json`'s
 * `serverConfig`: a device grant is not server configuration, and mixing them is
 * how the shared-token design happened in the first place. One authority, one file.
 */

import { createHash, randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { CONFIG_DIR } from '../config/paths.ts';
import {
  EMPTY_REMOTE_ACCESS_STORE,
  pruneEnrollments,
  type RemoteAccessStore,
} from './devices.ts';

export const REMOTE_ACCESS_FILE = join(CONFIG_DIR, 'remote-access.json');
export const HOST_IDENTITY_FILE = join(CONFIG_DIR, 'host-identity.json');

/** The one hasher the device authority is given. Tokens are never stored in clear. */
export function hashRemoteSecret(secret: string): string {
  return createHash('sha256').update(secret).digest('hex');
}

/** 256 bits of opaque secret — what the user copies, and what a device keeps. */
export function newRemoteSecret(): string {
  return `${randomUUID()}${randomUUID()}`.replace(/-/g, '');
}

export function newRemoteId(): string {
  return randomUUID();
}

function isStore(value: unknown): value is RemoteAccessStore {
  if (!value || typeof value !== 'object') return false;
  const v = value as Partial<RemoteAccessStore>;
  return Array.isArray(v.devices) && Array.isArray(v.enrollments);
}

/**
 * Read the store. A missing or unreadable file yields an empty store rather than
 * throwing: failing closed here means "no device is authorised", which is the safe
 * direction — it never means "let anyone in".
 */
export function loadRemoteAccessStore(path = REMOTE_ACCESS_FILE): RemoteAccessStore {
  try {
    if (!existsSync(path)) return { ...EMPTY_REMOTE_ACCESS_STORE };
    const parsed: unknown = JSON.parse(readFileSync(path, 'utf8'));
    if (!isStore(parsed)) return { ...EMPTY_REMOTE_ACCESS_STORE };
    return parsed;
  } catch {
    return { ...EMPTY_REMOTE_ACCESS_STORE };
  }
}

export function saveRemoteAccessStore(store: RemoteAccessStore, path = REMOTE_ACCESS_FILE): void {
  const dir = dirname(path);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  const pruned: RemoteAccessStore = {
    devices: store.devices,
    enrollments: pruneEnrollments(store.enrollments, Date.now()),
  };
  writeFileSync(path, `${JSON.stringify(pruned, null, 2)}\n`, { mode: 0o600 });
}

/** Read, transform, write. The store is small and single-writer (the main process). */
export function updateRemoteAccessStore(
  mutate: (store: RemoteAccessStore) => RemoteAccessStore,
  path = REMOTE_ACCESS_FILE,
): RemoteAccessStore {
  const next = mutate(loadRemoteAccessStore(path));
  saveRemoteAccessStore(next, path);
  return next;
}

/**
 * This machine's stable id, minted once and kept.
 *
 * Without it a client has nothing to group by: two Workspaces paired to the same
 * computer arrive as two unrelated `{url, token}` records and read as two devices.
 * The id is not a secret — it is an identity — so it lives in its own small file
 * rather than inside the grant store.
 */
export function getHostId(path = HOST_IDENTITY_FILE): string {
  try {
    if (existsSync(path)) {
      const parsed: unknown = JSON.parse(readFileSync(path, 'utf8'));
      const id = (parsed as { hostId?: unknown } | null)?.hostId;
      if (typeof id === 'string' && id.length > 0) return id;
    }
  } catch {
    // fall through and mint a new one; a lost id costs a re-pair, not data
  }
  const hostId = randomUUID();
  const dir = dirname(path);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(path, `${JSON.stringify({ hostId }, null, 2)}\n`);
  return hostId;
}
