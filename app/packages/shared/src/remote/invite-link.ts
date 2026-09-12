/**
 * The access link, v3: it carries a **one-time invite**, not a credential.
 *
 * v1/v2 packed the server's own bearer token into the link, so the link was the
 * credential: anyone who saw it held permanent access, and there was nothing to
 * revoke per device. v3 packs `{ enrollmentId, secret }` instead — redeemed once,
 * on redemption the host mints that device its own revocable token.
 *
 * `endpoints` stays: P9-rev packs every usable address and the client tries them
 * in order. Parsing v1/v2 is retained so an existing link still explains itself
 * rather than failing as malformed.
 */

export const INVITE_LINK_VERSION = 3;

export interface InviteOffer {
  version: 3;
  enrollmentId: string;
  secret: string;
  endpoints: string[];
}

/** A pre-v3 link: the token *is* the credential, so it cannot be revoked per device. */
export interface LegacyTokenOffer {
  version: 1 | 2;
  token: string;
  endpoints: string[];
}

export type ParsedOffer = InviteOffer | LegacyTokenOffer;

export function isInviteOffer(offer: ParsedOffer): offer is InviteOffer {
  return offer.version === 3;
}

export function normalizeEndpoints(urls: readonly string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const url of urls) {
    const normalized = url.trim().replace(/\/+$/, '');
    if (!/^wss?:\/\//i.test(normalized)) continue;
    const key = normalized.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(normalized);
  }
  return out;
}

function toBase64Url(json: string): string {
  return Buffer.from(json, 'utf8').toString('base64url');
}

function fromBase64Url(code: string): string {
  return Buffer.from(code, 'base64url').toString('utf8');
}

export function encodeInviteLink(offer: Omit<InviteOffer, 'version'>): string {
  const endpoints = normalizeEndpoints(offer.endpoints);
  if (endpoints.length === 0) throw new Error('REMOTE_NO_REACHABLE_ADDRESS');
  const payload = JSON.stringify({
    v: INVITE_LINK_VERSION,
    e: offer.enrollmentId,
    s: offer.secret,
    endpoints,
  });
  return `fleet://pair?code=${toBase64Url(payload)}`;
}

function offerFromPayload(value: unknown): ParsedOffer | null {
  if (!value || typeof value !== 'object') return null;
  const record = value as Record<string, unknown>;
  const endpoints = normalizeEndpoints([
    ...(Array.isArray(record.endpoints) ? record.endpoints.filter((x): x is string => typeof x === 'string') : []),
    ...(typeof record.url === 'string' ? [record.url] : []),
  ]);
  if (endpoints.length === 0) return null;

  if (record.v === INVITE_LINK_VERSION) {
    const enrollmentId = typeof record.e === 'string' ? record.e : '';
    const secret = typeof record.s === 'string' ? record.s : '';
    if (!enrollmentId || !secret) return null;
    return { version: 3, enrollmentId, secret, endpoints };
  }

  const token = typeof record.token === 'string' ? record.token : '';
  if (!token) return null;
  return { version: record.v === 2 ? 2 : 1, token, endpoints };
}

export function parseAccessLink(raw: string): ParsedOffer | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  try {
    const url = new URL(trimmed);
    if (url.protocol === 'fleet:' && url.hostname === 'pair') {
      const code = url.searchParams.get('code') || (url.hash ? url.hash.slice(1) : '');
      if (code) return offerFromPayload(JSON.parse(fromBase64Url(code)));
    }
  } catch {
    // not a URL — fall through to the bare-code and legacy text forms
  }

  const compact = trimmed.replace(/\s+/g, '');
  const hashForm = /^(?:fleet1:)?(wss?:\/\/[^#\s]+)#(.+)$/i.exec(compact);
  if (hashForm) {
    return { version: 1, token: hashForm[2]!, endpoints: normalizeEndpoints([hashForm[1]!]) };
  }

  try {
    return offerFromPayload(JSON.parse(fromBase64Url(compact)));
  } catch {
    return null;
  }
}
