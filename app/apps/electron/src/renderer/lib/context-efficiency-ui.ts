/**
 * Shared labels, validation, and section-state helpers for Context Efficiency UI.
 */

import type { ContextSignalConfidence, ExternalReviewJobStatus } from '@craft-agent/shared/protocol'

export type SectionPhase = 'empty' | 'loading' | 'error' | 'ready'

export type AsyncLoadState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'done'; data: T }

export const METRIC_KIND_LABEL: Record<ContextSignalConfidence, string> = {
  real: '真实',
  estimate: '估算',
  unknown: '未知',
}

export const METRIC_KIND_CLASS: Record<ContextSignalConfidence, string> = {
  real: 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-500/20',
  estimate: 'bg-amber-500/10 text-amber-900 dark:text-amber-200 border-amber-500/20',
  unknown: 'bg-muted text-muted-foreground border-border/60',
}

export const FLEET_TOKEN_EXTERNAL_REVIEW_NOTE =
  '外部网站审查不消耗 Fleet API token；这不等于免费，外部平台成本仍可能未知或由该平台单独计费。'

export const MANUAL_PASTE_PRIVACY_NOTE =
  '只保存你手动粘贴的内容，不自动登录、不自动抓网页、不读取 cookies/token。'

export const JOB_STATUS_LABEL: Record<ExternalReviewJobStatus, string> = {
  pending_auth: '待授权（需人工确认）',
  submitted: '已提交（人工操作）',
  awaiting_result: '等待外部结果',
  completed: '已完成',
  failed: '失败',
}

export const JOB_STATUS_CLASS: Record<ExternalReviewJobStatus, string> = {
  pending_auth: 'text-amber-800 dark:text-amber-200',
  submitted: 'text-sky-800 dark:text-sky-200',
  awaiting_result: 'text-violet-800 dark:text-violet-200',
  completed: 'text-emerald-800 dark:text-emerald-300',
  failed: 'text-destructive',
}

export const REVIEW_READINESS_LABEL: Record<string, string> = {
  ready: '可准备外部审查',
  blocked: '被 secret 阻断',
  needs_pack: '需要先生成项目包',
  unknown: '状态未知',
}

export const TOOL_SOURCE_LABEL: Record<string, string> = {
  'system-path': '系统 PATH',
  'login-shell-path': 'Login shell PATH',
  bundled: 'Fleet 内置',
  override: '用户 override',
  unknown: '未知来源',
}

export function deriveSectionPhase<T>(
  state: AsyncLoadState<T>,
  options?: { emptyWhen?: (data: T) => boolean },
): SectionPhase {
  if (state.status === 'loading') return 'loading'
  if (state.status === 'error') return 'error'
  if (state.status === 'idle') return 'empty'
  if (options?.emptyWhen?.(state.data)) return 'empty'
  return 'ready'
}

export function validateRequiredText(value: string, fieldLabel: string): string | null {
  if (!value.trim()) return `${fieldLabel} 不能为空`
  return null
}

export function validateWorkspacePath(value: string): string | null {
  const err = validateRequiredText(value, '项目路径')
  if (err) return err
  if (value.trim().length < 2) return '项目路径过短，请填写有效 workspacePath'
  return null
}

export function validateBundleId(value: string): string | null {
  const err = validateRequiredText(value, 'bundleId')
  if (err) return err
  return null
}

export function validatePasteOutput(value: string): string | null {
  const err = validateRequiredText(value, '粘贴内容')
  if (err) return err
  if (value.trim().length < 8) return '粘贴内容过短，请确认已完整复制外部审查结果'
  return null
}

export function formatExternalCostKind(kind: 'actual' | 'estimate' | 'unknown'): string {
  if (kind === 'actual') return '外部成本（真实）'
  if (kind === 'estimate') return '外部成本（估算）'
  return '外部成本（未知）'
}
