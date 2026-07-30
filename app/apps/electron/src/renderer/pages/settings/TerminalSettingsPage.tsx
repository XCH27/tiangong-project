import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { RefreshCw, SquareTerminal } from 'lucide-react'
import type { CliRuntimeHandshake } from '@craft-agent/shared/protocol'
import { PanelHeader } from '@/components/app-shell/PanelHeader'
import { ModelPickerList } from '@/components/app-shell/input/ModelPickerList'
import { buildCliRuntimeModelPickerGroups } from '@/components/app-shell/input/model-picker-helpers'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  SettingsCard,
  SettingsRow,
  SettingsSection,
} from '@/components/settings'
import type { DetailsPageMeta } from '@/lib/navigation-registry'

export const meta: DetailsPageMeta = {
  navigator: 'settings',
  slug: 'terminal',
}

export default function TerminalSettingsPage() {
  const { t } = useTranslation()
  const [runtimes, setRuntimes] = useState<CliRuntimeHandshake[]>([])
  const [loading, setLoading] = useState(true)

  const handshake = useCallback(async () => {
    setLoading(true)
    try {
      setRuntimes(await window.electronAPI.handshakeCliRuntimes())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void handshake()
  }, [handshake])

  const groups = useMemo(
    () => buildCliRuntimeModelPickerGroups(runtimes),
    [runtimes],
  )

  return (
    <div className="flex h-full min-h-0 flex-col">
      <PanelHeader title={t('settings.terminal.title')} />
      <ScrollArea className="min-h-0 flex-1">
        <div className="mx-auto w-full max-w-[760px] space-y-8 px-6 py-8">
          <SettingsSection
            title={t('settings.terminal.connections')}
            description={t('settings.terminal.connectionsDesc')}
          >
            <SettingsCard>
              {runtimes.map((runtime) => (
                <SettingsRow
                  key={runtime.id}
                  label={
                    <span className="flex items-center gap-2">
                      <SquareTerminal className="size-4" />
                      {runtime.name}
                    </span>
                  }
                  description={
                    runtime.version
                      ? `${runtime.version} · ${t(`settings.terminal.status.${runtime.status}`)}`
                      : t(`settings.terminal.status.${runtime.status}`)
                  }
                >
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {t('settings.terminal.modelCount', {
                      count: runtime.models.length,
                    })}
                  </span>
                </SettingsRow>
              ))}
              {!loading && runtimes.length === 0 && (
                <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                  {t('settings.terminal.none')}
                </div>
              )}
            </SettingsCard>
            <div className="flex justify-end">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => void handshake()}
                disabled={loading}
              >
                <RefreshCw
                  className={loading ? 'size-3.5 animate-spin' : 'size-3.5'}
                />
                {t('settings.terminal.refresh')}
              </Button>
            </div>
          </SettingsSection>

          {groups.length > 0 && (
            <SettingsSection
              title={t('settings.terminal.models')}
              description={t('settings.terminal.modelsDesc')}
            >
              <SettingsCard className="overflow-hidden">
                <ModelPickerList
                  groups={groups}
                  currentModel=""
                  onSelect={() => {}}
                  selectable={false}
                  variant="catalog"
                  className="max-h-[520px]"
                />
              </SettingsCard>
            </SettingsSection>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
