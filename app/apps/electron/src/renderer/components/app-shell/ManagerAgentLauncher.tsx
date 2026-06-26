import { createPortal } from "react-dom"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { useAtomValue } from "jotai"
import { cn } from "@/lib/utils"
import * as storage from "@/lib/local-storage"
import { useAppShellContext, useSession } from "@/context/AppShellContext"
import { CraftAgentsSymbol } from "@/components/icons/CraftAgentsSymbol"
import {
  useNavigationState,
  isSessionsNavigation,
} from "@/contexts/NavigationContext"
import { panelStackAtom } from "@/atoms/panel-stack"
import type { AutoDecisionSettings } from "@craft-agent/shared/protocol"
import type { CreateSessionOptions } from "../../../shared/types"
import {
  ManagerAgentColumn,
  type ManagerAgentExitMode,
  type ManagerAgentMessageView,
} from "./ManagerAgentColumn"

const MANAGER_AGENT_SYSTEM_PROMPT = [
  '你是 Fleet/Craft Agents 的管理 Agent，是软件级管家，不是某个项目的执行 Agent。',
  '你的职责是帮助用户管理软件内部状态：会话、身份标签、权限、团队协调、自动决策、设置、Skill、数据源、上下文和记忆入口。',
  '优先使用已暴露的结构化工具操作内部状态，例如 list_sessions、get_session_info、set_session_labels、set_session_status、set_session_progress、get_team、send_team_message、assign_team_task、submit_team_report、list_memory、add_memory、delete_memory、config_validate、update_preferences、source_test、skill_validate。',
  '不要绕过 permission；写文件、运行命令、改设置、外发、删除、发布、登录或敏感操作必须按权限等级请求确认。L3 永远不能自动同意。',
  '不要替项目 Agent 深度写代码；需要项目执行时先整理目标、风险和交付标准，再通过团队/会话工具调度。',
  '回答要短，先说你准备执行的内部动作；没有可用工具时明确说明只能给建议，不能假装已经操作。',
].join('\n')

const BUTTON_SIZE = 44
const PANEL_WIDTH = 400
const PANEL_HEIGHT = 480
const COLUMN_WIDTH = 480
const EDGE = 20
const PORTAL_HOST_ID = 'manager-agent-launcher-root'

// Renderer-local preference (no protocol/i18n key — kept inside Manager Agent domain).
const EXIT_MODE_KEY = 'craft-manager-agent-exit-behavior'
const DEFAULT_EXIT_MODE: ManagerAgentExitMode = 'persistent_mini'

type Point = { x: number; y: number }

function readExitMode(): ManagerAgentExitMode {
  if (typeof window === 'undefined') return DEFAULT_EXIT_MODE
  try {
    const raw = window.localStorage.getItem(EXIT_MODE_KEY)
    return raw === 'direct_exit' ? 'direct_exit' : 'persistent_mini'
  } catch {
    return DEFAULT_EXIT_MODE
  }
}

function writeExitMode(mode: ManagerAgentExitMode): void {
  try {
    window.localStorage.setItem(EXIT_MODE_KEY, mode)
  } catch {
    // ignore storage errors
  }
}

// Expose the exit-mode key for the settings page (same domain, no shared file).
export const MANAGER_AGENT_EXIT_MODE_KEY = EXIT_MODE_KEY
export const MANAGER_AGENT_DEFAULT_EXIT_MODE = DEFAULT_EXIT_MODE

function defaultLauncherPosition(): Point {
  if (typeof window === 'undefined') return { x: 0, y: 0 }
  return {
    x: window.innerWidth - BUTTON_SIZE - 24,
    y: window.innerHeight - BUTTON_SIZE - 24,
  }
}

function clampLauncherPosition(position: Point): Point {
  if (typeof window === 'undefined') return position
  return {
    x: Math.min(Math.max(EDGE, position.x), window.innerWidth - BUTTON_SIZE - EDGE),
    y: Math.min(Math.max(EDGE, position.y), window.innerHeight - BUTTON_SIZE - EDGE),
  }
}

function getPanelPosition(anchor: Point): Point {
  if (typeof window === 'undefined') return { x: EDGE, y: EDGE }
  const width = Math.min(PANEL_WIDTH, window.innerWidth - EDGE * 2)
  const height = Math.min(PANEL_HEIGHT, window.innerHeight - EDGE * 2)
  const preferredX = anchor.x + BUTTON_SIZE - width
  const preferredY = anchor.y - height - 12
  const fallbackY = anchor.y + BUTTON_SIZE + 12

  return {
    x: Math.min(Math.max(EDGE, preferredX), window.innerWidth - width - EDGE),
    y: preferredY >= EDGE
      ? preferredY
      : Math.min(Math.max(EDGE, fallbackY), window.innerHeight - height - EDGE),
  }
}

