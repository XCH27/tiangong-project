import { useMemo } from 'react'
import { useAtomValue } from 'jotai'
import { AlertCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { UsageLedger } from '@craft-agent/ui'
import { ContextEfficiencyPanel } from '@/components/workbench/ContextEfficiencyPanel'
import { focusedSessionIdAtom } from '@/atoms/panel-stack'
import { sessionAtomFamily, sessionMetaMapAtom } from '@/atoms/sessions'
import { PanelHeader } from '@/components/app-shell/PanelHeader'
import { ScrollArea } from '@/components/ui/scroll-area'
import { SettingsCard, SettingsRow, SettingsSection } from '@/components/settings'
import { useAppShellContext } from '@/context/AppShellContext'
import { buildUsageLedgerData } from '@/lib/usage-ledger'
import type { DetailsPageMeta } from '@/lib/navigation-registry'

export const meta: DetailsPageMeta = {
  navigator: 'settings',
  slug: 'contextEfficiency',
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
  const focusedSessionId = useAtomValue(focusedSessionIdAtom)
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

          <SettingsSection title="Context Center">
            {activeWorkspace ? (
              <SettingsCard className="min-w-0 overflow-hidden">
                <ContextEfficiencyPanel
                  variant="full"
                  showFullProjectPack
                  workspacePath={activeWorkspace.rootPath}
                  workspaceId={activeWorkspaceId ?? undefined}
                  sessionId={focusedSessionId ?? undefined}
                />
              </SettingsCard>
            ) : (
              <SettingsCard>
                <SettingsRow label={t('settings.contextEfficiency.noWorkspace')}>
                  <span className="text-xs text-muted-foreground">—</span>
                </SettingsRow>
              </SettingsCard>
            )}
          </SettingsSection>
        </div>
      </ScrollArea>
    </div>
  )
}
