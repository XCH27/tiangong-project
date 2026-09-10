/**
 * TaskBrief enforcement on spawn_session (Decision C3).
 *
 * Structured brief fields → validate + formatTaskBriefMessage as child prompt.
 * Bare prompt → fillDefaults compat conversion (briefCompat=true) unless already
 * a TaskBrief message (GOAL: + ACCEPTANCE:). Empty goal/prompt rejected.
 */
import { describe, it, expect, beforeEach } from 'bun:test';
import {
  resolveSpawnSessionBrief,
  type SpawnSessionRequest,
  type SpawnSessionResult,
} from '../base-agent.ts';
import { resolveChildPermission } from '../permission-intersection.ts';
import { TestAgent, createMockBackendConfig } from './test-utils.ts';

class SpawnTestAgent extends TestAgent {
  public invokeSpawn(input: Record<string, unknown>) {
    return this.preExecuteSpawnSession(input);
  }
}

function setup() {
  const agent = new SpawnTestAgent(createMockBackendConfig());
  const captured: SpawnSessionRequest[] = [];
  agent.onSpawnSession = async (request) => {
    captured.push(request);
    const result: SpawnSessionResult = {
      sessionId: 'spawned-id',
      name: 'spawned',
      status: 'started',
    };
    return result;
  };
  return { agent, captured };
}

describe('resolveSpawnSessionBrief', () => {
  it('accepts a structured brief and formats the child message', () => {
    const r = resolveSpawnSessionBrief({
      goal: 'Audit permission defaults',
      acceptance: ['No child exceeds parent permission', 'Tests cover escalation'],
      deliverable: 'RunReport + test evidence',
      scopePaths: ['app/packages/shared/src/agent/'],
      reservedPaths: ['docs/02-DECISIONS.md'],
      knownFacts: ['Parent is safe'],
      constraints: ['No second authority'],
      budget: { maxTokens: 50_000, maxToolCalls: 20 },
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.briefCompat).toBe(false);
    expect(r.prompt).toContain('GOAL: Audit permission defaults');
    expect(r.prompt).toContain('ACCEPTANCE:');
    expect(r.prompt).toContain('No child exceeds parent permission');
    expect(r.prompt).toContain('DELIVERABLE: RunReport + test evidence');
    expect(r.prompt).toContain('SCOPE PATHS:');
    expect(r.prompt).toContain('RESERVED:');
    expect(r.prompt).toContain('KNOWN FACTS:');
    expect(r.prompt).toContain('CONSTRAINTS:');
    expect(r.prompt).toContain('tokens≤50000');
    expect(r.prompt).toContain('RunReport');
  });

  it('coerces a single acceptance string into an array', () => {
    const r = resolveSpawnSessionBrief({
      goal: 'Ship brief',
      acceptance: 'Formatted message reaches child',
      deliverable: 'RunReport',
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.prompt).toContain('[1] Formatted message reaches child');
  });

  it('rejects incomplete structured brief (missing acceptance/deliverable)', () => {
    const r = resolveSpawnSessionBrief({ goal: 'only a goal' });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.message).toContain('TaskBrief invalid');
  });

  it('converts bare prompt with fillDefaults and sets briefCompat', () => {
    const r = resolveSpawnSessionBrief({ prompt: 'summarize the README' });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.briefCompat).toBe(true);
    expect(r.prompt).toContain('GOAL:');
    expect(r.prompt).toContain('ACCEPTANCE:');
    expect(r.prompt).toContain('DELIVERABLE:');
    // Child message is the formatted brief, not the raw dump alone
    expect(r.prompt).not.toBe('summarize the README');
    expect(r.prompt).toContain('summarize the README');
  });

  it('passes through a prompt that already looks like a TaskBrief', () => {
    const preformatted =
      'GOAL: Existing brief\nACCEPTANCE:\n  [1] Keep as-is\nDELIVERABLE: RunReport';
    const r = resolveSpawnSessionBrief({ prompt: `  ${preformatted}  \n` });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.briefCompat).toBe(false);
    // Whitespace is trimmed; body is not re-wrapped through fillDefaults.
    expect(r.prompt).toBe(preformatted);
    expect(r.prompt).toContain('GOAL:');
    expect(r.prompt).toContain('ACCEPTANCE:');
  });

  it('rejects empty prompt and empty goal', () => {
    expect(resolveSpawnSessionBrief({}).ok).toBe(false);
    expect(resolveSpawnSessionBrief({ prompt: '   ' }).ok).toBe(false);
    expect(resolveSpawnSessionBrief({ goal: '' }).ok).toBe(false);
    const empty = resolveSpawnSessionBrief({ prompt: '' });
    expect(empty.ok).toBe(false);
    if (!empty.ok) {
      expect(empty.message).toMatch(/goal or prompt is required/i);
    }
  });
});

describe('preExecuteSpawnSession TaskBrief enforcement', () => {
  let agent: SpawnTestAgent;
  let captured: SpawnSessionRequest[];

  beforeEach(() => {
    ({ agent, captured } = setup());
  });

  it('forwards a formatted structured brief as the child prompt', async () => {
    const result = await agent.invokeSpawn({
      goal: 'Research X',
      acceptance: ['Return findings with paths'],
      deliverable: 'RunReport',
      model: 'claude-opus-4-7',
    });
    expect(captured).toHaveLength(1);
    expect(captured[0]?.prompt).toContain('GOAL: Research X');
    expect(captured[0]?.prompt).toContain('ACCEPTANCE:');
    expect(captured[0]?.prompt).toContain('DELIVERABLE: RunReport');
    expect(captured[0]?.model).toBe('claude-opus-4-7');
    expect('briefCompat' in result ? (result as SpawnSessionResult).briefCompat : undefined).toBeUndefined();
  });

  it('bare prompt converts with fillDefaults and returns briefCompat', async () => {
    const result = (await agent.invokeSpawn({
      prompt: 'do a quick scan of src/',
      name: 'scan',
    })) as SpawnSessionResult;
    expect(captured).toHaveLength(1);
    expect(captured[0]?.prompt).toContain('GOAL:');
    expect(captured[0]?.prompt).toContain('ACCEPTANCE:');
    expect(result.briefCompat).toBe(true);
    expect(result.status).toBe('started');
  });

  it('rejects empty spawn without goal or prompt', async () => {
    await expect(agent.invokeSpawn({})).rejects.toThrow(/goal or prompt is required/i);
    expect(captured).toHaveLength(0);
  });

  it('rejects structured brief missing required fields before onSpawnSession', async () => {
    await expect(
      agent.invokeSpawn({ goal: 'incomplete' }),
    ).rejects.toThrow(/TaskBrief invalid/);
    expect(captured).toHaveLength(0);
  });
});

describe('spawn_session permission escalation (still denied)', () => {
  it('resolveChildPermission still denies escalation past parent', () => {
    // SessionManager wires resolveChildPermission on onSpawnSession; the
    // intersection helper remains the authority for non-escalation (C11).
    const denied = resolveChildPermission({
      parent: 'safe',
      requested: 'allow-all',
      unattended: false,
      approvalAvailable: true,
    });
    expect(denied.ok).toBe(false);
    if (!denied.ok) expect(denied.reason).toBe('permission-escalation-denied');

    const inherit = resolveChildPermission({
      parent: 'ask',
      unattended: false,
      approvalAvailable: true,
    });
    expect(inherit.ok).toBe(true);
    if (inherit.ok) expect(inherit.mode).toBe('ask');
  });
});
