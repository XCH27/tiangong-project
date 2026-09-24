/**
 * Props shared by `AppMenu` (router) and the desktop/mobile shapes underneath.
 *
 * The menu owns only the Craft logo trigger and its dropdown/sheet — back/forward
 * nav lives directly in `TopBar.tsx` and does not pass through here.
 */
export interface AppMenuProps {
  /** Desktop trigger placement. Compact mode keeps its existing top-bar sheet. */
  placement?: 'topbar' | 'sidebar'
  onNewChat: () => void
  onNewWindow?: () => void
  onOpenSettings: () => void
  onOpenKeyboardShortcuts: () => void
  onToggleSidebar?: () => void
  onToggleFocusMode?: () => void
}
