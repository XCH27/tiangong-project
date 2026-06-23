import { createPortal } from "react-dom"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Bot, ChevronDown, Expand, Minus, Plus, RefreshCw, Send, Settings } from "lucide-react"
import { cn } from "@/lib/utils"
import { navigate, routes } from "@/lib/navigate"
import { useAppShellContext, useSession } from "@/context/AppShellContext"
import type { AutoDecisionSettings } from "@craft-agent/shared/protocol"
import type { CreateSessionOptions } from "../../../shared/types"

/**
 * Global Manager Agent entry.
 *
 * This intentionally lives outside SessionList: the list header slot is reserved
 * for team chat. Until a real manager conversation session exists, the input is
 * disabled and actions route to the wired Manager settings surface.
 */
export function ManagerAgentLauncher() {
  const { t } = useTranslation()
  const { activeWorkspaceId, onCreateSession, onSendMessage } = useAppShellContext()
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [settings, setSettings] = useState<AutoDecisionSettings | null>(null)
  const [managerSessionId, setManagerSessionId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const managerSession = useSession(managerSessionId ?? '__manager-agent-none__')

  if (typeof document === 'undefined') return null

  const title = t('settings.managerAgent.title')
  const visibleMessages = useMemo(() => {
    return (managerSession?.messages ?? [])
      .filter(message => message.role === 'user' || message.role === 'assistant' || message.role === 'error')
      .slice(-8)
  }, [managerSession?.messages])

  const openSettings = () => {
    navigate(routes.view.settings('managerAgent'))
    setOpen(false)
  }

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

  const createOptions = useCallback((): CreateSessionOptions => {
    const model = settings?.model
    return {
      name: title,
      hidden: true,
      permissionMode: 'ask',
      systemPromptPreset: 'default',
      ...(model?.mode === 'api_connection' && model.connectionSlug ? { llmConnection: model.connectionSlug } : {}),
      ...(model?.mode === 'api_connection' && model.model ? { model: model.model } : {}),
      ...(model?.thinkingLevel ? { thinkingLevel: model.thinkingLevel } : {}),
    }
  }, [settings?.model, title])

  const sendMessage = useCallback(async () => {
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

  return createPortal(
    <>
      {open ? (
        <div
          className={cn(
            "fixed right-5 bottom-5 z-floating-menu",
            "w-[360px] max-w-[calc(100vw-2.5rem)] h-[420px] max-h-[calc(100vh-5rem)]",
            "rounded-[8px] border border-border bg-background text-foreground shadow-modal",
            "flex flex-col overflow-hidden",
          )}
          role="dialog"
          aria-label={title}
        >
          <div className="h-12 px-3 border-b border-border/70 flex items-center gap-2">
            <button
              type="button"
              className="size-7 rounded-[6px] inline-flex items-center justify-center hover:bg-foreground/[0.04]"
              aria-label={t('session.newSession')}
              onClick={() => {
                setManagerSessionId(null)
                setInput('')
                setError(null)
              }}
            >
              <Plus className="size-4 text-muted-foreground" />
            </button>
            <button
              type="button"
              className="h-8 min-w-0 px-2 rounded-[6px] inline-flex items-center gap-1.5 hover:bg-foreground/[0.04]"
              onClick={openSettings}
            >
              <Bot className="size-4" />
              <span className="text-sm font-medium truncate">{title}</span>
              <ChevronDown className="size-3.5 text-muted-foreground" />
            </button>
            <div className="ml-auto flex items-center gap-1">
              <button
                type="button"
                className="size-7 rounded-[6px] inline-flex items-center justify-center hover:bg-foreground/[0.04]"
                aria-label="Refresh"
                onClick={() => void loadSettings()}
              >
                <RefreshCw className="size-3.5" />
              </button>
              <button
                type="button"
                className="size-7 rounded-[6px] inline-flex items-center justify-center hover:bg-foreground/[0.04]"
                aria-label="Expand"
                onClick={openSettings}
              >
                <Expand className="size-3.5" />
              </button>
              <button
                type="button"
                className="size-7 rounded-[6px] inline-flex items-center justify-center hover:bg-foreground/[0.04]"
                aria-label="Minimize"
                onClick={() => setOpen(false)}
              >
                <Minus className="size-3.5" />
              </button>
            </div>
          </div>

          <div className="flex-1 min-h-0 px-5 py-5 overflow-y-auto flex flex-col gap-3">
            {visibleMessages.length === 0 ? (
              <div className="flex-1 min-h-[180px] flex flex-col items-center justify-center gap-3">
                <div className="size-10 rounded-[8px] border border-border bg-foreground/[0.04] flex items-center justify-center">
                  <Bot className="size-5" />
                </div>
                <div className="text-center">
                  <div className="text-[15px] font-semibold">你好，我是{title}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{t('settings.managerAgent.description')}</div>
                </div>
                <div className="w-full mt-3 flex flex-col gap-2">
                  {[
                    '打开管理设置',
                    '查看自动决策规则',
                    '查看分层记忆',
                  ].map(label => (
                    <button
                      key={label}
                      type="button"
                      onClick={openSettings}
                      className="w-full h-9 px-3 rounded-[6px] border border-border bg-background text-left text-sm hover:bg-foreground/[0.03] inline-flex items-center gap-2"
                    >
                      <Settings className="size-3.5 text-muted-foreground" />
                      <span className="truncate">{label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {visibleMessages.map(message => (
                  <div
                    key={message.id}
                    className={cn(
                      "rounded-[8px] px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap",
                      message.role === 'user'
                        ? "ml-8 bg-foreground text-background"
                        : "mr-8 border border-border bg-foreground/[0.03]",
                      message.role === 'error' && "border-destructive/40 text-destructive",
                    )}
                  >
                    {message.content}
                  </div>
                ))}
                {managerSession?.isProcessing && (
                  <div className="mr-8 rounded-[8px] border border-border bg-foreground/[0.03] px-3 py-2 text-sm text-muted-foreground">
                    正在思考…
                  </div>
                )}
              </div>
            )}
            {error && (
              <div className="rounded-[8px] border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                {error}
              </div>
            )}
            <div className="text-[11px] text-muted-foreground">
              模型：{settings?.model?.mode === 'api_connection'
                ? [settings.model.connectionSlug, settings.model.model || '连接默认模型'].filter(Boolean).join(' · ')
                : '跟随工作区默认'}
            </div>
          </div>

          <div className="p-3 border-t border-border/70">
            <div className="rounded-[8px] border border-border bg-background px-3 py-2">
              <textarea
                className="w-full h-12 resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground/80 disabled:cursor-not-allowed"
                placeholder={`给${title}发消息…`}
                value={input}
                onChange={event => setInput(event.target.value)}
                onKeyDown={event => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault()
                    void sendMessage()
                  }
                }}
                disabled={managerSession?.isProcessing}
              />
              <div className="mt-2 flex items-center justify-between">
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"
                  onClick={openSettings}
                >
                  <Bot className="size-3.5" />
                  <span>{title}</span>
                  <ChevronDown className="size-3" />
                </button>
                <button
                  type="button"
                  className={cn(
                    "size-8 rounded-[8px] bg-foreground text-background inline-flex items-center justify-center",
                    (!input.trim() || managerSession?.isProcessing) && "opacity-45 cursor-not-allowed",
                  )}
                  disabled={!input.trim() || managerSession?.isProcessing}
                  onClick={() => void sendMessage()}
                  aria-label="Send"
                >
                  <Send className="size-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={title}
          className={cn(
            "fixed right-5 bottom-20 z-floating-menu",
            "size-12 rounded-full border border-border bg-background text-foreground",
            "flex items-center justify-center shadow-modal-small",
            "hover:bg-foreground/[0.04] active:scale-95 transition",
          )}
        >
          <Bot className="size-5" />
        </button>
      )}
    </>,
    document.body,
  )
}
