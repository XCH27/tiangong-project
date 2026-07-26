import type { LucideIcon } from "lucide-react"
import * as React from "react"
import { AnimatePresence, motion } from "motion/react"
import { ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  ContextMenu,
  ContextMenuTrigger,
  StyledContextMenuContent,
} from '@/components/ui/styled-context-menu'
import { ContextMenuProvider } from '@/components/ui/menu-context'
import { SidebarMenu, type SidebarMenuType } from './SidebarMenu'
import { SortableList, type SortableItemData } from '@/components/ui/sortable-list'

/**
 * One interaction language for every sidebar row (top-level and nested):
 *
 * | Gesture / state     | Behavior |
 * |---------------------|----------|
 * | Hover (ghost)       | `bg-sidebar-hover` fill |
 * | Selected (default)  | `bg-foreground/[0.07]` fill |
 * | Context menu open   | same fill as hover via `data-state=open` |
 * | Click row           | `onClick` only (navigate / open) — never toggles expand |
 * | Click chevron       | expand/collapse only (`stopPropagation`) |
 * | Trailing + / count  | revealed on row hover; pointer-events gated when hidden |
 * | Density             | normal `py-[5px]`; `compact` only for dense label trees |
 *
 * Nested rows (Sources → API, 项目 → session, 对话 → session) use the same
 * SidebarButton as Flagged/Archived. Expand height is animated once on the
 * parent; children do not stagger-fade (that felt like a second UI kit).
 */

/** Context menu configuration for sidebar items */
export interface SidebarContextMenuConfig {
  /** Type of sidebar item (determines available menu items) */
  type: SidebarMenuType
  /** Status ID for status items (e.g., 'todo', 'done') - not currently used but kept for future */
  statusId?: string
  /** Label ID — when set, this is an individual label (enables Delete Label) */
  labelId?: string
  /** Handler for "Configure Statuses" action - for allSessions/status/flagged types */
  onConfigureStatuses?: () => void
  /** Handler for "Mark All Read" action - for allSessions type */
  onMarkAllRead?: () => void
  /** Handler for "Configure Labels" action - receives labelId when triggered from a specific label */
  onConfigureLabels?: (labelId?: string) => void
  /** Handler for "Add New Label" action - creates a label (parentId passed from labelId) */
  onAddLabel?: (parentId?: string) => void
  /** Handler for "Delete Label" action - deletes the label by labelId */
  onDeleteLabel?: (labelId: string) => void
  /** Handler for "Add Source" action - for sources type */
  onAddSource?: () => void
  /** Handler for "Add Skill" action - for skills type */
  onAddSkill?: () => void
  /** Handler for "Add Automation" action - for automations type */
  onAddAutomation?: () => void
  /** Handler for "Add Project" action - for projects type (local folder pick) */
  onAddProject?: () => void
  /** Handler for cloud/remote Project connection */
  onAddCloudProject?: () => void
  /** Handler for "Manage projects" — keeps the project detail surface reachable */
  onManageProjects?: () => void
  /** Handler for removing one project (workspace) */
  onRemoveProject?: () => void
  /** Source type filter for "Learn More" link - determines which docs page to open */
  sourceType?: 'api' | 'mcp' | 'local'
  /** Handler for "Edit Views" action - for views type */
  onConfigureViews?: () => void
  /** View ID — when set, this is an individual view (enables Delete) */
  viewId?: string
  /** Handler for "Delete View" action */
  onDeleteView?: (id: string) => void
}

/**
 * Sortable configuration for expandable sidebar items.
 * When present on an expandable LinkItem, its children become drag-sortable.
 */
export interface SortableConfig {
  /** Flat list reorder: called with new ordered array of item IDs after a drag-drop */
  onReorder: (orderedIds: string[]) => void
}

