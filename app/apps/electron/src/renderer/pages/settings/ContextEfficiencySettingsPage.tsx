import { AlertCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
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
