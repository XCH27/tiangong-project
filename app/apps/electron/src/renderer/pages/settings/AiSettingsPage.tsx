/**
 * AiSettingsPage
 *
 * Unified AI settings page that consolidates all LLM-related configuration:
 * - Connection and available-model management
 * - Connection management (add/edit/delete)
 *
 * Session model and effort are chosen in the existing composer.
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { X, MoreHorizontal, Pencil, Trash2, Star, AlertTriangle, RefreshCcw, MessageSquareMore, Zap, Clock, Check, Plus, Monitor } from 'lucide-react'
import type { CredentialHealthStatus, CredentialHealthIssue } from '../../../shared/types'
import { Tooltip, TooltipTrigger, TooltipContent } from '@craft-agent/ui'
import type { LlmConnectionWithStatus } from '../../../shared/types'
import type { ManualModelSettings } from '../../../shared/types'
import type { DetailsPageMeta } from '@/lib/navigation-registry'
import {
  DropdownMenu,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  StyledDropdownMenuContent,
  StyledDropdownMenuItem,
  StyledDropdownMenuSeparator,
  DropdownMenuSub,
  StyledDropdownMenuSubTrigger,
  StyledDropdownMenuSubContent,
} from '@/components/ui/styled-dropdown'
import { cn } from '@/lib/utils'
import { getConnectionDisplayName, getConnectionProviderLabel } from '@/lib/connection-labels'
import { ConnectionIcon } from '@/components/icons/ConnectionIcon'

import {
  SettingsSection,
  SettingsCard,
  SettingsRow,
  SettingsToggle,
} from '@/components/settings'
import { useOnboarding } from '@/hooks/useOnboarding'
import { CredentialsStep, LocalModelStep, type ApiSetupMethod } from '@/components/onboarding'
import { ApiKeyInput } from '@/components/apisetup'
import { API_KEY_PROVIDER_PRESETS } from '@/components/apisetup/ApiKeyInput'
import type { ApiKeyCatalogPreview, ApiKeyInputProps } from '@/components/apisetup/ApiKeyInput'
import { ProviderCatalog } from '@/components/apisetup/ProviderCatalog'
import { ModelCapabilityBadges } from '@/components/apisetup/ModelCapabilityBadges'
import type { ProviderChoice } from '@/components/onboarding/ProviderSelectStep'
import { RenameDialog } from '@/components/ui/rename-dialog'
import { useAppShellContext } from '@/context/AppShellContext'
import { getModelShortName, type ModelDefinition } from '@config/models'
import { getModelsForProviderType, isCompatProvider, isModelVisibleInPicker, isOfficialApiModelCatalogConnection, resolveMidStreamBehavior, type CustomEndpointApi, type MidStreamBehavior } from '@config/llm-connections'
import { toast } from 'sonner'
import type { CodexUsageReadResult, XaiSubscriptionUsage } from '@craft-agent/shared/auth'

/**
 * Compact token count: 1234 → "1.2K", 1234567 → "1.2M". Used by the RTK
 * efficiency meter. Locale-agnostic — the suffix is universal across the
 * 7 supported locales.
 */
function formatTokenCount(n: number): string {
  if (n < 1000) return String(n)
  if (n < 1_000_000) return `${(n / 1000).toFixed(1)}K`
  return `${(n / 1_000_000).toFixed(1)}M`
}

function GrokSubscriptionUsage({ connectionSlug }: { connectionSlug: string }) {
  const { t, i18n } = useTranslation()
  const [usage, setUsage] = useState<XaiSubscriptionUsage | null>(null)
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      setUsage(await window.electronAPI.readXaiSubscriptionUsage(connectionSlug))
    } catch {
      setUsage(null)
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [connectionSlug])

  useEffect(() => { void refresh() }, [refresh])

  return <div className="border-t border-border/60 px-5 py-4">
    <div className="flex items-center justify-between gap-3">
      <div>
        <h3 className="text-sm font-semibold">{t('settings.ai.grokUsage')}</h3>
        {usage?.plan && <p className="mt-0.5 text-xs text-muted-foreground">{usage.plan}</p>}
      </div>
      <Button size="sm" variant="outline" onClick={() => void refresh()} disabled={loading} aria-label={t('settings.ai.refreshUsage')}>
        <RefreshCcw className={cn('size-3.5', loading && 'animate-spin')} />
        <span className="hidden sm:inline">{t('settings.ai.refreshUsage')}</span>
      </Button>
    </div>
    {usage?.window ? <p className="mt-3 text-xs text-muted-foreground">
      {t(`settings.ai.grokUsage.${usage.window.label}`)} · {t('settings.ai.grokUsage.used', { percent: Math.round(usage.window.usedPercent) })}
      {usage.window.resetAt ? ` · ${t('settings.ai.grokUsage.resets', { date: new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium' }).format(usage.window.resetAt) })}` : ''}
    </p> : error ? <p className="mt-3 text-xs text-muted-foreground">{t('common.unavailable')}</p> : null}
    {usage?.prepaidBalanceUsd !== undefined && <p className="mt-1 text-xs text-muted-foreground">
      {t('settings.ai.grokUsage.prepaidBalance')} · {new Intl.NumberFormat(i18n.language, { style: 'currency', currency: 'USD' }).format(usage.prepaidBalanceUsd)}
    </p>}
  </div>
}

