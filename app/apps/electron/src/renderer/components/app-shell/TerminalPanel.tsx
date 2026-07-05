/**
 * TerminalPanel — D19 一等终端面板（surface='terminal'）
 *
 * 与 BottomTerminalPanel 共享 xterm + PTY 逻辑，但渲染为一等面板：
 * - 用 PanelHeader（50px）而非 CraftModuleFrame（h-10）
 * - 可进多面板 grid，与对话面板并排
 * - 每个面板独立 PTY 实例
 */

import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { FitAddon } from '@xterm/addon-fit'
import { Terminal } from '@xterm/xterm'
import '@xterm/xterm/css/xterm.css'
import { PanelHeader } from './PanelHeader'
import { useAppShellContext } from '@/context/AppShellContext'

interface TerminalPanelProps {
  onClose: () => void
  sessionId?: string
}

function readTerminalColors(mount: HTMLElement): { background: string; foreground: string } {
  const style = getComputedStyle(mount)
  return {
    background: style.backgroundColor || '#1e1e1e',
    foreground: style.color || '#d4d4d4',
  }
}

function waitForNonZeroSize(el: HTMLElement, timeoutMs = 2000): Promise<void> {
  if (el.clientWidth > 0 && el.clientHeight > 0) return Promise.resolve()
  return new Promise((resolve) => {
    const observer = new ResizeObserver(() => {
      if (el.clientWidth > 0 && el.clientHeight > 0) {
        observer.disconnect()
        resolve()
      }
    })
    observer.observe(el)
    window.setTimeout(() => {
      observer.disconnect()
      resolve()
    }, timeoutMs)
  })
}

export function TerminalPanel({ onClose, sessionId }: TerminalPanelProps) {
  const { t } = useTranslation()
  const containerRef = React.useRef<HTMLDivElement | null>(null)
  const termRef = React.useRef<Terminal | null>(null)
  const fitRef = React.useRef<FitAddon | null>(null)
  const terminalIdRef = React.useRef<string | null>(null)
  const resizeTimerRef = React.useRef<number | null>(null)
  const appCtx = useAppShellContext()

  // Get active workspace root path to bind terminal cwd
  const activeWorkspace = appCtx.workspaces?.find((w) => w.id === appCtx.activeWorkspaceId)
  const cwd = activeWorkspace?.rootPath

  React.useEffect(() => {
    const mount = containerRef.current
    if (!mount) return

    let disposed = false
    const colors = readTerminalColors(mount)

    const term = new Terminal({
      fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
      fontSize: 12,
      lineHeight: 1.2,
      cursorBlink: true,
      scrollback: 5000,
      convertEol: true,
      allowProposedApi: true,
      theme: {
        background: colors.background,
        foreground: colors.foreground,
        cursor: colors.foreground,
      },
    })
    const fit = new FitAddon()
    term.loadAddon(fit)
    termRef.current = term
    fitRef.current = fit

    // Buffers for transcript logging
    let inputLineBuffer = ''
    let outputBuffer = ''
    let flushTimer: number | null = null

    const cleanAnsi = (str: string) => {
      return str.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '')
    }

    const flushOutput = () => {
      if (flushTimer) {
        window.clearTimeout(flushTimer)
        flushTimer = null
      }
      const content = cleanAnsi(outputBuffer).trim()
      if (content && sessionId && terminalIdRef.current) {
        window.electronAPI.sessionCommand(sessionId, {
          type: 'appendTerminalTranscript',
          role: 'tool',
          content,
          terminalId: terminalIdRef.current,
        }).catch(() => {})
      }
      outputBuffer = ''
    }

    void waitForNonZeroSize(mount).then(() => {
      if (disposed) return
      term.open(mount)
      try { fit.fit() } catch { /* mount not ready */ }

      const cols = term.cols
      const rows = term.rows

      window.electronAPI
        .terminalRestart({
          cwd: cwd ?? null,
          sessionId: sessionId ?? null,
          size: { cols, rows },
        })
        .then((result) => {
          if (disposed) return
          terminalIdRef.current = result.id
          if (result.buffer) term.write(result.buffer)
          term.focus()
        })
        .catch((error: unknown) => {
          const message = error instanceof Error ? error.message : String(error)
          term.writeln(`\r\n\x1b[31m${message}\x1b[0m`)
        })
    })

    const handleResize = () => {
      if (!termRef.current || !fitRef.current) return
      try { fitRef.current.fit() } catch { /* noop */ }
      const id = terminalIdRef.current
      if (!id) return
      if (resizeTimerRef.current) window.clearTimeout(resizeTimerRef.current)
      resizeTimerRef.current = window.setTimeout(() => {
        window.electronAPI
          .terminalResize(id, { cols: term.cols, rows: term.rows })
          .catch(() => { /* noop */ })
      }, 100)
    }

    const resizeObserver = new ResizeObserver(handleResize)
    resizeObserver.observe(mount)

    const onData = term.onData((data) => {
      const id = terminalIdRef.current
      if (!id) return
      window.electronAPI.terminalWrite(id, data).catch(() => { /* noop */ })

      if (sessionId) {
        if (data === '\r' || data === '\n') {
          const cmd = inputLineBuffer.trim()
          if (cmd) {
            window.electronAPI.sessionCommand(sessionId, {
              type: 'appendTerminalTranscript',
              role: 'user',
              content: cmd,
              terminalId: id,
            }).catch(() => {})
          }
          inputLineBuffer = ''
        } else if (data === '\x7f') { // backspace
          inputLineBuffer = inputLineBuffer.slice(0, -1)
        } else {
          const char = data.replace(/[\x00-\x1F\x7F-\x9F]/g, '')
          inputLineBuffer += char
        }
      }
    })

    const unsubscribeData = window.electronAPI.onTerminalData(({ id, data }) => {
      if (id === terminalIdRef.current && termRef.current) {
        termRef.current.write(data)
        if (sessionId) {
          outputBuffer += data
          if (flushTimer) window.clearTimeout(flushTimer)
          flushTimer = window.setTimeout(flushOutput, 1000)
        }
      }
    })

    const unsubscribeExit = window.electronAPI.onTerminalExit(({ id }) => {
      if (id === terminalIdRef.current) {
        if (flushTimer) {
          flushOutput()
        }
        term.writeln('\r\n\x1b[90m[process exited]\x1b[0m')
        terminalIdRef.current = null
      }
    })

    return () => {
      disposed = true
      onData.dispose()
      resizeObserver.disconnect()
      unsubscribeData()
      unsubscribeExit()
      if (flushTimer) {
        window.clearTimeout(flushTimer)
        flushTimer = null
      }
      const id = terminalIdRef.current
      if (id) {
        window.electronAPI.terminalKill(id).catch(() => { /* noop */ })
      }
      term.dispose()
      if (resizeTimerRef.current) window.clearTimeout(resizeTimerRef.current)
    }
  }, [sessionId, cwd])

  return (
    <div className="flex h-full flex-col">
      <PanelHeader
        title={t('terminal.title')}
        actions={appCtx.rightSidebarButton}
        leadingAction={appCtx.leadingAction}
      />
      <div className="flex-1 min-h-0 bg-foreground-2 overflow-hidden">
        <div ref={containerRef} className="h-full w-full" />
      </div>
    </div>
  )
}
