import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import * as Icons from "lucide-react"
import { isMac } from "@/lib/platform"
import { useActionLabel } from "@/actions"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuShortcut,
  StyledDropdownMenuContent,
  StyledDropdownMenuItem,
  StyledDropdownMenuSeparator,
  DropdownMenuSub,
  StyledDropdownMenuSubTrigger,
  StyledDropdownMenuSubContent,
} from "@/components/ui/styled-dropdown"
import { CraftAgentsSymbol } from "../icons/CraftAgentsSymbol"
import { SquarePenRounded } from "../icons/SquarePenRounded"
import { TopBarButton } from "../ui/TopBarButton"
import { Button } from "../ui/button"
import {
  EDIT_MENU,
  VIEW_MENU,
  WINDOW_MENU,
  ROOT_MENU,
  HELP_LINKS,
  getShortcutDisplay,
} from "../../../shared/menu-schema"
import type { MenuItem, MenuSection } from "../../../shared/menu-schema"
import type { AppMenuProps } from "./types"
import { openLocalHelp } from "@/lib/local-help"

type MenuActionHandlers = {
  toggleFocusMode?: () => void
  toggleSidebar?: () => void
}

const roleHandlers: Record<string, () => void> = {
  undo: () => window.electronAPI.menuUndo(),
  redo: () => window.electronAPI.menuRedo(),
  cut: () => window.electronAPI.menuCut(),
  copy: () => window.electronAPI.menuCopy(),
  paste: () => window.electronAPI.menuPaste(),
  selectAll: () => window.electronAPI.menuSelectAll(),
  zoomIn: () => window.electronAPI.menuZoomIn(),
  zoomOut: () => window.electronAPI.menuZoomOut(),
  resetZoom: () => window.electronAPI.menuZoomReset(),
  minimize: () => window.electronAPI.menuMinimize(),
  zoom: () => window.electronAPI.menuMaximize(),
}

function getIcon(name: string): React.ComponentType<{ className?: string }> | null {
  const IconComponent = Icons[name as keyof typeof Icons] as React.ComponentType<{ className?: string }> | undefined
  return IconComponent ?? null
}

function renderSubmenuItem(
  item: MenuItem,
  index: number,
  actionHandlers: MenuActionHandlers,
  t: (key: string) => string,
): React.ReactNode {
  if (item.type === 'separator') {
    return <StyledDropdownMenuSeparator key={`sep-${index}`} />
  }

  if (item.type === 'url') {
    const Icon = getIcon(item.icon)
    return (
      <StyledDropdownMenuItem key={item.id} onClick={() => openLocalHelp(item.url)}>
        {Icon && <Icon className="h-3.5 w-3.5" />}
        {t(item.labelKey)}
      </StyledDropdownMenuItem>
    )
  }

  const Icon = getIcon(item.icon)
  const shortcut = getShortcutDisplay(item, isMac)

  if (item.type === 'role') {
    const handler = roleHandlers[item.role]
    const safeHandler = handler ?? (() => {
      console.warn(`[DesktopAppMenu] No handler registered for role: ${item.role}`)
    })
    return (
      <StyledDropdownMenuItem key={item.role} onClick={safeHandler}>
        {Icon && <Icon className="h-3.5 w-3.5" />}
        {t(item.labelKey)}
        {shortcut && <DropdownMenuShortcut className="pl-6">{shortcut}</DropdownMenuShortcut>}
      </StyledDropdownMenuItem>
    )
  }

  if (item.type === 'action') {
    const handler = item.id === 'toggleFocusMode'
      ? actionHandlers.toggleFocusMode
      : item.id === 'toggleSidebar'
        ? actionHandlers.toggleSidebar
        : undefined
    return (
      <StyledDropdownMenuItem key={item.id} onClick={handler}>
        {Icon && <Icon className="h-3.5 w-3.5" />}
        {t(item.labelKey)}
        {shortcut && <DropdownMenuShortcut className="pl-6">{shortcut}</DropdownMenuShortcut>}
      </StyledDropdownMenuItem>
    )
  }

  return null
}

function renderMenuSection(
  section: MenuSection,
  actionHandlers: MenuActionHandlers,
  t: (key: string) => string,
): React.ReactNode {
  const Icon = getIcon(section.icon)
  return (
    <DropdownMenuSub key={section.id}>
      <StyledDropdownMenuSubTrigger>
        {Icon && <Icon className="h-3.5 w-3.5" />}
        {t(section.labelKey)}
      </StyledDropdownMenuSubTrigger>
      <StyledDropdownMenuSubContent>
        {section.items.map((item, index) => renderSubmenuItem(item, index, actionHandlers, t))}
      </StyledDropdownMenuSubContent>
    </DropdownMenuSub>
  )
}

/**
 * Desktop AppMenu — Craft logo dropdown. Retain the original Edit/View/Window
 * controls and their displayed shortcuts on every desktop platform.
 *
 * Behavior matches the pre-refactor version that lived inline in `TopBar.tsx`.
 * Labels and hotkey strings come from `menu-schema.ts`. Update actions live in
 * Settings > App, which has the readiness state needed to show only valid actions.
 */
