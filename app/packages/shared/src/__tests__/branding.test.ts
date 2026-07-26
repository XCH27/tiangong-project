/**
 * R2-C3 guard: online sharing has no default target. The share/viewer URL is
 * user-configured via FLEET_SHARE_VIEWER_URL; unset means sharing is honestly
 * disabled and no Craft-operated host is ever the fallback.
 */

import { describe, it, expect, afterEach } from 'bun:test';

import { getShareViewerUrl } from '../branding';

const ORIGINAL = process.env.FLEET_SHARE_VIEWER_URL;

afterEach(() => {
  if (ORIGINAL === undefined) delete process.env.FLEET_SHARE_VIEWER_URL;
  else process.env.FLEET_SHARE_VIEWER_URL = ORIGINAL;
});

describe('getShareViewerUrl', () => {
  it('returns null when no share target is configured', () => {
    delete process.env.FLEET_SHARE_VIEWER_URL;
    expect(getShareViewerUrl()).toBeNull();
  });

  it('treats a blank value as unconfigured', () => {
    process.env.FLEET_SHARE_VIEWER_URL = '   ';
    expect(getShareViewerUrl()).toBeNull();
  });

  it('returns the user-configured viewer URL', () => {
    process.env.FLEET_SHARE_VIEWER_URL = 'https://viewer.example.test';
    expect(getShareViewerUrl()).toBe('https://viewer.example.test');
  });

  it('never falls back to a Craft-operated host', () => {
    delete process.env.FLEET_SHARE_VIEWER_URL;
    expect(String(getShareViewerUrl())).not.toContain('craft.do');
  });
});
