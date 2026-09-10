/**
 * TopBar - Persistent top bar above all panels (Slack-style)
 *
 * Layout: [Sidebar] [Menu] [compact workspace selector] ... [Browser strip]
 * Global search: LeftSidebar row above Sources → GlobalSearchDialog (App menu / hotkey too).
 * Right workbench toggle lives on the chat panel header (replaces close).
 *
 * Fixed at top of window, 48px tall.
 * macOS: offset left to avoid stoplight controls.
 */

import { useTranslation } from "react-i18next"
import { Tooltip, TooltipTrigger, TooltipContent } from "@craft-agent/ui"
import { PanelLeftRounded } from "../icons/PanelLeftRounded"
import { TopBarButton } from "../ui/TopBarButton"
import { cn } from "@/lib/utils"
import { isMac, isWebUI } from "@/lib/platform"
import type { SettingsMenuItem } from "../../../shared/menu-schema"
import { useEffect, useRef, useState } from "react"
import { BrowserTabStrip } from "../browser/BrowserTabStrip"
import type { Workspace } from "../../../shared/types"
import { CompactWorkspaceSwitcher } from "./CompactWorkspaceSwitcher"
import { AppMenu } from "../AppMenu"
import type { SidebarVisibilityProjection } from "./sidebar-visibility"

const RIGHT_SLOT_FULL_BADGES_THRESHOLD = 420
const RIGHT_SLOT_TWO_BADGES_THRESHOLD = 300

interface TopBarProps {
  workspaces: Workspace[]
  activeWorkspaceId: string | null
  onSelectWorkspace: (workspaceId: string, openInNewWindow?: boolean) => void | Promise<void>
  workspaceUnreadMap?: Record<string, boolean>
  onWorkspaceCreated?: (workspace: Workspace) => void
  onWorkspaceRemoved?: () => void
  activeSessionId?: string | null
  onNewChat: () => void
  onNewWindow?: () => void
  onOpenGlobalSearch: () => void
  onOpenSettings: () => void
  onOpenSettingsSubpage: (subpage: SettingsMenuItem['id']) => void
  onOpenKeyboardShortcuts: () => void
  onOpenStoredUserPreferences: () => void
  onOpenWhatsNew: () => void
  hasUnseenReleaseNotes?: boolean
  onToggleSidebar: () => void
  onToggleFocusMode: () => void
  /** When true, hides controls that don't apply in compact/mobile layout */
  isCompact?: boolean
  /** Projected sidebar pressed state — must match rendered width (not only stored preference). */
  sidebarAriaPressed?: boolean
  /** Full sidebar projection when available (preferred over bare aria-pressed). */
  sidebarProjection?: SidebarVisibilityProjection
}

