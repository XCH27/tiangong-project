import * as React from 'react'
import { ArrowUp, Paperclip, X, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CraftAgentsSymbol } from '@/components/icons/CraftAgentsSymbol'

export type ManagerAgentExitMode = 'direct_exit' | 'persistent_mini'

export interface ManagerAgentMessageView {
  id: string
  role: string
  content: string
}

export interface ManagerAgentColumnProps {
  title: string
  variant: 'column' | 'mini'
  exitMode: ManagerAgentExitMode
  messages: ManagerAgentMessageView[]
  isProcessing: boolean
  input: string
  onInputChange: (value: string) => void
  onSend: () => void
  onMinimize: () => void
  onExit: () => void
  emptyHint: string
  emptySub: string
  placeholder: string
  processingHint: string
  error: string | null
  style?: React.CSSProperties
  className?: string
}

/**
 * ManagerAgentColumn — presentational surface for the software-level Manager Agent.
 *
 * Session creation, sending, permission/tool/timeline routing all live in the
 * parent (`ManagerAgentLauncher`); this component is pure presentation so the
 * manager chat can be rendered either as a dedicated all-sessions column
 * ("专栏") or as a corner mini-window, sharing one hidden Craft session.
 *
 * The column intentionally follows Craft's inline edit-popover language:
 * floating grip header, quiet empty state, bottom prompt box. No state of its
 * own — every interaction is reported back to the owner.
 */
export function ManagerAgentColumn({
  title,
  variant,
  exitMode,
  messages,
  isProcessing,
  input,
  onInputChange,
  onSend,
  onMinimize,
  onExit,
  emptyHint,
  emptySub,
  placeholder,
  processingHint,
  error,
  style,
  className,
}: ManagerAgentColumnProps) {
  const isColumn = variant === 'column'
  const closeLabel = exitMode === 'direct_exit' ? '关闭 management agent' : '收起常驻小窗'

  return (
    <div
      role="dialog"
      aria-label={title}
      data-manager-agent-panel
      data-manager-agent-variant={variant}
      className={cn(
        'flex flex-col overflow-hidden bg-foreground-2 shadow-modal-small',
        isColumn ? 'rounded-[16px]' : 'rounded-[16px]',
        className,
      )}
      style={style}
    >
      {/* Header: identity + minimize + exit (exit honors the exit-behavior setting) */}
      <div
        className={cn(
          'flex items-center gap-2 px-4',
          isColumn ? 'py-3 border-b border-border/40' : 'pt-4 pb-1',
        )}
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-background text-accent shadow-minimal">
          <CraftAgentsSymbol className="h-3.5 w-3.5" />
        </span>
        <span className="text-[14px] font-medium text-foreground/80">{title}</span>
        <span className="ml-1 text-[11px] text-muted-foreground/60">软件管家 · 不替项目 Agent 执行</span>
        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={onMinimize}
            aria-label="最小化管理 Agent"
            className="inline-flex h-7 w-7 items-center justify-center rounded-[8px] text-muted-foreground hover:bg-foreground/[0.06]"
          >
            <Minus className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onExit}
            aria-label={closeLabel}
            className="inline-flex h-7 w-7 items-center justify-center rounded-[8px] text-muted-foreground hover:bg-foreground/[0.06]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        {messages.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
            <div className="text-[15px] font-medium text-foreground/60">{emptyHint}</div>
            <div className="mt-2 text-[13px] text-muted-foreground/70">{emptySub}</div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-5 py-4">
            <div className="space-y-3">
              {messages.map(message => (
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
              {isProcessing && (
                <div className="mr-10 rounded-[10px] bg-background/70 px-3 py-2 text-[13px] text-muted-foreground shadow-minimal">
                  {processingHint}
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

        <div className={cn('p-4', isColumn && 'pt-3')}>
          <div className="rounded-[14px] bg-background px-4 py-3 shadow-middle">
            <textarea
              className="h-28 w-full resize-none bg-transparent text-[15px] outline-none placeholder:text-muted-foreground/70 disabled:cursor-not-allowed"
              placeholder={placeholder}
              value={input}
              onChange={event => onInputChange(event.target.value)}
              onKeyDown={event => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault()
                  onSend()
                }
              }}
              disabled={isProcessing}
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
                  (!input.trim() || isProcessing) && 'cursor-not-allowed opacity-45',
                )}
                disabled={!input.trim() || isProcessing}
                onClick={onSend}
                aria-label="Send"
              >
                <ArrowUp className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}