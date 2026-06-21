import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AlertCircle, CheckCircle2, MinusCircle, RotateCw, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Spinner } from '@craft-agent/ui'
import { PanelHeader } from '@/components/app-shell/PanelHeader'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import {
  SettingsCard,
  SettingsRow,
  SettingsSection,
} from '@/components/settings'
import type { DetailsPageMeta } from '@/lib/navigation-registry'
import type {
  CliRuntimeCatalogItem,
  CliRuntimeHealthResult,
  CliRuntimeHealthStatus,
} from '@craft-agent/shared/protocol'

export const meta: DetailsPageMeta = {
  navigator: 'settings',
  slug: 'cliRuntime',
}

function healthLabel(status?: CliRuntimeHealthStatus): string {
  switch (status) {
    case 'available':
      return '可用'
    case 'fail_cli':
      return 'CLI 启动失败'
    case 'fail_acp':
      return 'ACP 握手失败'
    case 'disabled':
      return '已禁用'
    case 'unsupported':
      return '不支持'
    default:
      return '未测试'
  }
}

function statusIcon(status?: CliRuntimeHealthStatus, supported = true) {
  const cls = 'h-3.5 w-3.5 shrink-0'
  if (!supported) return <MinusCircle className={`${cls} text-muted-foreground`} />
  switch (status) {
    case 'available':
      return <CheckCircle2 className={`${cls} text-success`} />
    case 'fail_cli':
    case 'fail_acp':
      return <XCircle className={`${cls} text-destructive`} />
    case 'disabled':
    case 'unsupported':
      return <MinusCircle className={`${cls} text-muted-foreground`} />
    default:
      return <AlertCircle className={`${cls} text-muted-foreground`} />
  }
}

function formatArgs(args?: string[]): string {
  return args && args.length > 0 ? args.join(' ') : ''
}

function RuntimeCard({
  item,
  result,
  isTesting,
  onTest,
}: {
  item: CliRuntimeCatalogItem
  result?: CliRuntimeHealthResult
  isTesting: boolean
  onTest: (item: CliRuntimeCatalogItem) => void
}) {
  const latestStatus = result?.status ?? item.lastHealth
  const command = item.command ?? item.mapping?.command
  const args = item.args ?? item.mapping?.args
  const canTest = Boolean(item.supported && command)

  return (
    <SettingsCard>
      <div className="px-3 py-2.5 border-b last:border-b-0">
        <div className="flex items-center gap-2">
          {statusIcon(latestStatus, item.supported)}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium truncate">{item.displayName}</span>
              <span className="text-[10px] rounded bg-muted px-1.5 py-0.5 uppercase tracking-wide text-muted-foreground">
                {item.source}
              </span>
              {item.supported ? (
                <span className="text-[10px] rounded bg-success/10 text-success px-1.5 py-0.5">ACP</span>
              ) : (
                <span className="text-[10px] rounded bg-muted text-muted-foreground px-1.5 py-0.5">未适配</span>
              )}
            </div>
            <div className="mt-1 text-[11px] text-muted-foreground">
              {healthLabel(latestStatus)}
              {result?.stage ? ` · ${result.stage}` : ''}
              {result?.checkedAt ? ` · ${new Date(result.checkedAt).toLocaleTimeString()}` : ''}
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={!canTest || isTesting}
            onClick={() => onTest(item)}
          >
            {isTesting ? <Spinner className="mr-1.5" /> : null}
            测试
          </Button>
        </div>

        {command && (
          <div className="mt-2 text-[11px] text-muted-foreground">
            <code className="font-mono bg-muted px-1.5 py-0.5 rounded">{command}</code>
            {formatArgs(args) && (
              <code className="ml-1 font-mono bg-muted px-1.5 py-0.5 rounded">{formatArgs(args)}</code>
            )}
          </div>
        )}

        {item.unsupportedReason && (
          <div className="mt-2 text-[11px] text-muted-foreground leading-snug">
            {item.unsupportedReason}
          </div>
        )}

        {result?.message && (
          <div className={`mt-2 text-[11px] leading-snug ${result.status === 'available' ? 'text-muted-foreground' : 'text-destructive'}`}>
            {result.message}
          </div>
        )}

        {(result?.stdoutTail || result?.stderrTail) && (
          <details className="mt-2 text-[11px] text-muted-foreground">
            <summary>诊断输出</summary>
            {result.stdoutTail && <pre className="mt-1 max-h-24 overflow-auto whitespace-pre-wrap bg-muted rounded p-2">{result.stdoutTail}</pre>}
            {result.stderrTail && <pre className="mt-1 max-h-24 overflow-auto whitespace-pre-wrap bg-muted rounded p-2">{result.stderrTail}</pre>}
          </details>
        )}
      </div>
    </SettingsCard>
  )
}

