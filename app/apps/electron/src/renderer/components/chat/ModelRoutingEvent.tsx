import * as React from 'react'
import { ArrowRight, Layers, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ModelRoutingEventView {
  type: 'model_routing_decision'
  sessionId: string
  taskType: string
  complexity: number
  tier: string
  fusionMode: string
  cascadeEligible: boolean
  basis: string
  hintOverrideReason?: string
  timestamp: number
}

const TIER_LABELS: Record<string, string> = {
  fast: 'Fast',
  balanced: 'Balanced',
  best: 'Best',
}

const FUSION_LABELS: Record<string, string> = {
  none: 'Single',
  synthesis: '综合',
  plan: '计划',
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

export function ModelRoutingEvent({ event }: { event: ModelRoutingEventView }) {
  const tierLabel = TIER_LABELS[event.tier] ?? event.tier
  const fusionLabel = FUSION_LABELS[event.fusionMode] ?? event.fusionMode

  return (
    <div className="flex items-center gap-1.5 px-3 py-1 text-[12px] text-muted-foreground select-none flex-wrap">
      <div className="w-3 h-3 flex items-center justify-center shrink-0">
        <Zap className="w-3 h-3 text-foreground/40" />
      </div>
      <Pill className="bg-foreground/8 text-foreground/70">
        Auto
      </Pill>
      <Pill>{event.taskType}</Pill>
      <ArrowRight className="w-3 h-3 text-foreground/30 shrink-0" />
      <Pill className="bg-info/10 text-info border-info/20">
        {tierLabel}
      </Pill>
      {event.fusionMode !== 'none' && (
        <Pill className="bg-success/10 text-success border-success/20">
          <Layers className="w-2.5 h-2.5" />
          {fusionLabel}
        </Pill>
      )}
      {event.cascadeEligible && (
        <Pill className="text-foreground/50">
          级联
        </Pill>
      )}
      {event.hintOverrideReason && (
        <span className="text-[11px] text-warning/70 italic">
          ↳ {event.hintOverrideReason}
        </span>
      )}
    </div>
  )
}
