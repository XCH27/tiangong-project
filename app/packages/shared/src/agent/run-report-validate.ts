/**
 * Deterministic RunReport validation against a locked TaskContract (C9).
 *
 * The executor cannot self-certify: kernel checks schema, criterion coverage,
 * evidence presence, path and budget compliance. Independent verifiers are
 * optional and read-only by default.
 */

import type { TaskContract } from './delegation-contract.ts';
import {
  type RunReport,
  type VerifierVerdict,
  parseRunReportFromText,
  RunReportSchema,
} from './delegation-contract.ts';
import { pathOverlaps } from './path-lease.ts';

export interface ValidationIssue {
  code:
    | 'invalid-schema'
    | 'missing-report'
    | 'criterion-uncovered'
    | 'criterion-unmet'
    | 'missing-evidence'
    | 'path-out-of-scope'
    | 'reserved-path-touched'
    | 'natural-language-only';
  message: string;
  criterionId?: string;
  path?: string;
}

export interface ReportValidationResult {
  ok: boolean;
  report: RunReport | null;
  structured: boolean;
  issues: ValidationIssue[];
  /** Kernel recommendation — acceptance authority is separate (C9). */
  suggestedVerdict: VerifierVerdict;
}

function pathsViolateAllowed(changed: string[], allowed: string[]): string[] {
  if (allowed.length === 0) return [];
  return changed.filter((p) => !allowed.some((a) => pathOverlaps(p, a)));
}

function pathsHitReserved(changed: string[], reserved: string[]): string[] {
  return changed.filter((p) => reserved.some((r) => pathOverlaps(p, r)));
}

/**
 * Validate structured report text (or a pre-parsed report) against a contract.
 */
export function validateRunReport(input: {
  contract: TaskContract;
  text?: string;
  report?: RunReport | null;
}): ReportValidationResult {
  let report = input.report ?? null;
  let structured = !!report;

  if (!report && input.text !== undefined) {
    const parsed = parseRunReportFromText(input.text);
    report = parsed.report;
    structured = parsed.structured;
  }

  const issues: ValidationIssue[] = [];

  if (!report) {
    issues.push({
      code: input.text?.trim() ? 'natural-language-only' : 'missing-report',
      message: input.text?.trim()
        ? 'Child returned natural language without a structured RunReport; cannot accept'
        : 'No RunReport produced',
    });
    return {
      ok: false,
      report: null,
      structured: false,
      issues,
      suggestedVerdict: 'EVIDENCE_UNAVAILABLE',
    };
  }

  const schema = RunReportSchema.safeParse(report);
  if (!schema.success) {
    issues.push({
      code: 'invalid-schema',
      message: schema.error.issues.map((i) => i.message).join('; '),
    });
    return {
      ok: false,
      report,
      structured,
      issues,
      suggestedVerdict: 'CONTRACT_AMBIGUOUS',
    };
  }
  report = schema.data;

  const byId = new Map(report.criteria.map((c) => [c.id, c]));
  for (const criterion of input.contract.criteria) {
    const outcome = byId.get(criterion.id);
    // Also allow matching by 1-based index description fallback
    const byIndex = report.criteria.find(
      (c) => c.id === criterion.id || c.note === criterion.description,
    );
    const hit = outcome ?? byIndex;
    if (!hit) {
      issues.push({
        code: 'criterion-uncovered',
        message: `Criterion ${criterion.id} has no outcome in the report`,
        criterionId: criterion.id,
      });
      continue;
    }
    if (hit.status === 'unmet') {
      issues.push({
        code: 'criterion-unmet',
        message: `Criterion ${criterion.id} is unmet`,
        criterionId: criterion.id,
      });
    }
    if (hit.status === 'met' && hit.evidence.length === 0 && input.contract.evidenceRequirements.length > 0) {
      issues.push({
        code: 'missing-evidence',
        message: `Criterion ${criterion.id} marked met without evidence refs`,
        criterionId: criterion.id,
      });
    }
  }

  const outOfScope = pathsViolateAllowed(report.changedPaths, input.contract.allowedPaths);
  for (const p of outOfScope) {
    issues.push({
      code: 'path-out-of-scope',
      message: `Changed path "${p}" is outside allowedPaths`,
      path: p,
    });
  }

  const reservedHits = pathsHitReserved(report.changedPaths, input.contract.reservedPaths);
  for (const p of reservedHits) {
    issues.push({
      code: 'reserved-path-touched',
      message: `Changed path "${p}" touches a reserved path`,
      path: p,
    });
  }

  const blocking = issues.filter((i) =>
    i.code === 'criterion-uncovered' ||
    i.code === 'criterion-unmet' ||
    i.code === 'missing-evidence' ||
    i.code === 'path-out-of-scope' ||
    i.code === 'reserved-path-touched' ||
    i.code === 'invalid-schema' ||
    i.code === 'missing-report' ||
    i.code === 'natural-language-only',
  );

  let suggestedVerdict: VerifierVerdict = 'PASS';
  if (blocking.some((i) => i.code === 'path-out-of-scope' || i.code === 'reserved-path-touched')) {
    suggestedVerdict = 'IMPLEMENTATION_FAILURE';
  } else if (blocking.some((i) => i.code === 'missing-evidence' || i.code === 'natural-language-only' || i.code === 'missing-report')) {
    suggestedVerdict = 'EVIDENCE_UNAVAILABLE';
  } else if (blocking.some((i) => i.code === 'criterion-unmet' || i.code === 'criterion-uncovered')) {
    suggestedVerdict = 'IMPLEMENTATION_FAILURE';
  } else if (blocking.length) {
    suggestedVerdict = 'CONTRACT_AMBIGUOUS';
  }

  return {
    ok: blocking.length === 0,
    report,
    structured,
    issues,
    suggestedVerdict,
  };
}

/**
 * Two non-progressing state-changing attempts → halt (C10).
 * Progress = newly met criterion ids that were unmet before.
 */
export function shouldHaltForNoProgress(input: {
  previousMet: ReadonlySet<string>;
  currentMet: ReadonlySet<string>;
  nonProgressingAttempts: number;
  limit?: number;
}): { halt: boolean; nonProgressingAttempts: number; newlyMet: string[] } {
  const limit = input.limit ?? 2;
  const newlyMet = [...input.currentMet].filter((id) => !input.previousMet.has(id));
  const nonProgressingAttempts = newlyMet.length > 0 ? 0 : input.nonProgressingAttempts + 1;
  return {
    halt: nonProgressingAttempts >= limit,
    nonProgressingAttempts,
    newlyMet,
  };
}