export default function CliRuntimeSettingsPage() {
  const { t } = useTranslation()
  const [catalog, setCatalog] = useState<CliRuntimeCatalogItem[]>([])
  const [results, setResults] = useState<Record<string, CliRuntimeHealthResult>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [testingId, setTestingId] = useState<string | null>(null)

  const loadCatalog = useCallback(async () => {
    setIsLoading(true)
    try {
      const items = await window.electronAPI.getCliRuntimeCatalog()
      setCatalog(items)
    } catch (error) {
      console.error('Failed to load CLI runtime catalog:', error)
      toast.error(t('settings.cliRuntime.loadFailed'))
    } finally {
      setIsLoading(false)
    }
  }, [t])

  useEffect(() => {
    void loadCatalog()
  }, [loadCatalog])

  const grouped = useMemo(() => {
    const supported = catalog.filter(item => item.supported)
    const unsupported = catalog.filter(item => !item.supported)
    return { supported, unsupported }
  }, [catalog])

  const handleTest = useCallback(async (item: CliRuntimeCatalogItem) => {
    const command = item.command ?? item.mapping?.command
    const args = item.args ?? item.mapping?.args
    if (!command) return

    setTestingId(item.id)
    try {
      const result = await window.electronAPI.testCliRuntime({
        runtimeId: item.id,
        command,
        args,
        acpMode: item.supported,
      })
      setResults(prev => ({ ...prev, [item.id]: result }))
      if (result.status === 'available') {
        toast.success(result.message)
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      console.error('CLI runtime health test failed:', error)
      toast.error(t('settings.cliRuntime.testFailed'))
    } finally {
      setTestingId(null)
    }
  }, [t])

  return (
    <div className="flex flex-col h-full">
      <PanelHeader title={t('settings.cliRuntime.title')} />
      <ScrollArea className="flex-1">
        <div className="px-5 py-7 max-w-3xl mx-auto space-y-5">
          <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-muted/40 border border-border text-xs text-muted-foreground">
            <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            <span className="flex-1">{t('settings.cliRuntime.boundary')}</span>
          </div>

          <SettingsSection title={t('settings.cliRuntime.detected')}>
            <div className="flex items-center justify-end px-3 pb-2">
              <Button variant="outline" size="sm" onClick={() => void loadCatalog()} disabled={isLoading}>
                {isLoading ? <Spinner className="mr-1.5" /> : <RotateCw className="h-3.5 w-3.5 mr-1.5" />}
                {t('settings.cliRuntime.refresh')}
              </Button>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-10">
                <Spinner />
              </div>
            ) : (
              <div className="space-y-3">
                {grouped.supported.length === 0 ? (
                  <SettingsCard>
                    <SettingsRow label={t('settings.cliRuntime.noSupported')}>
                      <span className="text-xs text-muted-foreground">—</span>
                    </SettingsRow>
                  </SettingsCard>
                ) : (
                  grouped.supported.map(item => (
                    <RuntimeCard
                      key={item.id}
                      item={item}
                      result={results[item.id]}
                      isTesting={testingId === item.id}
                      onTest={handleTest}
                    />
                  ))
                )}
              </div>
            )}
          </SettingsSection>

          {!isLoading && grouped.unsupported.length > 0 && (
            <SettingsSection title={t('settings.cliRuntime.unsupported')}>
              <div className="space-y-3">
                {grouped.unsupported.map(item => (
                  <RuntimeCard
                    key={item.id}
                    item={item}
                    result={results[item.id]}
                    isTesting={testingId === item.id}
                    onTest={handleTest}
                  />
                ))}
              </div>
            </SettingsSection>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
