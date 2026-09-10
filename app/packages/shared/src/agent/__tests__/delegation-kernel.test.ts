import { describe, expect, it } from 'bun:test';
import {
  attemptIdempotencyKey,
  contractFromBrief,
  formatTaskBriefMessage,
  parseRunReportFromText,
  taskBriefFromLegacyPrompt,
  validateTaskBrief,
} from '../delegation-contract.ts';
import { chooseOrganization, planDelegation } from '../delegation-policy.ts';
import { PathLeaseManager, pathOverlaps } from '../path-lease.ts';
import { shouldHaltForNoProgress, validateRunReport } from '../run-report-validate.ts';
import type { DelegationCandidate } from '../delegation-routing.ts';
import { toDelegationStripViewModel } from '../delegation-projection.ts';

describe('TaskBrief / RunReport contracts', () => {
  it('rejects incomplete bare briefs', () => {
    const r = validateTaskBrief({ goal: 'x' });
    expect(r.ok).toBe(false);
  });

  it('accepts a complete brief and formats a child message', () => {
    const r = validateTaskBrief({
      goal: 'Audit permission defaults',
      acceptance: ['No child exceeds parent permission'],
      deliverable: 'RunReport + test evidence',
      scopePaths: ['app/packages/shared/src/agent/'],
      reservedPaths: ['docs/02-DECISIONS.md'],
      budget: { maxTokens: 50_000 },
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const msg = formatTaskBriefMessage(r.brief);
    expect(msg).toContain('GOAL:');
    expect(msg).toContain('ACCEPTANCE:');
    expect(msg).toContain('RunReport');
  });

  it('refuses bare prompt without fillDefaults', () => {
    const r = taskBriefFromLegacyPrompt({ prompt: 'do stuff' });
    expect(r.ok).toBe(false);
  });

  it('compat-converts bare prompt only with fillDefaults', () => {
    const r = taskBriefFromLegacyPrompt({ prompt: 'do stuff', fillDefaults: true });
    expect(r.ok).toBe(true);
  });

  it('parses structured RunReport from fenced JSON', () => {
    const text = `Here is my report:\n\`\`\`json\n${JSON.stringify({
      outcome: 'Fixed defaults',
      criteria: [{ id: 'c1', status: 'met', evidence: [{ kind: 'file', id: 't1', path: 'a.test.ts' }] }],
      changedPaths: ['a.ts'],
      artifacts: [],
      evidence: [],
      decisions: [],
      open: [],
      status: 'wired but not visually checked',
    })}\n\`\`\``;
    const { report, structured } = parseRunReportFromText(text);
    expect(structured).toBe(true);
    expect(report?.outcome).toBe('Fixed defaults');
  });

  it('builds a locked contract from a brief', () => {
    const brief = validateTaskBrief({
      goal: 'G',
      acceptance: ['A', 'B'],
      deliverable: 'D',
      scopePaths: ['src/'],
    });
    expect(brief.ok).toBe(true);
    if (!brief.ok) return;
    const c = contractFromBrief(brief.brief, {
      taskId: 't1',
      taskPath: 't1/n1',
      version: 'v1',
    });
    expect(c.criteria).toHaveLength(2);
    expect(c.criteria[0]!.id).toBe('c1');
  });

  it('forms stable attempt idempotency keys', () => {
    expect(attemptIdempotencyKey({ contractVersion: 'v1', taskPath: 'a/b', attempt: 2 })).toBe(
      'v1::a/b::2',
    );
  });
});

describe('organization policy', () => {
  it('defaults to direct execution', () => {
    const d = chooseOrganization({
      sequentialDependence: false,
      highSharedContext: false,
      smallTask: false,
      verificationOnly: false,
      independentWorkUnits: 1,
      overlappingWritePaths: false,
      highVerificationRisk: false,
    });
    expect(d.shouldDelegate).toBe(false);
    expect(d.mode).toBe('direct');
  });

  it('chooses bounded-parallel for independent units', () => {
    const d = chooseOrganization({
      sequentialDependence: false,
      highSharedContext: false,
      smallTask: false,
      verificationOnly: false,
      independentWorkUnits: 3,
      overlappingWritePaths: false,
      highVerificationRisk: false,
    });
    expect(d.mode).toBe('bounded-parallel');
    expect(d.shouldDelegate).toBe(true);
  });

  it('serializes overlapping writes', () => {
    const d = chooseOrganization({
      sequentialDependence: false,
      highSharedContext: false,
      smallTask: false,
      verificationOnly: false,
      independentWorkUnits: 3,
      overlappingWritePaths: true,
      highVerificationRisk: false,
    });
    expect(d.mode).toBe('serial-isolated');
  });

  it('plans agent routing only when organization delegates', () => {
    const cheap: DelegationCandidate = {
      id: 'cheap',
      label: 'Cheap',
      kind: 'model',
      costTier: 'cheap',
      capabilities: { tools: true, vision: false, reasoning: false, contextWindow: 100_000 },
      available: true,
    };
    const plan = planDelegation({
      signals: {
        sequentialDependence: false,
        highSharedContext: false,
        smallTask: true,
        verificationOnly: false,
        independentWorkUnits: 1,
        overlappingWritePaths: false,
        highVerificationRisk: false,
      },
      requirements: { tools: true },
      candidates: [cheap],
    });
    expect(plan.organization.shouldDelegate).toBe(false);
    expect(plan.explanation.whyNotDelegate).toBeTruthy();
  });
});

describe('path leases', () => {
  it('detects overlapping paths', () => {
    expect(pathOverlaps('/a/b', '/a/b/c')).toBe(true);
    expect(pathOverlaps('/a/b', '/a/c')).toBe(false);
  });

  it('allows only one writer per overlapping path', () => {
    const m = new PathLeaseManager();
    const a = m.tryAcquire({
      path: 'src/foo',
      holderId: 's1',
      role: 'writer',
      attemptKey: 'k1',
    });
    expect(a.ok).toBe(true);
    const b = m.tryAcquire({
      path: 'src/foo/bar.ts',
      holderId: 's2',
      role: 'writer',
      attemptKey: 'k2',
    });
    expect(b.ok).toBe(false);
    if (!b.ok) expect(b.denial.reason).toBe('writer-conflict');
  });

  it('requires integrator for reserved paths', () => {
    const m = new PathLeaseManager({ reservedPaths: ['app/packages/shared/src/protocol'] });
    const r = m.tryAcquire({
      path: 'app/packages/shared/src/protocol/types.ts',
      holderId: 's1',
      role: 'writer',
      attemptKey: 'k1',
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.denial.reason).toBe('reserved-requires-integrator');
  });

  it('releases leases so another writer can proceed', () => {
    const m = new PathLeaseManager();
    m.tryAcquire({ path: 'x', holderId: 's1', role: 'writer', attemptKey: 'k1' });
    m.release('k1');
    const again = m.tryAcquire({ path: 'x', holderId: 's2', role: 'writer', attemptKey: 'k2' });
    expect(again.ok).toBe(true);
  });
});

describe('run report validation + no-progress halt', () => {
  it('rejects natural-language-only completion', () => {
    const brief = validateTaskBrief({
      goal: 'G',
      acceptance: ['done right'],
      deliverable: 'report',
      scopePaths: ['src/'],
    });
    if (!brief.ok) throw new Error('brief');
    const c = contractFromBrief(brief.brief, { taskId: 't', taskPath: 't/n', version: 'v1' });
    const v = validateRunReport({ contract: c, text: 'I finished everything successfully.' });
    expect(v.ok).toBe(false);
    expect(v.suggestedVerdict).toBe('EVIDENCE_UNAVAILABLE');
  });

  it('accepts a complete structured report inside scope', () => {
    const brief = validateTaskBrief({
      goal: 'G',
      acceptance: ['done right'],
      deliverable: 'report',
      scopePaths: ['src/'],
    });
    if (!brief.ok) throw new Error('brief');
    const c = contractFromBrief(brief.brief, { taskId: 't', taskPath: 't/n', version: 'v1' });
    const report = {
      outcome: 'done',
      criteria: [{ id: 'c1', status: 'met' as const, evidence: [{ kind: 'file' as const, id: 'e1', path: 'src/a.ts' }] }],
      changedPaths: ['src/a.ts'],
      artifacts: [],
      evidence: [],
      decisions: [],
      open: [],
      status: 'wired but not visually checked' as const,
    };
    const v = validateRunReport({ contract: c, report });
    expect(v.ok).toBe(true);
    expect(v.suggestedVerdict).toBe('PASS');
  });

  it('halts after two non-progressing attempts', () => {
    const first = shouldHaltForNoProgress({
      previousMet: new Set(),
      currentMet: new Set(),
      nonProgressingAttempts: 0,
    });
    expect(first.halt).toBe(false);
    expect(first.nonProgressingAttempts).toBe(1);
    const second = shouldHaltForNoProgress({
      previousMet: new Set(),
      currentMet: new Set(),
      nonProgressingAttempts: first.nonProgressingAttempts,
    });
    expect(second.halt).toBe(true);
  });
});

describe('delegation strip projection (H11)', () => {
  it('summarizes child sessions under a parent without owning state', () => {
    const vm = toDelegationStripViewModel('parent', [
      { sessionId: 'c1', parentSessionId: 'parent', name: 'Research', isProcessing: true, sessionStatus: 'in-progress' },
      { sessionId: 'c2', parentSessionId: 'parent', name: 'Draft', sessionStatus: 'done' },
      { sessionId: 'other', parentSessionId: 'elsewhere', name: 'Ignore me' },
    ]);
    expect(vm.total).toBe(2);
    expect(vm.running).toBe(1);
    expect(vm.completed).toBe(1);
    expect(vm.headline).toContain('running');
  });
});
