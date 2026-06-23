import { createPortal } from "react-dom"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Bot, ChevronDown, Expand, Minus, Plus, RefreshCw, Send, Settings } from "lucide-react"
import { cn } from "@/lib/utils"
import { navigate, routes } from "@/lib/navigate"

/**
 * Global Manager Agent entry.
 *
 * This intentionally lives outside SessionList: the list header slot is reserved
 * for team chat. Until a real manager conversation session exists, the input is
 * disabled and actions route to the wired Manager settings surface.
 */
export function ManagerAgentLauncher() {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)

  if (typeof document === 'undefined') return null

  const title = t('settings.managerAgent.title')
  const openSettings = () => {
    navigate(routes.view.settings('managerAgent'))
    setOpen(false)
  }

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
              disabled
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
                onClick={openSettings}
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

          <div className="flex-1 min-h-0 px-5 py-6 overflow-y-auto flex flex-col items-center justify-center gap-3">
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

          <div className="p-3 border-t border-border/70">
            <div className="rounded-[8px] border border-border bg-background px-3 py-2">
              <textarea
                className="w-full h-12 resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground/80 disabled:cursor-not-allowed"
                placeholder="管理对话后端待接入"
                disabled
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
                  className="size-8 rounded-[8px] bg-foreground text-background inline-flex items-center justify-center opacity-45 cursor-not-allowed"
                  disabled
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
