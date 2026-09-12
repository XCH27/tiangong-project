/**
 * What the public listener does with the credential a connecting client presents.
 *
 * Two credentials are accepted, and only two:
 *  - a **device token** — the per-device grant minted at pairing time;
 *  - a **one-time invite** — `fleet-invite:<enrollmentId>:<secret>`, presented by a
 *    device that has not paired yet. Redeeming it mints that device its own token,
 *    exactly once. This is the only way a new device gets in, and it is why the
 *    access link can be shared without handing over permanent access.
 *
 * Everything else fails closed, by name. Nothing here knows about the local
 * renderer's bearer token: a remote client can never authenticate with it.
 */

import {
  authenticateDevice,
  redeemEnrollment,
  type Hasher,
  type RemoteAccessStore,
  type RemoteDevice,
  type RemoteDevicePlatform,
} from './devices.ts';

export const INVITE_CREDENTIAL_PREFIX = 'fleet-invite:';

export interface InviteCredential {
  enrollmentId: string;
  secret: string;
}

/** The shape a pairing client sends as its token. Keeps the transport unchanged. */
export function formatInviteCredential(credential: InviteCredential): string {
  return `${INVITE_CREDENTIAL_PREFIX}${credential.enrollmentId}:${credential.secret}`;
}

export function parseInviteCredential(presented: string): InviteCredential | null {
  if (!presented.startsWith(INVITE_CREDENTIAL_PREFIX)) return null;
  const rest = presented.slice(INVITE_CREDENTIAL_PREFIX.length);
  const split = rest.indexOf(':');
  if (split <= 0) return null;
  const enrollmentId = rest.slice(0, split);
  const secret = rest.slice(split + 1);
  if (!enrollmentId || !secret) return null;
  return { enrollmentId, secret };
}

export type RemoteAuthOutcome =
  | { ok: true; device: RemoteDevice; store: RemoteAccessStore; mintedToken?: string }
  | { ok: false; reason: 'NO_CREDENTIAL' | 'UNKNOWN_DEVICE' | 'ENROLLMENT_NOT_FOUND' | 'ENROLLMENT_ALREADY_REDEEMED' | 'ENROLLMENT_EXPIRED' };

export interface RemoteAuthDeps {
  hash: Hasher;
  /** Id for a device minted by redeeming an invite. */
  newDeviceId: () => string;
  /** The token that device will present from now on. Returned once, then never again. */
  newDeviceToken: () => string;
  /** Platform the connecting client declared; unknown is fine and recorded as such. */
  platform?: RemoteDevicePlatform;
  now?: number;
}

export function authenticateRemoteCredential(
  store: RemoteAccessStore,
  presented: string,
  deps: RemoteAuthDeps,
): RemoteAuthOutcome {
  const now = deps.now ?? Date.now();
  if (!presented) return { ok: false, reason: 'NO_CREDENTIAL' };

  const invite = parseInviteCredential(presented);
  if (invite) {
    const mintedToken = deps.newDeviceToken();
    const result = redeemEnrollment(store, {
      enrollmentId: invite.enrollmentId,
      secret: invite.secret,
      deviceId: deps.newDeviceId(),
      platform: deps.platform ?? 'unknown',
      deviceToken: mintedToken,
      now,
    }, deps.hash);
    if ('failure' in result) return { ok: false, reason: result.failure };
    return { ok: true, device: result.device, store: result.store, mintedToken };
  }

  const authenticated = authenticateDevice(store, presented, now, deps.hash);
  if (!authenticated) return { ok: false, reason: 'UNKNOWN_DEVICE' };
  return { ok: true, device: authenticated.device, store: authenticated.store };
}
