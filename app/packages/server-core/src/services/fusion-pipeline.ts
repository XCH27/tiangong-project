/**
 * Fusion 流水线 — Synthesis + Plan + 后置 Verification
 *
 * 单一真相：docs/03 §5
 *
 * 架构：Panel（2–3 互补模型并行）→ Judge 结构化 JSON → Writer 综合终答
 *       + 可选后置 Verification（交叉取证）
 *
 * 依赖：AgentBackend.queryLlm()（已有）做模型调用；fusion-cache.ts 做 L3 缓存。
 * 递归保护：fusionDepth 标记，panelist 不能再触发 Fusion。
 */

import type {
  PanelMember,
  PanelResult,
  JudgeAnalysis,
  FusionConfig,
  FusionResult,
  RoutingDecision,
} from './fusion-types.ts'
import { lookupPanel, writePanel } from './fusion-cache.ts'
import {
  runVerificationWithSignals,
  type VerificationHooks,
} from './verification-runner.ts'

// ---------------------------------------------------------------------------
// queryLlm 适配器接口
// ---------------------------------------------------------------------------

/**
 * 模型调用适配器。
 * 实现侧绑定到 AgentBackend.queryLlm()（Pi/Claude 都有）。
 */
export interface QueryLlmAdapter {
  (
    connectionSlug: string,
    modelId: string,
    prompt: string,
    options?: {
      systemPrompt?: string
      maxTokens?: number
      temperature?: number
      outputSchema?: Record<string, unknown>
      fusionDepth?: number
    },
  ): Promise<{ text: string; usage?: { inputTokens: number; outputTokens: number; cacheReadTokens?: number; cacheCreationTokens?: number } }>
}

// ---------------------------------------------------------------------------
// Panel 执行（并行 + L3 缓存 + 部分失败容错）
// ---------------------------------------------------------------------------

/**
 * 并行执行 Panel。每个成员独立超时；≥1 成功才进判官；全失败返回空数组。
 *
 * L3 Panel 缓存：每个成员先查缓存，命中跳过 API 调用。
 */
export async function runPanel(
  members: PanelMember[],
  prompt: string,
  systemPrompt: string,
  stablePrefixHash: string,
  queryLlm: QueryLlmAdapter,
  fusionDepth: number,
  panelCacheEnabled?: boolean,
): Promise<PanelResult[]> {
  const results = await Promise.allSettled(
    members.map(async (member): Promise<PanelResult> => {
      const start = Date.now()

      // L3 缓存查询
      const panelCacheOn = panelCacheEnabled === true
      if (panelCacheOn) {
        const cached = lookupPanel(member.modelId, stablePrefixHash, prompt)
        if (cached.hit && cached.entry) {
          return {
            member,
            answer: cached.entry.payload.answer,
            cacheHit: true,
            durationMs: Date.now() - start,
          }
        }
      }

      // 实际调用（带超时）
      const result = await Promise.race([
        queryLlm(member.connectionSlug, member.modelId, prompt, {
          systemPrompt,
          fusionDepth: fusionDepth + 1,
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`Panel timeout: ${member.modelId} (${member.timeoutMs}ms)`)), member.timeoutMs),
        ),
      ])

      const answer = result.text

      // 写 L3 缓存
      if (panelCacheOn) {
        writePanel(member.modelId, stablePrefixHash, prompt, answer, member)
      }

      return {
        member,
        answer,
        cacheHit: false,
        durationMs: Date.now() - start,
      }
    }),
  )

  // 收集成功结果
  const panelResults: PanelResult[] = []
  for (let i = 0; i < results.length; i++) {
    const r = results[i]
    if (r.status === 'fulfilled') {
      panelResults.push(r.value)
    } else {
      // 部分失败：记录错误但不拖垮全局
      panelResults.push({
        member: members[i],
        answer: '',
        error: r.reason instanceof Error ? r.reason.message : String(r.reason),
        cacheHit: false,
        durationMs: 0,
      })
    }
  }

  return panelResults
}

// ---------------------------------------------------------------------------
// Judge 结构化分析
// ---------------------------------------------------------------------------

