/**
 * Cleanup of historical Page publications. Fleet never uploads Pages.
 * Publish/password methods remain explicit refusals for older RPC callers.
 * Only an owner-requested unpublish/delete may contact the legacy service.
 */

import type { PageConfig, PageShareInfo } from '@craft-agent/core';
import { deletePage, loadPageConfig, setPageShareState } from './storage.ts';
import { PageShareError } from './share-bundle.ts';

/** Legacy cleanup endpoint, never used for uploading content. */
export const DEFAULT_PAGES_SHARE_API_BASE_URL = 'https://thecraftagents.com/p/api';

/**
 * Resolve the publication API base URL. `CRAFT_PAGES_SHARE_API_URL` overrides
 * for local Worker development (e.g. http://localhost:8787/p/api).
 */
export function resolvePagesShareApiBaseUrl(): string {
  const override =
    typeof process !== 'undefined' ? process.env?.CRAFT_PAGES_SHARE_API_URL : undefined;
  const base = override?.trim() || DEFAULT_PAGES_SHARE_API_BASE_URL;
  return base.replace(/\/+$/, '');
}

/** Minimal vault seam so tests can run without the real CredentialManager */
export interface PagePublishTokenStore {
  get(workspaceId: string, pageId: string): Promise<string | null>;
  set(workspaceId: string, pageId: string, token: string): Promise<void>;
  delete(workspaceId: string, pageId: string): Promise<boolean>;
}

/**
 * Production token store backed by the encrypted credential vault
 * (`page_publish_token::{workspaceId}::{pageId}`).
 */
export function createCredentialPagePublishTokenStore(): PagePublishTokenStore {
  const credentialId = (workspaceId: string, pageId: string) =>
    ({ type: 'page_publish_token', workspaceId, name: pageId }) as const;
  return {
    async get(workspaceId, pageId) {
      const { getCredentialManager } = await import('../credentials/index.ts');
      const stored = await getCredentialManager().get(credentialId(workspaceId, pageId));
      return stored?.value ?? null;
    },
    async set(workspaceId, pageId, token) {
      const { getCredentialManager } = await import('../credentials/index.ts');
      await getCredentialManager().set(credentialId(workspaceId, pageId), { value: token });
    },
    async delete(workspaceId, pageId) {
      const { getCredentialManager } = await import('../credentials/index.ts');
      return getCredentialManager().delete(credentialId(workspaceId, pageId));
    },
  };
}

export interface PagePublisherOptions {
  tokenStore: PagePublishTokenStore;
  /** Injectable for tests (defaults to global fetch) */
  fetchFn?: typeof fetch;
  /** Publication API base, e.g. https://thecraftagents.com/p/api */
  apiBaseUrl?: string;
  log?: (message: string) => void;
}

export interface PublishPageOptions {
  /** Publish the current data snapshot alongside the HTML (default false) */
  includeData: boolean;
  /** Optional viewer password, applied at create time only */
  password?: string;
  /** Required when the page has approved source-action grants */
  viewOnlyAcknowledged?: boolean;
}

export interface UnpublishResult {
  config: PageConfig;
  /**
   * Set when local state was cleared without remote confirmation (vault token
   * missing) — the public copy may still exist until it is garbage-collected.
   */
  warning?: 'remote-copy-may-remain';
}

const ERROR_BODY_MAX_CHARS = 300;

export class PagePublisher {
  private readonly tokenStore: PagePublishTokenStore;
  private readonly fetchFn: typeof fetch;
  private readonly apiBaseUrl: string;
  private readonly log: (message: string) => void;

  constructor(options: PagePublisherOptions) {
    this.tokenStore = options.tokenStore;
    this.fetchFn = options.fetchFn ?? fetch;
    this.apiBaseUrl = (options.apiBaseUrl ?? resolvePagesShareApiBaseUrl()).replace(/\/+$/, '');
    this.log = options.log ?? (() => {});
  }

  async publish(
    _workspaceRootPath: string,
    _workspaceId: string,
    _pageSlug: string,
    _options: PublishPageOptions,
  ): Promise<PageConfig> {
    throw new PageShareError('PAGE_SHARING_DISABLED', 'Fleet does not support hosted Page publication. Local Pages are unchanged.');
  }

  async setPassword(
    _workspaceRootPath: string,
    _workspaceId: string,
    _pageSlug: string,
    _password: string | null,
  ): Promise<PageConfig> {
    throw new PageShareError('PAGE_SHARING_DISABLED', 'Fleet does not update hosted Pages. You can still unpublish an existing copy.');
  }

