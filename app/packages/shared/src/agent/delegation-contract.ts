/**
 * Bounded delegation envelopes (C3 / C7 / R6).
 *
 * TaskContract is locked per attempt. TaskBrief is the only inbound envelope
 * across a delegation boundary; RunReport is the only outbound envelope.
 * Transcripts never cross the boundary.
 *
 * These types are the shared contract surface. TaskRunner / spawn_session
 * convert and validate into them; they do not invent a second task store.
 */

import { z } from 'zod';
import type { PermissionMode } from './mode-types.ts';

// ---------------------------------------------------------------------------
// Identity & refs
// ---------------------------------------------------------------------------

/** Stable criterion id — never renumbered mid-attempt. */
export type CriterionId = string;

/** Artifact / evidence pointer — bytes stay in their authority (R5). */
export const ArtifactRefSchema = z.object({
  kind: z.enum(['file', 'session-evidence', 'url', 'git-diff', 'other']),
  id: z.string().min(1),
  /** Absolute or workspace-relative path when kind=file. */
  path: z.string().optional(),
  version: z.string().optional(),
  producerRunId: z.string().optional(),
  label: z.string().optional(),
});
export type ArtifactRef = z.infer<typeof ArtifactRefSchema>;

export const EvidenceRefSchema = ArtifactRefSchema.extend({
  purpose: z.string().optional(),
});
export type EvidenceRef = z.infer<typeof EvidenceRefSchema>;

/**
 * Every command / heartbeat / result carries this so stale generations cannot
 * land output after a restart or retry (13-ORCHESTRATION §2.1).
 */
export const AttemptIdentitySchema = z.object({
  taskId: z.string().min(1),
  taskPath: z.string().min(1),
  contractVersion: z.string().min(1),
  attemptId: z.string().min(1),
  /** Monotonic dispatch generation; only the current generation may settle. */
  dispatchGeneration: z.number().int().nonnegative(),
  sessionId: z.string().optional(),
  parentSessionId: z.string().optional(),
  runId: z.string().optional(),
  nodeId: z.string().optional(),
});
export type AttemptIdentity = z.infer<typeof AttemptIdentitySchema>;

// ---------------------------------------------------------------------------
// Budgets
// ---------------------------------------------------------------------------

export const BudgetCeilingSchema = z.object({
  maxTokens: z.number().int().positive().optional(),
  maxToolCalls: z.number().int().positive().optional(),
  maxEdits: z.number().int().positive().optional(),
  maxRetries: z.number().int().nonnegative().optional(),
  maxDelegations: z.number().int().nonnegative().optional(),
  maxElapsedMs: z.number().int().positive().optional(),
});
export type BudgetCeiling = z.infer<typeof BudgetCeilingSchema>;

// ---------------------------------------------------------------------------
// TaskContract (locked per attempt)
// ---------------------------------------------------------------------------

export const CriterionSchema = z.object({
  id: z.string().min(1),
  description: z.string().min(1),
  /** Optional machine-checkable predicate description. */
  check: z.string().optional(),
});
export type Criterion = z.infer<typeof CriterionSchema>;

export const TaskContractSchema = z.object({
  version: z.string().min(1),
  taskId: z.string().min(1),
  taskPath: z.string().min(1),
  primaryOutcome: z.string().min(1),
  criteria: z.array(CriterionSchema).min(1),
  nonGoals: z.array(z.string()).default([]),
  allowedPaths: z.array(z.string()).default([]),
  reservedPaths: z.array(z.string()).default([]),
  budgets: BudgetCeilingSchema.default({}),
  preconditions: z.array(z.string()).default([]),
  evidenceRequirements: z.array(z.string()).default([]),
  requestedPermissionMode: z.enum(['safe', 'ask', 'allow-all']).optional(),
});
export type TaskContract = z.infer<typeof TaskContractSchema>;

// ---------------------------------------------------------------------------
// TaskBrief (inbound delegation envelope)
// ---------------------------------------------------------------------------

export const ContextForkSchema = z.enum(['none', 'last-n', 'full']);
export type ContextFork = z.infer<typeof ContextForkSchema>;

export const TaskBriefSchema = z.object({
  goal: z.string().min(1),
  acceptance: z.array(z.string().min(1)).min(1),
  scopePaths: z.array(z.string()).default([]),
  reservedPaths: z.array(z.string()).default([]),
  knownFacts: z.array(z.string()).default([]),
  references: z.array(z.string()).default([]),
  constraints: z.array(z.string()).default([]),
  deliverable: z.string().min(1),
  budget: BudgetCeilingSchema.default({}),
  contextFork: ContextForkSchema.default('none'),
  contextForkLastN: z.number().int().positive().optional(),
  permissionMode: z.enum(['safe', 'ask', 'allow-all']).optional(),
  contractVersion: z.string().optional(),
  /** Stable path in the parent task tree, e.g. "parent/research". */
  taskPath: z.string().optional(),
  model: z.string().optional(),
  llmConnection: z.string().optional(),
  labels: z.array(z.string()).optional(),
  workingDirectory: z.string().optional(),
});
export type TaskBrief = z.infer<typeof TaskBriefSchema>;

