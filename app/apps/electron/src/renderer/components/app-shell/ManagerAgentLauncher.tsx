import { createPortal } from "react-dom"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { ArrowUp, GripHorizontal, Paperclip } from "lucide-react"
import { cn } from "@/lib/utils"
import * as storage from "@/lib/local-storage"
import { useAppShellContext, useSession } from "@/context/AppShellContext"
import { CraftAgentsSymbol } from "@/components/icons/CraftAgentsSymbol"
import type { AutoDecisionSettings } from "@craft-agent/shared/protocol"
import type { CreateSessionOptions } from "../../../shared/types"

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
const EDGE = 20
const PORTAL_HOST_ID = 'manager-agent-launcher-root'

type Point = { x: number; y: number }

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
 * Global Manager Agent entry.
 *
 * The visual shell intentionally follows Craft's existing inline agent edit
 * popover language: floating grip, quiet empty state, and a bottom prompt box.
 * Sending still creates a hidden Craft session and uses the normal model,
 * permission, tool, and timeline path.
 */
export function ManagerAgentLauncher() {
  const { t } = useTranslation()
  const { activeWorkspaceId, onCreateSession, onSendMessage } = useAppShellContext()
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [settings, setSettings] = useState<AutoDecisionSettings | null>(null)
  const [managerSessionId, setManagerSessionId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [portalHost, setPortalHost] = useState<HTMLElement | null>(null)
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

  const visibleMessages = useMemo(() => {
    return (managerSession?.messages ?? [])
      .filter(message => message.role === 'user' || message.role === 'assistant' || message.role === 'error')
      .slice(-6)
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
    if (open) void loadSettings()
  }, [loadSettings, open])

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
    if (!drag.moved) setOpen(true)
  }

  if (!portalHost || typeof document === 'undefined') return null

  const panelWidth = Math.min(PANEL_WIDTH, window.innerWidth - EDGE * 2)
  const panelHeight = Math.min(PANEL_HEIGHT, window.innerHeight - EDGE * 2)
  const panelPosition = getPanelPosition(launcherPosition)

  return createPortal(
    <>
      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-floating-menu cursor-default bg-transparent"
            aria-label="Close manager agent"
            onClick={() => setOpen(false)}
            data-manager-agent-backdrop
          />
          <div
            className="fixed z-floating-menu flex flex-col overflow-hidden rounded-[16px] bg-foreground-2 shadow-modal-small"
            style={{
              left: panelPosition.x,
              top: panelPosition.y,
              width: panelWidth,
              height: panelHeight,
            }}
            role="dialog"
            aria-label={title}
            data-manager-agent-panel
          >
            <div className="absolute left-1/2 top-0 z-10 -translate-x-1/2 px-4 py-2">
              <GripHorizontal className="h-4 w-4 text-muted-foreground/30" />
            </div>

            <div className="flex min-h-0 flex-1 flex-col">
              {visibleMessages.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
                  <div className="text-[16px] font-medium text-foreground/60">{t('editPopover.whatToChange')}</div>
                  <div className="mt-2 text-[14px] text-muted-foreground/70">{t('editPopover.justDescribe')}</div>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto px-5 py-10">
                  <div className="space-y-3">
                    {visibleMessages.map(message => (
                      <div
                        key={message.id}
                        className={cn(
                          'rounded-[10px] px-3 py-2 text-[13px] leading-relaxed whitespace-pre-wrap',
                          message.role === 'user'
                            ? 'ml-10 bg-foreground text-background'
                            : 'mr-10 bg-background/70 text-foreground shadow-minimal',
                          message.role === 'error' && 'text-destructive',
                        )}
                      >
                        {message.content}
                      </div>
                    ))}
                    {managerSession?.isProcessing && (
                      <div className="mr-10 rounded-[10px] bg-background/70 px-3 py-2 text-[13px] text-muted-foreground shadow-minimal">
                        正在处理…
                      </div>
                    )}
                  </div>
                </div>
              )}

              {error && (
                <div className="mx-4 mb-2 rounded-[8px] bg-destructive/5 px-3 py-2 text-xs text-destructive">
                  {error}
                </div>
              )}

              <div className="p-4">
                <div className="rounded-[14px] bg-background px-4 py-3 shadow-middle">
                  <textarea
                    className="h-28 w-full resize-none bg-transparent text-[15px] outline-none placeholder:text-muted-foreground/70 disabled:cursor-not-allowed"
                    placeholder={t('editPopover.placeholder3')}
                    value={input}
                    onChange={event => setInput(event.target.value)}
                    onKeyDown={event => {
                      if (event.key === 'Enter' && !event.shiftKey) {
                        event.preventDefault()
                        void sendManagerText()
                      }
                    }}
                    disabled={managerSession?.isProcessing}
                  />
                  <div className="mt-2 flex items-center justify-between">
                    <button
                      type="button"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-[8px] text-muted-foreground hover:bg-foreground/[0.05]"
                      aria-label="Attach"
                    >
                      <Paperclip className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      className={cn(
                        'inline-flex h-9 w-9 items-center justify-center rounded-full bg-foreground text-background',
                        (!input.trim() || managerSession?.isProcessing) && 'cursor-not-allowed opacity-45',
                      )}
                      disabled={!input.trim() || managerSession?.isProcessing}
                      onClick={() => void sendManagerText()}
                      aria-label="Send"
                    >
                      <ArrowUp className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
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
