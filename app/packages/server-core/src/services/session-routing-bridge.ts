/**
 * SessionManager ↔ 模型路由接线 — Plan 执行、Verification、cascade、语义缓存、RouteLLM
 */

import { randomUUID } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type {
  ActionInvocation,
  ActorRef,
  DesignAction,
  DesignPatch,
  SessionEvent,
} from '@craft-agent/shared/protocol'
import { executePlanFusion, parseActionPlan } from './plan-fusion-executor.ts'
import {
  runWorkspaceTypecheck,
  runPlanTestHint,
  runPlanRenderHint,
} from './verification-workspace.ts'
import type { PlanFusionHook } from './fusion-pipeline.ts'
import { lookupExact, writeExact } from './fusion-cache.ts'
import { runVerificationWithSignals, type VerificationHooks } from './verification-runner.ts'
import { evaluateCascade, extractConfidenceSignals, type CascadeSignal } from './cascade-evaluator.ts'
import { RouteLLMTrainer, TrainedRouter, type PersistedRouterState } from './routellm-trainer.ts'
import {
  semanticCache,
  routingDataCollector,
} from './model-routing-runtime.ts'
import type {
  CacheKey,
  ModelRoutingPrefs,
  RoutingDecision,
  TaskType,
} from './fusion-types.ts'
import type { InternalActionRuntimeBridge } from './internal-action-bridge.ts'
import { InternalActionExecutorService } from './internal-action-executor.ts'
import { FileMutationService } from './file-mutation-service.ts'
import {
  createAllInternalActions,
  InternalActionRegistryService,
} from './internal-action-registry.ts'

export interface RoutingTurnContext {
  decision: RoutingDecision
  prefs: ModelRoutingPrefs
  shapedMessage: string
  exactCacheKey: CacheKey | null
  cascadeRetries: number
  modelId: string
  connectionSlug: string
  routerConfidence?: number
  turnStartedAt: number
  workspaceGitHead?: string
}

export interface SessionRoutingPorts {
  sessionId: string
  workspaceId: string
  workspaceRoot: string
  labels?: string[]
  sendEvent: (event: SessionEvent) => void
  requestWorkflowPermission: (
    sessionId: string,
    input: { toolName: string; description: string; type: 'file_write' | 'mcp_mutation' | 'api_mutation'; reason?: string },
  ) => Promise<boolean>
  getInternalActionBridge: () => InternalActionRuntimeBridge
}

let trainedRouterCache: { datasetSize: number; router: TrainedRouter } | null = null

const executorByWorkspace = new Map<string, InternalActionExecutorService>()

const ROUTER_CACHE_DIR = join(process.env.HOME || process.env.USERPROFILE || '.', '.craft-agent', 'cache')
const ROUTER_STATE_PATH = join(ROUTER_CACHE_DIR, 'routellm-router.json')

function loadPersistedRouter(datasetSize: number): TrainedRouter | null {
  try {
    if (!existsSync(ROUTER_STATE_PATH)) return null
    const state = JSON.parse(readFileSync(ROUTER_STATE_PATH, 'utf-8')) as PersistedRouterState
    if (state.datasetSize !== datasetSize) return null
    return TrainedRouter.fromJSON(state.routerJson)
  } catch {
    return null
  }
}

function savePersistedRouter(router: TrainedRouter, datasetSize: number): void {
  try {
    if (!existsSync(ROUTER_CACHE_DIR)) mkdirSync(ROUTER_CACHE_DIR, { recursive: true })
    const state: PersistedRouterState = {
      datasetSize,
      routerJson: router.toJSON(),
      savedAt: Date.now(),
    }
    writeFileSync(ROUTER_STATE_PATH, JSON.stringify(state, null, 2), 'utf-8')
  } catch {
    // best-effort
  }
}

/** 解析工作区 git HEAD（非 git 仓库则 undefined）。 */
export function resolveWorkspaceGitHead(workspaceRoot: string): string | undefined {
  try {
    const head = execFileSync('git', ['rev-parse', 'HEAD'], {
      cwd: workspaceRoot,
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim()
    return head || undefined
  } catch {
    return undefined
  }
}

export function hashEmbed(text: string, dims = 64): number[] {
  const vec = new Array<number>(dims).fill(0)
  const normalized = text.trim().toLowerCase()
  for (let i = 0; i < normalized.length; i++) {
    const code = normalized.charCodeAt(i)
    vec[(code + i) % dims] += 1
    vec[(code * 31 + i * 7) % dims] += 0.5
  }
  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0))
  if (norm === 0) return vec
  return vec.map(v => v / norm)
}