// ---------------------------------------------------------------------------
// RunReport (outbound envelope)
// ---------------------------------------------------------------------------

export const CriterionOutcomeSchema = z.object({
  id: z.string().min(1),
  status: z.enum(['met', 'unmet', 'unknown']),
  evidence: z.array(EvidenceRefSchema).default([]),
  note: z.string().optional(),
});
export type CriterionOutcome = z.infer<typeof CriterionOutcomeSchema>;

/** Capability status vocabulary (09-QUALITY / AGENTS.md). */
export const CapabilityStatusSchema = z.enum([
  'usable',
  'wired but not visually checked',
  'display-only',
  'not implemented',
]);
export type CapabilityStatus = z.infer<typeof CapabilityStatusSchema>;

export const MechanicalFailureClassSchema = z.enum([
  'tool-loop-exhausted',
  'context-overflow',
  'repeated-error',
  'timeout',
  'dispatch-failed',
  'permission-denied',
  'budget-halt',
  'environment-failure',
  'explicit-request',
]);
export type MechanicalFailureClass = z.infer<typeof MechanicalFailureClassSchema>;

export const RunReportSchema = z.object({
  outcome: z.string().min(1),
  criteria: z.array(CriterionOutcomeSchema).default([]),
  changedPaths: z.array(z.string()).default([]),
  artifacts: z.array(ArtifactRefSchema).default([]),
  evidence: z.array(EvidenceRefSchema).default([]),
  decisions: z.array(z.string()).default([]),
  open: z.array(z.string()).default([]),
  status: CapabilityStatusSchema,
  mechanicalFailure: MechanicalFailureClassSchema.optional(),
  attempt: AttemptIdentitySchema.optional(),
});
export type RunReport = z.infer<typeof RunReportSchema>;

// ---------------------------------------------------------------------------
// Contract change + verifier verdicts (C7 / C9)
// ---------------------------------------------------------------------------

export const ContractChangeRequestSchema = z.object({
  fromVersion: z.string().min(1),
  reason: z.string().min(1),
  proposed: TaskContractSchema.partial(),
});
export type ContractChangeRequest = z.infer<typeof ContractChangeRequestSchema>;

export const VerifierVerdictSchema = z.enum([
  'PASS',
  'IMPLEMENTATION_FAILURE',
  'ENVIRONMENT_FAILURE',
  'EVIDENCE_UNAVAILABLE',
  'CONTRACT_AMBIGUOUS',
]);
export type VerifierVerdict = z.infer<typeof VerifierVerdictSchema>;

// ---------------------------------------------------------------------------
// Parsing / validation helpers
// ---------------------------------------------------------------------------

export interface BriefValidationError {
  field: string;
  message: string;
}

/**
 * Validate a TaskBrief. Bare prompts fail: goal, acceptance, and deliverable
 * are required so spawn_session cannot accept an unscoped dump.
 */
export function validateTaskBrief(input: unknown): {
  ok: true;
  brief: TaskBrief;
} | {
  ok: false;
  errors: BriefValidationError[];
} {
  const parsed = TaskBriefSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      errors: parsed.error.issues.map((i) => ({
        field: i.path.join('.') || 'root',
        message: i.message,
      })),
    };
  }
  const brief = parsed.data;
  const errors: BriefValidationError[] = [];
  if (!brief.goal.trim()) errors.push({ field: 'goal', message: 'GOAL is required' });
  if (brief.acceptance.length === 0) {
    errors.push({ field: 'acceptance', message: 'At least one acceptance criterion is required' });
  }
  if (!brief.deliverable.trim()) {
    errors.push({ field: 'deliverable', message: 'DELIVERABLE is required' });
  }
  if (errors.length) return { ok: false, errors };
  return { ok: true, brief };
}

/**
 * Best-effort conversion from a legacy bare prompt + optional fields into a
 * TaskBrief. Incomplete conversions fail validation — callers must not dispatch.
 */
