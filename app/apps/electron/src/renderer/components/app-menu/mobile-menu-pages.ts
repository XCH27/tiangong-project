import { HELP_LINKS, ROOT_MENU } from '../../../shared/menu-schema'

/** Every compact-menu row opens its destination directly. */
export type MobileMenuAction =
  | { kind: 'callback'; key: 'newChat' | 'newWindow' | 'openSettings' | 'openKeyboardShortcuts' }
  | { kind: 'url'; url: string }
  | { kind: 'electronApi'; method: 'menuToggleDevTools' }

export interface MobileMenuRow {
  id: string
  iconName: string
  labelKey: string
  action: MobileMenuAction
}

interface BuildOptions {
  hasNewWindow: boolean
  isDebugMode: boolean
}

/**
 * The compact menu keeps the same one-step destinations as the desktop popup.
 * Settings opens its existing navigator; Help opens the one documentation link.
 */
export function buildMobileMenuRows({ hasNewWindow, isDebugMode }: BuildOptions): MobileMenuRow[] {
  const rows: MobileMenuRow[] = [
    {
      id: ROOT_MENU.newChat.id,
      iconName: ROOT_MENU.newChat.icon,
      labelKey: ROOT_MENU.newChat.labelKey,
      action: { kind: 'callback', key: 'newChat' },
    },
  ]

  if (hasNewWindow) {
    rows.push({
      id: ROOT_MENU.newWindow.id,
      iconName: ROOT_MENU.newWindow.icon,
      labelKey: ROOT_MENU.newWindow.labelKey,
      action: { kind: 'callback', key: 'newWindow' },
    })
  }

  rows.push({
    id: 'settings',
    iconName: 'Settings',
    labelKey: 'menu.settings',
    action: { kind: 'callback', key: 'openSettings' },
  })

  rows.push({
    id: ROOT_MENU.keyboardShortcuts.id,
    iconName: ROOT_MENU.keyboardShortcuts.icon,
    labelKey: ROOT_MENU.keyboardShortcuts.labelKey,
    action: { kind: 'callback', key: 'openKeyboardShortcuts' },
  })

  rows.push(...HELP_LINKS.map<MobileMenuRow>(link => ({
    id: link.id,
    iconName: link.icon,
    labelKey: link.labelKey,
    action: { kind: 'url', url: link.url },
  })))

  if (isDebugMode) {
    rows.push({
      id: 'toggleDevTools',
      iconName: 'Bug',
      labelKey: 'menu.toggleDevTools',
      action: { kind: 'electronApi', method: 'menuToggleDevTools' },
    })
  }

  return rows
}
