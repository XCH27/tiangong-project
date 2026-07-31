import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useAtomValue } from 'jotai'
import { toast } from 'sonner'
import { ChartColumn, CircleHelp, Coins } from 'lucide-react'
import {
  coverageIsPartial,
  coverageRatio,
  formatCost,
  formatTokens,
  getModelById,
  getModelDisplayName,
  resolveModelPricing,
  rollUpUsage,
  type ModelPricing,
  type SessionCost,
  type UsageSession,
} from '@craft-agent/shared/config'
import { PanelHeader } from '@/components/app-shell/PanelHeader'
import { ScrollArea } from '@/components/ui/scroll-area'
import { EntityListEmptyScreen } from '@/components/ui/entity-list-empty'
import {
  SettingsCard,
  SettingsCardContent,
  SettingsSection,
  SettingsSegmentedControl,
} from '@/components/settings'
import { sessionMetaMapAtom } from '@/atoms/sessions'
import { useAppShellContext } from '@/context/AppShellContext'
import { ModelRateEditor } from './ModelRateEditor'
import type { DetailsPageMeta } from '@/lib/navigation-registry'
import type { LlmConnection, LlmConnectionWithStatus } from '../../../shared/types'
import { cn } from '@/lib/utils'

export const meta: DetailsPageMeta = {
  navigator: 'settings',
  slug: 'usage',
}

/**
 * Usage.
 *
 * Tokens have always been tracked; `SessionInfoPopover` shows them one session
 * at a time. That answers "what did this conversation cost" and never "where is
 * it all going", which is the question that actually gets asked — and the one
 * that needs every session at once.
 *
 * The page's main obligation is to not lie about money. Most sessions in a mixed
 * setup report `costUsd: 0` because OpenAI-compatible endpoints have no cost
 * field to copy, so a naive sum shows a confident, badly wrong, and always *low*
 * total. Costs therefore carry provenance, unknowns are counted rather than
 * zeroed, and coverage states how much of the total rests on a real number.
 *
 * Rendering grammar is UI-SPEC: six-colour theme, the §3 opacity ladder, shared
 * `Settings*` primitives rather than hand-rolled cards, and `EntityListEmptyScreen`
 * rather than a local empty div.
 */

const DAY = 24 * 60 * 60_000
const WINDOWS = [7, 30, 90] as const
type Window = (typeof WINDOWS)[number]

