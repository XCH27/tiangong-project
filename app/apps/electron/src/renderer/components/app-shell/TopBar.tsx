/**
 * TopBar - Persistent top bar above all panels (Slack-style)
 *
 * Layout: [Sidebar] [Menu] [Back] [Forward] [Workspace selector] ... [Browser strip] [+] [Help]
 *
 * Fixed at top of window, 48px tall.
 * macOS: offset left to avoid stoplight controls.
 */

import { useTranslation } from "react-i18next"
import * as Icons from "lucide-react"
import { Tooltip, TooltipTrigger, TooltipContent } from "@craft-agent/ui"
import { PanelLeftRounded } from "../icons/PanelLeftRounded"
import { TopBarButton } from "../ui/TopBarButton"
import { cn } from "@/lib/utils"
import { isMac, isWebUI } from "@/lib/platform"
import { useActionLabel } from "@/actions"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  StyledDropdownMenuContent,
  StyledDropdownMenuItem,
  StyledDropdownMenuSeparator,
} from "@/components/ui/styled-dropdown"
import type { SettingsMenuItem } from "../../../shared/menu-schema"
import { SquarePenRounded } from "../icons/SquarePenRounded"
import { useEffect, useMemo, useRef, useState } from "react"
import { BrowserTabStrip } from "../browser/BrowserTabStrip"
import type { Workspace } from "../../../shared/types"
import { WorkspaceSwitcher } from "./WorkspaceSwitcher"
import { CompactWorkspaceSwitcher } from "./CompactWorkspaceSwitcher"
import { getDocUrl } from "@craft-agent/shared/docs/doc-links"
import { AppMenu } from "../AppMenu"
import type { CliRuntimeDefinition, CliRuntimeModelState } from "@craft-agent/shared/protocol"
import { getCliRuntimeModelDisplay } from "./input/cli-runtime-model-picker"

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
  activeCliRuntimeId?: string | null
  cliRuntimeModelState?: CliRuntimeModelState
  onNewChat: () => void
  onNewWindow?: () => void
  onOpenSettings: () => void
  onOpenSettingsSubpage: (subpage: SettingsMenuItem['id']) => void
  onOpenKeyboardShortcuts: () => void
  onOpenStoredUserPreferences: () => void
  onBack: () => void
  onForward: () => void
  canGoBack: boolean
  canGoForward: boolean
  onToggleSidebar: () => void
  onToggleFocusMode: () => void
  onAddSessionPanel: () => void
  onAddBrowserPanel: () => void
  /** When true, hides controls that don't apply in compact/mobile layout */
  isCompact?: boolean
}

