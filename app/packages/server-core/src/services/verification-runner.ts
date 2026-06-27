/**
 * 后置 Verification Runner — 接 craft 测试/lint/渲染能力做交叉取证
 *
 * 单一真相：docs/03 §5（后置 Verification）+ docs/16（外部 AI 审查诚实可观测）
 *
 * 设计要点：
 * - 用 1–2 个模型交叉取证（通过 QueryLlmAdapter 注入，不硬依赖 backend）。
 * - 信号源：schema 校验、测试结果、lint 结果、模型交叉验证。
 * - 每个信号独立打分，汇总成 passed/issues；不阻塞解析失败（降级为通过）。
 * - 诚实可观测：记录每个信号的来源（模型 id / 本机工具）、实际/估算状态。
 */

import type { QueryLlmAdapter } from './fusion-pipeline.ts'
import type { FusionConfig, FusionResult } from './fusion-types.ts'

// ---------------------------------------------------------------------------
// 信号源接口（本机工具侧，由调用方注入）
// ---------------------------------------------------------------------------

export type VerificationSignalKind = 'schema' | 'test' | 'lint' | 'render' | 'model-cross'

export interface VerificationSignal {
  kind: VerificationSignalKind
  source: string
  passed: boolean
  detail?: string
  /** 'actual' = 真实工具输出；'estimated' = 模型估算；'unknown' = 解析失败降级 */
  evidence: 'actual' | 'estimated' | 'unknown'
}

export interface VerificationHooks {
  validateSchema?: (actionPlan: unknown) => VerificationSignal | null
  runTests?: (actionPlan: unknown) => VerificationSignal | null
  runLint?: (actionPlan: unknown) => VerificationSignal | null
  runRender?: (actionPlan: unknown) => VerificationSignal | null
}

export interface VerificationReport {
  passed: boolean
  signals: VerificationSignal[]
  issues: string[]
  /** 诚实标注：每个信号的证据来源 */
  evidenceLedger: Array<{ kind: VerificationSignalKind; source: string; evidence: string }>
}

// ---------------------------------------------------------------------------
// 模型交叉验证 prompt
// ---------------------------------------------------------------------------

const CROSS_VERIFY_SYSTEM = `你是一个交叉验证者。你会收到一个最终答案/动作方案和原始任务。
请从以下维度检查：
1. 逻辑自洽性
2. 安全风险（如文件覆盖、权限越界、不可逆操作）
3. 边界情况遗漏
4. 与原始任务的对齐度

输出 JSON: { "passed": true/false, "issues": ["发现的问题"], "confidence": 0.0-1.0 }
只输出 JSON。`

// ---------------------------------------------------------------------------
// 主入口
// ---------------------------------------------------------------------------

export async function runVerificationWithSignals(
  fusionResult: FusionResult,
  originalPrompt: string,
  config: FusionConfig,
  queryLlm: QueryLlmAdapter,
  hooks?: VerificationHooks,
): Promise<VerificationReport> {
  const signals: VerificationSignal[] = []
  const issues: string[] = []

  if (hooks?.validateSchema) {
    const sig = safeHook(() => hooks.validateSchema!(fusionResult.actionPlan), 'schema', 'schema-validator')
    if (sig) { signals.push(sig); if (!sig.passed) issues.push(`schema: ${sig.detail ?? '校验失败'}`) }
  }
  if (hooks?.runTests) {
    const sig = safeHook(() => hooks.runTests!(fusionResult.actionPlan), 'test', 'test-runner')
    if (sig) { signals.push(sig); if (!sig.passed) issues.push(`test: ${sig.detail ?? '测试失败'}`) }
  }
  if (hooks?.runLint) {
    const sig = safeHook(() => hooks.runLint!(fusionResult.actionPlan), 'lint', 'lint-runner')
    if (sig) { signals.push(sig); if (!sig.passed) issues.push(`lint: ${sig.detail ?? 'lint 失败'}`) }
  }
  if (hooks?.runRender) {
    const sig = safeHook(() => hooks.runRender!(fusionResult.actionPlan), 'render', 'render-checker')
    if (sig) { signals.push(sig); if (!sig.passed) issues.push(`render: ${sig.detail ?? '渲染失败'}`) }
  }

  const modelSignals = await runModelCrossVerification(
    fusionResult,
    originalPrompt,
    config,
    queryLlm,
  )
  for (const sig of modelSignals) {
    signals.push(sig)
    if (!sig.passed) issues.push(`model-cross(${sig.source}): ${sig.detail ?? '模型发现问题'}`)
  }

  const passed = signals.length === 0 || signals.every(s => s.passed)
  const evidenceLedger = signals.map(s => ({
    kind: s.kind,
    source: s.source,
    evidence: s.evidence,
  }))

  return { passed, signals, issues, evidenceLedger }
}

function safeHook(
  fn: () => VerificationSignal | null,
  kind: VerificationSignalKind,
  defaultSource: string,
): VerificationSignal | null {
  try {
    return fn()
  } catch (err) {
    return {
      kind,
      source: defaultSource,
      passed: false,
      detail: err instanceof Error ? err.message : String(err),
      evidence: 'unknown',
    }
  }
}

async function runModelCrossVerification(
  fusionResult: FusionResult,
  originalPrompt: string,
  config: FusionConfig,
  queryLlm: QueryLlmAdapter,
): Promise<VerificationSignal[]> {
  if (!config.verification?.enabled) return []

  const verifyModels = config.verification.models ?? [config.judgeModel.modelId]
  const target = fusionResult.actionPlan
    ? JSON.stringify(fusionResult.actionPlan)
    : fusionResult.finalAnswer

  const results = await Promise.allSettled(
    verifyModels.slice(0, 2).map(modelId =>
      queryLlm(config.judgeModel.connectionSlug, modelId, `原始任务：${originalPrompt}\n\n待验证结果：${target}`, {
        systemPrompt: CROSS_VERIFY_SYSTEM,
        temperature: 0,
        maxTokens: 500,
        fusionDepth: config.fusionDepth + 1,
      }),
    ),
  )

  const signals: VerificationSignal[] = []
  for (let i = 0; i < results.length; i++) {
    const r = results[i]
    const modelId = verifyModels[i]
    if (r.status !== 'fulfilled') {
      signals.push({
        kind: 'model-cross',
        source: modelId,
        passed: true,
        detail: '模型调用失败，降级通过',
        evidence: 'unknown',
      })
      continue
    }
    try {
      const parsed = JSON.parse(r.value.text) as { passed?: boolean; issues?: string[]; confidence?: number }
      signals.push({
        kind: 'model-cross',
        source: modelId,
        passed: parsed.passed !== false,
        detail: parsed.issues?.join('; ') ?? (parsed.passed === false ? '模型发现问题' : '通过'),
        evidence: 'estimated',
      })
    } catch {
      signals.push({
        kind: 'model-cross',
        source: modelId,
        passed: true,
        detail: '模型输出解析失败，降级通过',
        evidence: 'unknown',
      })
    }
  }
  return signals
}
