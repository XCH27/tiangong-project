import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronRight, KeyRound, Monitor, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { ConnectionIcon } from '@/components/icons/ConnectionIcon'
import { API_KEY_PROVIDER_PRESETS } from './ApiKeyInput'
import type { ProviderChoice } from '@/components/onboarding/ProviderSelectStep'

interface ProviderCatalogProps {
  onSelect: (choice: ProviderChoice, preset?: string) => void
}

const SUBSCRIPTIONS: Array<{ choice: ProviderChoice; provider: string; nameKey: string }> = [
  { choice: 'claude', provider: 'anthropic', nameKey: 'onboarding.providerSelect.claudeProMax' },
  { choice: 'chatgpt', provider: 'openai-codex', nameKey: 'onboarding.providerSelect.codexChatGPT' },
  { choice: 'copilot', provider: 'github-copilot', nameKey: 'onboarding.providerSelect.githubCopilot' },
  { choice: 'xai', provider: 'xai', nameKey: 'onboarding.providerSelect.grokSubscription' },
]

/** Cindy's one-column provider catalog, using Craft's existing connection and setup owners. */
export function ProviderCatalog({ onSelect }: ProviderCatalogProps) {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const filtered = useMemo(() => {
    const search = query.trim().toLocaleLowerCase()
    return {
      subscriptions: SUBSCRIPTIONS.filter(item => !search || t(item.nameKey).toLocaleLowerCase().includes(search)),
      api: API_KEY_PROVIDER_PRESETS.filter(item => item.key !== 'custom'
        && (!search || item.label.toLocaleLowerCase().includes(search))),
      local: !search || t('onboarding.providerSelect.localModel').toLocaleLowerCase().includes(search),
      custom: !search || t('settings.ai.customEndpoint').toLocaleLowerCase().includes(search),
    }
  }, [query, t])

  const row = (name: string, meta: string, icon: React.ReactNode, onClick: () => void) => (
    <button
      type="button"
      key={name}
      onClick={onClick}
      className="flex w-full min-w-0 items-center gap-2.5 rounded-[6px] px-2 py-2.5 text-left transition-colors hover:bg-foreground/[0.05] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
    >
      <span className="flex size-7 shrink-0 items-center justify-center rounded-[6px] bg-foreground/[0.03]">{icon}</span>
      <span className="min-w-0 flex-1 truncate text-sm font-medium">{name}</span>
      <span className="shrink-0 text-xs text-foreground/50">{meta}</span>
      <ChevronRight className="size-3.5 shrink-0 text-foreground/40" />
    </button>
  )

  const groupLabel = (label: string) => (
    <div className="px-2 pb-1 pt-3 text-xs font-medium text-foreground/50">{label}</div>
  )

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b border-border/60 px-5 py-4">
        <h3 className="text-base font-semibold">{t('settings.ai.chooseProvider')}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{t('settings.ai.chooseProviderDesc')}</p>
      </div>
      <div className="border-b border-border/60 p-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder={t('settings.ai.searchProviders')}
            aria-label={t('settings.ai.searchProviders')}
            className="pl-8"
          />
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-3">
        {filtered.subscriptions.length > 0 && <>
          {groupLabel(t('settings.ai.subscriptionProviders'))}
          {filtered.subscriptions.map(item => row(
            t(item.nameKey), t('settings.ai.subscriptionConnection'),
            <ConnectionIcon size={16} connection={{ name: t(item.nameKey), providerType: item.choice === 'claude' ? 'anthropic' : 'pi', piAuthProvider: item.provider }} />,
            () => onSelect(item.choice),
          ))}
        </>}
        {(filtered.api.length > 0 || filtered.local) && <>
          {groupLabel(t('settings.ai.apiProviders'))}
          {filtered.api.map(item => row(
            item.label, t('settings.ai.apiKeyConnection'),
            <ConnectionIcon size={16} connection={{ name: item.label, providerType: 'pi', piAuthProvider: item.key, baseUrl: item.url }} />,
            () => onSelect('api_key', item.key),
          ))}
          {filtered.local && row(
            t('onboarding.providerSelect.localModel'), t('settings.ai.localConnection'),
            <Monitor className="size-4 text-foreground/60" />,
            () => onSelect('local'),
          )}
        </>}
        {!filtered.subscriptions.length && !filtered.api.length && !filtered.local && !filtered.custom && (
          <p className="px-2 py-6 text-center text-xs text-muted-foreground">{t('chat.noResults')}</p>
        )}
      </div>
      {filtered.custom && <div className="border-t border-border/60 p-3">
        {row(
          t('settings.ai.customEndpoint'), t('settings.ai.apiKeyConnection'),
          <KeyRound className="size-4 text-foreground/60" />,
          () => onSelect('api_key', 'custom'),
        )}
      </div>}
    </div>
  )
}
