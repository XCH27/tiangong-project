/**
 * CliRuntimeSettingsPage
 *
 * Local CLI runtime discovery and future terminal adapter settings.
 */

import { useTranslation } from 'react-i18next'
import { PanelHeader } from '@/components/app-shell/PanelHeader'
import { HeaderMenu } from '@/components/ui/HeaderMenu'
import { ScrollArea } from '@/components/ui/scroll-area'
import { routes } from '@/lib/navigate'
import type { DetailsPageMeta } from '@/lib/navigation-registry'
import { CliRuntimePanel } from '@/components/cli-runtime/CliRuntimePanel'
import {
  SettingsSection,
  SettingsCard,
} from '@/components/settings'

export const meta: DetailsPageMeta = {
  navigator: 'settings',
  slug: 'cli',
}

export default function CliRuntimeSettingsPage() {
  const { t } = useTranslation()

  return (
    <div className="h-full flex flex-col">
      <PanelHeader title={t('settings.cli.title')} actions={<HeaderMenu route={routes.view.settings('cli')} />} />
      <div className="flex-1 min-h-0 mask-fade-y">
        <ScrollArea className="h-full">
          <div className="px-5 py-7 max-w-3xl mx-auto">
            <div className="space-y-8">
              <SettingsSection
                title={t('settings.cli.runtimeSection')}
                description={t('settings.cli.runtimeSectionDesc')}
              >
                <CliRuntimePanel />
              </SettingsSection>

              <SettingsSection
                title={t('settings.cli.nextSection')}
                description={t('settings.cli.nextSectionDesc')}
              >
                <SettingsCard className="px-4 py-3.5">
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>{t('settings.cli.nextAdapter')}</p>
                    <p>{t('settings.cli.nextPermission')}</p>
                    <p>{t('settings.cli.nextCustom')}</p>
                  </div>
                </SettingsCard>
              </SettingsSection>
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