export interface LinkItem {
  id: string            // Unique ID for navigation (e.g., 'nav:allSessions')
  title: string
  label?: string        // Optional badge (e.g., count)
  icon: LucideIcon | React.ReactNode  // LucideIcon or custom React element
  iconColor?: string    // Optional color class for the icon
  /** Whether the icon responds to color (uses currentColor). Default true for Lucide icons. */
  iconColorable?: boolean
  variant: "default" | "ghost"  // "default" = highlighted, "ghost" = subtle
  onClick?: () => void
  // Expandable item properties
  expandable?: boolean
  expanded?: boolean
  onToggle?: () => void
  items?: SidebarItem[]    // Subitems as data (rendered as nested LeftSidebar) - supports separators
  // Compact mode: reduced vertical padding — only for dense label trees (many nodes)
  compact?: boolean
  // Tutorial system
  dataTutorial?: string // data-tutorial attribute for tutorial targeting
  // Context menu configuration (optional - if provided, right-click shows context menu)
  contextMenu?: SidebarContextMenuConfig
  // Drag-and-drop: flat list reorder (e.g., statuses)
  sortable?: SortableConfig
  // Optional element rendered after the title (e.g., label type icon), revealed on hover
  afterTitle?: React.ReactNode
  /**
   * Interactive row action rendered as a *sibling overlay* of the row button, never nested inside
   * it — a button inside a button breaks keyboard traversal and hit-testing. Occupies the 24 px
   * action slot from `docs/UI-SPEC.md` §4 and stays keyboard reachable while hover-revealed.
   */
  trailingAction?: React.ReactNode
}

export interface SeparatorItem {
  id: string
  type: 'separator'
}

export type SidebarItem = LinkItem | SeparatorItem

export const isSeparatorItem = (item: SidebarItem): item is SeparatorItem =>
  'type' in item && item.type === 'separator'

interface LeftSidebarProps {
  isCollapsed: boolean
  links: SidebarItem[]
  /** Get props for each item (from unified sidebar navigation) */
  getItemProps?: (id: string) => {
    tabIndex: number
    'data-focused': boolean
    ref: (el: HTMLElement | null) => void
  }
  /** Currently focused item ID */
  focusedItemId?: string | null
  /** Whether this is a nested sidebar (child of expandable item) */
  isNested?: boolean
}

/**
 * LeftSidebar - Vertical list of navigation buttons with icons
 *
 * One row component (`SidebarButton`) for every level. Expand/collapse is
 * chevron-only; row click always runs `onClick`. Nested trees indent with a
 * rail but do not use a second hover/click system.
 */