function CodexSubscriptionUsage({ connectionSlug }: { connectionSlug: string }) {
  const { t, i18n } = useTranslation()
  const [result, setResult] = useState<CodexUsageReadResult | null>(null)
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      setResult(await window.electronAPI.readCodexSubscriptionUsage(connectionSlug))
    } catch {
      setResult({ status: 'unavailable' })
    } finally {
      setLoading(false)
    }
  }, [connectionSlug])

  useEffect(() => { void refresh() }, [refresh])

  const usage = result?.status === 'available' ? result.usage : null
  const windowLabel = (minutes: number): string => minutes % 1440 === 0
    ? t('settings.ai.codexUsage.days', { value: minutes / 1440 })
    : minutes % 60 === 0
      ? t('settings.ai.codexUsage.hours', { value: minutes / 60 })
      : t('settings.ai.codexUsage.minutes', { value: minutes })
  return <div className="border-t border-border/60 px-5 py-4">
    <div className="flex items-center justify-between gap-3">
      <div>
        <h3 className="text-sm font-semibold">{t('settings.ai.codexUsage')}</h3>
        {usage?.plan && <p className="mt-0.5 text-xs text-muted-foreground">{usage.plan}</p>}
      </div>
      <Button size="sm" variant="outline" onClick={() => void refresh()} disabled={loading} aria-label={t('settings.ai.refreshUsage')}>
        <RefreshCcw className={cn('size-3.5', loading && 'animate-spin')} />
        <span className="hidden sm:inline">{t('settings.ai.refreshUsage')}</span>
      </Button>
    </div>
    {usage ? <div className="mt-3 space-y-2 text-xs text-muted-foreground">
      {usage.buckets.map(bucket => <div key={bucket.id}>
        <p className="font-medium text-foreground">{bucket.id === 'default' ? t('settings.ai.codexUsage.general') : bucket.id}</p>
        {bucket.windows.map((window, index) => <div key={`${bucket.id}:${index}`} className="mt-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 tabular-nums">
            <span>{window.windowMinutes ? windowLabel(window.windowMinutes) : t('settings.ai.codexUsage.window', { value: index + 1 })}</span>
            <div role="progressbar" aria-valuenow={window.usedPercent} aria-valuemin={0} aria-valuemax={100}
              aria-label={`${bucket.id === 'default' ? t('settings.ai.codexUsage.general') : bucket.id} · ${t('settings.ai.grokUsage.used', { percent: Math.round(window.usedPercent) })}`}
              className="h-1.5 w-28 shrink-0 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-foreground/70" style={{ width: `${window.usedPercent}%` }} />
            </div>
            <span className="font-medium text-foreground">{t('settings.ai.grokUsage.used', { percent: Math.round(window.usedPercent) })}</span>
          </div>
          {window.resetAt && <p className="mt-0.5">
            {t('settings.ai.grokUsage.resets', { date: new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium', timeStyle: 'short' }).format(window.resetAt) })}
          </p>}
        </div>)}
      </div>)}
    </div> : result && <p className="mt-3 text-xs text-muted-foreground">
      {t(`settings.ai.codexUsage.${result.status}`)}
    </p>}
  </div>
}

/** Show only models saved for this connection; a registry is not account proof. */
function getModelOptionsForConnection(
  connection: LlmConnectionWithStatus | undefined,
): Array<{ value: string; label: string; description: string; descriptionKey?: string }> {
  if (!connection) return []

  // If connection has explicit models, use those
  if (connection.models && connection.models.length > 0) {
    return connection.models.map((m) => {
      if (typeof m === 'string') {
        return { value: m, label: getModelShortName(m), description: '' }
      }
      // ModelDefinition object
      const def = m as ModelDefinition
      return { value: def.id, label: def.name, description: def.description, descriptionKey: def.descriptionKey }
    })
  }

  return []
}

/** Prefer live connection metadata; use the exact provider registry ID for legacy string entries. */
function getConnectionModelDefinition(
  connection: LlmConnectionWithStatus | undefined,
  modelId: string,
): ModelDefinition | undefined {
  if (!connection || !modelId) return undefined
  const saved = connection.models?.find(candidate =>
    (typeof candidate === 'string' ? candidate : candidate.id) === modelId)
  if (saved && typeof saved !== 'string') return saved
  return getModelsForProviderType(connection.providerType, connection.piAuthProvider)
    .find(candidate => candidate.id === modelId)
}

const REASONING_LEVELS = ['low', 'medium', 'high', 'xhigh', 'max'] as const

/** The connection owns corrections; blank fields inherit a refreshed catalog value. */
function ModelDetailsDialog({ connection, modelId, model, accountContextWindow, onClose, onSaved }: {
  connection: LlmConnectionWithStatus
  modelId: string | null
  model?: ModelDefinition
  accountContextWindow?: number
  onClose: () => void
  onSaved: () => Promise<void>
}) {
  const { t, i18n } = useTranslation()
  const adding = modelId === '__add__'
  const existingOverride = modelId && !adding ? connection.manualModelOverrides?.[modelId] : undefined
  const [id, setId] = useState('')
  const [name, setName] = useState('')
  const [context, setContext] = useState('')
  const [output, setOutput] = useState('')
  const [images, setImages] = useState<'inherit' | 'yes' | 'no'>('inherit')
  const [reasoningMode, setReasoningMode] = useState<'inherit' | 'manual'>('inherit')
  const [efforts, setEfforts] = useState<string[]>([])
  const [reasoningOff, setReasoningOff] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setId('')
    setName(existingOverride?.name ?? '')
    setContext(existingOverride?.contextWindow?.toString() ?? '')
    setOutput(existingOverride?.maxOutputTokens?.toString() ?? '')
    setImages(existingOverride?.supportsImages === undefined ? 'inherit' : existingOverride.supportsImages ? 'yes' : 'no')
    setReasoningMode(existingOverride?.reasoningEfforts === undefined ? 'inherit' : 'manual')
    setEfforts(existingOverride?.reasoningEfforts ?? [])
    setReasoningOff(existingOverride?.reasoningDisableSupported ?? false)
  }, [modelId, connection.slug, existingOverride])

  const save = async () => {
    if (!modelId || saving) return
    const parseTokens = (value: string): number | undefined => value.trim() ? Number(value.trim()) : undefined
    const contextWindow = parseTokens(context)
    const maxOutputTokens = parseTokens(output)
    if ([contextWindow, maxOutputTokens].some(value => value !== undefined && (!Number.isSafeInteger(value) || value <= 0))) {
      toast.error(t('settings.ai.invalidModelLimit'))
      return
    }
    const settings: ManualModelSettings = {
      ...(name.trim() ? { name: name.trim() } : {}),
      ...(contextWindow ? { contextWindow } : {}),
      ...(maxOutputTokens ? { maxOutputTokens } : {}),
      ...(images !== 'inherit' ? { supportsImages: images === 'yes' } : {}),
      ...(reasoningMode === 'manual' ? {
        reasoningEfforts: REASONING_LEVELS.filter(level => efforts.includes(level)),
        reasoningDisableSupported: reasoningOff,
      } : {}),
    }
    setSaving(true)
    try {
      const result = await window.electronAPI.setLlmConnectionModelDetails(connection.slug, adding ? id : modelId, settings, adding)
      if (!result.success) throw new Error(result.error || t('settings.ai.modelDetailsSaveFailed'))
      await onSaved()
      onClose()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('settings.ai.modelDetailsSaveFailed'))
    } finally {
      setSaving(false)
    }
  }

  const formatExact = (value?: number) => value ? new Intl.NumberFormat(i18n.language).format(value) : t('common.unknown')
  const selectClass = 'h-9 w-full rounded-lg border border-border/60 bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-1 focus-visible:ring-ring'
  return <Dialog open={modelId !== null} onOpenChange={(open) => { if (!open) onClose() }}>
    <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-xl">
      <DialogHeader>
        <DialogTitle>{adding ? t('settings.ai.addModel') : model?.name ?? modelId}</DialogTitle>
        <DialogDescription>{adding ? t('settings.ai.addModelHint') : modelId}</DialogDescription>
      </DialogHeader>
      <div className="space-y-4 text-sm">
        {adding && <label className="block space-y-1.5">
          <span className="font-medium">{t('settings.ai.modelId')}</span>
          <Input value={id} onChange={event => setId(event.target.value)} placeholder="provider-model-id" />
        </label>}
        <p className="text-xs text-muted-foreground">{t(modelId && connection.manualModelOverrides?.[modelId] ? 'settings.ai.manualCorrection'
          : model?.catalogSource === 'provider' ? 'apiSetup.accountCatalog'
            : model?.catalogSource === 'sdk' ? 'apiSetup.bundledCatalog' : 'settings.ai.capabilitySourceUnknown')}</p>
        <label className="block space-y-1.5">
          <span className="font-medium">{t('settings.ai.modelName')}</span>
          <Input value={name} onChange={event => setName(event.target.value)} placeholder={model?.name || t('settings.ai.inheritModelValue')} />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block space-y-1.5">
            <span className="font-medium">{t('chat.contextUsage.contextWindow')}</span>
            <Input inputMode="numeric" value={context} onChange={event => setContext(event.target.value)} placeholder={formatExact(accountContextWindow ?? model?.contextWindow)} />
          </label>
          <label className="block space-y-1.5">
            <span className="font-medium">{t('settings.ai.maxOutputTokens')}</span>
            <Input inputMode="numeric" value={output} onChange={event => setOutput(event.target.value)} placeholder={formatExact(model?.maxOutputTokens)} />
          </label>
        </div>
        <label className="block space-y-1.5">
          <span className="font-medium">{t('settings.ai.imageInput')}</span>
          <select className={selectClass} value={images} onChange={event => setImages(event.target.value as typeof images)}>
            <option value="inherit">{t('settings.ai.inheritModelValue')} · {model?.supportsImages === undefined ? t('common.unknown') : t(model.supportsImages ? 'settings.ai.supported' : 'settings.ai.notSupported')}</option>
            <option value="yes">{t('settings.ai.supported')}</option>
            <option value="no">{t('settings.ai.notSupported')}</option>
          </select>
        </label>
        <div className="space-y-2">
          <label className="block space-y-1.5">
            <span className="font-medium">{t('settings.ai.reasoningLevels')}</span>
            <select className={selectClass} value={reasoningMode} onChange={event => setReasoningMode(event.target.value as typeof reasoningMode)}>
              <option value="inherit">{t('settings.ai.inheritModelValue')} · {model?.reasoningEfforts?.length ? model.reasoningEfforts.map(level => t(`thinking.${level}`)).join(', ') : t('common.unknown')}</option>
              <option value="manual">{t('settings.ai.manualCorrection')}</option>
            </select>
          </label>
          {reasoningMode === 'manual' && <div className="flex flex-wrap gap-1.5">
            {REASONING_LEVELS.map(level => <Button key={level} type="button" size="sm" variant={efforts.includes(level) ? 'secondary' : 'outline'}
              aria-pressed={efforts.includes(level)} onClick={() => setEfforts(current => current.includes(level) ? current.filter(value => value !== level) : [...current, level])}>
              {t(`thinking.${level}`)}
            </Button>)}
            <Button type="button" size="sm" variant={reasoningOff ? 'secondary' : 'outline'} aria-pressed={reasoningOff} onClick={() => setReasoningOff(value => !value)}>{t('thinking.off')}</Button>
          </div>}
        </div>
        {!adding && <div className="rounded-lg border border-border/60 px-3 py-2 text-xs text-muted-foreground">
          {t('settings.ai.outputModalities')}: {model?.modalities?.output?.length ? model.modalities.output.join(', ') : t('common.unknown')}
          {model?.supportsFastMode === true && ` · ${t('settings.ai.fastMode')}: ${t('settings.ai.supported')}`}
        </div>}
        <p className="text-xs text-muted-foreground">{t('settings.ai.manualModelHint')}</p>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>{t('common.cancel')}</Button>
        <Button type="button" onClick={() => void save()} disabled={saving}>{t(saving ? 'common.saving' : 'common.save')}</Button>
      </div>
    </DialogContent>
  </Dialog>
}

export const meta: DetailsPageMeta = {
  navigator: 'settings',
  slug: 'ai',
}

// ============================================
// Credential Health Warning Banner
// ============================================

/** Get user-friendly message for credential health issue */
function getHealthIssueMessage(issue: CredentialHealthIssue, t: (key: string) => string): string {
  switch (issue.type) {
    case 'file_corrupted':
      return t("settings.ai.credentialCorrupted")
    case 'decryption_failed':
      return t("settings.ai.credentialOtherMachine")
    case 'no_default_credentials':
      return t("settings.ai.credentialNotFound")
    default:
      return issue.message || 'Credential issue detected.'
  }
}

interface CredentialHealthBannerProps {
  issues: CredentialHealthIssue[]
  onReauthenticate: () => void
}

function CredentialHealthBanner({ issues, onReauthenticate }: CredentialHealthBannerProps) {
  const { t } = useTranslation()
  if (issues.length === 0) return null

  return (
    <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 mb-6">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-amber-700 dark:text-amber-400">
            {t("settings.ai.credentialIssue")}
          </h4>
          <p className="mt-1 text-sm text-amber-600 dark:text-amber-300/80">
            {getHealthIssueMessage(issues[0], t)}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onReauthenticate}
          className="flex-shrink-0 border-amber-500/30 text-amber-700 dark:text-amber-400 hover:bg-amber-500/10"
        >
          {t("settings.ai.reAuthenticate")}
        </Button>
      </div>
    </div>
  )
}

// ============================================
// Connection Row Component
// ============================================

type ValidationState = 'idle' | 'validating' | 'success' | 'error'

