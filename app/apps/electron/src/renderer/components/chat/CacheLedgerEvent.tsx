import * as React from 'react'
import { Database, Sparkles, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface CacheLedgerEventView {
  type: 'cache_ledger'
  sessionId: string
  routing: {
    taskType: string
    complexity: number
    tier: string
    fusionMode: string
    cascadeUpgrades: number
  }
  layers: {
    l1Provider?: {
      cacheReadTokens: number
      cacheCreationTokens: number
      provider: string
    }
    l2Exact?: {
      hit: boolean
    }
    l2Semantic?: {
      hit: boolean
      similarity: number
    }
    l3Panel?: {
      hits: number
      misses: number
    }
  }
  cost: {
    actual: number | null
    estimated: number | null
    savedByCache: number | null
  }
  timestamp: number
}

interface PillProps {
  children: React.ReactNode
  className?: string
}

function Pill({ children, className }: PillProps) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium leading-none',
      'bg-foreground/5 text-muted-foreground border border-foreground/10',
      className
    )}>
      {children}
    </span>
  )
}

function formatTokens(tokens: number): string {
  if (tokens >= 1000) {
    return `${(tokens / 1000).toFixed(1)}k`
  }
  return String(tokens)
}

function formatCost(value: number | null): string | null {
  if (value === null) return null
  if (value === 0) return '$0'
  if (value < 0.01) return `<$0.01`
  return `$${value.toFixed(2)}`
}

export function CacheLedgerEvent({ event }: { event: CacheLedgerEventView }) {
  const { layers, cost, routing } = event

  const l2Hit = layers.l2Exact?.hit === true
  const l2SemHit = layers.l2Semantic?.hit === true
  const l3 = layers.l3Panel
  const l3HasActivity = l3 && (l3.hits > 0 || l3.misses > 0)
  const l1 = layers.l1Provider
  const hasL1 = l1 && (l1.cacheReadTokens > 0 || l1.cacheCreationTokens > 0)

  const isFusion = routing.fusionMode !== 'none'
  const saved = cost.savedByCache
  const hasSaved = saved !== null && saved > 0

  return (
    <div className="flex items-center gap-1.5 px-3 py-1 text-[12px] text-muted-foreground select-none flex-wrap">
      <div className="w-3 h-3 flex items-center justify-center shrink-0">
        <Database className="w-3 h-3 text-foreground/40" />
      </div>

      {l2Hit && (
        <Pill className="bg-success/10 text-success border-success/20">
          <TrendingDown className="w-2.5 h-2.5" />
          缓存命中 L2
        </Pill>
      )}

      {l2SemHit && (
        <Pill className="bg-success/10 text-success border-success/20">
          <TrendingDown className="w-2.5 h-2.5" />
          语义缓存
          {layers.l2Semantic?.similarity != null && (
            <span className="text-foreground/50">
              · {(layers.l2Semantic.similarity * 100).toFixed(0)}%
            </span>
          )}
        </Pill>
      )}

      {isFusion && (
        <Pill className="bg-info/10 text-info border-info/20">
          <Sparkles className="w-2.5 h-2.5" />
          Fusion
          {l3HasActivity && (
            <span className="text-foreground/50">
              · {l3!.hits}P
            </span>
          )}
        </Pill>
      )}

      {!l2Hit && !l2SemHit && !isFusion && hasL1 && (
        <Pill className="text-foreground/50">
          P-cache
        </Pill>
      )}

      {hasSaved && (
        <Pill className="bg-success/5 text-success/80 border-success/15">
          省 {formatTokens(saved)}
        </Pill>
      )}

      {l1 && hasL1 && (
        <span className="text-[11px] text-foreground/40">
          {formatTokens(l1.cacheReadTokens)} read
        </span>
      )}

      {cost.actual !== null && cost.actual === 0 && (
        <span className="text-[11px] text-success/60">
          零 API
        </span>
      )}
    </div>
  )
}