/**
 * Measure the content-area left boundary (right edge of the navigator panel).
 * The Manager Agent column portals as a fixed panel anchored to this edge so
 * it reads as a dedicated all-sessions column ("专门栏") in the content area,
 * without modifying MainContentPanel (owned by others). Returns null until a
 * navigator element is found.
 */
function measureContentLeft(): number | null {
  if (typeof document === 'undefined') return null
  const navigator = document.querySelector('[data-panel-role="navigator"]')
  if (!(navigator instanceof HTMLElement)) return null
  const rect = navigator.getBoundingClientRect()
  if (rect.width === 0) return null
  return Math.round(rect.right)
}

/**
 * Global Manager Agent entry.
 *
 * The software-level Manager Agent has two surfaces, both driven by a single
 * hidden Craft session and the normal model / permission / tool / timeline path:
 *
 * 1. "所有会话"层专栏 (column variant) — the primary message surface, shown as a
 *    dedicated column in the content area when the app is on the all-sessions
 *    layer with nothing selected. It is NOT inserted into a project session and
 *    does NOT occupy the team-chat SessionList top slot.
 * 2. Right-bottom唤起/最小化 button (mini variant) — an optional quick entry
 *    that唤起s the same manager chat as a corner popover when away from the
 *    all-sessions layer (or after the user minimized the column).
 *
 * Exit behavior is configurable: "直接退出" clears the conversation ref on close,
 * "常驻小窗" keeps it minimized and restorable. Sending never bypasses craft
 * permission; L3 is never auto-confirmed. The Manager Agent coordinates only —
 * it does not write project code on a project Agent's behalf.
 */