const JUDGE_SYSTEM_PROMPT = `你是一个严格的结构化分析判官。你会收到多个模型对同一问题的回答。
你的任务是输出结构化 JSON 分析，而不是直接选赢家。

输出 JSON schema:
{
  "consensus": ["所有模型一致同意的点"],
  "contradictions": ["模型间矛盾的点"],
  "partialCoverage": ["只有部分模型覆盖的点"],
  "uniqueInsights": ["某个模型独有的洞见"],
  "blindSpots": ["所有模型都遗漏的点"],
  "shouldFuse": true/false
}

shouldFuse: 如果问题简单、所有回答基本一致且正确，设为 false（不需要综合，直接用最好的回答）。
只有当存在矛盾/遗漏/需要综合时才设为 true。

只输出 JSON，不要其他文字。`

/**
 * Judge 分析。用强模型、temp=0。
 */
export async function runJudge(
  panelResults: PanelResult[],
  originalPrompt: string,
  config: FusionConfig,
  queryLlm: QueryLlmAdapter,
): Promise<JudgeAnalysis> {
  const successful = panelResults.filter(r => !r.error && r.answer)

  // 少于 1 个成功 → 无法 judge
  if (successful.length === 0) {
    return {
      consensus: [],
      contradictions: ['所有 panelist 失败'],
      partialCoverage: [],
      uniqueInsights: [],
      blindSpots: ['无法分析：无有效回答'],
      shouldFuse: false,
    }
  }

  // 只有 1 个成功 → 不需要综合
  if (successful.length === 1) {
    return {
      consensus: [successful[0].answer],
      contradictions: [],
      partialCoverage: [],
      uniqueInsights: [],
      blindSpots: [],
      shouldFuse: false,
    }
  }

  const panelText = successful
    .map((r, i) => `--- 模型 ${i + 1} (${r.member.role}) ---\n${r.answer}`)
    .join('\n\n')

  const judgePrompt = `原始问题：\n${originalPrompt}\n\n各模型回答：\n${panelText}\n\n请输出结构化分析 JSON。`

  const result = await queryLlm(
    config.judgeModel.connectionSlug,
    config.judgeModel.modelId,
    judgePrompt,
    {
      systemPrompt: JUDGE_SYSTEM_PROMPT,
      temperature: 0,
      maxTokens: 2000,
      fusionDepth: config.fusionDepth + 1,
    },
  )

  // JSON 解析容错（docs/03 §13.2）
  try {
    const parsed = JSON.parse(result.text) as JudgeAnalysis
    return {
      consensus: parsed.consensus ?? [],
      contradictions: parsed.contradictions ?? [],
      partialCoverage: parsed.partialCoverage ?? [],
      uniqueInsights: parsed.uniqueInsights ?? [],
      blindSpots: parsed.blindSpots ?? [],
      shouldFuse: parsed.shouldFuse ?? true,
    }
  } catch {
    // 一次重试：让模型修复 JSON
    try {
      const retry = await queryLlm(
        config.judgeModel.connectionSlug,
        config.judgeModel.modelId,
        `上一个输出不是合法 JSON。请修复并只输出 JSON。\n\n${result.text}`,
        { systemPrompt: JUDGE_SYSTEM_PROMPT, temperature: 0, maxTokens: 2000, fusionDepth: config.fusionDepth + 1 },
      )
      return JSON.parse(retry.text) as JudgeAnalysis
    } catch {
      // 再失败 → 降级：不综合，取第一个成功回答
      return {
        consensus: [successful[0].answer],
        contradictions: [],
        partialCoverage: [],
        uniqueInsights: [],
        blindSpots: [],
        shouldFuse: false,
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Writer 综合终答
// ---------------------------------------------------------------------------

const SYNTHESIS_WRITER_SYSTEM = `你是一个综合写作者。你将收到原始问题和一份结构化分析（共识/矛盾/覆盖/洞见/盲点）。
请综合这些信息写出最终答案。关掉所有外部工具——只扎根于这次审议。
不要简单拼接，要综合。`

const PLAN_WRITER_SYSTEM = `你是一个动作方案综合器。你将收到原始任务和多个模型各自提出的动作方案 + 结构化分析。
请综合出唯一可执行的动作序列。输出必须是合法的结构化格式。
不要简单拼接，要择优综合。`

/**
 * Writer 综合终答。
 * - Synthesis：写文本终答，关外部工具，用最强模型。
 * - Plan：产唯一可执行动作序列，保 structuredOutput。
 */
export async function runWriter(
  decision: RoutingDecision,
  panelResults: PanelResult[],
  judgeAnalysis: JudgeAnalysis,
  originalPrompt: string,
  config: FusionConfig,
  queryLlm: QueryLlmAdapter,
): Promise<{ finalAnswer: string; actionPlan?: unknown }> {
  // Judge 说不需要综合 → 取最好的回答（consensus[0] 或第一个成功）
  if (!judgeAnalysis.shouldFuse) {
    const successful = panelResults.find(r => !r.error && r.answer)
    return { finalAnswer: successful?.answer ?? '（Fusion 失败：无有效回答）' }
  }

  const analysisText = `共识：${judgeAnalysis.consensus.join('; ')}
矛盾：${judgeAnalysis.contradictions.join('; ')}
部分覆盖：${judgeAnalysis.partialCoverage.join('; ')}
独有洞见：${judgeAnalysis.uniqueInsights.join('; ')}
盲点：${judgeAnalysis.blindSpots.join('; ')}`

  const panelText = panelResults
    .filter(r => !r.error && r.answer)
    .map((r, i) => `--- 方案 ${i + 1} (${r.member.role}) ---\n${r.answer}`)
    .join('\n\n')

  const isPlan = decision.fusionMode === 'plan'
  const systemPrompt = isPlan ? PLAN_WRITER_SYSTEM : SYNTHESIS_WRITER_SYSTEM
  const writerPrompt = isPlan
    ? `原始任务：\n${originalPrompt}\n\n各方案：\n${panelText}\n\n结构化分析：\n${analysisText}\n\n请综合出唯一可执行的动作序列。`
    : `原始问题：\n${originalPrompt}\n\n结构化分析：\n${analysisText}\n\n请写出最终答案。`

  const result = await queryLlm(
    config.writerModel.connectionSlug,
    config.writerModel.modelId,
    writerPrompt,
    {
      systemPrompt,
      maxTokens: 4000,
      fusionDepth: config.fusionDepth + 1,
      ...(isPlan ? { outputSchema: { type: 'object' } } : {}),
    },
  )

  return {
    finalAnswer: result.text,
    actionPlan: isPlan ? safeParseJson(result.text) : undefined,
  }
}

// ---------------------------------------------------------------------------
// 后置 Verification（可选）
// ---------------------------------------------------------------------------

const VERIFICATION_SYSTEM = `你是一个验证者。你会收到一个最终答案/动作方案和原始任务。
请检查：
1. 逻辑是否自洽
2. 是否有明显的安全风险
3. 是否有遗漏的边界情况

输出 JSON: { "passed": true/false, "issues": ["发现的问题"] }`

/**
 * 后置验证：1–2 个模型对结果交叉取证。
 * 不是每个 Fusion 必走——由 config.verification.enabled 控制。
 */
export async function runVerification(
  finalAnswer: string,
  actionPlan: unknown,
  originalPrompt: string,
  config: FusionConfig,
  queryLlm: QueryLlmAdapter,
): Promise<boolean> {
  if (!config.verification?.enabled) return true

  const verifyModels = config.verification.models ?? [config.judgeModel.modelId]
  const target = actionPlan ? JSON.stringify(actionPlan) : finalAnswer

  const results = await Promise.allSettled(
    verifyModels.slice(0, 2).map(modelId =>
      queryLlm(config.judgeModel.connectionSlug, modelId, `原始任务：${originalPrompt}\n\n待验证结果：${target}`, {
        systemPrompt: VERIFICATION_SYSTEM,
        temperature: 0,
        maxTokens: 500,
        fusionDepth: config.fusionDepth + 1,
      }),
    ),
  )

  // 全部通过才算通过
  for (const r of results) {
    if (r.status !== 'fulfilled') continue
    try {
      const parsed = JSON.parse(r.value.text) as { passed?: boolean; issues?: string[] }
      if (parsed.passed === false) return false
    } catch {
      // 解析失败 → 视为通过（不阻塞）
    }
  }

  return true
}

// ---------------------------------------------------------------------------
// Plan Fusion 执行回调（可选注入，避免硬依赖 SessionManager）
// ---------------------------------------------------------------------------

export interface PlanFusionExecutionResult {
  executedDesignActions: unknown[]
  executedInternalActions: unknown[]
  errors: Array<{ index: number; error: string }>
}

export interface PlanFusionHook {
  (fusionResult: FusionResult): Promise<PlanFusionExecutionResult>
}

export type FusionResultWithPlan = FusionResult & {
  planExecution?: PlanFusionExecutionResult
}

// ---------------------------------------------------------------------------
// 主入口：runFusion()
// ---------------------------------------------------------------------------

/**
 * Fusion 流水线主入口。
 *
 * 全失败降级：所有 panelist 失败时，返回单模型直答 + 提示。
 *
 * Plan Fusion：当 decision.fusionMode === 'plan' 且 Writer 产出 actionPlan 时，
 * 若调用方注入了 planExecutor 回调，则把 actionPlan 转成 DesignAction/InternalAction
 * 并经 permission+timeline 执行（不硬依赖 SessionManager）。
 *
 * @returns FusionResultWithPlan — 包含终答、panel 结果、judge 分析、验证结果、token/成本汇总、可选 plan 执行结果。
 */
export async function runFusion(
  decision: RoutingDecision,
  prompt: string,
  systemPrompt: string,
  config: FusionConfig,
  queryLlm: QueryLlmAdapter,
  stablePrefixHash: string,
  planExecutor?: PlanFusionHook,
  verificationHooks?: VerificationHooks,
): Promise<FusionResultWithPlan> {
  const cascadeUpgrades = 0

  // 1. Panel 并行（含 L3 缓存）
  const panelResults = await runPanel(
    config.panel,
    prompt,
    systemPrompt,
    stablePrefixHash,
    queryLlm,
    config.fusionDepth,
    config.panelCacheEnabled,
  )

  const successful = panelResults.filter(r => !r.error && r.answer)

  // 全失败 → 降级单模型直答
  if (successful.length === 0) {
    const fallback = await queryLlm(
      config.writerModel.connectionSlug,
      config.writerModel.modelId,
      prompt,
      { systemPrompt, fusionDepth: config.fusionDepth + 1 },
    ).catch(() => ({ text: '⚠️ Fusion 流水线全部失败，且降级单模型也失败。请检查模型连接。', usage: undefined }))

    return {
      finalAnswer: fallback.text,
      panelResults,
      judgeAnalysis: { consensus: [], contradictions: ['全失败'], partialCoverage: [], uniqueInsights: [], blindSpots: [], shouldFuse: false },
      totalTokens: fallback.usage?.inputTokens ?? 0,
      totalCostUsd: 0,
      cascadeUpgrades,
      verificationPassed: undefined,
    }
  }

  // 2. Judge 结构化分析
  const judgeAnalysis = await runJudge(panelResults, prompt, config, queryLlm)

  // 3. Writer 综合终答
  const { finalAnswer, actionPlan } = await runWriter(
    decision,
    panelResults,
    judgeAnalysis,
    prompt,
    config,
    queryLlm,
  )

  // 3.5 Plan Fusion：执行 actionPlan（若注入了回调）
  let planExecutionResult: PlanFusionExecutionResult | undefined
  if (decision.fusionMode === 'plan' && actionPlan && planExecutor) {
    try {
      const partialResult: FusionResult = {
        finalAnswer,
        actionPlan,
        panelResults,
        judgeAnalysis,
        verificationPassed: undefined,
        totalTokens: 0,
        totalCostUsd: 0,
        cascadeUpgrades,
      }
      planExecutionResult = await planExecutor(partialResult)
    } catch {
      planExecutionResult = { executedDesignActions: [], executedInternalActions: [], errors: [{ index: -1, error: 'plan executor threw' }] }
    }
  }

  // 4. 后置 Verification（可选）
  let verificationPassed: boolean | undefined
  if (config.verification?.enabled) {
    const partialForVerify: FusionResult = {
      finalAnswer,
      actionPlan,
      panelResults,
      judgeAnalysis,
      verificationPassed: undefined,
      totalTokens: 0,
      totalCostUsd: 0,
      cascadeUpgrades,
    }
    const report = await runVerificationWithSignals(
      partialForVerify,
      prompt,
      config,
      queryLlm,
      verificationHooks,
    )
    verificationPassed = report.passed
  } else {
    verificationPassed = undefined
  }

  // 5. 汇总 token/成本（粗略估算）
  const totalTokens = panelResults.reduce((sum, r) => sum + (r.cacheHit ? 0 : 1000), 0) + 2000

  return {
    finalAnswer,
    actionPlan,
    panelResults,
    judgeAnalysis,
    verificationPassed,
    totalTokens,
    totalCostUsd: 0, // 实际成本由调用方按 connection 单价算
    cascadeUpgrades,
    planExecution: planExecutionResult,
  }
}

// ---------------------------------------------------------------------------
// 工具
// ---------------------------------------------------------------------------

function safeParseJson(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    // 尝试提取 JSON 块
    const match = text.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (match) {
      try { return JSON.parse(match[1]) } catch { /* fall through */ }
    }
    return null
  }
}