interface ConnectionRowProps {
  connection: LlmConnectionWithStatus
  connections: LlmConnectionWithStatus[]
  onRenameClick: () => void
  onDelete: () => void
  onSetDefault: () => void
  onValidate: () => void
  onReauthenticate: () => void
  onSetMidStreamBehavior: (behavior: MidStreamBehavior) => void
  validationState: ValidationState
  validationError?: string
  /** True when another OAuth connection resolves to the same Anthropic account (issue #838) */
  isDuplicateAccount?: boolean
}

function ConnectionRow({ connection, connections, onRenameClick, onDelete, onSetDefault, onValidate, onReauthenticate, onSetMidStreamBehavior, validationState, validationError, isDuplicateAccount }: ConnectionRowProps) {
  const { t } = useTranslation()
  const [menuOpen, setMenuOpen] = useState(false)

  // Opening dialog/overlay flows directly from a dropdown item can race with
  // menu teardown and leave a transient interaction lock behind on some systems.
  // Force menu close first, then trigger action on next frame.
  const runAfterMenuClose = useCallback((action: () => void) => {
    setMenuOpen(false)
    requestAnimationFrame(() => {
      action()
    })
  }, [])

  // The header names the provider once; connection type and health are metadata.
  const getDescription = () => {
    // Show validation state if not idle
    if (validationState === 'validating') return t("settings.ai.validating")
    if (validationState === 'success') return t("settings.ai.connectionValid")
    if (validationState === 'error') return validationError || t("settings.ai.validationFailed")

    return [
      t(connection.authType === 'oauth' ? 'settings.ai.subscriptionConnection' : 'settings.ai.apiKeyConnection'),
      t(connection.isAuthenticated ? 'settings.ai.connected' : 'settings.ai.notAuthenticated'),
    ].join(' · ')
  }

  // Resolved Anthropic identity (issue #838): render `email · org` independently of
  // validation state. It cannot live in getDescription() — that short-circuits for
  // validating/success/error and would hide the identity during those states.
  const oauthIdentityLine = connection.authType === 'oauth' && connection.oauthAccountEmail
    ? [connection.oauthAccountEmail, connection.oauthOrganizationName].filter(Boolean).join(' · ')
    : null

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 px-5 py-4">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 text-sm font-semibold">
            <ConnectionIcon connection={connection} size={18} />
            <span className="truncate">{getConnectionDisplayName(connection, connections)}</span>
            {connection.isDefault && (
              <span className="inline-flex h-5 items-center rounded-[4px] bg-foreground/[0.05] px-2 text-[11px] text-foreground/60">
                {t('common.default')}
              </span>
            )}
            {isDuplicateAccount && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex items-center" aria-label={t("settings.ai.duplicateAccount")}>
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                  </span>
                </TooltipTrigger>
                <TooltipContent>{t("settings.ai.duplicateAccount")}</TooltipContent>
              </Tooltip>
            )}
        </div>
        <p className="mt-1 truncate text-xs text-muted-foreground">{getDescription()}</p>
        {oauthIdentityLine && <p className="mt-0.5 truncate text-xs text-muted-foreground">{oauthIdentityLine}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-2">
      <Button
        size="sm"
        variant="outline"
        onClick={onValidate}
        disabled={validationState === 'validating'}
      >
        {t(validationState === 'validating' ? 'settings.ai.validating' : 'settings.ai.validateConnection')}
      </Button>
      <DropdownMenu modal={false} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label={t('settings.ai.connectionActions')}
            className="p-1.5 rounded-md hover:bg-foreground/[0.05] data-[state=open]:bg-foreground/[0.05] transition-colors"
            data-state={menuOpen ? 'open' : 'closed'}
          >
            <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <StyledDropdownMenuContent align="end">
          <StyledDropdownMenuItem onClick={() => runAfterMenuClose(onRenameClick)}>
            <Pencil className="h-3.5 w-3.5" />
            <span>{t("common.rename")}</span>
          </StyledDropdownMenuItem>
          {!connection.isDefault && (
            <StyledDropdownMenuItem onClick={onSetDefault}>
              <Star className="h-3.5 w-3.5" />
              <span>{t("settings.ai.setAsDefault")}</span>
            </StyledDropdownMenuItem>
          )}
          {connection.authType === 'oauth' ? (
            <StyledDropdownMenuItem onClick={() => runAfterMenuClose(onReauthenticate)}>
              <RefreshCcw className="h-3.5 w-3.5" />
              <span>{t("settings.ai.reAuthenticate")}</span>
            </StyledDropdownMenuItem>
          ) : null}
          {(() => {
            const currentBehavior = resolveMidStreamBehavior(connection)
            return (
              <DropdownMenuSub>
                <StyledDropdownMenuSubTrigger>
                  <MessageSquareMore className="h-3.5 w-3.5" />
                  <span>{t("settings.ai.midStream.title")}</span>
                </StyledDropdownMenuSubTrigger>
                <StyledDropdownMenuSubContent>
                  <StyledDropdownMenuItem onClick={() => onSetMidStreamBehavior('steer')}>
                    <Zap className="h-3.5 w-3.5" />
                    <span className="flex-1">{t("settings.ai.midStream.steer")}</span>
                    {currentBehavior === 'steer' && <Check className="h-3.5 w-3.5" />}
                  </StyledDropdownMenuItem>
                  <StyledDropdownMenuItem onClick={() => onSetMidStreamBehavior('queue')}>
                    <Clock className="h-3.5 w-3.5" />
                    <span className="flex-1">{t("settings.ai.midStream.queue")}</span>
                    {currentBehavior === 'queue' && <Check className="h-3.5 w-3.5" />}
                  </StyledDropdownMenuItem>
                </StyledDropdownMenuSubContent>
              </DropdownMenuSub>
            )
          })()}
          <StyledDropdownMenuSeparator />
          <StyledDropdownMenuItem
            onClick={() => runAfterMenuClose(onDelete)}
            variant="destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>{t('settings.ai.deleteConnection')}</span>
          </StyledDropdownMenuItem>
        </StyledDropdownMenuContent>
      </DropdownMenu>
      </div>
    </div>
  )
}

// ============================================
// Helpers
// ============================================

/** Map a connection's provider type to the corresponding API key setup method. */
function getApiKeyMethodForConnection(conn: LlmConnectionWithStatus): ApiSetupMethod {
  const provider = conn.providerType || conn.type
  if (provider === 'pi' || provider === 'pi_compat') return 'pi_api_key'
  return 'anthropic_api_key'
}

function getApiKeyInitialValues(connection: LlmConnectionWithStatus): ApiKeyInputProps['initialValues'] {
  const modelIds = connection.models
    ?.map(model => typeof model === 'string' ? model : model.id)
    .filter(Boolean)
  const customEndpoint = !!connection.customEndpoint && !!connection.baseUrl?.trim()
  return {
    connectionSlug: connection.slug,
    baseUrl: connection.baseUrl,
    connectionDefaultModel: customEndpoint ? modelIds?.join(', ') : connection.defaultModel,
    activePreset: customEndpoint ? 'custom' : connection.piAuthProvider || undefined,
    models: modelIds,
    customApi: connection.customEndpoint?.api,
  }
}

/** ZCode-style inline provider detail: one credential section above the same model list. */
function ConnectionApiKeySection({ connection, existingSlugs, refreshRequestId, onCatalogChange, onDraftKeyChange, onDraftStateChange, onSaved }: {
  connection: LlmConnectionWithStatus
  existingSlugs: Set<string>
  refreshRequestId: number
  onCatalogChange: (catalog: ApiKeyCatalogPreview | null) => void
  onDraftKeyChange: (hasDraft: boolean) => void
  onDraftStateChange: (hasDraft: boolean) => void
  onSaved: (slug: string) => Promise<void>
}) {
  const { t } = useTranslation()
  const [formVersion, setFormVersion] = useState(0)
  const [dirty, setDirty] = useState(false)
  const method = getApiKeyMethodForConnection(connection)
  const onboarding = useOnboarding({
    initialStep: 'credentials',
    initialApiSetupMethod: method,
    editingSlug: connection.slug,
    existingSlugs,
    onComplete: () => {},
    autoStartOAuthOnSelect: false,
  })
  const step = onboarding.state.step
  const jumpToCredentials = onboarding.jumpToCredentials

  useEffect(() => {
    if (step !== 'complete') return
    let cancelled = false
    void onSaved(connection.slug).finally(() => {
      if (cancelled) return
      // Remount the input only after the saved connection has been reloaded so
      // the plaintext draft is cleared and account discovery uses stored credentials.
      setFormVersion(version => version + 1)
      setDirty(false)
      onDraftKeyChange(false)
      onDraftStateChange(false)
      jumpToCredentials(method)
    })
    return () => { cancelled = true }
  }, [step, jumpToCredentials, connection.slug, method, onSaved, onDraftKeyChange, onDraftStateChange])

  return <div className="border-b border-border/60 px-5 py-4">
    <ApiKeyInput
      key={`${connection.slug}:${formVersion}`}
      status={onboarding.state.credentialStatus}
      errorMessage={onboarding.state.errorMessage}
      onSubmit={onboarding.handleSubmitCredential}
      formId={`connection-api-key-${connection.slug}`}
      providerType={method === 'pi_api_key' ? 'pi_api_key' : 'anthropic'}
      providerLocked
      hideModelSelection={method === 'pi_api_key'}
      refreshRequestId={refreshRequestId}
      onCatalogChange={onCatalogChange}
      onDraftKeyChange={onDraftKeyChange}
      onDirtyChange={() => { setDirty(true); onDraftStateChange(true) }}
      hasStoredCredential={connection.isAuthenticated}
      initialValues={getApiKeyInitialValues(connection)}
    />
    {dirty && <div className="mt-4 flex justify-end">
      <Button size="sm" type="submit" form={`connection-api-key-${connection.slug}`} disabled={onboarding.state.credentialStatus === 'validating'}>
        {t(onboarding.state.credentialStatus === 'validating' ? 'common.validating' : 'settings.ai.saveAndTestConnection')}
      </Button>
    </div>}
  </div>
}

