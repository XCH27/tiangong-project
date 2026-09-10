/**
 * Tests for getConfigDomainBashRedirect — the bash config-domain guard,
 * including simple `cd` prefix tracking when resolving path candidates.
 */
import { describe, it, expect } from 'bun:test';
import { getConfigDomainBashRedirect } from '../pre-tool-use.ts';

const WORKSPACE = '/ws';

describe('getConfigDomainBashRedirect', () => {
  it('blocks direct operations on guarded paths from the working directory', () => {
    const result = getConfigDomainBashRedirect(
      { command: 'rm labels/bug.json' },
      WORKSPACE,
      WORKSPACE,
    );
    expect(result).not.toBeNull();
    expect(result!.message).toContain('label');
  });

  it('blocks candidates resolved through a simple cd prefix', () => {
    const result = getConfigDomainBashRedirect(
      { command: 'cd labels && rm bug.json' },
      WORKSPACE,
      WORKSPACE,
    );
    expect(result).not.toBeNull();
    expect(result!.message).toContain('label');
  });

  it('blocks guarded root files reached via cd .', () => {
    const result = getConfigDomainBashRedirect(
      { command: 'cd . && rm automations.json' },
      WORKSPACE,
      WORKSPACE,
    );
    expect(result).not.toBeNull();
    expect(result!.message).toContain('automation');
  });

  it('does not block unguarded files when no cd prefix is present', () => {
    const result = getConfigDomainBashRedirect(
      { command: 'rm bug.json' },
      WORKSPACE,
      WORKSPACE,
    );
    expect(result).toBeNull();
  });

  it('falls back to the working directory for subshell/pipe commands (documented guardrail limit)', () => {
    const result = getConfigDomainBashRedirect(
      { command: '(cd labels) && rm bug.json' },
      WORKSPACE,
      WORKSPACE,
    );
    expect(result).toBeNull();
  });

  it('always allows craft-agent CLI commands', () => {
    const result = getConfigDomainBashRedirect(
      { command: 'craft-agent label list' },
      WORKSPACE,
      WORKSPACE,
    );
    expect(result).toBeNull();
  });
});