export function LeftSidebar({ links, isCollapsed, getItemProps, focusedItemId, isNested }: LeftSidebarProps) {
  return (
    <div className={cn("flex flex-col select-none", !isNested && "py-1")}>
      <nav
        className={cn(
          // minmax(0,1fr): a bare `grid` track floors at min-content, so under panel
          // compression rows kept their natural width and overflowed — titles clipped
          // without an ellipsis and edge-pinned actions were cut off (owner 2026-07-26).
          "grid grid-cols-[minmax(0,1fr)] gap-0.5",
          isNested ? "pl-5 pr-0 relative" : "px-2"
        )}
        role="navigation"
        aria-label={isNested ? "Sub navigation" : "Main navigation"}
      >
        {/* Vertical line for nested items - 4px left of chevron center */}
        {isNested && (
          <div
            className="absolute left-[13px] top-1 bottom-1 w-px bg-foreground/10"
            aria-hidden="true"
          />
        )}
        {links.map((item) => {
          // Handle separator items
          if (isSeparatorItem(item)) {
            return (
              <div key={item.id} className="py-1 px-2" aria-hidden="true">
                <div className="h-px bg-foreground/5" />
              </div>
            )
          }

          const link = item
          const itemProps = getItemProps?.(link.id)

          // Button element shared by both expandable and non-expandable items
          const buttonElement = (
            <SidebarButton
              link={link}
              itemProps={itemProps}
            />
          )

          // Determine which expanded content to render (sortable vs regular)
          const expandedContent = link.expandable && link.items && link.expanded
            ? renderExpandedContent(link, getItemProps, focusedItemId, isNested)
            : null

          // Wrap with context menu if configured, scoped to button only.
          // ContextMenuTrigger with asChild sets data-state="open" on the button
          // so only the clicked item highlights, not the entire section.
          const rowElement = link.contextMenu ? (
                <ContextMenu modal={true}>
                  <ContextMenuTrigger asChild>
                    {buttonElement}
                  </ContextMenuTrigger>
                  <StyledContextMenuContent>
                    <ContextMenuProvider>
                      <SidebarMenu
                        type={link.contextMenu.type}
                        statusId={link.contextMenu.statusId}
                        labelId={link.contextMenu.labelId}
                        onConfigureStatuses={link.contextMenu.onConfigureStatuses}
                        onMarkAllRead={link.contextMenu.onMarkAllRead}
                        onConfigureLabels={link.contextMenu.onConfigureLabels}
                        onAddLabel={link.contextMenu.onAddLabel}
                        onDeleteLabel={link.contextMenu.onDeleteLabel}
                        onAddSource={link.contextMenu.onAddSource}
                        onAddSkill={link.contextMenu.onAddSkill}
                        onAddAutomation={link.contextMenu.onAddAutomation}
                        onAddProject={link.contextMenu.onAddProject}
                        onAddCloudProject={link.contextMenu.onAddCloudProject}
                        onManageProjects={link.contextMenu.onManageProjects}
                        onRemoveProject={link.contextMenu.onRemoveProject}
                        sourceType={link.contextMenu.sourceType}
                        onConfigureViews={link.contextMenu.onConfigureViews}
                        viewId={link.contextMenu.viewId}
                        onDeleteView={link.contextMenu.onDeleteView}
                      />
                    </ContextMenuProvider>
                  </StyledContextMenuContent>
                </ContextMenu>
              ) : (
                buttonElement
              )

          // group/section wraps ONLY the header row (and trailing +), not nested children.
          // If children sit inside the same group, hovering a child falsely triggers parent
          // hover styles and reveals the parent's "+" (Craft keeps badges tied to the row).
          return (
            <React.Fragment key={link.id}>
              <div className="group/section min-w-0">
                {link.trailingAction ? (
                  <div className="relative min-w-0">
                    {rowElement}
                    {/* Sibling overlay, not nested button (UI-SPEC §4). Same language as the
                      * count badges beside it: trailing elements are always visible (owner
                      * decision 2026-07-26 — one rule for the whole level, so the control can
                      * never vanish mid-drag and never depends on hover discovery). */}
                    <div
                      className="absolute right-1 top-1/2 z-10 -translate-y-1/2 flex h-6 w-6 items-center justify-center"
                      onMouseDown={(event) => event.stopPropagation()}
                    >
                      {link.trailingAction}
                    </div>
                  </div>
                ) : (
                  rowElement
                )}
              </div>
              {/* Expandable subitems — height animate only; children are instant rows */}
              {link.expandable && link.items && (
                <AnimatePresence initial={false}>
                  {link.expanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0, marginTop: 0, marginBottom: 0 }}
                      animate={{ height: 'auto', opacity: 1, marginTop: 2, marginBottom: isNested ? 4 : 8 }}
                      exit={{ height: 0, opacity: 0, marginTop: 0, marginBottom: 0 }}
                      transition={{ duration: 0.2, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      {expandedContent}
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
            </React.Fragment>
          )
        })}
      </nav>
    </div>
  )
}

// ============================================================
// Expanded Content Renderer
// Chooses between sortable, sortableTree, or regular nested sidebar
// ============================================================

function renderExpandedContent(
  link: LinkItem,
  getItemProps: LeftSidebarProps['getItemProps'],
  focusedItemId: string | null | undefined,
  isNested: boolean | undefined
): React.ReactNode {
  // Flat sortable (e.g., statuses): wrap items in SortableList
  if (link.sortable && link.items) {
    // Split at first separator: items before are sortable, items after are trailing (non-sortable)
    const separatorIndex = link.items.findIndex(isSeparatorItem)
    const sortableItems = separatorIndex >= 0 ? link.items.slice(0, separatorIndex) : link.items
    const trailingItems = separatorIndex >= 0
      ? link.items.slice(separatorIndex + 1).filter((item): item is LinkItem => !isSeparatorItem(item))
      : []

    return (
      <SortableStatusList
        items={sortableItems}
        onReorder={link.sortable.onReorder}
        getItemProps={getItemProps}
        focusedItemId={focusedItemId}
        trailingItems={trailingItems}
      />
    )
  }

  // Regular nested sidebar (same row interaction as top-level)
  return (
    <LeftSidebar
      isCollapsed={false}
      links={link.items ?? []}
      getItemProps={getItemProps}
      focusedItemId={focusedItemId}
      isNested={true}
    />
  )
}

// ============================================================
// Sortable status list (flat reorder under an expandable section)
// ============================================================

function SortableStatusList({
  items,
  onReorder,
  getItemProps,
  focusedItemId,
  trailingItems,
}: {
  items: SidebarItem[]
  onReorder: (orderedIds: string[]) => void
  getItemProps?: LeftSidebarProps['getItemProps']
  focusedItemId?: string | null
  trailingItems?: LinkItem[]
}) {
  const linkItems = items.filter((item): item is LinkItem => !isSeparatorItem(item))

  // Map to SortableItemData format (needs `id` field)
  const sortableItems: (LinkItem & SortableItemData)[] = linkItems.map(item => ({
    ...item,
    id: item.id,
  }))

  const handleReorder = React.useCallback((newItems: (LinkItem & SortableItemData)[]) => {
    // Extract the raw IDs (strip 'nav:state:' prefix) for the IPC call
    const orderedIds = newItems.map(item => {
      // Strip navigation prefix to get the actual status/label ID
      const parts = item.id.split(':')
      return parts[parts.length - 1]
    })
    onReorder(orderedIds)
  }, [onReorder])

  return (
    <div className="flex flex-col select-none">
      <div className="pl-5 pr-0 relative">
        {/* Vertical line for nested items */}
        <div
          className="absolute left-[13px] top-1 bottom-1 w-px bg-foreground/10"
          aria-hidden="true"
        />
        <SortableList
          items={sortableItems}
          onReorder={handleReorder}
          className="grid gap-0.5"
          renderItem={(item) => (
            <div className="group/section">
              {item.contextMenu ? (
                <ContextMenu modal={true}>
                  <ContextMenuTrigger asChild>
                    <SidebarButton
                      link={item}
                      itemProps={getItemProps?.(item.id)}
                    />
                  </ContextMenuTrigger>
                  <StyledContextMenuContent>
                    <ContextMenuProvider>
                      <SidebarMenu
                        type={item.contextMenu.type}
                        statusId={item.contextMenu.statusId}
                        labelId={item.contextMenu.labelId}
                        onConfigureStatuses={item.contextMenu.onConfigureStatuses}
                        onMarkAllRead={item.contextMenu.onMarkAllRead}
                        onConfigureLabels={item.contextMenu.onConfigureLabels}
                        onAddLabel={item.contextMenu.onAddLabel}
                        onDeleteLabel={item.contextMenu.onDeleteLabel}
                        onAddSource={item.contextMenu.onAddSource}
                        onAddSkill={item.contextMenu.onAddSkill}
                        onAddAutomation={item.contextMenu.onAddAutomation}
                        onAddProject={item.contextMenu.onAddProject}
                        onAddCloudProject={item.contextMenu.onAddCloudProject}
                        onManageProjects={item.contextMenu.onManageProjects}
                        onRemoveProject={item.contextMenu.onRemoveProject}
                        sourceType={item.contextMenu.sourceType}
                        onConfigureViews={item.contextMenu.onConfigureViews}
                        viewId={item.contextMenu.viewId}
                        onDeleteView={item.contextMenu.onDeleteView}
                      />
                    </ContextMenuProvider>
                  </StyledContextMenuContent>
                </ContextMenu>
              ) : (
                <SidebarButton
                  link={item}
                  itemProps={getItemProps?.(item.id)}
                />
              )}
            </div>
          )}
          renderOverlay={(item) => (
            <SidebarButton
              link={item}
              isOverlay={true}
            />
          )}
        />
        {/* Non-sortable trailing items (e.g., Flagged, Archived) */}
        {trailingItems && trailingItems.length > 0 && (
          <>
            <div className="my-1 ml-2" aria-hidden="true">
              <div className="h-px bg-foreground/5" />
            </div>
            <div className="grid gap-0.5">
              {trailingItems.map(item => (
                <div key={item.id} className="group/section">
                  <SidebarButton
                    link={item}
                    itemProps={getItemProps?.(item.id)}
                  />
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ============================================================
// SidebarButton - Single row primitive for every sidebar level
// ============================================================

interface SidebarButtonProps {
  link: LinkItem
  itemProps?: {
    tabIndex: number
    'data-focused': boolean
    ref: (el: HTMLElement | null) => void
  }
  /** True when rendering inside the DragOverlay (floating clone) */
  isOverlay?: boolean
}

// forwardRef is required so Radix's ContextMenuTrigger (asChild) can attach its ref
// and pass props like data-state="open" directly onto this button element.
const SidebarButton = React.forwardRef<HTMLButtonElement, SidebarButtonProps & React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ link, itemProps, isOverlay, className: extraClassName, ...radixProps }, forwardedRef) => {
    return (
      <button
        type="button"
        {...(isOverlay ? {} : (() => {
          // Separate ref from itemProps so we can merge it with forwardedRef
          const { ref: _itemRef, ...rest } = itemProps || { ref: undefined }
          return rest
        })())}
        // Spread Radix props (data-state, onContextMenu, onPointerDown, etc.)
        {...radixProps}
        ref={(el) => {
          // Merge forwarded ref (from Radix) and itemProps ref (for keyboard nav)
          if (typeof forwardedRef === 'function') forwardedRef(el)
          else if (forwardedRef) forwardedRef.current = el
          if (!isOverlay && itemProps?.ref) itemProps.ref(el)
        }}
        onClick={isOverlay ? undefined : link.onClick}
        data-tutorial={link.dataTutorial}
        className={cn(
          // Shared row chrome — identical for Flagged, Sources children, 项目 sessions, 对话 sessions
          "group flex w-full items-center gap-2 rounded-[6px] text-[13px] select-none outline-none",
          "focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ring",
          // Density: normal for all primary trees; compact only when caller opts in (labels)
          link.compact ? "py-[3px]" : "py-[5px]",
          "px-2",
          // Reserve the 24 px action slot so the title truncates instead of sliding under "+"
          link.trailingAction && "pr-7",
          link.variant === "default"
            ? "bg-foreground/[0.07]"
            // Hover / open states — same tokens for every ghost row at every depth
            : cn(
              "hover:bg-sidebar-hover data-[state=open]:bg-sidebar-hover data-[edit-active=true]:bg-sidebar-hover",
              // Keep row highlighted while the pointer is on the sibling trailing action
              link.trailingAction && "group-hover/section:bg-sidebar-hover",
            ),
          extraClassName,
        )}
      >
        {/* Icon container with hover toggle for expandable items */}
        <span className="relative h-3.5 w-3.5 shrink-0 flex items-center justify-center">
          {link.expandable && !isOverlay ? (
            <>
              {/* Main icon - hidden on hover */}
              <span className="absolute inset-0 flex items-center justify-center group-hover:opacity-0 transition-opacity duration-150">
                {renderIcon(link)}
              </span>
              {/* Toggle chevron - shown on hover. Expand only; never the row's navigate action. */}
              <span
                className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150 cursor-pointer"
                data-no-dnd="true"
                data-touch-reveal="true"
                onClick={(e) => {
                  e.stopPropagation()
                  link.onToggle?.()
                }}
              >
                <ChevronRight
                  className={cn(
                    "h-3.5 w-3.5 text-muted-foreground transition-transform duration-200",
                    link.expanded && "rotate-90"
                  )}
                />
              </span>
            </>
          ) : (
            renderIcon(link)
          )}
        </span>
        {/* flex-1 + min-w-0 + truncate: the title owns the flexible middle, so trailing
          * badges/actions stay pinned to the row's right edge regardless of text length
          * and track the panel edge during divider drags (UI-SPEC §4; owner 2026-07-26). */}
        <span className="min-w-0 flex-1 truncate text-left">{link.title}</span>
        {/* After-title / count: ONE language for every trailing element on a row — always
          * visible (owner decision 2026-07-26: affordances must not vanish during panel
          * drags or at rest; length-independence comes from the title's flex-1). */}
        {link.afterTitle && (
          <span className="ml-auto">
            {link.afterTitle}
          </span>
        )}
        {link.label && (
          <span
            className={cn(
              link.afterTitle ? 'ml-0' : 'ml-auto',
              'text-xs text-foreground/30',
            )}
          >
            {link.label}
          </span>
        )}
      </button>
    )
  }
)
SidebarButton.displayName = 'SidebarButton'

/**
 * Helper to render icon - either component (function/forwardRef) or React element.
 * Colors are always applied via inline style (resolved CSS color strings from EntityColor).
 */
function renderIcon(link: LinkItem) {
  const isComponent = typeof link.icon === 'function' ||
    (typeof link.icon === 'object' && link.icon !== null && 'render' in link.icon)
  // Default color for items without explicit iconColor (foreground at 60% opacity)
  const defaultColor = 'color-mix(in oklch, var(--foreground) 60%, transparent)'

  // Lucide components are always colorable; ReactNode icons check iconColorable
  // Default to true for backwards compatibility (most icons are colorable)
  const applyColor = link.iconColorable !== false

  if (isComponent) {
    const Icon = link.icon as LucideIcon
    return (
      <Icon
        className="h-3.5 w-3.5"
        style={applyColor ? { color: link.iconColor || defaultColor } : undefined}
      />
    )
  }

  // React element — clone with size + optional color
  const element = link.icon as React.ReactElement<{ className?: string; style?: React.CSSProperties }>
  return React.cloneElement(element, {
    className: cn("h-3.5 w-3.5", element.props.className),
    style: applyColor
      ? { ...element.props.style, color: link.iconColor || defaultColor }
      : element.props.style,
  })
}
