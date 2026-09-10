/**
 * Path write leases for concurrent delegated work (C4 / C11).
 *
 * At most one writer holds a path at a time. Reserved paths (shared contracts,
 * test harnesses) require an explicit integrator role. This is an in-process
 * authority helper — persistence of leases can ride SessionEvents later; the
 * lattice rules live here so TaskRunner and future adapters share one check.
 */

export type LeaseRole = 'reader' | 'writer' | 'integrator';

export interface PathLease {
  path: string;
  holderId: string;
  role: LeaseRole;
  acquiredAt: string;
  /** Attempt / run identity that owns the lease. */
  attemptKey: string;
}

export interface LeaseDenial {
  path: string;
  reason: 'writer-conflict' | 'reserved-requires-integrator' | 'already-held';
  existing?: PathLease;
  message: string;
}

/** Normalize for comparison: strip trailing slashes, collapse // */
export function normalizeLeasePath(p: string): string {
  const s = p.replace(/\\/g, '/').replace(/\/+/g, '/');
  if (s.length > 1 && s.endsWith('/')) return s.slice(0, -1);
  return s;
}

/** True when `child` is the same as or nested under `parent`. */
export function pathOverlaps(a: string, b: string): boolean {
  const x = normalizeLeasePath(a);
  const y = normalizeLeasePath(b);
  if (x === y) return true;
  const xp = x.endsWith('/') ? x : `${x}/`;
  const yp = y.endsWith('/') ? y : `${y}/`;
  return xp.startsWith(yp) || yp.startsWith(xp);
}

export class PathLeaseManager {
  private readonly leases = new Map<string, PathLease>();
  private readonly reserved: Set<string>;

  constructor(opts?: { reservedPaths?: readonly string[] }) {
    this.reserved = new Set((opts?.reservedPaths ?? []).map(normalizeLeasePath));
  }

  list(): readonly PathLease[] {
    return [...this.leases.values()];
  }

  isReserved(path: string): boolean {
    const n = normalizeLeasePath(path);
    for (const r of this.reserved) {
      if (pathOverlaps(n, r)) return true;
    }
    return false;
  }

  /**
   * Acquire a write (or integrator) lease. Readers do not take exclusive leases
   * in v1 — they only check that no conflicting exclusive write exists when
   * required by the caller.
   */
  tryAcquire(input: {
    path: string;
    holderId: string;
    role: LeaseRole;
    attemptKey: string;
    now?: string;
  }): { ok: true; lease: PathLease } | { ok: false; denial: LeaseDenial } {
    const path = normalizeLeasePath(input.path);
    if (this.isReserved(path) && input.role !== 'integrator') {
      return {
        ok: false,
        denial: {
          path,
          reason: 'reserved-requires-integrator',
          message: `Path "${path}" is reserved; only an integrator may write it`,
        },
      };
    }

    if (input.role === 'reader') {
      // Readers do not register exclusive leases.
      return {
        ok: true,
        lease: {
          path,
          holderId: input.holderId,
          role: 'reader',
          acquiredAt: input.now ?? new Date().toISOString(),
          attemptKey: input.attemptKey,
        },
      };
    }

    for (const existing of this.leases.values()) {
      if (existing.holderId === input.holderId && existing.attemptKey === input.attemptKey) {
        if (pathOverlaps(existing.path, path)) {
          return { ok: true, lease: existing };
        }
      }
      if (
        (existing.role === 'writer' || existing.role === 'integrator') &&
        pathOverlaps(existing.path, path)
      ) {
        if (existing.holderId === input.holderId && existing.attemptKey === input.attemptKey) {
          return { ok: true, lease: existing };
        }
        return {
          ok: false,
          denial: {
            path,
            reason: 'writer-conflict',
            existing,
            message:
              `Path "${path}" overlaps active ${existing.role} lease held by ` +
              `${existing.holderId} (${existing.attemptKey})`,
          },
        };
      }
    }

    const lease: PathLease = {
      path,
      holderId: input.holderId,
      role: input.role,
      acquiredAt: input.now ?? new Date().toISOString(),
      attemptKey: input.attemptKey,
    };
    this.leases.set(`${input.attemptKey}::${path}`, lease);
    return { ok: true, lease };
  }

  release(attemptKey: string, path?: string): void {
    if (path) {
      this.leases.delete(`${attemptKey}::${normalizeLeasePath(path)}`);
      return;
    }
    for (const key of [...this.leases.keys()]) {
      if (key.startsWith(`${attemptKey}::`)) this.leases.delete(key);
    }
  }

  releaseAllForHolder(holderId: string): void {
    for (const [key, lease] of [...this.leases.entries()]) {
      if (lease.holderId === holderId) this.leases.delete(key);
    }
  }
}
