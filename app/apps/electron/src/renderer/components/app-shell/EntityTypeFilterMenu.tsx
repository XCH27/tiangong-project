/**
 * The type filter for a resource list, as one header control.
 *
 * Sources and Automations each used to publish their types as sidebar rows —
 * APIs, MCPs, Scheduled, Event-based, Agentic. Five rows that were not places:
 * every one navigated to the same list with a single predicate applied, and
 * their presence pushed the person's actual work below four configuration
 * surfaces.
 *
 * A predicate over one list belongs to that list. This renders in the panel
 * header beside the session filter that was already there, uses the same
 * trigger treatment when active, and drives the same routes the sidebar rows
 * drove — so `sources/api` and `automations/scheduled` links from anywhere else
 * still land exactly where they did.
 */

import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Bot, Check, Clock, DatabaseZap, Globe, ListFilter, ListTodo, Radio } from 'lucide-react'

import { HeaderIconButton } from '@/components/ui/HeaderIconButton'
import { McpIcon } from '@/components/icons/McpIcon'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  StyledDropdownMenuContent,
  StyledDropdownMenuItem,
} from '@/components/ui/styled-dropdown'

export interface EntityTypeFilterOption {
  /** Stable id; `null` is the unfiltered list. */
  id: string | null
  labelKey: string
  icon: React.ReactNode
  /** How many items carry this type. Shown trailing, like a sidebar count. */
  count?: number
  onSelect: () => void
}

export interface EntityTypeFilterMenuProps {
  /** Currently applied type, or `null` when the whole list is shown. */
  activeId: string | null
  options: readonly EntityTypeFilterOption[]
  /** Tooltip and accessible name for the trigger. */
  tooltip: string
}

export function EntityTypeFilterMenu({ activeId, options, tooltip }: EntityTypeFilterMenuProps) {
  const { t } = useTranslation()
  const isFiltered = activeId !== null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <HeaderIconButton
          icon={<ListFilter className="h-4 w-4" />}
          tooltip={tooltip}
          // Same active treatment as the session filter one slot over: a tinted
          // shadow on the accent, so "a filter is on" reads identically in both.
          className={isFiltered ? 'bg-accent/5 text-accent rounded-[8px] shadow-tinted' : 'rounded-[8px]'}
          style={isFiltered ? ({ '--shadow-color': 'var(--accent-rgb)' } as React.CSSProperties) : undefined}
        />
      </DropdownMenuTrigger>
      <StyledDropdownMenuContent align="end" light minWidth="min-w-[180px]">
        {options.map((option) => (
          <StyledDropdownMenuItem
            key={option.id ?? 'all'}
            onClick={option.onSelect}
            className="gap-2"
          >
            <span className="flex h-4 w-4 shrink-0 items-center justify-center [&_svg]:h-3.5 [&_svg]:w-3.5">
              {option.icon}
            </span>
            <span className="flex-1 truncate">{t(option.labelKey)}</span>
            {option.count !== undefined && (
              <span className="text-xs text-foreground/30 tabular-nums">{option.count}</span>
            )}
            {option.id === activeId && <Check className="h-3 w-3 text-muted-foreground" />}
          </StyledDropdownMenuItem>
        ))}
      </StyledDropdownMenuContent>
    </DropdownMenu>
  )
}

/**
 * The two concrete menus. Their option tables live here rather than at the call
 * site because AppShell is already 4,000 lines and the file-size ratchet is the
 * reason that number stopped climbing.
 */

export function SourceTypeFilterMenu(props: {
  activeType: string | null
  totalCount: number
  apiCount: number
  mcpCount: number
  onAll: () => void
  onApi: () => void
  onMcp: () => void
}) {
  const { t } = useTranslation()
  return (
    <EntityTypeFilterMenu
      tooltip={t('sidebar.sources')}
      activeId={props.activeType}
      options={[
        { id: null, labelKey: 'common.all', icon: <DatabaseZap />, count: props.totalCount, onSelect: props.onAll },
        { id: 'api', labelKey: 'sidebar.apis', icon: <Globe />, count: props.apiCount, onSelect: props.onApi },
        { id: 'mcp', labelKey: 'sidebar.mcps', icon: <McpIcon className="h-3.5 w-3.5" />, count: props.mcpCount, onSelect: props.onMcp },
      ]}
    />
  )
}

export function AutomationTypeFilterMenu(props: {
  activeType: string | null
  totalCount: number
  scheduledCount: number
  eventCount: number
  agenticCount: number
  onAll: () => void
  onScheduled: () => void
  onEvent: () => void
  onAgentic: () => void
}) {
  const { t } = useTranslation()
  return (
    <EntityTypeFilterMenu
      tooltip={t('sidebar.automations')}
      activeId={props.activeType}
      options={[
        { id: null, labelKey: 'common.all', icon: <ListTodo />, count: props.totalCount, onSelect: props.onAll },
        { id: 'scheduled', labelKey: 'sidebar.scheduled', icon: <Clock />, count: props.scheduledCount, onSelect: props.onScheduled },
        { id: 'event', labelKey: 'sidebar.eventBased', icon: <Radio />, count: props.eventCount, onSelect: props.onEvent },
        { id: 'agentic', labelKey: 'sidebar.agentic', icon: <Bot />, count: props.agenticCount, onSelect: props.onAgentic },
      ]}
    />
  )
}
