/**
 * UsageLedger (T-USAGE v1)
 *
 * 自包含的只读展示组件。
 * - 仅渲染传入的真实数据（input/output/cache*）
 * - 没有真实数据时显示"未知"或省略"缓存命中"声明
 * - 真实 token / 估算 / 成本归属 严格视觉分离
 * - 本地/CLI 模型的成本明确标注为"无 API 费用"，绝不写成免费
 *
 * 使用方式（由主线后续接线）：
 *   <UsageLedger ledger={ledger} connectionName={conn?.name} />
 *
 * 不修改任何 AppShell / Stage / Inspector / ActionTicker / RightSidebar 共享壳。
 */

import React from 'react'

/**
 * 本地镜像类型（与 server-core/services/usage-ledger 的 UsageLedger 结构兼容）。
 * 组件保持自包含，不依赖 server-core 包。
 * 仅渲染传入的字段；字段含义见 usage-ledger.ts 注释。
 */
export interface UsageLedgerData {
  sessionId: string
  real: {
    inputTokens: number
    outputTokens: number
    cacheReadTokens?: number
    cacheCreationTokens?: number
  }
  reportedCostUsd: number
  costAttribution: 'provider-reported' | 'local-no-api-cost' | 'unknown'
  contextWindow?: number
  estimatedContextPercent?: number
  notes: string[]
}

export interface UsageLedgerProps {
  ledger: UsageLedgerData
  /** 可选：连接显示名（仅用于说明，不作为计费来源证明） */
  connectionName?: string
  /** 可选：模型名（仅说明） */
  model?: string
  className?: string
}

function formatTokens(n: number): string {
  return n.toLocaleString()
}

function formatPercent(p?: number): string {
  if (p === undefined) return '未知'
  return `${(p * 100).toFixed(1)}%`
}

function formatCost(ledger: UsageLedgerData): string {
  if (ledger.costAttribution === 'provider-reported') {
    return `$${ledger.reportedCostUsd.toFixed(6)}`
  }
  if (ledger.costAttribution === 'local-no-api-cost') {
    return '本地/CLI 运行（无 API 费用记录）'
  }
  return '未知（未报告或 0）'
}

function costKindLabel(kind: UsageLedgerData['costAttribution']): string {
  if (kind === 'provider-reported') return '真实（provider 上报）'
  if (kind === 'local-no-api-cost') return '本地运行（非 API 花费）'
  return '未知'
}

export function UsageLedger({ ledger, connectionName, model, className }: UsageLedgerProps) {
  const { real } = ledger

  const hasCache =
    real.cacheReadTokens !== undefined || real.cacheCreationTokens !== undefined

  const formatCacheValue = (value: number | undefined): string => {
    if (value === undefined) return '未报告'
    if (value === 0) return '0 (真实报告，无本次命中)'
    return `${formatTokens(value)} (真实)`
  }

  const isRealCost = ledger.costAttribution === 'provider-reported'
  const isLocalCost = ledger.costAttribution === 'local-no-api-cost'

  return (
    <div
      className={className}
      data-testid="usage-ledger"
      data-session-id={ledger.sessionId}
      style={{
        fontSize: 12,
        lineHeight: 1.5,
        padding: 8,
        border: '1px solid #e5e5e5',
        borderRadius: 6,
        background: '#fafafa',
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 6 }}>
        用量（真实数据优先）
        {connectionName ? ` · ${connectionName}` : ''}
        {model ? ` · ${model}` : ''}
      </div>

      {/* 真实 token 区块 */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ color: '#444', marginBottom: 2 }}>真实 Token（来自 provider / agent）</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '2px 12px' }}>
          <div>Input</div>
          <div data-testid="real-input" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {formatTokens(real.inputTokens)}
          </div>

          <div>Output</div>
          <div data-testid="real-output" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {formatTokens(real.outputTokens)}
          </div>
        </div>
      </div>

      {/* 缓存：只有真实报告的正值才展示具体数字；否则明确未知 */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ color: '#444', marginBottom: 2 }}>缓存（真实命中才显示）</div>
        {!hasCache && (
          <div data-testid="cache-unknown" style={{ color: '#777' }}>
            缓存读写：未知（本次会话未报告）
          </div>
        )}
        {hasCache && (
          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '2px 12px' }}>
            <div>Cache Read</div>
            <div data-testid="cache-read">
              {formatCacheValue(real.cacheReadTokens)}
            </div>

            <div>Cache Creation</div>
            <div data-testid="cache-create">
              {formatCacheValue(real.cacheCreationTokens)}
            </div>
          </div>
        )}
      </div>

      {/* 成本：真实 / 本地 / 未知 严格分开 */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ color: '#444', marginBottom: 2 }}>成本</div>
        <div data-testid="cost-line">
          <span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatCost(ledger)}</span>
          <span style={{ marginLeft: 8, color: '#666' }}>
            [{costKindLabel(ledger.costAttribution)}]
          </span>
        </div>
        {isLocalCost && (
          <div style={{ fontSize: 11, color: '#856404', marginTop: 2 }}>
            说明：外部网站 / 本地 CLI 不消耗 Fleet API token，不等于“免费”。
          </div>
        )}
        {isRealCost && (
          <div style={{ fontSize: 11, color: '#155724', marginTop: 2 }}>
            以上为 provider 实际报告的累计用量费用。
          </div>
        )}
      </div>

      {/* 估算区块（仅当有真实依据时才显示数字，否则未知） */}
      <div style={{ marginBottom: 6 }}>
        <div style={{ color: '#444', marginBottom: 2 }}>上下文（估算）</div>
        <div>
          窗口大小：{ledger.contextWindow ? formatTokens(ledger.contextWindow) : '未知'}
        </div>
        <div data-testid="context-percent">
          当前填充比例（估算）：{formatPercent(ledger.estimatedContextPercent)}
        </div>
      </div>

      {/* 边界说明（真实数据来源说明） */}
      {ledger.notes.length > 0 && (
        <div
          data-testid="usage-notes"
          style={{
            marginTop: 6,
            paddingTop: 6,
            borderTop: '1px dashed #ddd',
            fontSize: 11,
            color: '#666',
          }}
        >
          {ledger.notes.map((n: string, i: number) => (
            <div key={i}>• {n}</div>
          ))}
        </div>
      )}
    </div>
  )
}

export default UsageLedger