export function applyTrainedRouter(decision: RoutingDecision): RoutingDecision {
  const dataset = routingDataCollector.exportDataset()
  if (dataset.length < 10) return decision

  if (!trainedRouterCache || trainedRouterCache.datasetSize !== dataset.length) {
    const persisted = loadPersistedRouter(dataset.length)
    if (persisted) {
      trainedRouterCache = { datasetSize: dataset.length, router: persisted }
    } else {
      const trainer = new RouteLLMTrainer()
      const trained = trainer.train(dataset, { minSamplesPerGroup: 3 }).router
      trainedRouterCache = {
        datasetSize: dataset.length,
        router: trained,
      }
      savePersistedRouter(trained, dataset.length)
    }
  }

  const pred = trainedRouterCache.router.predict(decision.taskType, decision.complexity)
  if (pred.confidence < 0.5 || pred.tier === decision.tier) {
    return decision
  }

  return {
    ...decision,
    tier: pred.tier,
    basis: `${decision.basis}; routellm=${pred.tier}@${pred.confidence.toFixed(2)}`,
  }
}

export function trySemanticCacheHit(key: CacheKey): { hit: boolean; answer?: string; similarity?: number } {
  return semanticCache.lookup(key, hashEmbed(key.normalizedMessage))
}

export function lookupExactWithGitHead(
  key: CacheKey,
  gitHead?: string,
): ReturnType<typeof lookupExact> {
  return lookupExact(key, { currentGitHead: gitHead })
}

export function writeExactWithGitHead(
  key: CacheKey,
  answer: string,
  gitHead?: string,
): void {
  writeExact(
    key,
    { answer },
    undefined,
    { toolSetHash: key.toolSetHash, gitHead },
  )
}

export function storeSemanticCacheEntry(
  key: CacheKey,
  answer: string,
  confidence: 'high' | 'low' = 'high',
): void {
  semanticCache.store(key, answer, hashEmbed(key.normalizedMessage), confidence)
}

export function recordRoutingPreferenceAccepted(ctx: RoutingTurnContext, sessionId: string): void {
  routingDataCollector.recordPreference({
    type: 'accepted',
    sessionId,
    taskType: ctx.decision.taskType,
    complexity: ctx.decision.complexity,
    tier: ctx.decision.tier,
    modelId: ctx.modelId,
  })
}

export function recordRoutingPreferenceRetried(ctx: RoutingTurnContext, sessionId: string): void {
  routingDataCollector.recordPreference({
    type: 'retried',
    sessionId,
    taskType: ctx.decision.taskType,
    complexity: ctx.decision.complexity,
    tier: ctx.decision.tier,
    modelId: ctx.modelId,
  })
}

export function recordRoutingPreferenceRejected(ctx: RoutingTurnContext, sessionId: string): void {
  routingDataCollector.recordPreference({
    type: 'rejected',
    sessionId,
    taskType: ctx.decision.taskType,
    complexity: ctx.decision.complexity,
    tier: ctx.decision.tier,
    modelId: ctx.modelId,
  })
}

export function recordRoutingPreferenceRolledBack(ctx: RoutingTurnContext, sessionId: string): void {
  routingDataCollector.recordPreference({
    type: 'rolled_back',
    sessionId,
    taskType: ctx.decision.taskType,
    complexity: ctx.decision.complexity,
    tier: ctx.decision.tier,
    modelId: ctx.modelId,
  })
}

function fusionActor(sessionId: string, labels?: string[]): ActorRef {
  const role = sessionId.includes('manager') ? 'manager' : 'code'
  return {
    kind: 'agent',
    agentId: `fusion:${sessionId}`,
    role,
    displayName: 'Fusion Writer',
  }
}

function getInternalActionExecutor(ports: SessionRoutingPorts): InternalActionExecutorService {
  let executor = executorByWorkspace.get(ports.workspaceRoot)
  if (!executor) {
    const registry = new InternalActionRegistryService(createAllInternalActions())
    executor = new InternalActionExecutorService({
      registry,
      fileMutations: new FileMutationService(),
      emit: event => ports.sendEvent(event),
      requestPermission: (sessionId, input) => ports.requestWorkflowPermission(sessionId, input),
      bridge: ports.getInternalActionBridge(),
    })
    executorByWorkspace.set(ports.workspaceRoot, executor)
  }
  return executor
}

