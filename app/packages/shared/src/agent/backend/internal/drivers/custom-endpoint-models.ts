import type { CustomEndpointApi } from '../../../../config/llm-connections.ts';
import { fetchOAuthToken } from '../../../../auth/oauth-token-fetch.ts';

const MAX_CATALOG_BYTES = 2 * 1024 * 1024;
const MAX_MODELS = 500;
const MAX_PAGES = 10;

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown> : null;
}

function modelIds(payload: unknown): string[] {
  const body = record(payload);
  const rows = Array.isArray(body?.data) ? body.data : body?.models;
  if (!Array.isArray(rows)) throw new Error('The endpoint returned an invalid model list');
  return rows.flatMap(value => {
    const row = record(value);
    const raw = row?.id ?? row?.slug ?? row?.name;
    if (typeof raw !== 'string') return [];
    const id = raw.replace(/^models\//, '').trim();
    return id && id.length <= 512 ? [id] : [];
  });
}

function modelListUrls(baseUrl: string): URL[] {
  const base = new URL(baseUrl);
  if (!['https:', 'http:'].includes(base.protocol) || !base.hostname || base.username || base.password || base.search || base.hash) {
    throw new Error('Enter an HTTP(S) API base URL without credentials or query parameters');
  }
  const path = base.pathname.replace(/\/+$/, '');
  const primary = new URL(base);
  primary.pathname = `${path}/models`;
  const candidates = [primary];
  if (!/\/v\d+(?:beta\d*)?$/i.test(path)) {
    const fallback = new URL(base);
    fallback.pathname = `${path}/v1/models`;
    candidates.push(fallback);
  }
  return candidates;
}

async function readModelList(response: Response): Promise<unknown> {
  const length = Number(response.headers.get('content-length'));
  if (length > MAX_CATALOG_BYTES) throw new Error('The model list exceeds the size limit');
  const reader = response.body?.getReader();
  if (!reader) throw new Error('The endpoint returned an empty model list');
  const decoder = new TextDecoder();
  let bytes = 0;
  let json = '';
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > MAX_CATALOG_BYTES) {
        await reader.cancel();
        throw new Error('The model list exceeds the size limit');
      }
      json += decoder.decode(value, { stream: true });
    }
    json += decoder.decode();
  } finally {
    reader.releaseLock();
  }
  try { return JSON.parse(json) as unknown; }
  catch { throw new Error('The endpoint returned invalid model JSON'); }
}

/**
 * Read IDs from the exact user-configured origin. An ID is only a candidate;
 * /models does not establish chat capability, context, effort or entitlement.
 * Unsupported model-list routes leave the connection's manual IDs intact.
 */
export async function fetchCustomEndpointModelIds(
  baseUrl: string,
  apiKey: string,
  api: CustomEndpointApi,
  timeoutMs = 15_000,
): Promise<string[]> {
  const headers: Record<string, string> = !apiKey ? {}
    : api === 'anthropic-messages'
      ? { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' }
      : api === 'google-generative-ai'
        ? { 'x-goog-api-key': apiKey }
        : { Authorization: `Bearer ${apiKey}` };
  const ids = new Set<string>();
  let lastError = 'Model listing is unavailable at this endpoint';
  for (const candidate of modelListUrls(baseUrl)) {
    let cursor = '';
    const seenCursors = new Set<string>();
    for (let page = 0; page < MAX_PAGES; page++) {
      const url = new URL(candidate);
      if (cursor) url.searchParams.set(api === 'google-generative-ai' ? 'pageToken' : 'after_id', cursor);
      const response = await fetchOAuthToken(url.toString(), {
        method: 'GET', headers, redirect: 'error', signal: AbortSignal.timeout(timeoutMs),
      });
      if (response.status === 404 || response.status === 405) {
        lastError = `Model listing returned HTTP ${response.status}`;
        break;
      }
      if (!response.ok) throw new Error(`Model listing returned HTTP ${response.status}`);
      const payload = await readModelList(response);
      for (const id of modelIds(payload)) {
        ids.add(id);
        if (ids.size > MAX_MODELS) throw new Error('The model list exceeds the model count limit');
      }
      const body = record(payload);
      const next = api === 'google-generative-ai'
        ? body?.nextPageToken
        : body?.has_more === true ? body?.last_id : undefined;
      if (typeof next !== 'string' || !next || seenCursors.has(next)) {
        if (!ids.size) throw new Error('The endpoint returned no model IDs');
        return [...ids];
      }
      seenCursors.add(next);
      cursor = next;
      if (page === MAX_PAGES - 1) throw new Error('The model list exceeds the page limit');
    }
  }
  if (ids.size) return [...ids];
  throw new Error(lastError);
}