export function TopBar({
  workspaces,
  activeWorkspaceId,
  onSelectWorkspace,
  workspaceUnreadMap,
  onWorkspaceCreated,
  onWorkspaceRemoved,
  activeSessionId,
  activeCliRuntimeId,
  cliRuntimeModelState,
  onNewChat,
  onNewWindow,
  onOpenSettings,
  onOpenSettingsSubpage,
  onOpenKeyboardShortcuts,
  onOpenStoredUserPreferences,
  onBack,
  onForward,
  canGoBack,
  canGoForward,
  onToggleSidebar,
  onToggleFocusMode,
  onAddSessionPanel,
  onAddBrowserPanel,
  isCompact,
}: TopBarProps) {
  const { t } = useTranslation()
  const [maxVisibleBrowserBadges, setMaxVisibleBrowserBadges] = useState(3)
  const rightSlotRef = useRef<HTMLDivElement | null>(null)

  const goBackHotkey = useActionLabel('nav.goBackAlt').hotkey
  const goForwardHotkey = useActionLabel('nav.goForwardAlt').hotkey

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
      className="fixed top-0 left-0 right-0 z-panel titlebar-drag-region"
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
            <TopBarButton onClick={onToggleSidebar} aria-label={t("menu.toggleSidebar")}>
              <PanelLeftRounded className="h-[18px] w-[18px] text-foreground/70" />
            </TopBarButton>
          </TooltipTrigger>
          <TooltipContent side="bottom">{t("menu.toggleSidebar")}</TooltipContent>
        </Tooltip>
        )}

        <AppMenu
          onNewChat={onNewChat}
          onNewWindow={onNewWindow}
          onOpenSettings={onOpenSettings}
          onOpenSettingsSubpage={onOpenSettingsSubpage}
          onOpenKeyboardShortcuts={onOpenKeyboardShortcuts}
          onOpenStoredUserPreferences={onOpenStoredUserPreferences}
          onToggleSidebar={onToggleSidebar}
          onToggleFocusMode={onToggleFocusMode}
        />
        </div>

        {/* Back / Forward / Workspace selector (moved from center).
            In compact mode the back/forward buttons are dropped — the iOS-style
            drill-in chevron in PanelHeader plus the browser's native back gesture
            cover that affordance, and the freed width lets the workspace pill
            actually fit on phone-width viewports. */}
        <div className={cn("ml-1 flex min-w-0 items-center gap-1", isCompact ? "flex-1" : "w-[clamp(220px,42vw,640px)]")}>
          {!isCompact && (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <TopBarButton onClick={onBack} disabled={!canGoBack} aria-label={t("common.back")}>
                    <Icons.ChevronLeft className="h-[18px] w-[18px] text-foreground/70" strokeWidth={1.5} />
                  </TopBarButton>
                </TooltipTrigger>
                <TooltipContent side="bottom">{t("common.back")} {goBackHotkey}</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <TopBarButton onClick={onForward} disabled={!canGoForward} aria-label={t("common.forward")}>
                    <Icons.ChevronRight className="h-[18px] w-[18px] text-foreground/70" strokeWidth={1.5} />
                  </TopBarButton>
                </TooltipTrigger>
                <TooltipContent side="bottom">{t("common.forward")} {goForwardHotkey}</TooltipContent>
              </Tooltip>
            </>
          )}

          <div className="min-w-0 flex-1">
            {isCompact ? (
              <CompactWorkspaceSwitcher
                workspaces={workspaces}
                activeWorkspaceId={activeWorkspaceId}
                onSelect={onSelectWorkspace}
                onWorkspaceCreated={onWorkspaceCreated}
                onWorkspaceRemoved={onWorkspaceRemoved}
                workspaceUnreadMap={workspaceUnreadMap}
              />
            ) : (
              <WorkspaceSwitcher
                variant="topbar"
                workspaces={workspaces}
                activeWorkspaceId={activeWorkspaceId}
                onSelect={onSelectWorkspace}
                onWorkspaceCreated={onWorkspaceCreated}
                onWorkspaceRemoved={onWorkspaceRemoved}
                workspaceUnreadMap={workspaceUnreadMap}
              />
            )}
          </div>
          {!isCompact && (
            <TopBarCliRuntimeSelector
              activeSessionId={activeSessionId}
              activeCliRuntimeId={activeCliRuntimeId}
              cliRuntimeModelState={cliRuntimeModelState}
              onOpenSettings={() => onOpenSettingsSubpage('cliRuntime')}
            />
          )}
        </div>
      </div>

      {/* === RIGHT: Browser strip + add + help === */}
      {!isCompact && (
      <div ref={rightSlotRef} className="flex min-w-0 shrink-0 items-center justify-end gap-1" style={{ paddingRight: 12 }}>
        <div className="min-w-0">
          <BrowserTabStrip activeSessionId={activeSessionId} maxVisibleBadges={maxVisibleBrowserBadges} />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <TopBarButton aria-label={t("menu.addPanelMenu")} className="ml-1 h-[26px] w-[26px] rounded-lg">
              <Icons.Plus className="h-4 w-4 text-foreground/50" strokeWidth={1.5} />
            </TopBarButton>
          </DropdownMenuTrigger>
          <StyledDropdownMenuContent align="end" minWidth="min-w-56">
            <StyledDropdownMenuItem onClick={onAddSessionPanel}>
              <SquarePenRounded className="h-3.5 w-3.5" />
              {t("session.newSessionInPanel")}
            </StyledDropdownMenuItem>
            <StyledDropdownMenuItem onClick={onAddBrowserPanel}>
              <Icons.Globe className="h-3.5 w-3.5" />
              {t("browser.newWindow")}
            </StyledDropdownMenuItem>
          </StyledDropdownMenuContent>
        </DropdownMenu>

        {/* Help button */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <TopBarButton aria-label={t("menu.helpAndDocs")} className="h-[26px] w-[26px] rounded-lg">
              <Icons.HelpCircle className="h-4 w-4 text-foreground/50" strokeWidth={1.5} />
            </TopBarButton>
          </DropdownMenuTrigger>
          <StyledDropdownMenuContent align="end" minWidth="min-w-48">
            <StyledDropdownMenuItem onClick={() => window.electronAPI.openUrl(getDocUrl('sources'))}>
              <Icons.DatabaseZap className="h-3.5 w-3.5" />
              <span className="flex-1">{t("sidebar.sources")}</span>
              <Icons.ExternalLink className="h-3 w-3 text-muted-foreground" />
            </StyledDropdownMenuItem>
            <StyledDropdownMenuItem onClick={() => window.electronAPI.openUrl(getDocUrl('skills'))}>
              <Icons.Zap className="h-3.5 w-3.5" />
              <span className="flex-1">{t("sidebar.skills")}</span>
              <Icons.ExternalLink className="h-3 w-3 text-muted-foreground" />
            </StyledDropdownMenuItem>
            <StyledDropdownMenuItem onClick={() => window.electronAPI.openUrl(getDocUrl('statuses'))}>
              <Icons.CheckCircle2 className="h-3.5 w-3.5" />
              <span className="flex-1">{t("sidebar.statuses")}</span>
              <Icons.ExternalLink className="h-3 w-3 text-muted-foreground" />
            </StyledDropdownMenuItem>
            <StyledDropdownMenuItem onClick={() => window.electronAPI.openUrl(getDocUrl('permissions'))}>
              <Icons.Settings className="h-3.5 w-3.5" />
              <span className="flex-1">{t("settings.permissions.title")}</span>
              <Icons.ExternalLink className="h-3 w-3 text-muted-foreground" />
            </StyledDropdownMenuItem>
            <StyledDropdownMenuItem onClick={() => window.electronAPI.openUrl(getDocUrl('automations'))}>
              <Icons.Webhook className="h-3.5 w-3.5" />
              <span className="flex-1">{t("sidebar.automations")}</span>
              <Icons.ExternalLink className="h-3 w-3 text-muted-foreground" />
            </StyledDropdownMenuItem>
            <StyledDropdownMenuItem onClick={() => window.electronAPI.openUrl(getDocUrl('messaging'))}>
              <Icons.MessageSquare className="h-3.5 w-3.5" />
              <span className="flex-1">{t("settings.messaging.title")}</span>
              <Icons.ExternalLink className="h-3 w-3 text-muted-foreground" />
            </StyledDropdownMenuItem>
            <StyledDropdownMenuSeparator />
            <StyledDropdownMenuItem onClick={() => window.electronAPI.openUrl('https://agents.craft.do/docs')}>
              <Icons.ExternalLink className="h-3.5 w-3.5" />
              <span className="flex-1">{t("menu.allDocumentation")}</span>
            </StyledDropdownMenuItem>
          </StyledDropdownMenuContent>
        </DropdownMenu>
      </div>
      )}
      </div>
    </div>
  )
}

