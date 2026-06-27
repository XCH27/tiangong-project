import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { TerminalSquare } from 'lucide-react'
import { FitAddon } from '@xterm/addon-fit'
import { Terminal } from '@xterm/xterm'
import '@xterm/xterm/css/xterm.css'

import { WorkbenchModuleFrame } from './WorkbenchModuleFrame'

interface BottomTerminalPanelProps {
  cwd?: string | null
  onClose: () => void
  onResizeStart: (event: React.PointerEvent<HTMLDivElement>) => void
  onHeaderPointerDown?: (event: React.PointerEvent<HTMLDivElement>) => void
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

export function BottomTerminalPanel({ cwd, onClose, onResizeStart, onHeaderPointerDown }: BottomTerminalPanelProps) {
  const { t } = useTranslation()
  const containerRef = React.useRef<HTMLDivElement | null>(null)
  const termRef = React.useRef<Terminal | null>(null)
  const fitRef = React.useRef<FitAddon | null>(null)
  const terminalIdRef = React.useRef<string | null>(null)
  const cwdRef = React.useRef<string | null | undefined>(cwd)
  const resizeTimerRef = React.useRef<number | null>(null)
  const skipCwdRestartRef = React.useRef(true)

  React.useEffect(() => {
    cwdRef.current = cwd
  }, [cwd])

  // Fresh PTY when workspace cwd changes while panel stays open (not on first mount).
  React.useEffect(() => {
    if (skipCwdRestartRef.current) {
      skipCwdRestartRef.current = false
      return
    }
    const term = termRef.current
    const id = terminalIdRef.current
    if (!term || !id) return

    void window.electronAPI
      .terminalRestart({ cwd: cwd ?? null, size: { cols: term.cols, rows: term.rows } })
      .then((result) => {
        terminalIdRef.current = result.id
        term.clear()
        if (result.buffer) term.write(result.buffer)
        term.focus()
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : String(error)
        term.writeln(`\r\n\x1b[31m${message}\x1b[0m`)
      })
  }, [cwd])

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
    term.open(mount)
    termRef.current = term
    fitRef.current = fit

    const scheduleResize = () => {
      if (resizeTimerRef.current) window.clearTimeout(resizeTimerRef.current)
      resizeTimerRef.current = window.setTimeout(() => {
        if (disposed) return
        try {
          fit.fit()
        } catch {
          return
        }
        const id = terminalIdRef.current
        if (id && term.cols > 0 && term.rows > 0) {
          void window.electronAPI.terminalResize(id, { cols: term.cols, rows: term.rows })
        }
      }, 50)
    }

    const onDataDisposable = term.onData((data) => {
      const id = terminalIdRef.current
      if (id) void window.electronAPI.terminalWrite(id, data)
    })

    const unsubscribeData = window.electronAPI.onTerminalData(({ id, data }) => {
      if (id === terminalIdRef.current) term.write(data)
    })
    const unsubscribeExit = window.electronAPI.onTerminalExit(({ id }) => {
      if (id === terminalIdRef.current) {
        term.writeln('\r\n\x1b[90m[process exited]\x1b[0m')
        terminalIdRef.current = null
      }
    })

    const startShell = async () => {
      await waitForNonZeroSize(mount)
      if (disposed) return

      try {
        fit.fit()
      } catch {
        /* first layout pass may fail */
      }

      const cols = Math.max(term.cols, 2)
      const rows = Math.max(term.rows, 2)

      try {
        const result = await window.electronAPI.terminalRestart({
          cwd: cwdRef.current ?? null,
          size: { cols, rows },
        })
        if (disposed) return
        terminalIdRef.current = result.id
        if (result.buffer) term.write(result.buffer)
        term.focus()
        scheduleResize()
      } catch (error: unknown) {
        if (disposed) return
        const message = error instanceof Error ? error.message : String(error)
        term.writeln(`\r\n\x1b[31m${message}\x1b[0m`)
      }
    }

    void startShell()

    const resizeObserver = new ResizeObserver(scheduleResize)
    resizeObserver.observe(mount)

    const focusOnClick = () => term.focus()
    mount.addEventListener('mousedown', focusOnClick)

    return () => {
      disposed = true
      if (resizeTimerRef.current) window.clearTimeout(resizeTimerRef.current)
      resizeObserver.disconnect()
      mount.removeEventListener('mousedown', focusOnClick)
      onDataDisposable.dispose()
      unsubscribeData()
      unsubscribeExit()
      const id = terminalIdRef.current
      terminalIdRef.current = null
      if (id) void window.electronAPI.terminalKill(id)
      term.dispose()
      termRef.current = null
      fitRef.current = null
    }
  }, [])

  return (
    <WorkbenchModuleFrame
      className="h-full shadow-middle"
      contentClassName="px-2 py-1"
      title={t('terminal.title')}
      icon={TerminalSquare}
      onClose={onClose}
      closeLabel={t('common.close')}
      dragTitle={t('terminal.resize')}
      gripMode="resize-y"
      onDragPointerDown={onResizeStart}
      onHeaderPointerDown={onHeaderPointerDown}
      ariaLabel={t('terminal.title')}
    >
      <div ref={containerRef} className="h-full min-h-[80px] min-w-0 bg-background" />
    </WorkbenchModuleFrame>
  )
}
