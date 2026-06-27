/**
 * 输入瘦身（杠杆0）— 调用 docs/16 上下文效率中心能力
 *
 * 单一真相：docs/03 §6.1
 *
 * 本模块是路由/Fusion 与 docs/16 之间的薄适配层。
 * 实际瘦身能力（rtk/codegraph/Reasonix）归属 docs/16，这里只做调用 + 记账。
 * 当 docs/16 能力未就绪时，shape() 返回原始输入（no-op）。
 */

import type { TaskType } from './fusion-types.ts'

/** 瘦身后的上下文。 */
export interface ShapedContext {
  /** 瘦身后的消息文本（可能被 rtk 压缩了命令输出段）。 */
  shapedMessage: string
  /** 瘦身前估算 token。 */
  beforeTokens: number
  /** 瘦身后估算 token。 */
  afterTokens: number
  /** 使用了哪些瘦身工具。 */
  tools: string[]
}

/** 估算 token（粗略，chars/4）。 */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}

/**
 * 对输入做瘦身。
 *
 * 当前实现：no-op pass-through（docs/16 能力接入前的占位）。
 * 后续按 docs/16 就绪状态逐步接 rtk → codegraph → Reasonix。
 *
 * 硬约束（docs/26）：
 * - rtk 不自动装全局 hook、不改 shell 配置，启用走用户确认。
 * - 瘦身节省记「估算」，与真实 token 分开。
 */
export function shape(
  message: string,
  _taskType: TaskType,
  prefs: { rtk: boolean; codegraph: boolean; reasonixPrefix: boolean },
): ShapedContext {
  const beforeTokens = estimateTokens(message)
  let shapedMessage = message
  const tools: string[] = []

  // rtk：命令输出压缩（待 docs/16 接入）
  if (prefs.rtk) {
    tools.push('rtk(pending)')
  }

  // codegraph：用结构化查询替代整文件 Read（待 docs/16 接入）
  if (prefs.codegraph) {
    tools.push('codegraph(pending)')
  }

  // Reasonix：稳定前缀分层（待 docs/16 接入）
  if (prefs.reasonixPrefix) {
    tools.push('reasonix(pending)')
  }

  // 保守本地瘦身：空白规范化（不依赖外部 sidecar）
  if (prefs.rtk || prefs.codegraph || prefs.reasonixPrefix) {
    const normalized = message.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim()
    if (normalized !== message) {
      shapedMessage = normalized
      tools.push('whitespace-normalize')
    }
  }

  const afterTokens = estimateTokens(shapedMessage)

  return {
    shapedMessage,
    beforeTokens,
    afterTokens,
    tools,
  }
}
