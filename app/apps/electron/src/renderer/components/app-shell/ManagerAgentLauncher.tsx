import { createPortal } from "react-dom"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Bot, ChevronDown, Expand, Minus, Plus, RefreshCw, Send, Settings, Wand2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { navigate, routes } from "@/lib/navigate"
import { useAppShellContext, useSession } from "@/context/AppShellContext"
import type { AutoDecisionSettings } from "@craft-agent/shared/protocol"
import type { CreateSessionOptions } from "../../../shared/types"

const MANAGER_AGENT_SYSTEM_PROMPT = [
  '你是 Fleet/Craft Agents 的管理 Agent，是软件级管家，不是某个项目的执行 Agent。',
  '你的职责是帮助用户管理软件内部状态：会话、身份标签、权限、团队协调、自动决策、设置、Skill、数据源、上下文和记忆入口。',
  '优先使用已暴露的结构化工具操作内部状态，例如 list_sessions、get_session_info、set_session_labels、set_session_status、set_session_progress、get_team、send_team_message、assign_team_task、submit_team_report、config_validate、update_preferences、source_test、skill_validate。',
  '不要绕过 permission；写文件、运行命令、改设置、外发、删除、发布、登录或敏感操作必须按权限等级请求确认。L3 永远不能自动同意。',
  '不要替项目 Agent 深度写代码；需要项目执行时先整理目标、风险和交付标准，再通过团队/会话工具调度。',
  '回答要短，先说你准备执行的内部动作；没有可用工具时明确说明只能给建议，不能假装已经操作。',
].join('\n')

const QUICK_PROMPTS = [
  { label: '整理当前团队状态', prompt: '请读取当前会话和团队状态，按待安排、进行中、待审查、完成、取消整理一份简短行动清单。' },
  { label: '检查权限与自动决策', prompt: '请检查当前权限、身份标签和自动决策规则，指出会导致误操作或需要我确认的风险。' },
  { label: '列出需要我处理的事项', prompt: '请列出当前需要用户确认、审查或下一步决策的事项，只保留可执行项。' },
]

/**
 * Global Manager Agent entry.
 *
 * This intentionally lives outside SessionList: the list header slot is reserved
 * for team chat. Messages create a hidden Craft session so the manager still
 * uses the normal model, permission, tool, and timeline path.
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
      systemPromptPreset: MANAGER_AGENT_SYSTEM_PROMPT,
      ...(model?.mode === 'api_connection' && model.connectionSlug ? { llmConnection: model.connectionSlug } : {}),
      ...(model?.mode === 'api_connection' && model.model ? { model: model.model } : {}),
      ...(model?.thinkingLevel ? { thinkingLevel: model.thinkingLevel } : {}),
    }
  }, [settings?.model, title])

  const sendManagerText = useCallback(async (rawText: string) => {
    const text = rawText.trim()
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
      setError(null)
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : String(sendError))
    }
  }, [activeWorkspaceId, createOptions, managerSessionId, onCreateSession, onSendMessage])

  const sendInputMessage = useCallback(async () => {
    const text = input.trim()
    if (!text) return
    await sendManagerText(text)
    setInput('')
  }, [input, sendManagerText])

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
                  {QUICK_PROMPTS.map(action => (
                    <button
                      key={action.label}
                      type="button"
                      onClick={() => void sendManagerText(action.prompt)}
                      disabled={managerSession?.isProcessing}
                      className="w-full h-9 px-3 rounded-[6px] border border-border bg-background text-left text-sm hover:bg-foreground/[0.03] inline-flex items-center gap-2"
                    >
                      <Wand2 className="size-3.5 text-muted-foreground" />
                      <span className="truncate">{action.label}</span>
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
                    void sendInputMessage()
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
                  onClick={() => void sendInputMessage()}
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
