/**
 * What the addresses this machine can publish actually reach.
 *
 * P9-rev packs every usable address into the access link and lets the client try them
 * in order. That is a **discovery** mechanism, not a reachability one: it can only
 * publish addresses that already work. `os.networkInterfaces()` returns this machine's
 * own interfaces, so behind NAT there is no public address to publish at all — and the
 * failure shows up as the joining device timing out on every candidate, one after
 * another, with nothing to act on.
 *
 * So classify the addresses *before* the link is copied, and say what the link can
 * actually do. This adds no connectivity; it stops the surface implying some.
 */

export type AddressClass =
  /** 10/8, 172.16/12, 192.168/16, fc00::/7 — same LAN only. */
  | 'private'
  /** 100.64/10 (CGNAT, where Tailscale and similar live) — both ends on that overlay. */
  | 'overlay'
  /** 169.254/16, fe80:: — link-local, almost never useful to another device. */
  | 'link-local'
  /** Globally routable: a VPS, or a machine with a real public address. */
  | 'public'
  /** Loopback; never publishable. */
  | 'loopback';

export function classifyAddress(address: string): AddressClass {
  const v4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(address.trim());
  if (v4) {
    const a = Number(v4[1]);
    const b = Number(v4[2]);
    if (a === 127) return 'loopback';
    if (a === 169 && b === 254) return 'link-local';
    if (a === 100 && b >= 64 && b <= 127) return 'overlay';
    if (a === 10) return 'private';
    if (a === 192 && b === 168) return 'private';
    if (a === 172 && b >= 16 && b <= 31) return 'private';
    return 'public';
  }
  const host = address.trim().toLowerCase();
  if (host === '::1') return 'loopback';
  if (host.startsWith('fe80:')) return 'link-local';
  if (host.startsWith('fc') || host.startsWith('fd')) return 'private';
  if (host.includes(':')) return 'public';
  // A hostname the user configured — assume it resolves to something routable.
  return host ? 'public' : 'loopback';
}

export type ReachabilityVerdict =
  /** Nothing publishable; the link would be unusable. */
  | 'none'
  /** Same network only. */
  | 'lan-only'
  /** Same network, or both ends on the same overlay network. */
  | 'lan-or-overlay'
  /** Reachable from other networks. */
  | 'anywhere';

export interface Reachability {
  verdict: ReachabilityVerdict;
  classes: AddressClass[];
}

/**
 * The honest verdict for a set of addresses. `public` wins, then `overlay`, then
 * `private`; link-local and loopback never count as reach.
 */
export function assessReachability(addresses: readonly string[]): Reachability {
  const classes = [...new Set(addresses.map(classifyAddress))];
  const usable = classes.filter((entry) => entry !== 'loopback' && entry !== 'link-local');
  if (usable.includes('public')) return { verdict: 'anywhere', classes };
  if (usable.includes('overlay')) return { verdict: 'lan-or-overlay', classes };
  if (usable.includes('private')) return { verdict: 'lan-only', classes };
  return { verdict: 'none', classes };
}

/** Host part of a `ws://host:port` endpoint, without the port. */
export function endpointAddress(url: string): string {
  try {
    return new URL(url).hostname.replace(/^\[|\]$/g, '');
  } catch {
    return '';
  }
}

/** The verdict for a list of endpoints, as published in an access link. */
export function assessEndpoints(endpoints: readonly string[]): Reachability {
  return assessReachability(endpoints.map(endpointAddress).filter((address) => address !== ''));
}
