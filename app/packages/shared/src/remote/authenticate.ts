/**
 * What the public listener does with the credential a connecting client presents.
 *
 * Three credentials are accepted, and only three:
 *  - a **device token** — the per-device grant minted at pairing time;
 *  - a **one-time invite** — `fleet-invite:<enrollmentId>:<secret>`, presented by a
 *    device that has not paired yet. Redeeming it mints that device its own token,
 *    exactly once, which is why an access link can be shared without handing over
 *    permanent access;
 *  - the **configured server token** — Craft's own model, and the only thing a
 *    `craft-cli --token`, a thin client started with `CRAFT_SERVER_TOKEN`, or a
 *    pre-device `ws://host:port#token` link has. Dropping it does not harden
 *    anything a user chose; it silently removes clients that already worked, so it
 *    stays admitted and is simply reported as not being a device: there is nothing
 *    per-device to revoke, and the surface says so.
 *
 * Everything else fails closed, by name.
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
  /** A paired device, or one that just redeemed its invite. */
  | { ok: true; kind: 'device'; device: RemoteDevice; store: RemoteAccessStore; mintedToken?: string }
  /** The configured server token: admitted, but not a device and not revocable. */
  | { ok: true; kind: 'server-token' }
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
  /**
   * The server token this machine is configured with, when it has one. A client
   * holding it is a legitimate Craft client (CLI, thin client, a pre-device link);
   * it is simply not a device. Omit to admit device credentials only.
   */
  serverToken?: string;
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
    return { ok: true, kind: 'device', device: result.device, store: result.store, mintedToken };
  }

  const authenticated = authenticateDevice(store, presented, now, deps.hash);
  if (authenticated) {
    return { ok: true, kind: 'device', device: authenticated.device, store: authenticated.store };
  }

  // Craft's own credential. Checked last so a device grant always wins, and compared
  // in constant time so a wrong guess leaks nothing about the real token's prefix.
  if (deps.serverToken && constantTimeEquals(presented, deps.serverToken)) {
    return { ok: true, kind: 'server-token' };
  }

  return { ok: false, reason: 'UNKNOWN_DEVICE' };
}

/** Length-independent comparison: never returns early on the first differing byte. */
function constantTimeEquals(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
