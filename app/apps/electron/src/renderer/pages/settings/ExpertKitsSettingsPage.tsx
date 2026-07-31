import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Search, Sparkles, TriangleAlert } from 'lucide-react'
import type { LabelConfig } from '@craft-agent/shared/labels'
import { isExpertLabel } from '@craft-agent/shared/labels/kind-normalize'
import { assessExpertKit, type ExpertKit } from '@craft-agent/shared/labels/expert-kit'
import { EXAMPLE_KITS } from '@craft-agent/shared/labels/example-kits'
import { kitRoutes } from '@craft-agent/shared/labels/kit-gallery'
import { PanelHeader } from '@/components/app-shell/PanelHeader'
import { ScrollArea } from '@/components/ui/scroll-area'
import { SettingsSection } from '@/components/settings'
import { Input } from '@/components/ui/input'
import { useAppShellContext } from '@/context/AppShellContext'
import { useLabels } from '@/hooks/useLabels'
import type { DetailsPageMeta } from '@/lib/navigation-registry'
import { cn } from '@/lib/utils'

export const meta: DetailsPageMeta = {
  navigator: 'settings',
  slug: 'expert-kits',
}

/**
 * Expert kits.
 *
 * Reads the real label store — an expert kit *is* a label whose `kind` resolves
 * to `expert`, so this is a view over `useLabels` rather than a second registry
 * (`kind-normalize.ts` owns the legacy `identity` spelling).
 *
 * The card shows what installing costs, not just what a kit is called: how many
 * skills it carries, and whether it routes within them. A reader cannot tell a
 * routed twenty-skill kit from an unrouted one by size alone, and the two behave
 * nothing alike — that is how someone ends up with several kits installed and an
 * agent that got worse.
 */
export default function ExpertKitsSettingsPage() {
  const { t } = useTranslation()
  const { activeWorkspaceId } = useAppShellContext()
  const { flatLabels, isLoading } = useLabels(activeWorkspaceId)
  const [query, setQuery] = React.useState('')

  const installed = React.useMemo(
    () => flatLabels.filter((label) => isExpertLabel(label)),
    [flatLabels],
  )

  const matches = React.useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return installed
    return installed.filter((label) => label.name.toLowerCase().includes(needle))
  }, [installed, query])

  return (
    <div className="flex h-full min-h-0 flex-col">
      <PanelHeader title={t('settings.expertKits.title')} />
      <ScrollArea className="min-h-0 flex-1">
        <div className="mx-auto w-full max-w-[760px] space-y-8 px-6 py-8">
          <p className="text-sm text-muted-foreground">
            {t('settings.expertKits.description')}
          </p>

          <div className="relative">
            <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t('settings.expertKits.search')}
              className="pl-8"
            />
          </div>

          <SettingsSection
            title={t('settings.expertKits.installed', { count: installed.length })}
            description={t('settings.expertKits.installedDesc')}
          >
            {isLoading && (
              <div className="px-2 py-6 text-sm text-muted-foreground">
                {t('common.loading')}
              </div>
            )}

            {!isLoading && matches.length === 0 && (
              <div className="rounded-md border border-dashed border-input px-4 py-8 text-center text-sm text-muted-foreground">
                {installed.length === 0
                  ? t('settings.expertKits.empty')
                  : t('settings.expertKits.noMatch')}
              </div>
            )}

            <div className="grid gap-2 sm:grid-cols-2">
              {matches.map((label) => (
                <InstalledKitCard key={label.id} label={label} />
              ))}
            </div>
          </SettingsSection>

          <SettingsSection
            title={t('settings.expertKits.examples')}
            description={t('settings.expertKits.examplesDesc')}
          >
            <div className="grid gap-2 sm:grid-cols-2">
              {EXAMPLE_KITS.map((kit) => {
                const routes = kitRoutes(kit.skills)
                return (
                  <KitCard
                    key={kit.id}
                    name={kit.name}
                    meta={t('settings.expertKits.skillCount', { count: kit.skills.length })}
                    hint={kit.audience.join(' · ')}
                    routes={routes}
                    warning={!routes && kit.skills.length > 10}
                  />
                )
              })}
            </div>
          </SettingsSection>
        </div>
      </ScrollArea>
    </div>
  )
}

function InstalledKitCard({ label }: { label: LabelConfig }) {
  const { t } = useTranslation()
  const kit: ExpertKit = {
    labelId: label.id,
    skills: label.expertKit?.skills ?? [],
    sources: label.expertKit?.sources ?? [],
    tools: label.expertKit?.tools ?? [],
    ...(label.expertKit?.requestedPermissionMode
      ? { requestedPermissionMode: label.expertKit.requestedPermissionMode }
      : {}),
  }
  const assessment = assessExpertKit(kit)

  return (
    <KitCard
      name={label.name}
      meta={t('settings.expertKits.carries', {
        skills: kit.skills.length,
        tools: kit.tools.length,
        sources: kit.sources.length,
      })}
      hint={label.systemPromptPreset ? undefined : t('settings.expertKits.noPreset')}
      routes={assessment.verdict !== 'over-budget'}
      warning={assessment.suggestion === 'add-skill-routing'}
      warningText={t('settings.expertKits.loadsEverything')}
    />
  )
}

function KitCard({
  name,
  meta,
  hint,
  routes,
  warning,
  warningText,
}: {
  name: string
  meta: string
  hint?: string
  routes: boolean
  warning?: boolean
  warningText?: string
}) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col gap-1.5 rounded-md border border-input p-3">
      <div className="flex items-start gap-2">
        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 opacity-60" />
        <span className="flex-1 truncate text-sm font-medium">{name}</span>
      </div>
      <div className="text-xs text-muted-foreground">{meta}</div>
      {hint && <div className="truncate text-xs text-muted-foreground">{hint}</div>}
      <div
        className={cn(
          'mt-0.5 flex items-center gap-1 text-xs',
          warning ? 'text-amber-600 dark:text-amber-500' : 'text-muted-foreground',
        )}
      >
        {warning && <TriangleAlert className="h-3 w-3 shrink-0" />}
        <span>
          {warning
            ? warningText ?? t('settings.expertKits.loadsEverything')
            : routes
              ? t('settings.expertKits.routes')
              : t('settings.expertKits.small')}
        </span>
      </div>
    </div>
  )
}
