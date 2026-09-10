import { getModelDisplayName, getModelShortName, getModelProvider } from '@config/models'
import { ProviderBrandIcon } from '@/components/icons/ProviderBrandIcon'
import { cn } from '@/lib/utils'

interface ModelChipProps {
  /** Model id, e.g. 'claude-opus-4-7'. */
  model: string
  /** Show the short name ("Haiku") instead of the full display name ("Haiku 4.5"). */
  short?: boolean
  className?: string
}

/**
 * Read-only chip: provider brand icon + model name. Reuses the centralized
 * model registry (`@config/models`) and the bundled provider sprite so it
 * can't drift from the real model metadata and resolves every known vendor.
 */
export function ModelChip({ model, short = false, className }: ModelChipProps) {
  const provider = getModelProvider(model) ?? 'anthropic'
  const label = short ? getModelShortName(model) : getModelDisplayName(model)

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium',
        'bg-foreground/[0.04] text-foreground/70 ring-1 ring-foreground/[0.06]',
        className
      )}
    >
      <ProviderBrandIcon providerId={provider} size={12} className="rounded-[2px]" aria-hidden />
      <span className="min-w-0 truncate">{label}</span>
    </span>
  )
}