// ============================================
// Main Component
// ============================================

export default function AiSettingsPage() {
  const { t } = useTranslation()
  const { llmConnections, refreshLlmConnections } = useAppShellContext()
  const [selectedConnectionSlug, setSelectedConnectionSlug] = useState<string | null>(null)
  const [showProviderCatalog, setShowProviderCatalog] = useState(false)

  // Setup in the provider detail panel
  const [showApiSetup, setShowApiSetup] = useState(false)
  const [editingConnectionSlug, setEditingConnectionSlug] = useState<string | null>(null)
  const [draftCatalog, setDraftCatalog] = useState<(ApiKeyCatalogPreview & { connectionSlug?: string }) | null>(null)
  const [hasPendingApiKey, setHasPendingApiKey] = useState(false)
  const [hasUnsavedConnectionDraft, setHasUnsavedConnectionDraft] = useState(false)
  const [catalogRefreshRequestId, setCatalogRefreshRequestId] = useState(0)
  const [editInitialValues, setEditInitialValues] = useState<{
    connectionSlug?: string
    apiKey?: string
    baseUrl?: string
    connectionDefaultModel?: string
    activePreset?: string
    models?: string[]
    customApi?: CustomEndpointApi
  } | undefined>(undefined)

  // Default settings state (app-level)
  const [extendedPromptCache, setExtendedPromptCache] = useState(false)
  const [enable1MContext, setEnable1MContext] = useState(false)
  const [rtkEnabled, setRtkEnabled] = useState(false)
  const [rtkStatus, setRtkStatus] = useState<{ installed: boolean; path: string | null; version: string | null } | null>(null)
  const [rtkRechecking, setRtkRechecking] = useState(false)
  const [rtkGain, setRtkGain] = useState<{ totalCommands: number; totalInput: number; totalOutput: number; totalSaved: number; avgSavingsPct: number; totalTimeMs: number; avgTimeMs: number } | null>(null)

  // Validation state per connection
  const [validationStates, setValidationStates] = useState<Record<string, {
    state: ValidationState
    error?: string
  }>>({})
  const [refreshingModelSlug, setRefreshingModelSlug] = useState<string | null>(null)
  const [mediaRefreshVersion, setMediaRefreshVersion] = useState(0)
  const [mediaCatalog, setMediaCatalog] = useState<{
    slug: string
    models: Array<{ id: string; name: string; kind: 'image' | 'video' | 'audio'; audioMode?: 'speech' | 'transcription' | 'generation' | 'realtime' }>
    status: 'available' | 'partial' | 'unavailable' | 'documented'
  } | null>(null)

  // Credential health state (for startup warning banner)
  const [credentialHealthIssues, setCredentialHealthIssues] = useState<CredentialHealthIssue[]>([])

  // Rename dialog state
  const [renameDialogOpen, setRenameDialogOpen] = useState(false)
  const [renamingConnection, setRenamingConnection] = useState<{ slug: string; name: string } | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [deletingConnectionSlug, setDeletingConnectionSlug] = useState<string | null>(null)
  const [deletingConnectionBusy, setDeletingConnectionBusy] = useState(false)

  // Load performance settings.
  useEffect(() => {
    const load = async () => {
      if (!window.electronAPI) return
      try {
        const extendedCache = await window.electronAPI.getExtendedPromptCache()
        setExtendedPromptCache(extendedCache)

        const enable1M = await window.electronAPI.getEnable1MContext()
        setEnable1MContext(enable1M)

        const rtkOn = await window.electronAPI.getRtkEnabled()
        setRtkEnabled(rtkOn)

        const status = await window.electronAPI.getRtkStatus()
        setRtkStatus(status)

      } catch (error) {
        console.error('Failed to load settings:', error)
      }
    }
    load()
  }, [])

  // Connection changes can resolve a missing-default-credential warning. Read
  // the current credential owner again, and ignore an older in-flight result.
  useEffect(() => {
    if (!window.electronAPI) return
    let cancelled = false
    void window.electronAPI.getCredentialHealth().then(health => {
      if (!cancelled) setCredentialHealthIssues(health.issues)
    }).catch(error => {
      if (!cancelled) console.error('Failed to check credential health:', error)
    })
    return () => { cancelled = true }
  }, [llmConnections])

  // Add/edit remains in the selected provider panel; the connection hook still owns saving.
  const openApiSetup = useCallback((connectionSlug?: string) => {
    setDraftCatalog(null)
    setHasPendingApiKey(false)
    setCatalogRefreshRequestId(0)
    setEditingConnectionSlug(connectionSlug || null)
    setShowProviderCatalog(false)
    setShowApiSetup(true)
  }, [])

  const closeApiSetup = useCallback(() => {
    setShowApiSetup(false)
    setDraftCatalog(null)
    setHasPendingApiKey(false)
    setCatalogRefreshRequestId(0)
    setEditingConnectionSlug(null)
  }, [])

  // Derive existing slugs for unique slug generation
  const existingSlugs = useMemo(
    () => new Set(llmConnections.map(c => c.slug)),
    [llmConnections],
  )

  // OnboardingWizard hook for editing API connection
  const apiSetupOnboarding = useOnboarding({
    initialStep: 'provider-select',
    onConfigSaved: async (slug) => {
      setSelectedConnectionSlug(slug)
      await refreshLlmConnections()
    },
    onComplete: () => {
      closeApiSetup()
      apiSetupOnboarding.reset()
    },
    onDismiss: () => {
      closeApiSetup()
      apiSetupOnboarding.reset()
    },
    editingSlug: editingConnectionSlug,
    existingSlugs,
    autoStartOAuthOnSelect: false,
  })

  const handleApiSetupFinish = useCallback(() => {
    closeApiSetup()
    apiSetupOnboarding.reset()
    // Clear any credential health issues after successful re-authentication
    setCredentialHealthIssues([])
    setEditInitialValues(undefined)
  }, [closeApiSetup, apiSetupOnboarding])

  // Leave setup and invalidate pending credential tests or authorization results.
  const handleCloseApiSetup = useCallback(() => {
    closeApiSetup()
    apiSetupOnboarding.reset()
    setEditInitialValues(undefined)
  }, [closeApiSetup, apiSetupOnboarding])

  // Settings has no onboarding completion page: return to the selected connection after save.
  useEffect(() => {
    if (showApiSetup && apiSetupOnboarding.state.step === 'complete') {
      handleApiSetupFinish()
    }
  }, [showApiSetup, apiSetupOnboarding.state.step, handleApiSetupFinish])

  const handleAddConnection = useCallback((choice: ProviderChoice, preset?: string) => {
    setShowProviderCatalog(false)
    setEditInitialValues(preset ? { activePreset: preset } : undefined)
    openApiSetup()
    apiSetupOnboarding.handleSelectProvider(choice)
  }, [apiSetupOnboarding, openApiSetup])

  const handleOpenProviderCatalog = useCallback(() => {
    closeApiSetup()
    apiSetupOnboarding.reset()
    setEditInitialValues(undefined)
    setShowProviderCatalog(true)
  }, [apiSetupOnboarding, closeApiSetup])

  // Handler for re-authenticate button in credential health banner
  const handleReauthenticate = useCallback(() => {
    // Open API setup for the default connection (or first connection if available)
    const defaultConn = llmConnections.find(c => c.isDefault) || llmConnections[0]
    if (defaultConn) {
      setSelectedConnectionSlug(defaultConn.slug)
      if (defaultConn.authType === 'oauth') {
        openApiSetup(defaultConn.slug)
      } else {
        requestAnimationFrame(() => document.getElementById('api-key')?.focus())
      }
    } else {
      setShowProviderCatalog(true)
    }
  }, [llmConnections, openApiSetup])

  // Connection action handlers
  const handleRenameClick = useCallback((connection: LlmConnectionWithStatus) => {
    const displayName = getConnectionDisplayName(connection, llmConnections)
    setRenamingConnection({ slug: connection.slug, name: displayName })
    setRenameValue(displayName)
    // Defer dialog open to next frame to let dropdown fully unmount first
    requestAnimationFrame(() => {
      setRenameDialogOpen(true)
    })
  }, [llmConnections])

  const handleRenameSubmit = useCallback(async () => {
    if (!renamingConnection || !window.electronAPI) return
    const trimmedName = renameValue.trim()
    if (!trimmedName || trimmedName === renamingConnection.name) {
      setRenameDialogOpen(false)
      return
    }
    try {
      // Get the full connection, update name, and save
      const connection = await window.electronAPI.getLlmConnection(renamingConnection.slug)
      if (connection) {
        const result = await window.electronAPI.saveLlmConnection({ ...connection, name: trimmedName })
        if (result.success) {
          refreshLlmConnections?.()
        } else {
          console.error('Failed to rename connection:', result.error)
        }
      }
    } catch (error) {
      console.error('Failed to rename connection:', error)
    }
    setRenameDialogOpen(false)
    setRenamingConnection(null)
    setRenameValue('')
  }, [renamingConnection, renameValue, refreshLlmConnections])

  const handleReauthenticateConnection = useCallback((connection: LlmConnectionWithStatus) => {
    setSelectedConnectionSlug(connection.slug)
    if (connection.authType === 'oauth') {
      openApiSetup(connection.slug)
      const method = connection.providerType === 'pi'
                   ? (connection.piAuthProvider === 'github-copilot' ? 'pi_copilot_oauth'
                     : connection.piAuthProvider === 'xai' ? 'pi_xai_oauth' : 'pi_chatgpt_oauth')
                   : 'claude_oauth'
      apiSetupOnboarding.jumpToCredentials(method)
      requestAnimationFrame(() => apiSetupOnboarding.handleStartOAuth(method, connection.slug))
    } else {
      requestAnimationFrame(() => document.getElementById('api-key')?.focus())
    }
  }, [apiSetupOnboarding, openApiSetup])

  const handleDeleteConnection = useCallback(async () => {
    if (!window.electronAPI || !deletingConnectionSlug) return
    setDeletingConnectionBusy(true)
    try {
      const result = await window.electronAPI.deleteLlmConnection(deletingConnectionSlug)
      if (result.success) {
        if (selectedConnectionSlug === deletingConnectionSlug) setSelectedConnectionSlug(null)
        setDeletingConnectionSlug(null)
        await refreshLlmConnections?.()
      } else {
        toast.error(result.error || t('settings.ai.deleteConnectionFailed'))
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('settings.ai.deleteConnectionFailed'))
    } finally {
      setDeletingConnectionBusy(false)
    }
  }, [deletingConnectionSlug, refreshLlmConnections, selectedConnectionSlug, t])

  const handleValidateConnection = useCallback(async (slug: string) => {
    if (!window.electronAPI) return

    // Set validating state
    setValidationStates(prev => ({ ...prev, [slug]: { state: 'validating' } }))

    try {
      const result = await window.electronAPI.testLlmConnection(slug)

      if (result.success) {
        setValidationStates(prev => ({ ...prev, [slug]: { state: 'success' } }))
        // Auto-clear success state after 3 seconds
        setTimeout(() => {
          setValidationStates(prev => ({ ...prev, [slug]: { state: 'idle' } }))
        }, 3000)
      } else {
        setValidationStates(prev => ({
          ...prev,
          [slug]: { state: 'error', error: result.error }
        }))
        // Auto-clear error state after 5 seconds
        setTimeout(() => {
          setValidationStates(prev => ({ ...prev, [slug]: { state: 'idle' } }))
        }, 5000)
      }
    } catch (error) {
      setValidationStates(prev => ({
        ...prev,
        [slug]: { state: 'error', error: t("settings.ai.validationFailed") }
      }))
      setTimeout(() => {
        setValidationStates(prev => ({ ...prev, [slug]: { state: 'idle' } }))
      }, 5000)
    }
  }, [t])

  const handleInlineApiSaved = useCallback(async (slug: string) => {
    await refreshLlmConnections()
    setCredentialHealthIssues([])
    setDraftCatalog(null)
    setValidationStates(previous => ({ ...previous, [slug]: { state: 'success' } }))
    setTimeout(() => {
      setValidationStates(previous => ({ ...previous, [slug]: { state: 'idle' } }))
    }, 3000)
  }, [refreshLlmConnections])

  const handleRefreshModels = useCallback(async (slug: string) => {
    if (refreshingModelSlug || !window.electronAPI) return
    setRefreshingModelSlug(slug)
    try {
      const result = await window.electronAPI.refreshLlmConnectionModels(slug)
      if (!result.success) throw new Error(result.error || 'Model refresh failed')
      await refreshLlmConnections()
      setMediaRefreshVersion(version => version + 1)
      // The inline credential form owns its own account preview and failure
      // state; refresh it after the saved catalog so an old error cannot linger.
      setCatalogRefreshRequestId(value => value + 1)
      if (result.error) {
        toast.error(t('settings.ai.modelRefreshFailed'))
        return
      }
      toast.info(t(result.source === 'provider' ? 'settings.ai.modelsCheckedProvider'
        : result.source === 'sdk' ? 'settings.ai.modelsCheckedSdk'
        : 'settings.ai.modelsCheckedCached'))
    } catch (error) {
      console.error('Failed to check connection models:', error)
      toast.error(t('settings.ai.modelRefreshFailed'))
    } finally {
      setRefreshingModelSlug(null)
    }
  }, [refreshingModelSlug, refreshLlmConnections, t])

  const handleSetDefaultConnection = useCallback(async (slug: string) => {
    if (!window.electronAPI) return
    try {
      const result = await window.electronAPI.setDefaultLlmConnection(slug)
      if (result.success) {
        refreshLlmConnections?.()
      } else {
        console.error('Failed to set default connection:', result.error)
      }
    } catch (error) {
      console.error('Failed to set default connection:', error)
    }
  }, [refreshLlmConnections])

  // Update a connection's mid-stream send behavior (steer vs queue).
  // Uses the same saveLlmConnection RPC as other connection edits.
  const handleSetMidStreamBehavior = useCallback(async (
    connection: LlmConnectionWithStatus,
    behavior: MidStreamBehavior,
  ) => {
    if (!window.electronAPI) return
    if (resolveMidStreamBehavior(connection) === behavior) return
    try {
      const updated = { ...connection, midStreamBehavior: behavior }
      const { isAuthenticated: _a, authError: _b, isDefault: _c, ...connectionData } = updated
      const result = await window.electronAPI.saveLlmConnection(connectionData as import('../../../shared/types').LlmConnection)
      if (result.success) {
        refreshLlmConnections?.()
      } else {
        console.error('Failed to update mid-stream behavior:', result.error)
        toast.error(t('settings.ai.midStream.updateFailed'))
      }
    } catch (error) {
      console.error('Failed to update mid-stream behavior:', error)
      toast.error(t('settings.ai.midStream.updateFailed'))
    }
  }, [refreshLlmConnections, t])

  // Get the default connection for display
  const defaultConnection = useMemo(() => {
    return llmConnections.find(c => c.isDefault)
  }, [llmConnections])
  const sortedConnections = useMemo(() => [...llmConnections].sort((a, b) => {
    if (a.isDefault !== b.isDefault) return a.isDefault ? -1 : 1
    return getConnectionDisplayName(a, llmConnections).localeCompare(getConnectionDisplayName(b, llmConnections))
  }), [llmConnections])
  const selectedConnection = llmConnections.find(c => c.slug === selectedConnectionSlug)
    ?? defaultConnection ?? sortedConnections[0]
  const deletingConnection = llmConnections.find(c => c.slug === deletingConnectionSlug)
  useEffect(() => {
    setHasPendingApiKey(false)
    setHasUnsavedConnectionDraft(false)
    setDraftCatalog(null)
  }, [selectedConnection?.slug])
  const handleSelectedCatalogChange = useCallback((catalog: ApiKeyCatalogPreview | null) => {
    setDraftCatalog(catalog ? { ...catalog, connectionSlug: selectedConnection?.slug } : null)
  }, [selectedConnection?.slug])
  const selectedIsApiKey = !!selectedConnection && selectedConnection.authType !== 'oauth'
    && (selectedConnection.providerType === 'pi' || selectedConnection.providerType === 'pi_compat' || selectedConnection.providerType === 'anthropic')
  const selectedHasLiveAccountCatalog = !!selectedConnection && (isOfficialApiModelCatalogConnection(selectedConnection)
    || (selectedConnection.providerType === 'pi' && selectedConnection.piAuthProvider === 'xai'
      && selectedConnection.authType === 'api_key' && !selectedConnection.customEndpoint))
  const accountPreview = hasPendingApiKey && selectedHasLiveAccountCatalog && draftCatalog?.source === 'provider'
    && draftCatalog.connectionSlug === selectedConnection?.slug
    && draftCatalog.provider === selectedConnection?.piAuthProvider && !draftCatalog.error
    ? draftCatalog : null
  const selectedHasXaiApiCatalog = selectedConnection?.providerType === 'pi'
    && selectedConnection.piAuthProvider === 'xai'
    && selectedConnection.authType === 'api_key'
    && selectedConnection.isAuthenticated
  const selectedHasOpenAiApiCatalog = selectedConnection?.providerType === 'pi'
    && selectedConnection.piAuthProvider === 'openai'
    && selectedConnection.authType === 'api_key'
    && selectedConnection.isAuthenticated
    && (!selectedConnection.baseUrl || selectedConnection.baseUrl.replace(/\/+$/, '') === 'https://api.openai.com/v1')
    && !selectedConnection.customEndpoint
  const selectedHasCodexSubscriptionCatalog = selectedConnection?.providerType === 'pi'
    && selectedConnection.piAuthProvider === 'openai-codex'
    && selectedConnection.authType === 'oauth'
    && selectedConnection.isAuthenticated
  const selectedHasMediaCatalog = selectedHasXaiApiCatalog || selectedHasOpenAiApiCatalog || selectedHasCodexSubscriptionCatalog
  const mediaConnectionSlug = selectedConnection?.slug
  useEffect(() => {
    if (!selectedHasMediaCatalog || !mediaConnectionSlug) {
      setMediaCatalog(null)
      return
    }
    let cancelled = false
    const slug = mediaConnectionSlug
    const provider = selectedHasCodexSubscriptionCatalog ? 'openai-codex' : selectedHasOpenAiApiCatalog ? 'openai' : 'xai'
    void window.electronAPI.getPiProviderModels(provider, undefined, slug).then(result => {
      if (cancelled) return
      setMediaCatalog({
        slug,
        models: result.mediaModels ?? [],
        status: result.mediaCatalogStatus ?? 'unavailable',
      })
    }).catch(() => {
      if (!cancelled) setMediaCatalog({ slug, models: [], status: 'unavailable' })
    })
    return () => { cancelled = true }
  }, [mediaConnectionSlug, selectedHasMediaCatalog, selectedHasCodexSubscriptionCatalog, selectedHasOpenAiApiCatalog, mediaRefreshVersion])
  const allSelectedModelOptions = useMemo<Array<{ value: string; label: string; description: string; descriptionKey?: string }>>(
    () => accountPreview
      ? accountPreview.models.map(model => ({ value: model.id, label: model.name, description: '' }))
      : getModelOptionsForConnection(selectedConnection),
    [selectedConnection, accountPreview],
  )
  const displayedMediaCatalog = useMemo(() => accountPreview && mediaConnectionSlug
    ? { slug: mediaConnectionSlug, models: accountPreview.mediaModels ?? [], status: accountPreview.mediaCatalogStatus ?? 'unavailable' }
    : mediaCatalog, [accountPreview, mediaCatalog, mediaConnectionSlug])
  const [detailModelId, setDetailModelId] = useState<string | null>(null)
  const [pendingVisibilityModel, setPendingVisibilityModel] = useState<string | null>(null)
  useEffect(() => {
    setDetailModelId(null)
  }, [selectedConnection?.slug])
  const detailModel = detailModelId && detailModelId !== '__add__' ? getConnectionModelDefinition(selectedConnection, detailModelId) : undefined
  const detailPreview = detailModelId ? accountPreview?.models.find(model => model.id === detailModelId) : undefined
  const detailContextWindow = detailPreview?.contextWindow || detailModel?.contextWindow
  const selectedCanRefreshModels = !!selectedConnection && (
    (isCompatProvider(selectedConnection.providerType)
      && !!selectedConnection.baseUrl && !!selectedConnection.customEndpoint)
    || (!isCompatProvider(selectedConnection.providerType) && (isOfficialApiModelCatalogConnection(selectedConnection)
      || selectedConnection.modelSelectionMode !== 'userDefined3Tier'
      || selectedConnection.piAuthProvider === 'github-copilot'
      || selectedConnection.piAuthProvider === 'xai')))

  // Anthropic account UUIDs that resolve from 2+ connections (issue #838).
  // Surfaces a warning when several Claude connections share one account/quota.
  const duplicateAccountUuids = useMemo(() => {
    const counts = new Map<string, number>()
    for (const conn of llmConnections) {
      const uuid = conn.oauthAccountUuid
      if (uuid) counts.set(uuid, (counts.get(uuid) ?? 0) + 1)
    }
    return new Set([...counts].filter(([, n]) => n > 1).map(([uuid]) => uuid))
  }, [llmConnections])

  const hasAnthropicApiConnection = llmConnections.some(connection =>
    connection.providerType === 'anthropic' && connection.authType === 'api_key')

  const handleModelVisibilityChange = useCallback(async (connection: LlmConnectionWithStatus, model: string, visible: boolean) => {
    if (!window.electronAPI || pendingVisibilityModel) return
    setPendingVisibilityModel(model)
    try {
      const result = await window.electronAPI.setLlmConnectionModelVisibility(connection.slug, model, visible)
      if (!result.success) throw new Error(result.error || t('settings.ai.modelVisibilityFailed'))
      await refreshLlmConnections()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('settings.ai.modelVisibilityFailed'))
    } finally {
      setPendingVisibilityModel(null)
    }
  }, [pendingVisibilityModel, refreshLlmConnections, t])

  const handleExtendedPromptCacheChange = useCallback(async (enabled: boolean) => {
    setExtendedPromptCache(enabled)
    await window.electronAPI?.setExtendedPromptCache(enabled)
  }, [])

  const handleEnable1MContextChange = useCallback(async (enabled: boolean) => {
    setEnable1MContext(enabled)
    await window.electronAPI?.setEnable1MContext(enabled)
  }, [])

  const handleRtkToggle = useCallback(async (enabled: boolean) => {
    setRtkEnabled(enabled)
    await window.electronAPI?.setRtkEnabled(enabled)
  }, [])

  const handleRecheckRtk = useCallback(async () => {
    setRtkRechecking(true)
    try {
      const status = await window.electronAPI?.getRtkStatus({ forceRecheck: true })
      if (status) setRtkStatus(status)
    } finally {
      setRtkRechecking(false)
    }
  }, [])

  const handleGetRtk = useCallback(() => {
    window.electronAPI?.openUrl('https://github.com/rtk-ai/rtk')
  }, [])

  const refreshRtkGain = useCallback(async () => {
    const gain = await window.electronAPI?.getRtkGain()
    setRtkGain(gain ?? null)
  }, [])

  // Refresh gain stats whenever rtk transitions to installed-and-enabled
  useEffect(() => {
    if (rtkStatus?.installed && rtkEnabled) {
      refreshRtkGain()
    } else {
      setRtkGain(null)
    }
  }, [rtkStatus?.installed, rtkEnabled, refreshRtkGain])

  // The same setup form is used for a new connection and inline editing of an
  // existing one. In the latter case the saved model list remains below it.
  const setupPreset = API_KEY_PROVIDER_PRESETS.find(preset => preset.key === editInitialValues?.activePreset)
  const setupMethod = apiSetupOnboarding.state.apiSetupMethod
  const setupIsLocal = apiSetupOnboarding.state.step === 'local-model'
  const setupIsSubscription = setupMethod === 'claude_oauth' || setupMethod === 'pi_chatgpt_oauth' || setupMethod === 'pi_copilot_oauth' || setupMethod === 'pi_xai_oauth'
  const setupSubscription = setupMethod === 'claude_oauth'
    ? { name: t('onboarding.providerSelect.claudeProMax'), providerType: 'anthropic' as const, piAuthProvider: 'anthropic' }
    : setupMethod === 'pi_chatgpt_oauth'
      ? { name: t('onboarding.providerSelect.codexChatGPT'), providerType: 'pi' as const, piAuthProvider: 'openai-codex' }
      : setupMethod === 'pi_copilot_oauth'
        ? { name: t('onboarding.providerSelect.githubCopilot'), providerType: 'pi' as const, piAuthProvider: 'github-copilot' }
        : setupMethod === 'pi_xai_oauth'
          ? { name: t('onboarding.providerSelect.grokSubscription'), providerType: 'pi' as const, piAuthProvider: 'xai' }
          : null
  const apiSetupForm = showApiSetup ? (
    <div>
      {!editingConnectionSlug && (setupPreset || setupSubscription || setupIsLocal) && <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 px-5 py-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-sm font-semibold">
            {setupIsLocal ? <Monitor className="size-[18px]" /> : <ConnectionIcon connection={setupPreset
              ? { name: setupPreset.label, providerType: 'pi', piAuthProvider: setupPreset.key, baseUrl: setupPreset.url }
              : setupSubscription!} size={18} />}
            <span className="truncate">{setupIsLocal ? t('onboarding.providerSelect.localModel') : setupPreset
              ? setupPreset.key === 'custom' ? t('settings.ai.customEndpoint') : setupPreset.label
              : setupSubscription?.name}</span>
          </div>
          <p className="mt-1 truncate text-xs text-muted-foreground">{t(setupIsLocal ? 'settings.ai.localConnection' : setupIsSubscription ? 'settings.ai.subscriptionConnection' : 'settings.ai.apiKeyConnection')} · {t('settings.ai.notAuthenticated')}</p>
        </div>
        <button type="button" onClick={handleOpenProviderCatalog} aria-label={t('common.close')} className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-foreground/[0.05] hover:text-foreground focus-visible:ring-1 focus-visible:ring-ring">
          <X className="h-4 w-4" />
        </button>
      </div>}
      <div className="border-b border-border/60 px-5 py-4">
      {apiSetupOnboarding.state.step === 'credentials' &&
        (apiSetupOnboarding.state.apiSetupMethod === 'pi_api_key' || apiSetupOnboarding.state.apiSetupMethod === 'anthropic_api_key') ? (
        <>
          <ApiKeyInput
            key={[editingConnectionSlug, editInitialValues?.activePreset, editInitialValues?.baseUrl].join(':')}
            status={apiSetupOnboarding.state.credentialStatus}
            errorMessage={apiSetupOnboarding.state.errorMessage}
            onSubmit={apiSetupOnboarding.handleSubmitCredential}
            providerType={apiSetupOnboarding.state.apiSetupMethod === 'pi_api_key' ? 'pi_api_key' : 'anthropic'}
            providerLocked
            hideModelSelection={apiSetupOnboarding.state.apiSetupMethod === 'pi_api_key' && editInitialValues?.activePreset !== 'custom'}
            refreshRequestId={catalogRefreshRequestId}
            onCatalogChange={setDraftCatalog}
            onDraftKeyChange={setHasPendingApiKey}
            initialValues={editInitialValues}
          />
          <div className="mt-4 flex justify-end">
            <Button size="sm" type="submit" form="api-key-form" disabled={apiSetupOnboarding.state.credentialStatus === 'validating'}>
              {t(apiSetupOnboarding.state.credentialStatus === 'validating' ? 'common.validating' : 'settings.ai.saveAndTestConnection')}
            </Button>
          </div>
        </>
      ) : apiSetupOnboarding.state.step === 'credentials' && apiSetupOnboarding.state.apiSetupMethod ? (
        <CredentialsStep
          presentation="settings"
          apiSetupMethod={apiSetupOnboarding.state.apiSetupMethod}
          status={apiSetupOnboarding.state.credentialStatus}
          errorMessage={apiSetupOnboarding.state.errorMessage}
          onSubmit={apiSetupOnboarding.handleSubmitCredential}
          onStartOAuth={apiSetupOnboarding.handleStartOAuth}
          onBack={editingConnectionSlug ? handleCloseApiSetup : handleOpenProviderCatalog}
          isWaitingForCode={apiSetupOnboarding.isWaitingForCode}
          onSubmitAuthCode={apiSetupOnboarding.handleSubmitAuthCode}
          onCancelOAuth={apiSetupOnboarding.handleCancelOAuth}
          copilotDeviceCode={apiSetupOnboarding.copilotDeviceCode}
        />
      ) : apiSetupOnboarding.state.step === 'local-model' ? (
        <LocalModelStep
          presentation="settings"
          onSubmit={apiSetupOnboarding.handleSubmitLocalModel}
          onBack={handleOpenProviderCatalog}
          status={apiSetupOnboarding.state.credentialStatus === 'validating' ? 'validating' : apiSetupOnboarding.state.credentialStatus === 'error' ? 'error' : 'idle'}
          errorMessage={apiSetupOnboarding.state.errorMessage}
        />
      ) : null}
      </div>
    </div>
  ) : null

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 min-h-0 mask-fade-y">
        <ScrollArea className="h-full md:[&_[data-radix-scroll-area-viewport]>div]:h-full">
          <div className="px-5 py-7 max-w-3xl mx-auto md:flex md:min-h-full md:w-full md:flex-col">
            <header className="mb-3 px-1">
              <h1 className="text-base font-semibold">{t('settings.ai.title')}</h1>
              <p className="mt-1 text-sm text-muted-foreground">{t('settings.ai.description')}</p>
            </header>
            {/* Credential Health Warning Banner */}
            <CredentialHealthBanner
              issues={credentialHealthIssues}
              onReauthenticate={handleReauthenticate}
            />

            <div className="space-y-8 md:flex md:min-h-0 md:flex-1 md:flex-col md:gap-8 md:space-y-0">
              <div className="overflow-hidden rounded-[12px] border border-border/60 bg-background shadow-minimal md:flex md:min-h-[20rem] md:max-h-[40rem] md:flex-1 md:flex-col">
                  <div className="flex flex-col md:min-h-0 md:flex-1 md:flex-row">
                    <aside className="flex w-full shrink-0 flex-col border-b border-border/60 bg-foreground/[0.02] md:min-h-0 md:w-56 md:border-b-0 md:border-r">
                      <div className="flex items-center justify-between px-3 py-3">
                        <span className="text-xs font-medium text-muted-foreground">{t('settings.ai.connections')}</span>
                        <span className="text-xs tabular-nums text-muted-foreground/70">{sortedConnections.length}</span>
                      </div>
                      <nav aria-label={t('settings.ai.connections')} className="min-h-0 flex-1 space-y-0.5 overflow-y-auto px-2 pb-2">
                        {sortedConnections.map((conn) => (
                          <button
                            key={conn.slug}
                            type="button"
                            onClick={() => { setShowProviderCatalog(false); setSelectedConnectionSlug(conn.slug); handleCloseApiSetup() }}
                            aria-current={!showProviderCatalog && !showApiSetup && selectedConnection?.slug === conn.slug ? 'page' : undefined}
                            className={cn(
                              'flex w-full min-w-0 items-center gap-2 rounded-lg px-2.5 py-2.5 text-left text-[13px] outline-none transition-colors',
                              'hover:bg-foreground/[0.05] focus-visible:ring-1 focus-visible:ring-ring',
                              !showProviderCatalog && !showApiSetup && selectedConnection?.slug === conn.slug && 'bg-background shadow-minimal',
                            )}
                          >
                            <ConnectionIcon connection={conn} size={18} />
                            <span className="min-w-0 flex-1 truncate font-medium">{getConnectionDisplayName(conn, llmConnections)}</span>
                            <span
                              className={cn('size-1.5 shrink-0 rounded-full', conn.isAuthenticated ? 'bg-success' : 'bg-foreground/20')}
                              aria-label={conn.isAuthenticated ? t('settings.ai.connected') : t('settings.ai.notAuthenticated')}
                            />
                          </button>
                        ))}
                      </nav>
                      <div className="border-t border-border/60 p-2">
                        <Button size="sm" variant="outline" className="w-full justify-start gap-2" aria-label={t('settings.ai.addConnection')} onClick={handleOpenProviderCatalog}>
                          <Plus className="h-4 w-4" />
                          {t('settings.ai.addConnection')}
                        </Button>
                      </div>
                    </aside>

                    <section className="min-w-0 flex-1 md:min-h-0 md:overflow-y-auto">
                      {showProviderCatalog || (!selectedConnection && !showApiSetup) ? (
                        <ProviderCatalog onSelect={handleAddConnection} />
                      ) : showApiSetup && !editingConnectionSlug ? (
                        <div>
                          {apiSetupForm}
                          {!setupIsLocal && setupPreset?.key !== 'custom' && <div className="border-t border-border/60">
                            <div className="flex flex-wrap items-end justify-between gap-3 px-5 py-4">
                              <div>
                                <h3 className="text-sm font-semibold">{t('settings.ai.modelList')}</h3>
                                <p className="mt-0.5 text-xs text-muted-foreground">{t(
                                  setupIsSubscription ? 'settings.ai.signInToLoadModels'
                                    : draftCatalog?.error ? 'apiSetup.catalogUnavailable'
                                    : draftCatalog?.source === 'provider' ? 'apiSetup.accountCatalog'
                                      : hasPendingApiKey ? 'settings.ai.refreshingModels' : 'settings.ai.enterApiKeyToLoadModels',
                                )}</p>
                              </div>
                              {!setupIsSubscription && hasPendingApiKey && <Button size="sm" variant="outline" onClick={() => setCatalogRefreshRequestId(value => value + 1)} aria-label={t('settings.ai.refreshModels')}>
                                <RefreshCcw className="size-3.5" />
                                {t('settings.ai.refreshModels')}
                              </Button>}
                            </div>
                            {draftCatalog?.source === 'provider' && !draftCatalog.error && <div className="border-t border-border/60">
                              {draftCatalog.models.map(model => <div key={model.id} title={model.id} className="flex flex-wrap items-center gap-x-2 gap-y-1 border-b border-border/60 px-5 py-3 last:border-b-0">
                                <span className="min-w-0 truncate text-sm font-medium">{model.name}</span>
                                <ModelCapabilityBadges model={model} />
                              </div>)}
                              {draftCatalog.mediaModels?.map(model => <div key={`${model.kind}:${model.id}`} title={model.id} className="flex flex-wrap items-center gap-x-2 gap-y-1 border-b border-border/60 px-5 py-3 last:border-b-0">
                                <span className="min-w-0 truncate text-sm font-medium">{model.name}</span>
                                <span className="rounded-full border border-border/60 px-1.5 text-xs text-muted-foreground">{t(model.kind === 'image' ? 'settings.ai.mediaImageModels' : model.kind === 'video' ? 'settings.ai.mediaVideoModels' : 'settings.ai.mediaAudioModels')}</span>
                              </div>)}
                            </div>}
                          </div>}
                        </div>
                      ) : selectedConnection ? (
                        <div className="min-w-0">
                          <ConnectionRow
                            connection={selectedConnection}
                            connections={llmConnections}
                            onRenameClick={() => handleRenameClick(selectedConnection)}
                            onDelete={() => setDeletingConnectionSlug(selectedConnection.slug)}
                            onSetDefault={() => handleSetDefaultConnection(selectedConnection.slug)}
                            onValidate={() => handleValidateConnection(selectedConnection.slug)}
                            onReauthenticate={() => handleReauthenticateConnection(selectedConnection)}
                            onSetMidStreamBehavior={(behavior) => handleSetMidStreamBehavior(selectedConnection, behavior)}
                            validationState={validationStates[selectedConnection.slug]?.state || 'idle'}
                            validationError={validationStates[selectedConnection.slug]?.error}
                            isDuplicateAccount={!!selectedConnection.oauthAccountUuid && duplicateAccountUuids.has(selectedConnection.oauthAccountUuid)}
                          />

                          {selectedIsApiKey ? <ConnectionApiKeySection
                            key={selectedConnection.slug}
                            connection={selectedConnection}
                            existingSlugs={existingSlugs}
                            refreshRequestId={catalogRefreshRequestId}
                            onCatalogChange={handleSelectedCatalogChange}
                            onDraftKeyChange={setHasPendingApiKey}
                            onDraftStateChange={setHasUnsavedConnectionDraft}
                            onSaved={handleInlineApiSaved}
                          /> : showApiSetup && editingConnectionSlug === selectedConnection.slug ? apiSetupForm : null}

                          {selectedConnection.providerType === 'pi' && selectedConnection.piAuthProvider === 'xai' && selectedConnection.authType === 'oauth'
                            && <GrokSubscriptionUsage key={selectedConnection.slug} connectionSlug={selectedConnection.slug} />}

                          {selectedConnection.providerType === 'pi' && selectedConnection.piAuthProvider === 'openai-codex' && selectedConnection.authType === 'oauth' && !selectedConnection.baseUrl
                            && <CodexSubscriptionUsage key={selectedConnection.slug} connectionSlug={selectedConnection.slug} />}

                          <div className="border-t border-border/60">
                            <div className="flex flex-wrap items-end justify-between gap-3 px-5 py-4">
                              <div>
                                <h3 className="text-sm font-semibold">{t('settings.ai.modelList')}</h3>
                                <p className="mt-0.5 text-xs text-muted-foreground">{t(accountPreview ? 'apiSetup.accountCatalog' : 'settings.ai.modelListDesc')}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button size="sm" variant="outline" onClick={() => setDetailModelId('__add__')}>
                                  <Plus className="size-3.5" />{t('settings.ai.addModel')}
                                </Button>
                                {selectedCanRefreshModels && <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => hasUnsavedConnectionDraft
                                    ? setCatalogRefreshRequestId(value => value + 1)
                                    : void handleRefreshModels(selectedConnection.slug)}
                                  disabled={refreshingModelSlug !== null}
                                  aria-label={t('settings.ai.refreshModels')}
                                >
                                  <RefreshCcw className={cn('size-3.5', refreshingModelSlug === selectedConnection.slug && 'animate-spin')} />
                                  <span>{t(refreshingModelSlug === selectedConnection.slug ? 'settings.ai.refreshingModels' : 'settings.ai.refreshModels')}</span>
                                </Button>}
                              </div>
                            </div>
                            {allSelectedModelOptions.length > 0 ? (
                              <div className="border-t border-border/60">
                                {allSelectedModelOptions.map(option => {
                                  const visible = isModelVisibleInPicker(selectedConnection, option.value)
                                  const model = accountPreview?.models.find(candidate => candidate.id === option.value)
                                    ?? getConnectionModelDefinition(selectedConnection, option.value)
                                  return (
                                    <div
                                      key={option.value}
                                      className="flex w-full items-center gap-3 border-b border-border/60 px-5 py-3.5 text-left last:border-b-0"
                                    >
                                      <button type="button" onClick={() => setDetailModelId(option.value)} title={option.value}
                                        aria-label={`${option.label}: ${t('settings.ai.modelCapabilities')}`}
                                        className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1 text-left outline-none focus-visible:ring-1 focus-visible:ring-ring">
                                        <span className="min-w-0 truncate text-sm font-medium">{option.label}</span>
                                        <ModelCapabilityBadges model={model} />
                                        <Pencil className="ml-auto size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                                      </button>
                                      {!accountPreview && <Switch
                                        checked={visible}
                                        disabled={pendingVisibilityModel !== null}
                                        onCheckedChange={(checked) => void handleModelVisibilityChange(selectedConnection, option.value, checked)}
                                        aria-label={`${option.label}: ${t('settings.ai.showInModelPicker')}`}
                                      />}
                                    </div>
                                  )
                                })}
                              </div>
                            ) : !selectedHasMediaCatalog && (
                              <p className="border-t border-border/60 px-5 py-4 text-sm text-muted-foreground">
                                {t('settings.ai.noModels')}
                              </p>
                            )}
                          </div>
                          {selectedHasMediaCatalog && (
                            <div className="border-t border-border/60 px-5 py-4">
                              <h3 className="text-sm font-semibold">{t('settings.ai.mediaModels')}</h3>
                              <p className="mt-0.5 text-xs text-muted-foreground">{t(selectedHasCodexSubscriptionCatalog ? 'settings.ai.mediaModelsCodexDesc' : 'settings.ai.mediaModelsDesc')}</p>
                              {displayedMediaCatalog?.slug === selectedConnection.slug ? (
                                <>
                                  {displayedMediaCatalog.status !== 'available' && <p className="mt-3 text-xs text-muted-foreground">
                                    {t(displayedMediaCatalog.status === 'documented' ? 'settings.ai.mediaModelsCodexUnverified' :
                                      displayedMediaCatalog.status === 'partial' ? 'settings.ai.mediaModelsPartial' : 'settings.ai.mediaModelsUnavailable')}
                                  </p>}
                                  {(['image', 'video', 'audio'] as const).map(kind => {
                                    const rows = displayedMediaCatalog.models.filter(model => model.kind === kind)
                                    if (!rows.length) return null
                                    return <div key={kind} className="mt-4">
                                      <h4 className="mb-1 text-xs font-medium text-muted-foreground">{t(kind === 'image' ? 'settings.ai.mediaImageModels' : kind === 'video' ? 'settings.ai.mediaVideoModels' : 'settings.ai.mediaAudioModels')}</h4>
                                      {rows.map(model => <div key={`${kind}:${model.id}`} className="border-b border-border/60 py-2 last:border-b-0">
                                        <span className="block truncate text-sm font-medium">{model.name}</span>
                                        {(model.name !== model.id || model.audioMode) && <span className="block truncate text-xs text-muted-foreground">
                                          {model.name !== model.id ? model.id : ''}{model.audioMode ? `${model.name !== model.id ? ' · ' : ''}${t(`settings.ai.mediaAudio.${model.audioMode}`)}` : ''}
                                        </span>}
                                      </div>)}
                                    </div>
                                  })}
                                  {displayedMediaCatalog.status === 'available' && !displayedMediaCatalog.models.length && <p className="mt-3 text-xs text-muted-foreground">{t('settings.ai.mediaModelsEmpty')}</p>}
                                </>
                              ) : <p className="mt-3 text-xs text-muted-foreground">{t('settings.ai.refreshingModels')}</p>}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex h-full min-h-64 items-center justify-center px-6 text-center text-sm text-muted-foreground">{t('settings.ai.noConnections')}</div>
                      )}
                    </section>
                  </div>
              </div>

              {/* Performance */}
              {llmConnections.length > 0 && <SettingsSection title={t("settings.ai.performance")} description={t("settings.ai.performanceDesc")}>
                <SettingsCard>
                  {hasAnthropicApiConnection && <SettingsToggle
                    label={t("settings.ai.extendedContext")}
                    description={t("settings.ai.extendedContextDesc")}
                    checked={enable1MContext}
                    onCheckedChange={handleEnable1MContextChange}
                  />}
                  {hasAnthropicApiConnection && <SettingsToggle
                    label={t("settings.ai.extendedPromptCache")}
                    description={t("settings.ai.extendedPromptCacheDesc")}
                    checked={extendedPromptCache}
                    onCheckedChange={handleExtendedPromptCacheChange}
                  />}
                  {rtkStatus?.installed ? (
                    <>
                      <SettingsToggle
                        label={t("settings.ai.rtk.title")}
                        description={t("settings.ai.rtk.description")}
                        checked={rtkEnabled}
                        onCheckedChange={handleRtkToggle}
                      />
                      {rtkEnabled && rtkGain && rtkGain.totalCommands > 0 && (
                        <div className="px-4 pb-4 -mt-1">
                          <div className="flex items-center justify-between text-xs text-foreground/60">
                            <span>
                              {t("settings.ai.rtk.gainSummary", {
                                saved: formatTokenCount(rtkGain.totalSaved),
                                count: rtkGain.totalCommands,
                                pct: rtkGain.avgSavingsPct.toFixed(1),
                              })}
                            </span>
                            <button
                              type="button"
                              onClick={refreshRtkGain}
                              className="text-foreground/60 hover:text-foreground transition-colors"
                              aria-label={t("settings.ai.rtk.gainRefresh")}
                            >
                              <RefreshCcw className="size-3" />
                            </button>
                          </div>
                          <div className="mt-2 h-1.5 rounded-full bg-foreground/10 overflow-hidden">
                            <div
                              className="h-full bg-foreground/60 transition-all"
                              style={{ width: `${Math.min(100, Math.max(0, rtkGain.avgSavingsPct))}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <SettingsRow
                      label={t("settings.ai.rtk.title")}
                      description={rtkStatus === null ? t("common.checking") : t("settings.ai.rtk.notInstalledDesc")}
                    >
                      <Button
                        size="sm"
                        onClick={handleGetRtk}
                        className="bg-background shadow-minimal text-foreground hover:bg-foreground/5 rounded-lg"
                      >
                        {t("settings.ai.rtk.getRtk")}
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleRecheckRtk}
                        disabled={rtkRechecking || rtkStatus === null}
                        className="bg-background shadow-minimal text-foreground hover:bg-foreground/5 rounded-lg"
                      >
                        {rtkRechecking ? t("common.checking") : t("settings.ai.rtk.recheck")}
                      </Button>
                    </SettingsRow>
                  )}
                </SettingsCard>
              </SettingsSection>}

              {selectedConnection && <ModelDetailsDialog
                connection={selectedConnection}
                modelId={detailModelId}
                model={detailModel}
                accountContextWindow={detailContextWindow}
                onClose={() => setDetailModelId(null)}
                onSaved={refreshLlmConnections}
              />}
              <RenameDialog
                open={renameDialogOpen}
                onOpenChange={setRenameDialogOpen}
                title={t("settings.ai.renameConnection")}
                value={renameValue}
                onValueChange={setRenameValue}
                onSubmit={handleRenameSubmit}
                placeholder={t("settings.ai.enterConnectionName")}
              />
              <Dialog open={deletingConnectionSlug !== null} onOpenChange={open => { if (!open && !deletingConnectionBusy) setDeletingConnectionSlug(null) }}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{t('settings.ai.deleteConnection')}</DialogTitle>
                    <DialogDescription>
                      {t('settings.ai.deleteConnectionConfirm', {
                        name: deletingConnection ? getConnectionDisplayName(deletingConnection, llmConnections) : '',
                      })}
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setDeletingConnectionSlug(null)} disabled={deletingConnectionBusy}>{t('common.cancel')}</Button>
                    <Button variant="destructive" onClick={handleDeleteConnection} disabled={deletingConnectionBusy}>{t('common.delete')}</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
