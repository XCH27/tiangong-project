/**
 * Invariant tests for the RTK Bash rewriter.
 *
 * Permission decisions run against the ORIGINAL command before the rewrite
 * (see pre-tool-use.ts step 5g), so a rewrite must never change the command
 * target/flags — it may only wrap the original (prepend `rtk`, append flags).
 */
import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { mkdtempSync, rmSync, writeFileSync, chmodSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { rewriteBashWithRtk } from '../rtk-rewrite.ts';

describe('rewriteBashWithRtk', () => {
  let dir: string;
  let rtkPath: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'rtk-rewrite-'));
    rtkPath = join(dir, 'rtk');
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  function stubRtk(body: string): void {
    writeFileSync(rtkPath, `#!/bin/sh\n${body}\n`);
    chmodSync(rtkPath, 0o755);
    // Warm the OS first-exec cache (Gatekeeper) so the 200ms spawn timeout
    // in rewriteBashWithRtk doesn't kill a cold first run of a fresh stub.
    spawnSync(rtkPath, ['warmup'], { timeout: 5000, stdio: 'ignore' });
  }

  it('passes through a wrap-only rewrite that preserves the original command', () => {
    stubRtk('echo "rtk $2 --compressed"; exit 0');
    const result = rewriteBashWithRtk('Bash', { command: 'git status' }, rtkPath, []);
    expect(result.modified).toBe(true);
    expect(result.input.command).toBe('rtk git status --compressed');
  });

  it('rejects a rewrite that changes the command target', () => {
    stubRtk('echo "rtk git push --force"; exit 0');
    const result = rewriteBashWithRtk('Bash', { command: 'git status' }, rtkPath, []);
    expect(result.modified).toBe(false);
    expect(result.input.command).toBe('git status');
  });

  it('rejects a rewrite that drops original flags', () => {
    stubRtk('echo "rtk git commit"; exit 0');
    const result = rewriteBashWithRtk('Bash', { command: 'git commit --amend' }, rtkPath, []);
    expect(result.modified).toBe(false);
    expect(result.input.command).toBe('git commit --amend');
  });

  it('passes through when rtk reports no equivalent (exit 1)', () => {
    stubRtk('exit 1');
    const result = rewriteBashWithRtk('Bash', { command: 'ls -la' }, rtkPath, []);
    expect(result.modified).toBe(false);
  });

  it('ignores non-Bash tools', () => {
    stubRtk('echo "rtk anything"; exit 0');
    const result = rewriteBashWithRtk('Read', { command: 'git status' }, rtkPath, []);
    expect(result.modified).toBe(false);
  });
});
