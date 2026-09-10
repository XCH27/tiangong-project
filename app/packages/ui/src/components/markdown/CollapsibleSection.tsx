import * as React from 'react'
import { ChevronRight } from 'lucide-react'
import { cn } from '../../lib/utils'

/**
 * Collapsible content wrapper. Fade-only: the motion spec forbids animating
 * height, and expanding a heading is a tens-per-day action.
 */
function AnimatedCollapsibleContent({ isOpen, children }: { isOpen: boolean; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        'overflow-hidden transition-opacity duration-200 ease-out',
        isOpen ? 'opacity-100' : 'opacity-0'
      )}
      aria-hidden={!isOpen}
    >
      {children}
    </div>
  )
}

interface CollapsibleSectionProps {
  sectionId: string
  headingLevel: number
  isCollapsed: boolean
  onToggle: (sectionId: string) => void
  children: React.ReactNode
}

/**
 * CollapsibleSection
 *
 * Renders a markdown section with a collapsible heading.
 * - First child is the heading (rendered as trigger)
 * - Remaining children are the content (collapsible)
 * - Chevron appears on hover, rotates when expanded
 * - Only H1-H4 are collapsible; H5-H6 render normally
 */
export function CollapsibleSection({
  sectionId,
  headingLevel,
  isCollapsed,
  onToggle,
  children,
}: CollapsibleSectionProps) {
  // Extract heading (first child) and content (rest)
  const childArray = React.Children.toArray(children)
  const heading = childArray[0]
  const content = childArray.slice(1)

  // Only make H1-H4 collapsible
  if (headingLevel > 4) {
    return <>{children}</>
  }

  const isExpanded = !isCollapsed
  const hasContent = content.length > 0

  return (
    <div className="markdown-collapsible-section" data-section-id={sectionId}>
      {/* Heading with toggle trigger */}
      <div
        className={cn(
          'relative group',
          hasContent && 'cursor-pointer'
        )}
        onClick={() => hasContent && onToggle(sectionId)}
      >
        {/* Chevron - always visible when collapsed, hover-only when expanded */}
        {/* Chevron - always visible when collapsed, hover-only when expanded */}
        <div
          className={cn(
            'absolute -left-4 top-[5px] select-none transition-transform duration-200 ease-out',
            isExpanded && 'rotate-90',
            !hasContent && 'opacity-0',
            hasContent && isCollapsed && 'opacity-100',
            hasContent && isExpanded && 'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100'
          )}
        >
          <ChevronRight className="h-3 w-3 text-muted-foreground" />
        </div>

        {/* Heading content */}
        {heading}
      </div>

      {/* Collapsible content */}
      {hasContent && (
        <AnimatedCollapsibleContent isOpen={isExpanded}>
          <div className="collapsible-section-content">
            {content}
          </div>
        </AnimatedCollapsibleContent>
      )}
    </div>
  )
}
