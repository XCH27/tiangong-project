/**
 * Identity labels（团队身份 = craft 原标签系统的一种用途）
 *
 * 身份的唯一真相：`labels/config.json` 里 `kind==='identity'` 的标签 + 每个 session 的原 `labels`。
 * team rules 不再保存 identityTags/identityAssignments（docs/33 §1.2、§0-8）。
 *
 * 本文件 browser-safe：只有常量、类型与纯函数，没有 Node 依赖。
 */

import type { LabelConfig } from './types.ts'

/**
 * 队长身份标签 id。这是原标签系统里的特殊身份：
 * 给一个 session 加裸 `priority` 标签 = 升队长；取消 = 降队长。
 * 旧的 `priority::3` 数值标签不算队长，避免历史优先级数据误触发团队模式。
 * 队长唯一性由 SessionManager.setSessionLabels 原子保证（docs/33 §1.2）。
 */
export const LEADER_LABEL_ID = 'priority'

/** 默认身份标签预设（用于设置页种子 / 首次填充 LabelConfig 的 identity 标签）。 */
export interface IdentityLabelPreset {
  id: string
  name: string
  systemPromptPreset?: string
}

export const DEFAULT_IDENTITY_LABEL_PRESETS: readonly IdentityLabelPreset[] = Object.freeze([
  { id: LEADER_LABEL_ID, name: '队长', systemPromptPreset: '负责拆分任务、分派、汇总和验收，不绕过权限。' },
  { id: 'code', name: '代码' },
  { id: 'design', name: '设计' },
  { id: 'research', name: '审查', systemPromptPreset: '负责检查风险、回归和验收证据。' },
  { id: 'bug', name: '测试' },
  { id: 'writing', name: '上下文' },
])

/** 取一个 session label 原始串的标签 id（去掉 `::value` 部分）。 */
export function labelIdOf(rawLabel: string): string {
  return rawLabel.split('::')[0] ?? rawLabel
}

/** 递归收集 LabelConfig 树里所有 identity 标签（kind==='identity'）。 */
export function collectIdentityLabels(labels: readonly LabelConfig[]): LabelConfig[] {
  const out: LabelConfig[] = []
  const walk = (list: readonly LabelConfig[]): void => {
    for (const label of list) {
      if (label.kind === 'identity') out.push(label)
      if (label.children?.length) walk(label.children)
    }
  }
  walk(labels)
  return out
}

/**
 * 从一个 session 的扁平 `labels` 里挑出 identity 标签 id。
 * 只保留 `identityIds` 集合内的（即 LabelConfig 中声明为 identity 的）。
 */
export function identityLabelIdsOf(
  sessionLabels: readonly string[],
  identityIds: ReadonlySet<string>,
): string[] {
  const seen = new Set<string>()
  for (const raw of sessionLabels) {
    const id = labelIdOf(raw)
    if (id === LEADER_LABEL_ID && raw !== LEADER_LABEL_ID) continue
    if (identityIds.has(id)) seen.add(id)
  }
  return [...seen]
}

/** 该 session 是否带 leader 身份标签。 */
export function hasLeaderLabel(sessionLabels: readonly string[]): boolean {
  return sessionLabels.some(raw => raw === LEADER_LABEL_ID)
}

/** 返回去掉 leader 标签后的 labels（保留其它标签与 `::value`）。 */
export function withoutLeaderLabel(sessionLabels: readonly string[]): string[] {
  return sessionLabels.filter(raw => raw !== LEADER_LABEL_ID)
}
