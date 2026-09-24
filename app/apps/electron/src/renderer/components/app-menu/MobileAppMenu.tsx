import * as React from 'react'
import { createPortal } from 'react-dom'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import * as Icons from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { useRegisterDismissibleLayer } from '@/context/DismissibleLayerContext'
import { CraftAgentsSymbol } from '../icons/CraftAgentsSymbol'
import { SquarePenRounded } from '../icons/SquarePenRounded'
import { TopBarButton } from '../ui/TopBarButton'
import { MobileMenuPage } from './MobileMenuPage'
import { MobileMenuItem } from './MobileMenuItem'
import { buildMobileMenuRows, type MobileMenuRow } from './mobile-menu-pages'
import type { AppMenuProps } from './types'
import { openLocalHelp } from '@/lib/local-help'

const SNAPPY_SPRING = { type: 'spring' as const, stiffness: 400, damping: 36, mass: 0.8 }
const BACKDROP_FADE = { duration: 0.18 }

function getIcon(name: string): React.ComponentType<{ className?: string }> | null {
  const IconComponent = Icons[name as keyof typeof Icons] as React.ComponentType<{ className?: string }> | undefined
  return IconComponent ?? null
}

function renderRowIcon(iconName: string, rowId: string): React.ReactNode {
  // The schema's "newChat" item declares icon: 'SquarePen' but we render the
  // local rounded variant to match the desktop dropdown.
  if (rowId === 'newChat') {
    return <SquarePenRounded className="h-5 w-5" />
  }
  const Icon = getIcon(iconName)
  return Icon ? <Icon className="h-5 w-5" /> : null
}

/**
 * Mobile AppMenu — Craft logo trigger that opens a single-page full-screen sheet.
 *
 * Mounted only when `AppShellContext.isCompactMode === true` via the `AppMenu` router.
 *
 * Sheet rendering is portalled into the closest element marked with
 * `data-mobile-menu-root` (PanelStackContainer in production, MobileWebUIFrame
 * in the playground). Falls back to `document.body` if no marker is found.
 */
export function MobileAppMenu(props: AppMenuProps) {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const [isDebugMode, setIsDebugMode] = useState(false)

  useEffect(() => {
    window.electronAPI.isDebugMode().then(setIsDebugMode)
  }, [])

  const rows = useMemo(
    () => buildMobileMenuRows({ hasNewWindow: !!props.onNewWindow, isDebugMode }),
    [props.onNewWindow, isDebugMode],
  )

  const close = React.useCallback(() => setIsOpen(false), [])

  // Register with the dismissible layer registry so Escape/back closes the sheet.
  // Priority 0 keeps us under permission/credential prompts (which register higher).
  const layerRegistration = useMemo(
    () => isOpen ? {
      id: 'mobile-app-menu',
      type: 'modal' as const,
      priority: 0,
      isOpen: true,
      close,
    } : null,
    [isOpen, close],
  )
  useRegisterDismissibleLayer(layerRegistration)

  const dispatchAction = (row: MobileMenuRow) => {
    switch (row.action.kind) {
      case 'callback':
        switch (row.action.key) {
          case 'newChat': props.onNewChat(); break
          case 'newWindow': props.onNewWindow?.(); break
          case 'openSettings': props.onOpenSettings(); break
          case 'openKeyboardShortcuts': props.onOpenKeyboardShortcuts(); break
        }
        close()
        return
      case 'url':
        openLocalHelp(row.action.url)
        close()
        return
      case 'electronApi':
        switch (row.action.method) {
          case 'menuToggleDevTools': window.electronAPI.menuToggleDevTools(); break
        }
        close()
        return
    }
  }

  return (
    <>
      <TopBarButton
        onClick={() => setIsOpen(open => !open)}
        aria-label={t('menu.craftMenu')}
        data-state={isOpen ? 'open' : 'closed'}
        className="rounded-[8px]"
      >
        <CraftAgentsSymbol className="!h-5 !w-auto text-accent" />
      </TopBarButton>
      <MobileMenuSheet
        isOpen={isOpen}
        rows={rows}
        onClose={close}
        onActivateRow={dispatchAction}
        t={t}
      />
    </>
  )
}

interface SheetProps {
  isOpen: boolean
  rows: MobileMenuRow[]
  onClose: () => void
  onActivateRow: (row: MobileMenuRow) => void
  t: (key: string) => string
}

function MobileMenuSheet({ isOpen, rows, onClose, onActivateRow, t }: SheetProps) {
  const portalTarget = useMobileMenuPortalTarget(isOpen)
  if (!portalTarget) return null

  // True while the sheet is open OR animating out — AnimatePresence handles the rest.
  const sheet = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="mobile-app-menu-sheet"
          className="absolute inset-0 z-modal"
          initial="closed"
          animate="open"
          exit="closed"
        >
          {/* Backdrop dim — only meaningful when the portal target has visible siblings,
              but cheap and harmless otherwise. */}
          <motion.div
            className="absolute inset-0 bg-foreground/30"
            variants={{ open: { opacity: 1 }, closed: { opacity: 0 } }}
            transition={BACKDROP_FADE}
            onClick={onClose}
          />
          <motion.div
            className="absolute inset-0 bg-background overflow-hidden"
            variants={{ open: { y: '0%' }, closed: { y: '100%' } }}
            transition={SNAPPY_SPRING}
          >
            <MobileMenuPage title={t('menu.craftMenu')} onClose={onClose}>
              <ul className="py-2">
                {rows.map(row => (
                  <li key={row.id}>
                    <MobileMenuItem
                      icon={renderRowIcon(row.iconName, row.id)}
                      label={t(row.labelKey)}
                      affordance="none"
                      onClick={() => onActivateRow(row)}
                    />
                  </li>
                ))}
              </ul>
            </MobileMenuPage>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )

  return createPortal(sheet, portalTarget)
}

/**
 * Resolves the portal target for the sheet. Returns `null` until the document is
 * available (SSR-safety / initial mount) and re-resolves whenever the sheet opens
 * so demos that mount after the first render still work.
 */
function useMobileMenuPortalTarget(isOpen: boolean): HTMLElement | null {
  const [target, setTarget] = useState<HTMLElement | null>(null)
  useEffect(() => {
    if (!isOpen) return
    const found = document.querySelector('[data-mobile-menu-root]')
    setTarget((found as HTMLElement | null) ?? document.body)
  }, [isOpen])
  return target
}
