import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, ChevronUp, Copy, ExternalLink, Github, Loader2, LogOut, Plus, RefreshCw } from 'lucide-react'
import type { GitHubCliAuthResult, GitHubCliCommand, GitHubCliStatus } from '@craft-agent/shared/protocol'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

/** OpenChamber GitHubAccountControl/GitHubSettings account and device-flow
 * structure, hosted in the owner-requested footer with Craft primitives.
 * gh owns credentials; there is no app-menu, Copilot or model-login state here. */
export function GitHubAccountControl() {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState<GitHubCliStatus | null>(null)
  const [flow, setFlow] = useState<GitHubCliAuthResult | null>(null)
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)
  const [confirmLogout, setConfirmLogout] = useState(false)
  const mounted = useRef(false)
  const flowRef = useRef<GitHubCliAuthResult | null>(null)
  const openedFlow = useRef<string | undefined>(undefined)
  const active = status?.accounts.find(account => account.active) ?? status?.accounts[0]
  const pending = flow?.state === 'starting' || flow?.state === 'waiting'

  const refresh = useCallback(async () => {
    try {
      const next = await window.electronAPI.getGitHubCliStatus()
      if (mounted.current) setStatus(next)
    } catch { if (mounted.current) setStatus({ state: 'error', accounts: [] }) }
  }, [])

  useEffect(() => {
    mounted.current = true
    void refresh()
    return () => {
      mounted.current = false
      const current = flowRef.current
      if (current?.flowId && ['starting', 'waiting'].includes(current.state)) {
        void window.electronAPI.githubCliAuth({ action: 'cancel', flowId: current.flowId }).catch(() => {})
      }
    }
  }, [refresh])

  const run = async (command: GitHubCliCommand) => {
    setBusy(true)
    setFailed(false)
    try {
      const result = await window.electronAPI.githubCliAuth(command)
      if (!mounted.current) {
        if (command.action === 'start' && result.flowId) {
          void window.electronAPI.githubCliAuth({ action: 'cancel', flowId: result.flowId }).catch(() => {})
        }
        return
      }
      flowRef.current = result
      setFlow(result)
      setFailed(result.state === 'error')
      setConfirmLogout(false)
      if (result.state === 'complete') await refresh()
    } catch { if (mounted.current) setFailed(true) }
    finally { if (mounted.current) setBusy(false) }
  }

  useEffect(() => {
    if (!pending || !flow?.flowId) return
    let disposed = false
    const timer = setTimeout(async () => {
      try {
        const result = await window.electronAPI.githubCliAuth({ action: 'poll', flowId: flow.flowId! })
        if (disposed) return
        flowRef.current = result
        setFlow(result)
        setFailed(result.state === 'error')
        if (result.state === 'complete') await refresh()
        if (result.state === 'waiting' && openedFlow.current !== result.flowId) {
          openedFlow.current = result.flowId
          await window.electronAPI.openUrl('https://github.com/login/device')
        }
      } catch {
        if (!disposed) { setFailed(true); setFlow(null) }
      }
    }, 1000)
    return () => { disposed = true; clearTimeout(timer) }
  }, [flow, pending, refresh])

  return <Popover open={open} onOpenChange={value => {
    // Keep the one-time code reachable while authorizing, without cancelling a
    // browser round-trip when the user clicks outside. Unmount cancels the flow.
    setOpen(value)
    if (value) { setConfirmLogout(false); void refresh() }
  }}>
    <PopoverTrigger asChild>
      <Button variant="ghost" size="sm" aria-label={t('githubCli.menu')}
        className="min-w-0 flex-1 justify-start gap-2 rounded-[6px] px-2 text-[13px] font-normal">
        <Github className="h-4 w-4 shrink-0" />
        <span className="min-w-0 flex-1 truncate text-left">{active?.login ?? t('githubCli.login')}</span>
        {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ChevronUp className="h-3.5 w-3.5 text-foreground/40" />}
      </Button>
    </PopoverTrigger>
    <PopoverContent align="start" side="top" className="w-72 space-y-3 p-3">
      <div className="flex items-center justify-between text-sm font-medium">
        <span>GitHub</span>
        <Button variant="ghost" size="icon" className="h-6 w-6" disabled={busy || pending}
          aria-label={t('common.refresh')} onClick={() => void refresh()}><RefreshCw className="h-4 w-4" /></Button>
      </div>
      {failed && <p role="alert" className="text-xs text-destructive">{t('githubCli.authError')}</p>}
      {pending ? <div className="space-y-3" aria-live="polite">
        <p className="text-sm text-foreground/60">{t(flow?.userCode ? 'githubCli.deviceInstructions' : 'githubCli.loading')}</p>
        {flow?.userCode && <>
          <div className="flex items-center justify-between rounded-[8px] bg-foreground/5 px-3 py-2">
            <code className="text-sm">{flow.userCode}</code>
            <Button variant="ghost" size="icon" className="h-6 w-6" aria-label={t('common.copy')}
              onClick={() => void navigator.clipboard.writeText(flow.userCode!)}><Copy className="h-4 w-4" /></Button>
          </div>
          <Button variant="outline" size="sm" className="w-full" onClick={() => void window.electronAPI.openUrl('https://github.com/login/device')}>
            <ExternalLink className="h-3.5 w-3.5" />{t('githubCli.authorize')}
          </Button>
        </>}
        <Button variant="ghost" size="sm" className="w-full" disabled={busy}
          onClick={() => void run({ action: 'cancel', flowId: flow!.flowId! })}>{t('common.cancel')}</Button>
      </div> : <>
        <p className="text-xs text-foreground/50">{t(!status ? 'githubCli.loading' : `githubCli.${status.state === 'connected' ? 'credentialOwner' : status.state}`)}</p>
        {status?.accounts.map(account => <Button key={`${account.host}:${account.login}`} variant="ghost" size="sm"
          disabled={busy || account.active} className="h-auto w-full justify-start gap-2 px-2 py-1.5 text-[13px] font-normal"
          onClick={() => void run({ action: 'switch', host: account.host, login: account.login })}>
          <Github className="h-4 w-4 shrink-0" />
          <span className="min-w-0 flex-1 text-left"><span className="block truncate">{account.login}</span><span className="block truncate text-xs text-foreground/50">{account.host}</span></span>
          {account.active && <Check className="h-3.5 w-3.5" />}
        </Button>)}
        {status?.state === 'unavailable' ? <Button variant="outline" size="sm" className="w-full"
          onClick={() => void window.electronAPI.openUrl('https://cli.github.com/')}><ExternalLink className="h-3.5 w-3.5" />{t('githubCli.install')}</Button>
          : <Button variant="outline" size="sm" className="w-full" disabled={busy || !status}
            onClick={() => void run({ action: 'start' })}><Plus className="h-3.5 w-3.5" />{t(active ? 'githubCli.addAccount' : 'githubCli.login')}</Button>}
        {active && (confirmLogout ? <div className="space-y-2">
          <p className="text-xs text-foreground/60">{t('githubCli.logoutNotice')}</p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setConfirmLogout(false)}>{t('common.cancel')}</Button>
            <Button variant="destructive" size="sm" disabled={busy} onClick={() => void run({ action: 'logout', host: active.host, login: active.login })}>{t('githubCli.logout')}</Button>
          </div>
        </div> : <Button variant="ghost" size="sm" className="w-full justify-start" disabled={busy}
          onClick={() => setConfirmLogout(true)}><LogOut className="h-3.5 w-3.5" />{t('githubCli.logout')}</Button>)}
      </>}
    </PopoverContent>
  </Popover>
}