export function DesktopAppMenu({
  placement = 'topbar',
  onNewChat,
  onNewWindow,
  onOpenSettings,
  onOpenKeyboardShortcuts,
  onToggleSidebar,
  onToggleFocusMode,
}: AppMenuProps) {
  const { t } = useTranslation()
  const [isDebugMode, setIsDebugMode] = useState(false)

  const newChatHotkey = useActionLabel('app.newChat').hotkey
  const newWindowHotkey = useActionLabel('app.newWindow').hotkey
  const settingsHotkey = useActionLabel('app.settings').hotkey
  const keyboardShortcutsHotkey = useActionLabel('app.keyboardShortcuts').hotkey
  const quitHotkey = useActionLabel('app.quit').hotkey

  useEffect(() => {
    window.electronAPI.isDebugMode().then(setIsDebugMode)
  }, [])

  const actionHandlers: MenuActionHandlers = {
    toggleFocusMode: onToggleFocusMode,
    toggleSidebar: onToggleSidebar,
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {placement === 'sidebar' ? (
          <Button variant="ghost" size="sm" aria-label={t("menu.craftMenu")}
            className="min-w-0 flex-1 justify-start gap-2 rounded-[6px] px-2 text-[13px] font-normal">
            <CraftAgentsSymbol className="h-4 shrink-0 text-accent" />
            <span className="min-w-0 flex-1 truncate text-left">Craft Agents</span>
            <Icons.ChevronUp className="h-3.5 w-3.5 text-foreground/40" />
          </Button>
        ) : (
          <TopBarButton aria-label={t("menu.craftMenu")}>
            <CraftAgentsSymbol className="h-4 text-accent" />
          </TopBarButton>
        )}
      </DropdownMenuTrigger>
      <StyledDropdownMenuContent align="start" side={placement === 'sidebar' ? 'top' : 'bottom'} minWidth="min-w-48">
        {placement !== 'sidebar' && (
          <StyledDropdownMenuItem onClick={onNewChat}>
            <SquarePenRounded className="h-3.5 w-3.5" />
            {t(ROOT_MENU.newChat.labelKey)}
            {newChatHotkey && <DropdownMenuShortcut className="pl-6">{newChatHotkey}</DropdownMenuShortcut>}
          </StyledDropdownMenuItem>
        )}
        {onNewWindow && (
          <StyledDropdownMenuItem onClick={onNewWindow}>
            <Icons.AppWindow className="h-3.5 w-3.5" />
            {t(ROOT_MENU.newWindow.labelKey)}
            {newWindowHotkey && <DropdownMenuShortcut className="pl-6">{newWindowHotkey}</DropdownMenuShortcut>}
          </StyledDropdownMenuItem>
        )}

        <StyledDropdownMenuSeparator />
        {renderMenuSection(EDIT_MENU, actionHandlers, t)}
        {renderMenuSection(VIEW_MENU, actionHandlers, t)}
        {renderMenuSection(WINDOW_MENU, actionHandlers, t)}

        <StyledDropdownMenuSeparator />

        {placement !== 'sidebar' && (
          <StyledDropdownMenuItem onClick={onOpenSettings}>
            <Icons.Settings className="h-3.5 w-3.5" />
            {t("menu.settings")}
            {settingsHotkey && <DropdownMenuShortcut className="pl-6">{settingsHotkey}</DropdownMenuShortcut>}
          </StyledDropdownMenuItem>
        )}

        <DropdownMenuSub>
          <StyledDropdownMenuSubTrigger>
            <Icons.HelpCircle className="h-3.5 w-3.5" />
            {t('menu.help')}
          </StyledDropdownMenuSubTrigger>
          <StyledDropdownMenuSubContent>
            {HELP_LINKS.map((link) => {
              const Icon = getIcon(link.icon)
              return (
                <StyledDropdownMenuItem key={link.id} onClick={() => openLocalHelp(link.url)}>
                  {Icon && <Icon className="h-3.5 w-3.5" />}
                  {t(link.labelKey)}
                </StyledDropdownMenuItem>
              )
            })}
            <StyledDropdownMenuItem onClick={onOpenKeyboardShortcuts}>
              <Icons.Keyboard className="h-3.5 w-3.5" />
              {t(ROOT_MENU.keyboardShortcuts.labelKey)}
              {keyboardShortcutsHotkey && <DropdownMenuShortcut className="pl-6">{keyboardShortcutsHotkey}</DropdownMenuShortcut>}
            </StyledDropdownMenuItem>
          </StyledDropdownMenuSubContent>
        </DropdownMenuSub>
        {isDebugMode && (
          <StyledDropdownMenuItem onClick={() => window.electronAPI.menuToggleDevTools()}>
            <Icons.Bug className="h-3.5 w-3.5" />
            {t('menu.toggleDevTools')}
            <DropdownMenuShortcut className="pl-6">{isMac ? '⌥⌘I' : 'Ctrl+Shift+I'}</DropdownMenuShortcut>
          </StyledDropdownMenuItem>
        )}

        <StyledDropdownMenuSeparator />

        <StyledDropdownMenuItem onClick={() => window.electronAPI.menuQuit()}>
          <Icons.LogOut className="h-3.5 w-3.5" />
          {t(ROOT_MENU.quit.labelKey)}
          {quitHotkey && <DropdownMenuShortcut className="pl-6">{quitHotkey}</DropdownMenuShortcut>}
        </StyledDropdownMenuItem>
      </StyledDropdownMenuContent>
    </DropdownMenu>
  )
}
