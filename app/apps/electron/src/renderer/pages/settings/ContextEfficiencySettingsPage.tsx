import { useMemo } from 'react'
import { useAtomValue } from 'jotai'
import { AlertCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { UsageLedger, type UsageLedgerData } from '@craft-agent/ui'
import { focusedSessionIdAtom } from '@/atoms/panel-stack'
import { sessionAtomFamily, sessionMetaMapAtom } from '@/atoms/sessions'
import { PanelHeader } from '@/components/app-shell/PanelHeader'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ProjectPackPanel } from '@/components/workbench/ProjectPackPanel'
import { SettingsCard, SettingsRow, SettingsSection } from '@/components/settings'
import { useAppShellContext } from '@/context/AppShellContext'
import type { DetailsPageMeta } from '@/lib/navigation-registry'

export const meta: DetailsPageMeta = {
  navigator: 'settings',
  slug: 'contextEfficiency',
}

function isLikelyLocalCost(slug?: string, name?: string, authType?: string, model?: string): boolean {
  if (authType === 'none') return true
  const haystack = [slug, name, model].filter(Boolean).join(' ').toLowerCase()
  return /(?:^|[\s_\-./:])(?:local|ollama|lmstudio|llama\.cpp|gpt4all|kobold|llamacpp|cli|localhost|127\.0\.0\.1)(?:$|[\s_\-./:])/i.test(haystack)
}

function buildUsageLedgerData(params: {
  sessionId: string
  tokenUsage?: {
    inputTokens?: number
    outputTokens?: number
    costUsd?: number
    cacheReadTokens?: number
    cacheCreationTokens?: number
    contextWindow?: number
  }
  connectionSlug?: string
  connectionName?: string
  authType?: string
  model?: string
}): UsageLedgerData {
  const tokenUsage = params.tokenUsage ?? {}
  const inputTokens = typeof tokenUsage.inputTokens === 'number' ? tokenUsage.inputTokens : 0
  const outputTokens = typeof tokenUsage.outputTokens === 'number' ? tokenUsage.outputTokens : 0
  const reportedCostUsd = typeof tokenUsage.costUsd === 'number' ? tokenUsage.costUsd : 0
  const contextWindow = typeof tokenUsage.contextWindow === 'number' && tokenUsage.contextWindow > 0
    ? tokenUsage.contextWindow
    : undefined

  const costAttribution: UsageLedgerData['costAttribution'] = reportedCostUsd > 0
    ? 'provider-reported'
    : isLikelyLocalCost(params.connectionSlug, params.connectionName, params.authType, params.model)
      ? 'local-no-api-cost'
      : 'unknown'

  const notes: string[] = []
  if (tokenUsage.cacheReadTokens === undefined && tokenUsage.cacheCreationTokens === undefined) {
    notes.push('本次会话未报告缓存读写数据（cacheRead/cacheCreation 缺席）')
  }
  if (!contextWindow) {
    notes.push('上下文窗口大小未知，无法计算填充比例')
  }
  if (reportedCostUsd === 0 && costAttribution === 'unknown') {
    notes.push('费用为 0 或未报告；不视为 Fleet API 花费')
  }

  return {
    sessionId: params.sessionId,
    real: {
      inputTokens,
      outputTokens,
      ...(tokenUsage.cacheReadTokens !== undefined ? { cacheReadTokens: tokenUsage.cacheReadTokens } : {}),
      ...(tokenUsage.cacheCreationTokens !== undefined ? { cacheCreationTokens: tokenUsage.cacheCreationTokens } : {}),
    },
    reportedCostUsd,
    costAttribution,
    contextWindow,
    estimatedContextPercent: contextWindow && typeof tokenUsage.inputTokens === 'number'
      ? Math.max(0, Math.min(1, inputTokens / contextWindow))
      : undefined,
    notes,
  }
}

function ActiveSessionUsageSection() {
  const { t } = useTranslation()
  const { llmConnections } = useAppShellContext()
  const focusedSessionId = useAtomValue(focusedSessionIdAtom)
  const sessionMetaMap = useAtomValue(sessionMetaMapAtom)
  const session = useAtomValue(sessionAtomFamily(focusedSessionId ?? '__no-session__'))
  const meta = focusedSessionId ? sessionMetaMap.get(focusedSessionId) : undefined

  const connectionSlug = session?.llmConnection ?? meta?.llmConnection
  const connection = llmConnections.find((item) => item.slug === connectionSlug)
  const model = session?.model ?? meta?.model ?? undefined

  const ledger = useMemo(() => {
    if (!focusedSessionId) return null
    return buildUsageLedgerData({
      sessionId: focusedSessionId,
      tokenUsage: session?.tokenUsage ?? meta?.tokenUsage,
      connectionSlug,
      connectionName: connection?.name,
      authType: connection?.authType,
      model,
    })
  }, [connection?.authType, connection?.name, connectionSlug, focusedSessionId, meta?.tokenUsage, model, session?.tokenUsage])

  return (
    <SettingsSection title={t('settings.contextEfficiency.usageLedger')}>
      <SettingsCard>
        {ledger ? (
          <UsageLedger
            ledger={ledger}
            connectionName={connection?.name ?? connectionSlug}
            model={model}
          />
        ) : (
          <SettingsRow label={t('settings.contextEfficiency.noActiveSession')}>
            <span className="text-xs text-muted-foreground">—</span>
          </SettingsRow>
        )}
      </SettingsCard>
    </SettingsSection>
  )
}

export default function ContextEfficiencySettingsPage() {
  const { t } = useTranslation()
  const { workspaces, activeWorkspaceId } = useAppShellContext()
  const activeWorkspace = workspaces.find(workspace => workspace.id === activeWorkspaceId)

  return (
    <div className="flex flex-col h-full">
      <PanelHeader title={t('settings.contextEfficiency.title')} />
      <ScrollArea className="flex-1">
        <div className="px-5 py-7 max-w-3xl mx-auto space-y-5">
          <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-muted/40 border border-border text-xs text-muted-foreground">
            <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            <span className="flex-1">{t('settings.contextEfficiency.boundary')}</span>
          </div>

          <ActiveSessionUsageSection />

          <SettingsSection title={t('settings.contextEfficiency.projectPack')}>
            {activeWorkspace ? (
              <SettingsCard>
                <SettingsRow label={t('settings.contextEfficiency.workspace')}>
                  <span className="text-xs text-muted-foreground break-all">{activeWorkspace.rootPath}</span>
                </SettingsRow>
                <div className="border-t">
                  <ProjectPackPanel rootPath={activeWorkspace.rootPath} />
                </div>
              </SettingsCard>
            ) : (
              <SettingsCard>
                <SettingsRow label={t('settings.contextEfficiency.noWorkspace')}>
                  <span className="text-xs text-muted-foreground">—</span>
                </SettingsRow>
              </SettingsCard>
            )}
          </SettingsSection>

          <SettingsSection title={t('settings.contextEfficiency.next')}>
            <SettingsCard className="px-4 py-3 text-xs leading-relaxed text-muted-foreground">
              {t('settings.contextEfficiency.nextDescription')}
            </SettingsCard>
          </SettingsSection>
        </div>
      </ScrollArea>
    </div>
  )
}
