import * as React from 'react'
import { ChevronDown } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@craft-agent/ui'
import { FadingText } from '@/components/ui/fading-text'
import { cn } from '@/lib/utils'

export interface FreeFormInputContextBadgeProps
  extends Omit<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    'children' | 'className' | 'onClick' | 'disabled'
  > {
  /** Left area - fully customizable (icon, avatar stack, etc.) */
  icon: React.ReactNode
  /** Label text - shown in expanded state or collapsed with selection */
  label: string
  /** Whether to show expanded state (icon + label + chevron) vs collapsed */
  isExpanded?: boolean
  /** Whether there's an active selection (affects collapsed state styling and shows label) */
  hasSelection?: boolean
  /** Show chevron indicator (for dropdowns) - only visible in expanded state */
  showChevron?: boolean
  /** Click handler */
  onClick?: () => void
  /** Tooltip content - can be string or ReactNode for rich content */
  tooltip?: React.ReactNode
  /** Whether the badge is currently "open" (e.g., dropdown is shown) */
  isOpen?: boolean
  /** Whether the badge is disabled */
  disabled?: boolean
  /** Render as non-interactive context while preserving the same slot metrics. */
  interactive?: boolean
  /** Additional className for the button */
  className?: string
  /** Ref forwarding for positioning dropdowns */
  buttonRef?: React.Ref<HTMLButtonElement>
  /** Data attribute for tutorials */
  'data-tutorial'?: string
}

/**
 * FreeFormInputContextBadge - Unified context badge for Sources, Files, and Folder selectors
 *
 * Visual States:
 * - Expanded: Icon + Label + Chevron, no background, hover shows background
 * - Collapsed (no selection): Icon only, no background, hover shows background
 * - Collapsed (has selection): Icon + Label (fading), bg-background + shadow-minimal
 * - Open: bg-foreground/5 (like hover)
 */
export const FreeFormInputContextBadge = React.forwardRef<HTMLButtonElement, FreeFormInputContextBadgeProps>(
  function FreeFormInputContextBadge(
    {
      icon,
      label,
      isExpanded = false,
      hasSelection = false,
      showChevron = false,
      onClick,
      tooltip,
      isOpen = false,
      disabled = false,
      interactive = true,
      className,
      buttonRef,
      'data-tutorial': dataTutorial,
      ...buttonProps
    },
    ref
  ) {
    // Radix `asChild` triggers inject pointer/keyboard/state props and a ref.
    // Keep those props intact: dropping them makes every context selector look
    // clickable while the trigger never opens its menu.
    const mergedRef = React.useCallback((node: HTMLButtonElement | null) => {
      if (typeof ref === 'function') ref(node)
      else if (ref) (ref as React.MutableRefObject<HTMLButtonElement | null>).current = node
      if (typeof buttonRef === 'function') buttonRef(node)
      else if (buttonRef) (buttonRef as React.MutableRefObject<HTMLButtonElement | null>).current = node
    }, [buttonRef, ref])

    // Show label in expanded state OR in collapsed state with selection
    const showLabel = isExpanded || hasSelection

    const sharedClassName = cn(
      "input-toolbar-btn inline-flex items-center gap-1.5 h-7 rounded-[6px] text-[13px] text-foreground transition-colors select-none shrink min-w-0",
      "disabled:opacity-50 disabled:pointer-events-none",
      showLabel ? "px-2" : "px-1.5",
      !isExpanded && hasSelection && "bg-background border border-foreground/5 mx-0.5",
      interactive && !(!isExpanded && hasSelection) && "hover:bg-foreground/5",
      isOpen && "bg-foreground/5",
      className,
    )

    const content = (
      <>
        <span className="shrink-0 flex items-center">{icon}</span>
        {showLabel && (
          isExpanded ? (
            <span className={cn("truncate max-w-[120px] min-w-0 shrink", !hasSelection && "opacity-50")}>{label}</span>
          ) : (
            <FadingText className="max-w-[140px] min-w-0 shrink" fadeWidth={20}>{label}</FadingText>
          )
        )}
        {isExpanded && showChevron && <ChevronDown className="h-3 w-3 opacity-50 shrink-0" />}
      </>
    )

    const button = interactive ? (
      <button
        {...buttonProps}
        ref={mergedRef}
        type={buttonProps.type ?? 'button'}
        aria-label={buttonProps['aria-label'] ?? label}
        onClick={onClick}
        disabled={disabled}
        data-tutorial={dataTutorial}
        className={sharedClassName}
      >
        {content}
      </button>
    ) : (
      <span aria-label={label} className={sharedClassName}>{content}</span>
    )

    // Wrap with tooltip if provided (skip when dropdown is open to avoid showing tooltip)
    if (tooltip && !isOpen) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            {button}
          </TooltipTrigger>
          <TooltipContent side="top">
            {tooltip}
          </TooltipContent>
        </Tooltip>
      )
    }

    return button
  }
)