export function taskBriefFromLegacyPrompt(input: {
  prompt: string;
  name?: string;
  permissionMode?: PermissionMode;
  workingDirectory?: string;
  model?: string;
  llmConnection?: string;
  labels?: string[];
  /** When true, invent minimal acceptance/deliverable from the prompt (compat only). */
  fillDefaults?: boolean;
}): { ok: true; brief: TaskBrief } | { ok: false; errors: BriefValidationError[] } {
  const prompt = input.prompt.trim();
  if (!prompt) {
    return { ok: false, errors: [{ field: 'prompt', message: 'prompt is required' }] };
  }

  if (!input.fillDefaults) {
    return {
      ok: false,
      errors: [
        {
          field: 'brief',
          message:
            'Bare prompt is not a TaskBrief. Provide goal, acceptance, deliverable ' +
            '(and scope/budget) or set fillDefaults for controlled compatibility conversion.',
        },
      ],
    };
  }

  return validateTaskBrief({
    goal: input.name?.trim() || prompt.slice(0, 200),
    acceptance: ['Produce the deliverable described in the goal'],
    scopePaths: input.workingDirectory ? [input.workingDirectory] : [],
    reservedPaths: [],
    knownFacts: [],
    references: [],
    constraints: [],
    deliverable: 'RunReport with criterion outcomes and evidence refs (not a transcript)',
    budget: {},
    contextFork: 'none',
    permissionMode: input.permissionMode,
    model: input.model,
    llmConnection: input.llmConnection,
    labels: input.labels,
    workingDirectory: input.workingDirectory,
  });
}

/** Render a TaskBrief as the child session's first user message body. */
export function formatTaskBriefMessage(brief: TaskBrief): string {
  const lines: string[] = [
    `GOAL: ${brief.goal}`,
    `ACCEPTANCE:`,
    ...brief.acceptance.map((c, i) => `  [${i + 1}] ${c}`),
  ];
  if (brief.scopePaths.length) lines.push(`SCOPE PATHS: ${brief.scopePaths.join(', ')}`);
  if (brief.reservedPaths.length) lines.push(`RESERVED: ${brief.reservedPaths.join(', ')}`);
  if (brief.knownFacts.length) {
    lines.push('KNOWN FACTS:');
    for (const f of brief.knownFacts) lines.push(`  - ${f}`);
  }
  if (brief.references.length) lines.push(`REFERENCES: ${brief.references.join(', ')}`);
  if (brief.constraints.length) {
    lines.push('CONSTRAINTS:');
    for (const c of brief.constraints) lines.push(`  - ${c}`);
  }
  lines.push(`DELIVERABLE: ${brief.deliverable}`);
  const budgetBits: string[] = [];
  if (brief.budget.maxTokens) budgetBits.push(`tokens≤${brief.budget.maxTokens}`);
  if (brief.budget.maxToolCalls) budgetBits.push(`tools≤${brief.budget.maxToolCalls}`);
  if (brief.budget.maxRetries !== undefined) budgetBits.push(`retries≤${brief.budget.maxRetries}`);
  if (brief.budget.maxElapsedMs) budgetBits.push(`elapsed≤${brief.budget.maxElapsedMs}ms`);
  if (budgetBits.length) lines.push(`BUDGET: ${budgetBits.join(', ')}`);
  lines.push(`CONTEXT FORK: ${brief.contextFork}`);
  lines.push('');
  lines.push(
    'Return a structured RunReport (JSON) with: outcome, criteria[{id,status,evidence}], ' +
      'changedPaths, artifacts, evidence, decisions, open, status. Do not dump the transcript.',
  );
  return lines.join('\n');
}

/**
 * Extract a RunReport from child final text. Prefers a fenced ```json block or
 * a top-level JSON object; falls back to a minimal report with status unknown.
 */
export function parseRunReportFromText(text: string): {
  report: RunReport | null;
  raw: string;
  structured: boolean;
} {
  const raw = text ?? '';
  const candidates: string[] = [];
  const fence = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence?.[1]) candidates.push(fence[1].trim());
  const brace = raw.match(/\{[\s\S]*\}/);
  if (brace?.[0]) candidates.push(brace[0]);

  for (const c of candidates) {
    try {
      const parsed = JSON.parse(c) as unknown;
      const result = RunReportSchema.safeParse(parsed);
      if (result.success) return { report: result.data, raw, structured: true };
    } catch {
      // try next
    }
  }
  return { report: null, raw, structured: false };
}

/** Lock a TaskContract from a brief for one attempt. */
export function contractFromBrief(
  brief: TaskBrief,
  opts: { taskId: string; taskPath: string; version: string },
): TaskContract {
  return TaskContractSchema.parse({
    version: opts.version,
    taskId: opts.taskId,
    taskPath: opts.taskPath,
    primaryOutcome: brief.goal,
    criteria: brief.acceptance.map((description, i) => ({
      id: `c${i + 1}`,
      description,
    })),
    nonGoals: [],
    allowedPaths: brief.scopePaths,
    reservedPaths: brief.reservedPaths,
    budgets: brief.budget,
    preconditions: [],
    evidenceRequirements: [],
    requestedPermissionMode: brief.permissionMode,
  });
}

/** Enqueue idempotency key: contractVersion + taskPath + attempt. */
export function attemptIdempotencyKey(parts: {
  contractVersion: string;
  taskPath: string;
  attempt: number | string;
}): string {
  return `${parts.contractVersion}::${parts.taskPath}::${parts.attempt}`;
}