  /**
   * Unpublish a page. Clears local state after remote 2xx or an idempotent
   * 404. When the vault token is missing, local state is still cleared but
   * the result carries a warning that the remote copy may remain.
   */
  async unpublish(
    workspaceRootPath: string,
    workspaceId: string,
    pageSlug: string,
  ): Promise<UnpublishResult> {
    const config = this.requirePage(workspaceRootPath, pageSlug);
    const share = this.requireShare(config);

    const token = await this.tokenStore.get(workspaceId, config.id);
    if (!token) {
      // Nothing we can do remotely without the capability; free the local page.
      const updated = setPageShareState(workspaceRootPath, pageSlug, undefined);
      this.log(`Unpublished ${pageSlug} locally only — admin token missing from vault`);
      return { config: updated, warning: 'remote-copy-may-remain' };
    }

    const response = await this.request(
      'DELETE',
      `/publications/${encodeURIComponent(share.publicationId)}`,
      { adminToken: token },
    );
    if (!response.ok && response.status !== 404) {
      throw new PageShareError(
        'PAGE_SHARE_REMOTE_ERROR',
        `Unpublish failed with status ${response.status}: ${await safeBodyExcerpt(response)}`,
      );
    }

    const updated = setPageShareState(workspaceRootPath, pageSlug, undefined);
    await this.tokenStore.delete(workspaceId, config.id);
    this.log(`Unpublished page ${pageSlug} (${share.publicationId})`);
    return { config: updated };
  }

  // --------------------------------------------------------------------
  // Internals
  // --------------------------------------------------------------------

  private requirePage(workspaceRootPath: string, pageSlug: string): PageConfig {
    const config = loadPageConfig(workspaceRootPath, pageSlug);
    if (!config) throw new PageShareError('PAGE_NOT_FOUND', `Page not found: ${pageSlug}`);
    return config;
  }

  private requireShare(config: PageConfig): PageShareInfo {
    if (!config.share) {
      throw new PageShareError('PAGE_SHARE_NOT_PUBLISHED', `Page is not published: ${config.slug}`);
    }
    return config.share;
  }

  private async request(
    method: 'DELETE',
    path: string,
    options: { body?: FormData; adminToken?: string } = {},
  ): Promise<Response> {
    const headers: Record<string, string> = {};
    if (options.adminToken) headers['Authorization'] = `Bearer ${options.adminToken}`;
    try {
      return await this.fetchFn(`${this.apiBaseUrl}${path}`, {
        method,
        headers,
        body: options.body,
      });
    } catch (err) {
      throw new PageShareError(
        'PAGE_SHARE_REMOTE_ERROR',
        `Could not reach the publication service: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }


}

async function safeBodyExcerpt(response: Response): Promise<string> {
  try {
    return (await response.text()).slice(0, ERROR_BODY_MAX_CHARS);
  } catch {
    return '<unreadable body>';
  }
}

// ============================================================================
// Delete with best-effort unpublish (shared flow)
// ============================================================================

export interface DeletePageOutcome {
  /** True when the page was published and the remote copy may still exist */
  publicCopyMayRemain: boolean;
}

/**
 * Delete a page, unpublishing it first when it has a share pointer.
 *
 * The single implementation behind BOTH the `pages:delete` RPC and the
 * `delete_page` session tool — keep it that way so the two paths cannot
 * drift (unpublish-before-delete is a policy, not a handler detail).
 * Unpublish failures are logged and folded into `publicCopyMayRemain`,
 * never blocking the local delete.
 */
export async function deletePageWithUnpublish(
  workspaceRootPath: string,
  workspaceId: string,
  pageSlug: string,
  options?: { log?: (message: string) => void },
): Promise<DeletePageOutcome> {
  let publicCopyMayRemain = false;
  const wasShared = Boolean(loadPageConfig(workspaceRootPath, pageSlug)?.share);
  if (wasShared) {
    try {
      const publisher = new PagePublisher({
        tokenStore: createCredentialPagePublishTokenStore(),
        log: options?.log,
      });
      const result = await publisher.unpublish(workspaceRootPath, workspaceId, pageSlug);
      publicCopyMayRemain = result.warning === 'remote-copy-may-remain';
    } catch (error) {
      publicCopyMayRemain = true;
      options?.log?.(
        `Unpublish before delete failed for ${pageSlug}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
  try {
    deletePage(workspaceRootPath, pageSlug);
  } catch (error) {
    // The unpublish (if any) already happened by now — a bare fs error would
    // misreport that state and send the user retrying the remote half too.
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(
      wasShared
        ? `The page was unpublished, but deleting the local folder failed: ${detail}`
        : `Deleting the local page folder failed: ${detail}`,
    );
  }
  return { publicCopyMayRemain };
}
