/**
 * Deterministic organization policy for bounded delegation (C5).
 *
 * Learning / model-driven routing is R17 and intentionally absent here.
 * This module only answers: direct | single-verifier | bounded-parallel | serial-isolated,
 * with a human-readable explanation every time.
 */

import {
  routeDelegation,
  type DelegationCandidate,
  type RoutingOutcome,
  type TaskRequirements,
} from './delegation-routing.ts';

export type OrganizationMode =
  | 'direct'
  | 'single-verifier'
  | 'bounded-parallel'
  | 'serial-isolated';

export interface OrganizationSignals {
  /** Strong sequential dependence / shared mutable context. */
  sequentialDependence: boolean;
  /** Context is mostly shared with the parent (handoff would dump history). */
  highSharedContext: boolean;
  /** Task is small enough that spawn overhead dominates. */
  smallTask: boolean;
  /** Independent verification of an existing result is enough. */
  verificationOnly: boolean;
  /** Count of independent criteria / tool domains / research domains. */
  independentWorkUnits: number;
  /** Write paths that would overlap if parallel. */
  overlappingWritePaths: boolean;
  /** Estimated risk that wrong result is costly. */
  highVerificationRisk: boolean;
}

export interface OrganizationDecision {
  mode: OrganizationMode;
  shouldDelegate: boolean;
  reasons: string[];
  whyNotDelegate?: string;
  stopConditions: string[];
}

/**
 * Lightest sufficient organization. Default is direct execution.
 */
export function chooseOrganization(signals: OrganizationSignals): OrganizationDecision {
  const stopConditions = [
    'Any budget ceiling crossed → pause for decision',
    'Two non-progressing state-changing attempts → halt',
    'Permission escalation requested → deny',
  ];

  if (signals.smallTask && !signals.verificationOnly) {
    return {
      mode: 'direct',
      shouldDelegate: false,
      reasons: ['Task is small; spawn overhead dominates'],
      whyNotDelegate: 'small-task',
      stopConditions,
    };
  }

  if (signals.sequentialDependence && signals.highSharedContext) {
    return {
      mode: 'direct',
      shouldDelegate: false,
      reasons: [
        'Strong sequential dependence with highly shared context',
        'Multi-agent coordination would not improve outcome-adjusted cost',
      ],
      whyNotDelegate: 'shared-context-sequential',
      stopConditions,
    };
  }

  if (signals.verificationOnly) {
    return {
      mode: 'single-verifier',
      shouldDelegate: true,
      reasons: ['Independent verification of an existing result'],
      stopConditions: [...stopConditions, 'Verifier is read-only by default'],
    };
  }

  if (signals.overlappingWritePaths) {
    return {
      mode: 'serial-isolated',
      shouldDelegate: true,
      reasons: [
        'Write paths overlap — parallel writers forbidden',
        'Serialize or isolate with path leases / worktrees',
      ],
      stopConditions: [...stopConditions, 'At most one writer per occupied path'],
    };
  }

  if (signals.independentWorkUnits >= 2) {
    return {
      mode: 'bounded-parallel',
      shouldDelegate: true,
      reasons: [
        `${signals.independentWorkUnits} independent work units`,
        'Bounded parallel under max_parallel and path isolation',
      ],
      stopConditions,
    };
  }

  if (signals.highVerificationRisk) {
    return {
      mode: 'single-verifier',
      shouldDelegate: true,
      reasons: ['High verification risk — schedule a read-only verifier after the executor'],
      stopConditions,
    };
  }

  return {
    mode: 'direct',
    shouldDelegate: false,
    reasons: ['Default: direct execution is lightest sufficient structure'],
    whyNotDelegate: 'default-direct',
    stopConditions,
  };
}

export interface FullRoutingDecision {
  organization: OrganizationDecision;
  agent: RoutingOutcome;
  explanation: {
    whyNotDelegate?: string;
    whyThisAgent?: string;
    estimatedCostTier?: string;
    stopConditions: string[];
  };
}

/**
 * Compose organization policy with capability/cost routing (H10).
 * Escalation remains mechanical-failure only via escalationPath.
 */
export function planDelegation(input: {
  signals: OrganizationSignals;
  requirements: TaskRequirements;
  candidates: readonly DelegationCandidate[];
}): FullRoutingDecision {
  const organization = chooseOrganization(input.signals);
  if (!organization.shouldDelegate) {
    return {
      organization,
      agent: { routed: false, reason: 'no-candidate' },
      explanation: {
        whyNotDelegate: organization.whyNotDelegate ?? organization.reasons.join('; '),
        stopConditions: organization.stopConditions,
      },
    };
  }

  const agent = routeDelegation({
    requirements: input.requirements,
    candidates: input.candidates,
  });

  if (!agent.routed) {
    return {
      organization,
      agent,
      explanation: {
        whyNotDelegate: `Organization chose ${organization.mode} but no agent candidate matched: ${agent.reason}`,
        stopConditions: organization.stopConditions,
      },
    };
  }

  return {
    organization,
    agent,
    explanation: {
      whyThisAgent:
        `Selected ${agent.candidate.label} (${agent.candidate.costTier}) as cheapest ` +
        `candidate that satisfies requirements; ${agent.escalationPath.length} escalation option(s)`,
      estimatedCostTier: agent.candidate.costTier,
      stopConditions: organization.stopConditions,
    },
  };
}