export function TopBar({
  workspaces,
  activeWorkspaceId,
  onSelectWorkspace,
  workspaceUnreadMap,
  onWorkspaceCreated,
  onWorkspaceRemoved,
  activeSessionId,
  onNewChat,
  onNewWindow,
  onOpenGlobalSearch,
  onOpenSettings,
  onOpenSettingsSubpage,
  onOpenKeyboardShortcuts,
  onOpenStoredUserPreferences,
  onOpenWhatsNew,
  hasUnseenReleaseNotes,
  onToggleSidebar,
  onToggleFocusMode,
  isCompact,
  sidebarAriaPressed,
  sidebarProjection,
}: TopBarProps) {
  const { t } = useTranslation()
  const [maxVisibleBrowserBadges, setMaxVisibleBrowserBadges] = useState(3)
  const rightSlotRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const slotEl = rightSlotRef.current
    if (!slotEl) return

    let frame = 0

    const updateBadgeDensity = () => {
      const slotWidth = slotEl.getBoundingClientRect().width
      const nextMaxVisibleBadges = slotWidth >= RIGHT_SLOT_FULL_BADGES_THRESHOLD
        ? 3
        : slotWidth >= RIGHT_SLOT_TWO_BADGES_THRESHOLD
          ? 2
          : 1

      setMaxVisibleBrowserBadges((prev) => (prev === nextMaxVisibleBadges ? prev : nextMaxVisibleBadges))
    }

    const schedule = () => {
      if (frame) cancelAnimationFrame(frame)
      frame = requestAnimationFrame(updateBadgeDensity)
    }

    const observer = new ResizeObserver(schedule)
    observer.observe(slotEl)
    updateBadgeDensity()

    return () => {
      if (frame) cancelAnimationFrame(frame)
      observer.disconnect()
    }
  }, [workspaces.length, activeWorkspaceId])

  // Stoplight padding clears macOS traffic-light controls, which only exist
  // in the Electron desktop window. The webui runs in a regular browser tab
  // and has no traffic lights regardless of host OS — collapse to a normal
  // 12px inset so the logo sits at the edge.
  const menuLeftPadding = isMac && !isWebUI ? 86 : 12

  return (
    <div
      className="pointer-events-none fixed top-0 left-0 right-0 z-panel titlebar-drag-region"
      style={{ height: 'var(--topbar-height)' }}
    >
      <div className="flex h-full w-full items-center justify-between gap-2">
      {/* === LEFT: Sidebar + Menu + Navigation + Workspace === */}
      {/* Keep this container draggable. Only individual interactive controls should use titlebar-no-drag. */}
      {/* In compact mode the right slot is hidden, so we add right padding here
          so the workspace pill doesn't run flush against the viewport edge. */}
      <div
        className="pointer-events-auto flex min-w-0 flex-1 items-center gap-0.5"
        style={{ paddingLeft: menuLeftPadding, paddingRight: isCompact ? 12 : 0 }}
      >
        <div className="flex items-center gap-0.5">
        {!isCompact && (
        <Tooltip>
          <TooltipTrigger asChild>
            <TopBarButton
              onClick={onToggleSidebar}
              aria-label={t("menu.toggleSidebar")}
              aria-pressed={sidebarProjection?.ariaPressed ?? sidebarAriaPressed}
              title={t("menu.toggleSidebar")}
              data-sidebar-chrome="toggle"
              data-sidebar-rendered-width={String(
                sidebarProjection?.renderedWidth
                  ?? (sidebarAriaPressed ? 1 : 0),
              )}
              data-sidebar-visible={
                (sidebarProjection?.isRendered ?? !!sidebarAriaPressed)
                  ? 'true'
                  : 'false'
              }
            >
              <PanelLeftRounded className="h-[18px] w-[18px] text-foreground/70" />
            </TopBarButton>
          </TooltipTrigger>
          <TooltipContent side="bottom">{t("menu.toggleSidebar")}</TooltipContent>
        </Tooltip>
        )}

        <AppMenu
          onNewChat={onNewChat}
          onNewWindow={onNewWindow}
          onOpenGlobalSearch={onOpenGlobalSearch}
          onOpenSettings={onOpenSettings}
          onOpenSettingsSubpage={onOpenSettingsSubpage}
          onOpenKeyboardShortcuts={onOpenKeyboardShortcuts}
          onOpenStoredUserPreferences={onOpenStoredUserPreferences}
          onOpenWhatsNew={onOpenWhatsNew}
          hasUnseenReleaseNotes={hasUnseenReleaseNotes}
          onToggleSidebar={onToggleSidebar}
          onToggleFocusMode={onToggleFocusMode}
        />
        </div>

        {/* Compact workspace selector. Desktop projects live in the sidebar,
            and history remains available through the existing shortcuts rather
            than a second pair of persistent titlebar controls. */}
        <div className={cn("ml-1 flex min-w-0 items-center gap-1", isCompact ? "flex-1" : "w-[clamp(220px,42vw,640px)]")}>
          {/* The full-width workspace switcher is gone: the sidebar's 项目 section is the single
            * container list and carries the create action, so a second switcher above it was the
            * duplicate the owner kept pointing at (R1 clause 1). Compact mode hides the sidebar, so it
            * still needs this control — removing it there would lose the capability outright. */}
          {isCompact && (
            <div className="min-w-0 flex-1">
              <CompactWorkspaceSwitcher
                workspaces={workspaces}
                activeWorkspaceId={activeWorkspaceId}
                onSelect={onSelectWorkspace}
                onWorkspaceCreated={onWorkspaceCreated}
                onWorkspaceRemoved={onWorkspaceRemoved}
                workspaceUnreadMap={workspaceUnreadMap}
              />
            </div>
          )}
        </div>
      </div>

      {/* === RIGHT: Browser strip === */}
      {!isCompact && (
      <div ref={rightSlotRef} className="pointer-events-auto flex min-w-0 shrink-0 items-center justify-end gap-1" style={{ paddingRight: 12 }}>
        <div className="min-w-0">
          <BrowserTabStrip activeSessionId={activeSessionId} maxVisibleBadges={maxVisibleBrowserBadges} />
        </div>
      </div>
      )}
      </div>
    </div>
  )
}
