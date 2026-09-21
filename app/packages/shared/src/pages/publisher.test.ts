import { afterEach, describe, expect, it } from 'bun:test';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { isPagesSharingEnabled } from '../feature-flags.ts';
import { PagePublisher, type PagePublishTokenStore } from './publisher.ts';
import { createPage, loadPageConfig, setPageShareState } from './storage.ts';

const roots: string[] = [];
const oldFlag = process.env.CRAFT_FEATURE_PAGES_SHARING;
afterEach(() => {
  if (oldFlag === undefined) delete process.env.CRAFT_FEATURE_PAGES_SHARING;
  else process.env.CRAFT_FEATURE_PAGES_SHARING = oldFlag;
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'fleet-publication-'));
  roots.push(root);
  const page = createPage(root, { name: 'Local page', content: '<p>Private content</p>' });
  let token: string | null = 'test-admin-token';
  const tokens: PagePublishTokenStore = {
    get: async () => token,
    set: async (_workspace, _page, next) => { token = next; },
    delete: async () => { token = null; return true; },
  };
  const calls: Array<{ method: string; body: unknown }> = [];
  const publisher = new PagePublisher({
    tokenStore: tokens,
    apiBaseUrl: 'https://cleanup.invalid/p/api',
    fetchFn: (async (_url: unknown, init?: RequestInit) => {
      calls.push({ method: init?.method ?? 'GET', body: init?.body });
      return new Response(null, { status: 204 });
    }) as typeof fetch,
  });
  return { root, page, publisher, tokens, calls };
}

describe('Fleet hosted-publication boundary', () => {
  it('cannot be enabled by inherited flags, and refuses uploads before reading data or using fetch', async () => {
    process.env.CRAFT_FEATURE_PAGES_SHARING = '1';
    expect(isPagesSharingEnabled()).toBe(false);
    const { publisher, calls } = fixture();
    await expect(publisher.publish('/missing', 'workspace', 'page', { includeData: true }))
      .rejects.toThrow('PAGE_SHARING_DISABLED');
    await expect(publisher.setPassword('/missing', 'workspace', 'page', 'password'))
      .rejects.toThrow('PAGE_SHARING_DISABLED');
    expect(calls).toEqual([]);
  });

  it('can explicitly remove an old publication without uploading any page bytes', async () => {
    const { root, page, publisher, tokens, calls } = fixture();
    setPageShareState(root, page.slug, {
      publicationId: 'old-publication', url: 'https://cleanup.invalid/old',
      publishedRevision: '1', publishedContentDigest: page.contentDigest!, includesData: false, publishedAt: 1, updatedAt: 1,
      passwordProtected: false,
    });
    await publisher.unpublish(root, 'workspace', page.slug);
    expect(calls).toEqual([{ method: 'DELETE', body: undefined }]);
    expect(loadPageConfig(root, page.slug)?.share).toBeUndefined();
    expect(await tokens.get('workspace', page.id)).toBeNull();
  });
});
