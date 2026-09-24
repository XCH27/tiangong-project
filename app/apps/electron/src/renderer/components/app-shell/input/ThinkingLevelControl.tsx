import { useTranslation } from 'react-i18next'
import { Brain, Check, ChevronDown } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@craft-agent/ui'
import { DropdownMenu, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { StyledDropdownMenuContent, StyledDropdownMenuItem } from '@/components/ui/styled-dropdown'
import { cn } from '@/lib/utils'
import { getThinkingLevelNameKey, type ThinkingLevel, type ThinkingLevelDefinition } from '@craft-agent/shared/agent/thinking-levels'

interface ThinkingLevelControlProps {
  level: ThinkingLevel
  levels: readonly ThinkingLevelDefinition[]
  capabilityUnknown: boolean
  compact: boolean
  onChange?: (level: ThinkingLevel) => void
  onRequestFocus?: () => void
}

/** Direct composer control; the provider's declared effort list is the only menu source. */
export function ThinkingLevelControl({
  level,
  levels,
  capabilityUnknown,
  compact,
  onChange,
  onRequestFocus,
}: ThinkingLevelControlProps) {
  const { t } = useTranslation()
  if (!levels.length && !capabilityUnknown) return null

  const currentLabel = t(getThinkingLevelNameKey(level))
  const currentValid = levels.some(option => option.id === level)
  const hint = !levels.length
    ? `${currentLabel} · ${t('common.unknown')}`
    : currentValid ? currentLabel : `${currentLabel} · ${t('common.unavailable')}`
  const accessibleLabel = `${t('settings.ai.thinking')}: ${hint}`
  const selectable = !!onChange && levels.length > 0 && (levels.length > 1 || !currentValid)
  const content = <>
    <Brain className="h-3.5 w-3.5 shrink-0" />
    <span className={cn('max-w-32 truncate', compact && 'sr-only')}>{hint}</span>
    {selectable && <ChevronDown className="h-3 w-3 shrink-0 opacity-50" />}
  </>
  const controlClass = 'input-toolbar-btn inline-flex h-7 shrink-0 items-center gap-0.5 rounded-[6px] px-1.5 text-[13px] transition-colors select-none'

  if (!selectable) {
    return <Tooltip>
      <TooltipTrigger asChild>
        <span aria-label={accessibleLabel} tabIndex={0} className={cn(controlClass, 'text-foreground/50')}>{content}</span>
      </TooltipTrigger>
      <TooltipContent side="top">{accessibleLabel}</TooltipContent>
    </Tooltip>
  }

  return <DropdownMenu>
    <Tooltip>
      <TooltipTrigger asChild>
        <DropdownMenuTrigger asChild>
          <button type="button" aria-label={accessibleLabel} className={cn(controlClass, 'hover:bg-foreground/5 data-[state=open]:bg-foreground/5')}>
            {content}
          </button>
        </DropdownMenuTrigger>
      </TooltipTrigger>
      <TooltipContent side="top">{accessibleLabel}</TooltipContent>
    </Tooltip>
    <StyledDropdownMenuContent side="top" align="end" sideOffset={8} className="min-w-[220px]">
      {levels.map(({ id, nameKey, descriptionKey }) => (
        <StyledDropdownMenuItem
          key={id}
          onSelect={() => {
            onChange?.(id)
            if (onRequestFocus) requestAnimationFrame(onRequestFocus)
          }}
          className="flex cursor-pointer items-center justify-between rounded-lg px-2 py-2"
        >
          <span className="text-left">
            <span className="block text-sm font-medium">{t(nameKey)}</span>
            <span className="block text-xs text-muted-foreground">{t(descriptionKey)}</span>
          </span>
          {level === id && <Check className="ml-3 h-3 w-3 shrink-0 text-foreground" />}
        </StyledDropdownMenuItem>
      ))}
    </StyledDropdownMenuContent>
  </DropdownMenu>
}
