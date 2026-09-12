/**
 * Short-lived record of "which device token did I just mint for which invite".
 *
 * An invite is single-use, so the credential the joining device holds stops working
 * the instant it is redeemed. The device therefore has exactly one chance to learn
 * the grant it was given, and this ledger is that chance: the host keeps the minted
 * token in memory only, hands it over once to the connection that redeemed the
 * invite, and forgets it. Nothing is persisted — a device that misses the window
 * pairs again, which is cheap and safe.
 */

export interface MintLedgerEntry {
  deviceId: string;
  token: string;
  expiresAt: number;
}

/** Long enough for a handshake plus one RPC, short enough to be uninteresting to steal. */
export const MINT_CLAIM_TTL_MS = 60_000;

export class DeviceMintLedger {
  private readonly byEnrollment = new Map<string, MintLedgerEntry>();

  remember(enrollmentId: string, deviceId: string, token: string, now = Date.now()): void {
    this.prune(now);
    this.byEnrollment.set(enrollmentId, { deviceId, token, expiresAt: now + MINT_CLAIM_TTL_MS });
  }

  /** Hand the grant over exactly once. A second claim gets nothing. */
  claim(enrollmentId: string, now = Date.now()): MintLedgerEntry | null {
    this.prune(now);
    const entry = this.byEnrollment.get(enrollmentId);
    if (!entry) return null;
    this.byEnrollment.delete(enrollmentId);
    return entry;
  }

  private prune(now: number): void {
    for (const [key, entry] of this.byEnrollment) {
      if (entry.expiresAt <= now) this.byEnrollment.delete(key);
    }
  }

  get size(): number {
    return this.byEnrollment.size;
  }
}
