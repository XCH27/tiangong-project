/**
 * Remote device authority — one record per device that may reach this machine.
 *
 * P7 requires a remote access grant to be **hashed at rest, revocable, and scoped
 * to explicit Workspace IDs, separate from the embedded server's internal token**.
 * That is what this file is: the public listener authenticates a device against
 * its own grant, never against the local renderer's bearer token.
 *
 * Why a device is its own object, and not `workspaces.filter(ws => ws.remoteServer)`:
 * one machine can hold several Workspaces, and a phone holds none. Projecting
 * devices out of the Workspace list makes one machine read as several devices and
 * leaves nothing to revoke. A Workspace points at a device; it is not the device.
 *
 * Pure logic: no filesystem, no crypto source of truth beyond the injected hasher,
 * so the whole lifecycle is testable and the same rules serve a future phone client.
 */

/** What a device is allowed to reach. An empty `workspaceIds` means "any Workspace on this machine". */
export interface RemoteDeviceScope {
  workspaceIds: string[];
}

export type RemoteDevicePlatform = 'macos' | 'windows' | 'linux' | 'ios' | 'android' | 'unknown';

export interface RemoteDevice {
  id: string;
  /** User-chosen label, shown in the device list. */
  name: string;
  platform: RemoteDevicePlatform;
  /** Hash of the device's bearer token. The token itself is never stored. */
  tokenHash: string;
  scope: RemoteDeviceScope;
  createdAt: string;
  /** Last successful authentication, for the online/offline dot. */
  lastSeenAt?: string;
  /** Set when revoked; a revoked device is kept so the list can explain itself. */
  revokedAt?: string;
}

/**
 * A one-time enrollment invite. It is what the user copies — never a long-lived
 * credential. Redeeming it mints the device's own token exactly once, so a leaked
 * old link is worthless (the same property OpenChamber's single-use QR has).
 */
export interface RemoteEnrollment {
  id: string;
  /** Hash of the invite secret. The secret lives only in the copied link. */
  secretHash: string;
  /** Name suggested when the invite was created. Usually empty: the joining device names itself. */
  deviceName: string;
  scope: RemoteDeviceScope;
  createdAt: string;
  expiresAt: string;
  /** Set the moment it is redeemed; a redeemed invite never works again. */
  redeemedAt?: string;
  /** The device it minted, for the audit trail. */
  redeemedDeviceId?: string;
}

export interface RemoteAccessStore {
  devices: RemoteDevice[];
  enrollments: RemoteEnrollment[];
}

export const EMPTY_REMOTE_ACCESS_STORE: RemoteAccessStore = { devices: [], enrollments: [] };

/** An unredeemed invite is worthless after this long. */
export const ENROLLMENT_TTL_MS = 15 * 60 * 1000;

export type Hasher = (secret: string) => string;

export interface IssueEnrollmentInput {
  /** Optional. The joining device supplies its own name when it redeems. */
  deviceName?: string;
  scope?: RemoteDeviceScope;
  /** Opaque secret that goes into the copied link; only its hash is kept. */
  secret: string;
  id: string;
  now: number;
  ttlMs?: number;
}

export function issueEnrollment(
  store: RemoteAccessStore,
  input: IssueEnrollmentInput,
  hash: Hasher,
): { store: RemoteAccessStore; enrollment: RemoteEnrollment } {
  const name = (input.deviceName ?? '').trim();
  if (!input.secret) throw new Error('REMOTE_ENROLLMENT_SECRET_REQUIRED');
  const createdAt = new Date(input.now).toISOString();
  const enrollment: RemoteEnrollment = {
    id: input.id,
    secretHash: hash(input.secret),
    deviceName: name,
    scope: input.scope ?? { workspaceIds: [] },
    createdAt,
    expiresAt: new Date(input.now + (input.ttlMs ?? ENROLLMENT_TTL_MS)).toISOString(),
  };
  return {
    store: { ...store, enrollments: [...pruneEnrollments(store.enrollments, input.now), enrollment] },
    enrollment,
  };
}

/** Drop invites that are redeemed or long expired so the store does not grow forever. */
export function pruneEnrollments(enrollments: RemoteEnrollment[], now: number): RemoteEnrollment[] {
  const cutoff = now - ENROLLMENT_TTL_MS;
  return enrollments.filter((entry) => {
    if (entry.redeemedAt) return Date.parse(entry.redeemedAt) > cutoff;
    return Date.parse(entry.expiresAt) > cutoff;
  });
}