export function ManagerAgentLauncher() {
  const { t } = useTranslation()
  const { activeWorkspaceId, onCreateSession, onSendMessage } = useAppShellContext()
  const navState = useNavigationState()
  const panelCount = useAtomValue(panelStackAtom).length

  const [miniOpen, setMiniOpen] = useState(false)
  const [columnOpen, setColumnOpen] = useState(true)
  const [input, setInput] = useState('')
  const [settings, setSettings] = useState<AutoDecisionSettings | null>(null)
  const [managerSessionId, setManagerSessionId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [exitMode, setExitMode] = useState<ManagerAgentExitMode>(DEFAULT_EXIT_MODE)
  const [portalHost, setPortalHost] = useState<HTMLElement | null>(null)
  const [contentLeft, setContentLeft] = useState<number | null>(null)
  const [launcherPosition, setLauncherPosition] = useState<Point>(() => {
    return typeof window === 'undefined'
      ? { x: 0, y: 0 }
      : clampLauncherPosition(storage.get(storage.KEYS.managerAgentLauncherPosition, defaultLauncherPosition()))
  })
  const launcherPositionRef = useRef(launcherPosition)
  const dragRef = useRef<{
    active: boolean
    pointerId: number | null
    startX: number
    startY: number
    originX: number
    originY: number
    moved: boolean
  }>({
    active: false,
    pointerId: null,
    startX: 0,
    startY: 0,
    originX: 0,
    originY: 0,
    moved: false,
  })
  const managerSession = useSession(managerSessionId ?? '__manager-agent-none__')
  const title = t('settings.managerAgent.title')

  // The Manager Agent column is the primary surface at the all-sessions layer
  // when nothing is selected (no content panels pushed). It must NOT appear for
  // a single project session, and it does NOT touch the team SessionList slot.
  const isAllSessionsEmpty = useMemo(() => {
    if (!isSessionsNavigation(navState)) return false
    if (navState.details) return false
    if (panelCount > 0) return false
    return navState.filter.kind === 'allSessions'
  }, [navState, panelCount])

  useEffect(() => {
    if (typeof document === 'undefined') return

    let host = document.getElementById(PORTAL_HOST_ID)
    if (!host) {
      host = document.createElement('div')
      host.id = PORTAL_HOST_ID
      document.body.appendChild(host)
    }

    document
      .querySelectorAll('button[aria-label], div[role="dialog"][aria-label]')
      .forEach((node) => {
        if (!(node instanceof HTMLElement)) return
        if (node.getAttribute('aria-label') !== title) return
        if (host.contains(node)) return
        if (!node.classList.contains('fixed')) return
        node.remove()
      })

    setPortalHost(host)
  }, [title])

  useEffect(() => {
    launcherPositionRef.current = launcherPosition
  }, [launcherPosition])

  useEffect(() => {
    setExitMode(readExitMode())
  }, [])

  // Measure content-area left boundary for the column whenever the layout that
  // affects it changes. Re-measured on resize; navigation changes are covered
  // by the effect re-running when isAllSessionsEmpty flips true.
  useEffect(() => {
    if (!isAllSessionsEmpty) {
      setContentLeft(null)
      return
    }
    let frame = 0
    const measure = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => setContentLeft(measureContentLeft()))
    }
    measure()
    window.addEventListener('resize', measure)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', measure)
    }
  }, [isAllSessionsEmpty])

  // Build the column's message view from the shared hidden session. The column
  // shows a longer tail than the corner mini popover since it's the primary
  // conversation surface.
  const columnMessages = useMemo<ManagerAgentMessageView[]>(() => {
    return (managerSession?.messages ?? [])
      .filter(message => message.role === 'user' || message.role === 'assistant' || message.role === 'error')
      .slice(-40)
      .map(message => ({ id: message.id, role: message.role, content: message.content }))
  }, [managerSession?.messages])

  const miniMessages = useMemo<ManagerAgentMessageView[]>(() => {
    return (managerSession?.messages ?? [])
      .filter(message => message.role === 'user' || message.role === 'assistant' || message.role === 'error')
      .slice(-6)
      .map(message => ({ id: message.id, role: message.role, content: message.content }))
  }, [managerSession?.messages])

  const loadSettings = useCallback(async () => {
    if (!window.electronAPI || !activeWorkspaceId) return
    try {
      setSettings(await window.electronAPI.getManagerDecisionSettings(activeWorkspaceId))
      setError(null)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : String(loadError))
    }
  }, [activeWorkspaceId])

  useEffect(() => {
    if (miniOpen || isAllSessionsEmpty) void loadSettings()
  }, [loadSettings, miniOpen, isAllSessionsEmpty])

  useEffect(() => {
    const handleResize = () => {
      setLauncherPosition((current) => {
        const next = clampLauncherPosition(current)
        launcherPositionRef.current = next
        storage.set(storage.KEYS.managerAgentLauncherPosition, next)
        return next
      })
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const createOptions = useCallback((): CreateSessionOptions => {
    const model = settings?.model
    return {
      name: title,
      hidden: true,
      permissionMode: 'ask',
      systemPromptPreset: MANAGER_AGENT_SYSTEM_PROMPT,
      ...(model?.mode === 'api_connection' && model.connectionSlug ? { llmConnection: model.connectionSlug } : {}),
      ...(model?.mode === 'api_connection' && model.model ? { model: model.model } : {}),
      ...(model?.thinkingLevel ? { thinkingLevel: model.thinkingLevel } : {}),
    }
  }, [settings?.model, title])

  // Resolve the manager session id, creating a hidden Craft session (with the
  // manager system prompt + ask permission mode) on first send. Sending flows
  // through the normal onSendMessage → model / permission / tool / timeline
  // path; nothing here bypasses permission or auto-confirms L3.
  const sendManagerText = useCallback(async () => {
    const text = input.trim()
    if (!text) return
    if (!activeWorkspaceId) {
      setError('没有可用工作区')
      return
    }
    try {
      let sessionId = managerSessionId
      if (!sessionId) {
        const session = await onCreateSession(activeWorkspaceId, createOptions())
        sessionId = session.id
        setManagerSessionId(session.id)
      }
      onSendMessage(sessionId, text)
      setInput('')
      setError(null)
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : String(sendError))
    }
  }, [activeWorkspaceId, createOptions, input, managerSessionId, onCreateSession, onSendMessage])

  // Exit honors the configured exit behavior. "direct_exit" clears the
  // conversation ref so the next entry starts fresh; "persistent_mini" keeps
  // the ref so the mini-window/column can be restored with history.
  const handleExit = useCallback(() => {
    setMiniOpen(false)
    setColumnOpen(false)
    if (exitMode === 'direct_exit') {
      setManagerSessionId(null)
    }
  }, [exitMode])

  const handleMinimize = useCallback(() => {
    setMiniOpen(false)
    setColumnOpen(false)
  }, [])

  // When the user leaves the all-sessions layer, the column is not the primary
  // surface anymore; keep the conversation ref so the corner button can唤起 it.
  useEffect(() => {
    if (!isAllSessionsEmpty) {
      setColumnOpen(false)
    }
  }, [isAllSessionsEmpty])

  const handlePointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId)
    dragRef.current = {
      active: true,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: launcherPosition.x,
      originY: launcherPosition.y,
      moved: false,
    }
  }

  const handlePointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current
    if (!drag.active || drag.pointerId !== event.pointerId) return
    const dx = event.clientX - drag.startX
    const dy = event.clientY - drag.startY
    if (Math.abs(dx) + Math.abs(dy) > 4) drag.moved = true
    const next = clampLauncherPosition({ x: drag.originX + dx, y: drag.originY + dy })
    launcherPositionRef.current = next
    setLauncherPosition(next)
  }

  const handlePointerUp = (event: React.PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current
    if (drag.pointerId === event.pointerId && event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    dragRef.current = { ...drag, active: false, pointerId: null }
    storage.set(storage.KEYS.managerAgentLauncherPosition, launcherPositionRef.current)
    if (!drag.moved) {
      // Corner button唤起s the surface: prefer the column when on the
      // all-sessions layer, otherwise the corner mini popover.
      if (isAllSessionsEmpty) {
        setColumnOpen(true)
      } else {
        setMiniOpen(true)
      }
    }
  }

  if (!portalHost || typeof document === 'undefined') return null

  const panelWidth = Math.min(PANEL_WIDTH, window.innerWidth - EDGE * 2)
  const panelHeight = Math.min(PANEL_HEIGHT, window.innerHeight - EDGE * 2)
  const panelPosition = getPanelPosition(launcherPosition)

  const showColumn = isAllSessionsEmpty && columnOpen && contentLeft !== null
  const columnLeft = contentLeft ?? EDGE
  const columnWidth = Math.min(COLUMN_WIDTH, window.innerWidth - columnLeft - EDGE)
  const columnHeight = window.innerHeight - EDGE * 2

  return createPortal(
    <>
      {/* === All-sessions column (primary surface) === */}
      {showColumn && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-floating-menu cursor-default bg-transparent"
            aria-label="Close manager agent column"
            onClick={handleMinimize}
            data-manager-agent-column-backdrop
          />
          <ManagerAgentColumn
            title={title}
            variant="column"
            exitMode={exitMode}
            messages={columnMessages}
            isProcessing={!!managerSession?.isProcessing}
            input={input}
            onInputChange={setInput}
            onSend={() => void sendManagerText()}
            onMinimize={handleMinimize}
            onExit={handleExit}
            emptyHint={'管理 Agent 在这里帮你看管软件'}
            emptySub={'让它整理会话、改设置、调度团队任务、归档记忆——写操作都要你或规则授权'}
            placeholder={t('editPopover.placeholder3')}
            processingHint={'正在处理…'}
            error={error}
            className="fixed z-floating-menu"
            style={{ left: columnLeft, top: EDGE, width: columnWidth, height: columnHeight }}
          />
        </>
      )}

      {/* === Corner mini popover (optional 唤起/最小化 entry) === */}
      {miniOpen && !isAllSessionsEmpty && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-floating-menu cursor-default bg-transparent"
            aria-label="Close manager agent"
            onClick={handleMinimize}
            data-manager-agent-backdrop
          />
          <ManagerAgentColumn
            title={title}
            variant="mini"
            exitMode={exitMode}
            messages={miniMessages}
            isProcessing={!!managerSession?.isProcessing}
            input={input}
            onInputChange={setInput}
            onSend={() => void sendManagerText()}
            onMinimize={handleMinimize}
            onExit={handleExit}
            emptyHint={t('editPopover.whatToChange')}
            emptySub={t('editPopover.justDescribe')}
            placeholder={t('editPopover.placeholder3')}
            processingHint={'正在处理…'}
            error={error}
            className="fixed z-floating-menu"
            style={{ left: panelPosition.x, top: panelPosition.y, width: panelWidth, height: panelHeight }}
          />
        </>
      )}

      <button
        type="button"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        aria-label={title}
        className={cn(
          'fixed z-floating-menu flex items-center justify-center rounded-full border border-border bg-background text-accent shadow-middle',
          'h-11 w-11 cursor-grab active:cursor-grabbing hover:bg-foreground/[0.04]',
        )}
        style={{ left: launcherPosition.x, top: launcherPosition.y }}
        data-manager-agent-launcher
      >
        <CraftAgentsSymbol className="h-5 w-5" />
      </button>
    </>,
    portalHost,
  )
}

/**
 * Re-export the exit-mode helpers so the Manager settings page (same domain)
 * can read/persist the user's choice without touching shared settings files.
 */
export function readManagerAgentExitMode(): ManagerAgentExitMode {
  return readExitMode()
}

export function persistManagerAgentExitMode(mode: ManagerAgentExitMode): void {
  writeExitMode(mode)
}