export default function UsageSettingsPage() {
  const { t, i18n } = useTranslation()
  const { llmConnections, refreshLlmConnections } = useAppShellContext()
  const metaMap = useAtomValue(sessionMetaMapAtom)
  const [days, setDays] = React.useState<Window>(30)
  const [editing, setEditing] = React.useState<string | null>(null)

  const sessions = React.useMemo<UsageSession[]>(
    () =>
      [...metaMap.values()].map((meta) => ({
        id: meta.id,
        ...(meta.name ? { name: meta.name } : {}),
        ...(meta.model ? { model: meta.model } : {}),
        ...(meta.projectId ? { projectId: meta.projectId } : {}),
        // `lastMessageAt` is the last *meaningful* message, which is what the
        // session list already groups dates by. Using it here keeps a day on
        // this chart meaning the same thing as a day in the sidebar.
        lastUsedAt: meta.lastMessageAt ?? 0,
        ...(meta.tokenUsage ? { tokenUsage: meta.tokenUsage } : {}),
      })),
    [metaMap],
  )

  // Connection-stated rates win over the bundled registry: for a custom endpoint
  // the registry is guessing and the user is reading their contract.
  const pricingFor = React.useCallback(
    (modelId: string | undefined) => resolveModelPricing(modelId, llmConnections, getModelById),
    [llmConnections],
  )

  const rollup = React.useMemo(
    () => rollUpUsage(sessions, pricingFor, { since: Date.now() - days * DAY }),
    [sessions, pricingFor, days],
  )

  /**
   * Which connection may hold a rate for this model.
   *
   * Only connections that actually list the model qualify. Writing a rate onto
   * an arbitrary connection would price a model it does not serve, and the next
   * lookup would find that stray entry first — the user would have "fixed" one
   * model by silently mispricing another.
   */
  const ownerOf = React.useCallback(
    (modelId: string) =>
      llmConnections.find((connection) =>
        (connection.models ?? []).some((entry) =>
          typeof entry === 'string' ? entry === modelId : entry.id === modelId,
        ),
      ),
    [llmConnections],
  )

  const saveRate = React.useCallback(
    async (connection: LlmConnectionWithStatus, modelId: string, pricing: ModelPricing) => {
      if (!window.electronAPI) return
      // Status flags are derived server-side; sending them back would persist a
      // snapshot of auth state into config.
      const { isAuthenticated: _a, authError: _b, isDefault: _c, ...data } = {
        ...connection,
        modelPricing: { ...connection.modelPricing, [modelId]: pricing },
      }
      const result = await window.electronAPI.saveLlmConnection(data as LlmConnection)
      if (result.success) {
        setEditing(null)
        refreshLlmConnections?.()
      } else {
        toast.error(t('settings.usage.rate.saveFailed'))
      }
    },
    [refreshLlmConnections, t],
  )

  const { totals } = rollup
  const partial = coverageIsPartial(totals.coverage)
  const peakDay = Math.max(1, ...rollup.byDay.map((entry) => entry.totals.totalTokens))
  const nothingYet = totals.sessions === 0

  return (
    <div className="flex h-full min-h-0 flex-col">
      <PanelHeader title={t('settings.usage.title')} />
      <ScrollArea className="min-h-0 flex-1">
        <div className="mx-auto w-full max-w-[760px] space-y-8 px-6 py-8">
          <p className="text-sm text-foreground/60">{t('settings.usage.description')}</p>

          <SettingsSegmentedControl
            value={`${days}`}
            onValueChange={(value) => setDays(Number(value) as Window)}
            options={WINDOWS.map((window) => ({
              value: `${window}`,
              label: t('settings.usage.lastDays', { count: window }),
            }))}
          />

          {nothingYet ? (
            /*
             * The empty state states the next action rather than the absence
             * (§10). "No usage recorded" alone leaves the reader wondering
             * whether the page is broken or they simply have not worked yet.
             */
            <EntityListEmptyScreen
              icon={<ChartColumn />}
              title={t('settings.usage.emptyTitle')}
              description={t('settings.usage.emptyDesc')}
              className=""
            />
          ) : (
            <>
              <SettingsSection title={t('settings.usage.totals')}>
                <SettingsCard divided={false}>
                  <SettingsCardContent>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
                      <Stat label={t('settings.usage.sessions')} value={`${totals.sessions}`} />
                      <Stat
                        label={t('settings.usage.tokens')}
                        value={formatTokens(totals.totalTokens)}
                      />
                      <Stat
                        label={t('settings.usage.spend')}
                        value={formatCost(totals.chargedUsd, i18n.language)}
                        {...(partial ? { caveat: t('settings.usage.atLeast') } : {})}
                      />
                      <Stat
                        label={t('settings.usage.cacheReads')}
                        value={formatTokens(totals.cacheReadTokens)}
                      />
                    </div>
                  </SettingsCardContent>
                </SettingsCard>

                {/*
                  Coverage is the honest part. Without it the spend figure is a
                  lower bound presented as a total — and it is systematically
                  low, because the unpriced sessions are exactly the custom
                  endpoints someone is most likely to be overspending on.
                */}
                {partial && (
                  <Note icon={<CircleHelp className="h-3.5 w-3.5 shrink-0" />}>
                    {t('settings.usage.coverage', {
                      percent: Math.round(coverageRatio(totals.coverage) * 100),
                      tokens: formatTokens(totals.coverage.unpricedTokens),
                    })}
                  </Note>
                )}

                {totals.subscriptionUsd > 0 && (
                  <Note icon={<Coins className="h-3.5 w-3.5 shrink-0" />}>
                    {t('settings.usage.subscriptionValue', {
                      amount: formatCost(totals.subscriptionUsd, i18n.language),
                    })}
                  </Note>
                )}
              </SettingsSection>

              <SettingsSection
                title={t('settings.usage.daily')}
                description={t('settings.usage.dailyDesc')}
              >
                <SettingsCard divided={false}>
                  <SettingsCardContent>
                    <div className="flex h-24 items-end gap-px">
                      {rollup.byDay.map((entry) => {
                        const height = (entry.totals.totalTokens / peakDay) * 100
                        const label = `${entry.key} · ${formatTokens(entry.totals.totalTokens)}`
                        return (
                          <div
                            key={entry.key}
                            className="flex h-full flex-1 items-end"
                            title={label}
                            aria-label={label}
                          >
                            {/*
                              A day with no work renders as a floor rather than
                              nothing: an absent bar and a zero bar look
                              identical at the end of a series, and the
                              difference between "quiet" and "not yet" is the one
                              the reader is checking for.
                            */}
                            <div
                              className={cn(
                                'w-full rounded-[4px]',
                                entry.totals.totalTokens > 0
                                  ? 'bg-accent/60'
                                  : 'bg-foreground/10',
                              )}
                              style={{ height: `${Math.max(height, 1)}%` }}
                            />
                          </div>
                        )
                      })}
                    </div>
                  </SettingsCardContent>
                </SettingsCard>
              </SettingsSection>

              <SettingsSection
                title={t('settings.usage.byModel')}
                description={t('settings.usage.byModelDesc')}
              >
                <SettingsCard divided={false}>
                  {rollup.byModel.slice(0, 12).map((group) => {
                    const unpriced = coverageIsPartial(group.totals.coverage)
                    const owner = group.key ? ownerOf(group.key) : undefined
                    const open = editing === group.key
                    return (
                      <div key={group.key || 'unknown'}>
                        <Row
                          name={
                            group.key
                              ? getModelDisplayName(group.key)
                              : t('settings.usage.noModel')
                          }
                          tokens={group.totals.totalTokens}
                          share={group.totals.totalTokens / Math.max(1, totals.totalTokens)}
                          cost={
                            unpriced
                              ? t('settings.usage.unpriced')
                              : formatCost(group.totals.chargedUsd, i18n.language)
                          }
                          {...(group.key && owner
                            ? {
                                onEditRate: () => setEditing(open ? null : group.key),
                                editing: open,
                              }
                            : {})}
                        />
                        {open && owner && (
                          <ModelRateEditor
                            modelId={group.key}
                            {...(pricingFor(group.key)
                              ? { initial: pricingFor(group.key)! }
                              : {})}
                            onCancel={() => setEditing(null)}
                            onSave={(pricing) => saveRate(owner, group.key, pricing)}
                          />
                        )}
                      </div>
                    )
                  })}
                </SettingsCard>
              </SettingsSection>

              <SettingsSection
                title={t('settings.usage.bySession')}
                description={t('settings.usage.bySessionDesc')}
              >
                <SettingsCard divided={false}>
                  {rollup.sessions.slice(0, 10).map((entry) => (
                    <Row
                      key={entry.session.id}
                      name={entry.session.name || t('settings.usage.untitled')}
                      tokens={entry.tokens}
                      share={entry.tokens / Math.max(1, totals.totalTokens)}
                      cost={costLabel(entry.cost, t, i18n.language)}
                    />
                  ))}
                </SettingsCard>
              </SettingsSection>
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

/**
 * An unknown cost renders as a dash, never as `$0.00`.
 *
 * This is the whole reason provenance exists: `$0.00` is a claim that the turn
 * was free, and for every OpenAI-compatible endpoint that claim is false.
 */
function costLabel(cost: SessionCost, t: (key: string) => string, locale: string): string {
  if (cost.provenance === 'unknown') return '—'
  if (cost.provenance === 'subscription') return t('settings.usage.included')
  return formatCost(cost.amount, locale)
}

function Note({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="mt-2 flex items-start gap-2 px-1 text-xs text-foreground/60">
      <span className="mt-0.5">{icon}</span>
      <span>{children}</span>
    </div>
  )
}

function Stat({ label, value, caveat }: { label: string; value: string; caveat?: string }) {
  return (
    <div>
      <div className="text-xs text-foreground/50">{label}</div>
      <div className="mt-0.5 text-sm font-medium tabular-nums">
        {/*
          The caveat sits inside the value, not beside the label: "at least
          $4.20" is one figure with a qualifier, and separating them lets a
          glance read the number as exact.
        */}
        {caveat && <span className="mr-1 font-normal text-foreground/50">{caveat}</span>}
        {value}
      </div>
    </div>
  )
}

function Row({
  name,
  tokens,
  share,
  cost,
  onEditRate,
  editing,
}: {
  name: string
  tokens: number
  share: number
  cost: string
  onEditRate?: () => void
  editing?: boolean
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-2 text-sm">
      <span className="min-w-0 flex-1 truncate">{name}</span>
      {/*
        The share bar is the ranking made visible; the number alone requires the
        reader to divide by a total that is elsewhere on the page.
      */}
      <span
        aria-hidden
        className="hidden h-1.5 w-24 shrink-0 overflow-hidden rounded-full bg-foreground/10 sm:block"
      >
        <span
          className="block h-full rounded-full bg-accent/50"
          style={{ width: `${Math.max(2, Math.round(share * 100))}%` }}
        />
      </span>
      <span className="w-16 shrink-0 text-right tabular-nums text-foreground/50">
        {formatTokens(tokens)}
      </span>
      {/*
        The action column reserves its width before the name truncates (§4.4),
        so a long model name never pushes the cost out of alignment.
      */}
      {onEditRate ? (
        <button
          type="button"
          onClick={onEditRate}
          aria-expanded={editing}
          className={cn(
            'w-20 shrink-0 rounded-[6px] px-1 text-right tabular-nums',
            'transition-colors duration-150 hover:bg-foreground/5',
            'outline-none focus-visible:bg-foreground/5',
          )}
        >
          {cost}
        </button>
      ) : (
        <span className="w-20 shrink-0 px-1 text-right tabular-nums">{cost}</span>
      )}
    </div>
  )
}