export type RedeemFailure =
  | 'ENROLLMENT_NOT_FOUND'
  | 'ENROLLMENT_ALREADY_REDEEMED'
  | 'ENROLLMENT_EXPIRED';

export interface RedeemEnrollmentInput {
  enrollmentId: string;
  secret: string;
  deviceId: string;
  platform: RemoteDevicePlatform;
  /** What the joining device calls itself. Falls back to the invite's suggestion. */
  deviceName?: string;
  /** The device's own long-lived token; only its hash is kept. */
  deviceToken: string;
  now: number;
}

/**
 * Redeem an invite into a device grant. Every refusal names its reason so the
 * pairing surface can explain itself instead of timing out silently.
 */
export function redeemEnrollment(
  store: RemoteAccessStore,
  input: RedeemEnrollmentInput,
  hash: Hasher,
): { store: RemoteAccessStore; device: RemoteDevice } | { failure: RedeemFailure } {
  const enrollment = store.enrollments.find((entry) => entry.id === input.enrollmentId);
  if (!enrollment) return { failure: 'ENROLLMENT_NOT_FOUND' };
  if (enrollment.secretHash !== hash(input.secret)) return { failure: 'ENROLLMENT_NOT_FOUND' };
  if (enrollment.redeemedAt) return { failure: 'ENROLLMENT_ALREADY_REDEEMED' };
  if (Date.parse(enrollment.expiresAt) <= input.now) return { failure: 'ENROLLMENT_EXPIRED' };

  const createdAt = new Date(input.now).toISOString();
  const device: RemoteDevice = {
    id: input.deviceId,
    name: (input.deviceName ?? '').trim() || enrollment.deviceName || input.platform,
    platform: input.platform,
    tokenHash: hash(input.deviceToken),
    scope: enrollment.scope,
    createdAt,
    lastSeenAt: createdAt,
  };
  return {
    store: {
      devices: [...store.devices, device],
      enrollments: store.enrollments.map((entry) =>
        entry.id === enrollment.id
          ? { ...entry, redeemedAt: createdAt, redeemedDeviceId: device.id }
          : entry,
      ),
    },
    device,
  };
}

export interface AuthenticatedDevice {
  device: RemoteDevice;
  store: RemoteAccessStore;
}

/**
 * Authenticate a presented token against the device grants. Fails closed: an
 * unknown or revoked token is simply not a device.
 */
export function authenticateDevice(
  store: RemoteAccessStore,
  token: string,
  now: number,
  hash: Hasher,
): AuthenticatedDevice | null {
  if (!token) return null;
  const presented = hash(token);
  const device = store.devices.find((entry) => entry.tokenHash === presented && !entry.revokedAt);
  if (!device) return null;
  const lastSeenAt = new Date(now).toISOString();
  return {
    device: { ...device, lastSeenAt },
    store: {
      ...store,
      devices: store.devices.map((entry) => (entry.id === device.id ? { ...entry, lastSeenAt } : entry)),
    },
  };
}

/** Does this device's scope admit the Workspace it is asking for? */
export function deviceMayReachWorkspace(device: RemoteDevice, workspaceId: string | null): boolean {
  if (device.revokedAt) return false;
  if (device.scope.workspaceIds.length === 0) return true;
  if (!workspaceId) return false;
  return device.scope.workspaceIds.includes(workspaceId);
}

/** Revoking keeps the row so the list can say "revoked" rather than forgetting it existed. */
export function revokeDevice(
  store: RemoteAccessStore,
  deviceId: string,
  now: number,
): RemoteAccessStore {
  const revokedAt = new Date(now).toISOString();
  return {
    ...store,
    devices: store.devices.map((entry) =>
      entry.id === deviceId && !entry.revokedAt ? { ...entry, revokedAt } : entry,
    ),
  };
}

/** "Clear revoked" — the only place a device record actually disappears. */
export function forgetRevokedDevices(store: RemoteAccessStore): RemoteAccessStore {
  return { ...store, devices: store.devices.filter((entry) => !entry.revokedAt) };
}
