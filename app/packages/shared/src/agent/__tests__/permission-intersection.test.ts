import { describe, expect, it } from 'bun:test';
import {
  intersectPermissionModes,
  isPermissionUpgrade,
  resolveChildPermission,
} from '../permission-intersection.ts';

describe('permission intersection', () => {
  it('meets to the most restrictive mode', () => {
    expect(intersectPermissionModes('allow-all', 'ask', 'safe')).toBe('safe');
    expect(intersectPermissionModes('allow-all', 'ask')).toBe('ask');
    expect(intersectPermissionModes(undefined, null)).toBe('safe');
  });

  it('detects privilege upgrades', () => {
    expect(isPermissionUpgrade('safe', 'allow-all')).toBe(true);
    expect(isPermissionUpgrade('allow-all', 'safe')).toBe(false);
    expect(isPermissionUpgrade('ask', 'ask')).toBe(false);
  });

  it('never defaults a missing request to allow-all', () => {
    const r = resolveChildPermission({ unattended: true });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.mode).toBe('safe');
  });

  it('inherits parent when request omitted', () => {
    const r = resolveChildPermission({ parent: 'ask', unattended: false });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.mode).toBe('ask');
  });

  it('denies explicit escalation past parent', () => {
    const r = resolveChildPermission({
      parent: 'safe',
      requested: 'allow-all',
      unattended: true,
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('permission-escalation-denied');
  });

  it('narrows task default by parent intersection', () => {
    const r = resolveChildPermission({
      parent: 'safe',
      taskDefault: 'allow-all',
      unattended: true,
    });
    // taskDefault is not an "explicit request" escalation — it is intersected
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.mode).toBe('safe');
      expect(r.narrowed).toBe(true);
    }
  });

  it('refuses unattended ask without approval channel', () => {
    const r = resolveChildPermission({
      parent: 'ask',
      requested: 'ask',
      unattended: true,
      approvalAvailable: false,
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('ask-requires-approval');
  });

  it('allows unattended ask when approval channel exists', () => {
    const r = resolveChildPermission({
      parent: 'ask',
      requested: 'ask',
      unattended: true,
      approvalAvailable: true,
    });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.mode).toBe('ask');
  });

  it('restricted parent can never yield a more privileged child', () => {
    for (const parent of ['safe', 'ask', 'allow-all'] as const) {
      for (const requested of ['safe', 'ask', 'allow-all'] as const) {
        const r = resolveChildPermission({
          parent,
          requested,
          unattended: false,
        });
        if (r.ok) {
          expect(isPermissionUpgrade(parent, r.mode)).toBe(false);
        } else {
          expect(r.reason).toBe('permission-escalation-denied');
        }
      }
    }
  });
});