function TopBarCliRuntimeSelector({
  activeSessionId,
  activeCliRuntimeId,
  cliRuntimeModelState,
  onOpenSettings,
}: {
  activeSessionId?: string | null
  activeCliRuntimeId?: string | null
  cliRuntimeModelState?: CliRuntimeModelState
  onOpenSettings: () => void
}) {
  const [runtimes, setRuntimes] = useState<CliRuntimeDefinition[]>([])

  useEffect(() => {
    let cancelled = false
    window.electronAPI.listCliRuntimes()
      .then((items) => {
        if (!cancelled) setRuntimes(items)
      })
      .catch(() => {
        if (!cancelled) setRuntimes([])
      })
    return () => {
      cancelled = true
    }
  }, [])

  const enabledRuntimes = useMemo(
    () => runtimes.filter(runtime => runtime.enabled),
    [runtimes],
  )

  const activeRuntime = useMemo(
    () => enabledRuntimes.find(runtime => runtime.id === activeCliRuntimeId) ?? null,
    [enabledRuntimes, activeCliRuntimeId],
  )

  const label = activeRuntime
    ? getCliRuntimeModelDisplay(activeRuntime.displayName, cliRuntimeModelState)
    : 'API 模型'

  const selectRuntime = async (runtimeId: string | null) => {
    if (!activeSessionId) return
    await window.electronAPI.sessionCommand(activeSessionId, { type: 'setCliRuntime', cliRuntimeId: runtimeId })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          disabled={!activeSessionId}
          className={cn(
            "header-icon-btn titlebar-no-drag shrink-0 min-w-0 max-w-[180px] flex items-center justify-start gap-1 h-[30px] px-3 rounded-[8px] border border-foreground/6 text-[13px] text-foreground/50 hover:bg-foreground/5 hover:text-foreground transition-colors cursor-pointer data-[state=open]:bg-foreground/5 data-[state=open]:text-foreground disabled:opacity-40 disabled:cursor-not-allowed",
            activeRuntime && "text-foreground/70",
          )}
          aria-label="选择 CLI"
        >
          <Icons.Terminal className="h-3.5 w-3.5 shrink-0" strokeWidth={1.7} />
          <span className="truncate min-w-0 text-left">{label}</span>
          <Icons.ChevronDown className="h-3 w-3 opacity-60 shrink-0" />
        </button>
      </DropdownMenuTrigger>
      <StyledDropdownMenuContent align="start" sideOffset={8} minWidth="min-w-64">
        <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground select-none">
          发送运行时
        </div>
        <StyledDropdownMenuItem onSelect={() => selectRuntime(null)} className="flex items-center justify-between">
          <div className="min-w-0">
            <div className="text-sm font-medium">API 模型</div>
            <div className="text-xs text-muted-foreground">使用当前模型连接</div>
          </div>
          {!activeRuntime && <Icons.Check className="h-3.5 w-3.5 shrink-0" />}
        </StyledDropdownMenuItem>
        {enabledRuntimes.map(runtime => (
          <StyledDropdownMenuItem
            key={runtime.id}
            onSelect={() => selectRuntime(runtime.id)}
            className="flex items-center justify-between"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-sm font-medium">
                <Icons.Terminal className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="truncate">{runtime.displayName}</span>
              </div>
              <div className="truncate text-xs text-muted-foreground">
                {runtime.command} {runtime.args.join(' ')}
              </div>
            </div>
            {activeRuntime?.id === runtime.id && <Icons.Check className="h-3.5 w-3.5 shrink-0" />}
          </StyledDropdownMenuItem>
        ))}
        {enabledRuntimes.length === 0 && (
          <div className="px-2 py-2 text-xs text-muted-foreground">
            没有可用的本机 CLI
          </div>
        )}
        <StyledDropdownMenuSeparator className="my-1" />
        <StyledDropdownMenuItem onSelect={onOpenSettings}>
          <Icons.Settings2 className="h-3.5 w-3.5" />
          CLI 设置
        </StyledDropdownMenuItem>
      </StyledDropdownMenuContent>
    </DropdownMenu>
  )
}