export function buildPlanFusionHook(ports: SessionRoutingPorts): PlanFusionHook {
  return async (fusionResult) => {
    const actor = fusionActor(ports.sessionId, ports.labels)
    const executor = getInternalActionExecutor(ports)
    const result = await executePlanFusion(fusionResult, {
      sessionId: ports.sessionId,
      actor,
      emitDesignAction: async (action: DesignAction) => {
        const patchPreview: DesignPatch = {
          patchId: randomUUID(),
          actionId: action.actionId,
          sessionId: ports.sessionId,
          forward: action.op,
          inverse: null,
          status: 'preview',
        }
        ports.sendEvent({
          type: 'design_action_proposed',
          sessionId: ports.sessionId,
          action,
          patchPreview,
        })
        return { patchId: patchPreview.patchId }
      },
      invokeInternalAction: async (invocation: ActionInvocation) =>
        executor.invoke({
          sessionId: ports.sessionId,
          workspaceRoot: ports.workspaceRoot,
          invocation,
          bridge: ports.getInternalActionBridge(),
        }),
    })
    return {
      executedDesignActions: result.executedDesignActions,
      executedInternalActions: result.executedInternalActions,
      errors: result.errors,
    }
  }
}

export function buildFusionVerificationHooks(workspaceRoot: string): VerificationHooks {
  return {
    validateSchema: (actionPlan) => {
      const steps = parseActionPlan(actionPlan)
      if (!actionPlan) {
        return { kind: 'schema', source: 'plan-parser', passed: true, evidence: 'actual' as const }
      }
      if (steps.length === 0) {
        return {
          kind: 'schema',
          source: 'plan-parser',
          passed: false,
          detail: 'actionPlan 无法解析或为空',
          evidence: 'actual',
        }
      }
      return {
        kind: 'schema',
        source: 'plan-parser',
        passed: true,
        detail: `${steps.length} steps`,
        evidence: 'actual',
      }
    },
    runLint: () => runWorkspaceTypecheck(workspaceRoot),
    runTests: (actionPlan) => runPlanTestHint(actionPlan),
    runRender: (actionPlan) => runPlanRenderHint(actionPlan),
  }
}

export interface CascadeRetryPlan {
  upgraded: boolean
  nextDecision?: RoutingDecision
  reason: string
  cascadeUpgrades: number
}

export function planCascadeRetry(
  ctx: RoutingTurnContext,
  assistantText: string,
  extraSignals: CascadeSignal[] = [],
): CascadeRetryPlan {
  if (ctx.cascadeRetries >= 2) {
    return { upgraded: false, reason: '级联重试已达上限', cascadeUpgrades: 0 }
  }

  const signals = [...extractConfidenceSignals(assistantText), ...extraSignals]
  const cascade = evaluateCascade(ctx.decision, signals, ctx.prefs)
  if (!cascade.upgraded || !cascade.newTier) {
    return { upgraded: false, reason: cascade.reason, cascadeUpgrades: 0 }
  }

  return {
    upgraded: true,
    nextDecision: {
      ...ctx.decision,
      tier: cascade.newTier,
      fusionMode: cascade.newFusionMode ?? ctx.decision.fusionMode,
      cascadeEligible: false,
      basis: `${ctx.decision.basis}; cascade=${cascade.reason}`,
    },
    reason: cascade.reason,
    cascadeUpgrades: cascade.cascadeUpgrades,
  }
}

export function collectCascadeToolSignal(
  toolName: string,
  result: string,
  isError: boolean,
): CascadeSignal[] {
  if (!isError) return []
  const detail = `${toolName}: ${result.slice(0, 200)}`
  const signals: CascadeSignal[] = [{ kind: 'tool-error', detail }]
  if (
    /test|lint|jest|vitest|pytest|eslint|tsc/i.test(toolName)
    || /test failed|lint error|tests? failed|compilation failed/i.test(result)
  ) {
    signals.push({ kind: 'test-failure', detail })
  }
  return signals
}

export function emitProviderCacheLedger(
  sendEvent: (event: SessionEvent) => void,
  sessionId: string,
  ctx: RoutingTurnContext,
  cacheReadTokens: number,
  cacheCreationTokens: number,
  provider: string,
): void {
  if (cacheReadTokens <= 0 && cacheCreationTokens <= 0) return
  sendEvent({
    type: 'cache_ledger',
    sessionId,
    routing: {
      taskType: ctx.decision.taskType,
      complexity: ctx.decision.complexity,
      tier: ctx.decision.tier,
      fusionMode: ctx.decision.fusionMode,
      cascadeUpgrades: ctx.cascadeRetries,
    },
    layers: {
      l1Provider: {
        cacheReadTokens,
        cacheCreationTokens,
        provider,
      },
    },
    cost: {
      actual: null,
      estimated: null,
      savedByCache: cacheReadTokens > 0 ? cacheReadTokens : null,
    },
    timestamp: Date.now(),
  })
}

/** 测试专用：重置模块级缓存 */
export function resetSessionRoutingBridgeForTests(): void {
  trainedRouterCache = null
  executorByWorkspace.clear()
}
