/**
 * AiSettingsPage
 *
 * Unified AI settings page that consolidates all LLM-related configuration:
 * - Default connection, model, and thinking level
 * - Per-workspace overrides
 * - Connection management (add/edit/delete)
 *
 * Follows the Appearance settings pattern: app-level defaults + workspace overrides.
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { X, MoreHorizontal, Pencil, Trash2, Star, ChevronDown, ChevronRight, AlertTriangle, RefreshCcw, Settings2, MessageSquareMore, Zap, Clock, Check, Plus, Search, Gauge, Brain } from 'lucide-react'
import type { CredentialHealthStatus, CredentialHealthIssue } from '../../../shared/types'
import { Tooltip, TooltipTrigger, TooltipContent } from '@craft-agent/ui'
import { motion, AnimatePresence } from 'motion/react'
import type { LlmConnectionWithStatus, ThinkingLevel, WorkspaceSettings, Workspace } from '../../../shared/types'
import { DEFAULT_THINKING_LEVEL, THINKING_LEVELS, getThinkingLevelsForModel, reconcileThinkingLevelForModel, getThinkingLevelNameKey } from '@craft-agent/shared/agent/thinking-levels'
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
import { ConnectionIcon } from '@/components/icons/ConnectionIcon'

import {
  SettingsSection,
  SettingsCard,
  SettingsRow,
  SettingsMenuSelectRow,
  SettingsToggle,
} from '@/components/settings'
import { useOnboarding } from '@/hooks/useOnboarding'
import { useWorkspaceIcon } from '@/hooks/useWorkspaceIcon'
import { CredentialsStep, LocalModelStep, type ApiSetupMethod } from '@/components/onboarding'
import { ApiKeyInput } from '@/components/apisetup'
import { ProviderCatalog } from '@/components/apisetup/ProviderCatalog'
import type { ProviderChoice } from '@/components/onboarding/ProviderSelectStep'
import { RenameDialog } from '@/components/ui/rename-dialog'
import { useAppShellContext } from '@/context/AppShellContext'
import { getModelShortName, type ModelDefinition } from '@config/models'
import { getModelsForProviderType, isCompatProvider, resolveMidStreamBehavior, type CustomEndpointApi, type MidStreamBehavior } from '@config/llm-connections'
import { toast } from 'sonner'
import type { XaiSubscriptionUsage } from '@craft-agent/shared/auth'

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

/**
 * Derive model dropdown options from a connection's models array,
 * falling back to registry models for the connection's provider type.
 */
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

  // Fall back to registry models for this provider type
  const registryModels = getModelsForProviderType(connection.providerType, connection.piAuthProvider)
  return registryModels.map((m) => ({
    value: m.id,
    label: m.name,
    description: m.description,
    descriptionKey: m.descriptionKey,
  }))
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
// Pi Auth Provider Display Names
// ============================================

const PI_AUTH_PROVIDER_LABELS: Record<string, string> = {
  anthropic: 'Anthropic',
  openai: 'OpenAI API',
  'openai-codex': 'ChatGPT / Codex',
  google: 'Google AI Studio',
  openrouter: 'OpenRouter',
  'azure-openai-responses': 'Azure OpenAI',
  'amazon-bedrock': 'Amazon Bedrock',
  groq: 'Groq',
  mistral: 'Mistral',
  deepseek: 'DeepSeek',
  xai: 'xAI',
  cerebras: 'Cerebras',
  zai: 'z.ai',
  huggingface: 'Hugging Face',
  minimax: 'Minimax',
  'minimax-cn': 'Minimax (CN)',
  'kimi-coding': 'Kimi (Coding)',
  moonshotai: 'Moonshot AI',
  'moonshotai-cn': 'Moonshot AI (CN)',
  'vercel-ai-gateway': 'Vercel AI Gateway',
  'github-copilot': 'GitHub Copilot',
}

function getConnectionProviderLabel(connection: LlmConnectionWithStatus): string {
  if (connection.providerType === 'anthropic') return 'Anthropic'
  if (connection.providerType === 'pi') {
    return PI_AUTH_PROVIDER_LABELS[connection.piAuthProvider ?? ''] || connection.piAuthProvider || connection.name
  }
  return connection.name
}

// ============================================
// Connection Row Component
// ============================================

type ValidationState = 'idle' | 'validating' | 'success' | 'error'

interface ConnectionRowProps {
  connection: LlmConnectionWithStatus
  isLastConnection: boolean
  onRenameClick: () => void
  onDelete: () => void
  onSetDefault: () => void
  onValidate: () => void
  onReauthenticate: () => void
  onEdit: () => void
  onSetMidStreamBehavior: (behavior: MidStreamBehavior) => void
  validationState: ValidationState
  validationError?: string
  /** True when another OAuth connection resolves to the same Anthropic account (issue #838) */
  isDuplicateAccount?: boolean
}

function ConnectionRow({ connection, isLastConnection, onRenameClick, onDelete, onSetDefault, onValidate, onReauthenticate, onEdit, onSetMidStreamBehavior, validationState, validationError, isDuplicateAccount }: ConnectionRowProps) {
  const { t } = useTranslation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [piBaseUrl, setPiBaseUrl] = useState<string | undefined>(undefined)

  // Opening dialog/overlay flows directly from a dropdown item can race with
  // menu teardown and leave a transient interaction lock behind on some systems.
  // Force menu close first, then trigger action on next frame.
  const runAfterMenuClose = useCallback((action: () => void) => {
    setMenuOpen(false)
    requestAnimationFrame(() => {
      action()
    })
  }, [])

  // Load Pi provider base URL via IPC (Pi SDK can't run in renderer)
  useEffect(() => {
    const provider = connection.providerType || connection.type
    if (provider === 'pi' && connection.piAuthProvider && !connection.baseUrl) {
      window.electronAPI.getPiProviderBaseUrl(connection.piAuthProvider).then(url => setPiBaseUrl(url))
    }
  }, [connection.providerType, connection.type, connection.piAuthProvider, connection.baseUrl])

  // Build description with provider, default indicator, auth status, and validation state
  const getDescription = () => {
    // Show validation state if not idle
    if (validationState === 'validating') return t("settings.ai.validating")
    if (validationState === 'success') return t("settings.ai.connectionValid")
    if (validationState === 'error') return validationError || t("settings.ai.validationFailed")

    const parts: string[] = []

    // Provider type (fall back to legacy 'type' field if providerType missing)
    // OAuth = subscription (Pro/Plus/Max), API key = API
    const provider = connection.providerType || connection.type
    parts.push(getConnectionProviderLabel(connection))

    // Base URL for API key connections (show custom endpoint or default for provider)
    if (connection.authType !== 'oauth') {
      let endpoint = connection.baseUrl
      // Use default endpoints for standard providers if no custom baseUrl
      if (!endpoint) {
        if (provider === 'anthropic') endpoint = 'https://api.anthropic.com'
        else if (provider === 'pi' && connection.piAuthProvider) {
          endpoint = piBaseUrl
        }
      }
      if (endpoint) {
        // Extract hostname from URL for cleaner display
        try {
          const url = new URL(endpoint)
          parts.push(url.host)
        } catch {
          parts.push(endpoint)
        }
      }
    }

    // Keep connection state in the same summary row as its actions.
    parts.push(t(connection.isAuthenticated ? "settings.ai.connected" : "settings.ai.notAuthenticated"))

    return parts.join(' · ')
  }

  // Resolved Anthropic identity (issue #838): render `email · org` independently of
  // validation state. It cannot live in getDescription() — that short-circuits for
  // validating/success/error and would hide the identity during those states.
  const oauthIdentityLine = connection.authType === 'oauth' && connection.oauthAccountEmail
    ? [connection.oauthAccountEmail, connection.oauthOrganizationName].filter(Boolean).join(' · ')
    : null

  return (
    <SettingsRow
      label={(
        <div className="flex flex-col gap-0.5 min-w-0">
          <div className="flex items-center gap-1">
            <ConnectionIcon connection={connection} size={14} />
            <span>{connection.name}</span>
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
          {oauthIdentityLine && (
            <span className="text-xs text-muted-foreground truncate">{oauthIdentityLine}</span>
          )}
        </div>
      )}
      description={getDescription()}
    >
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
          ) : (
            <StyledDropdownMenuItem onClick={() => runAfterMenuClose(onEdit)}>
              <Settings2 className="h-3.5 w-3.5" />
              <span>{t("common.edit")}</span>
            </StyledDropdownMenuItem>
          )}
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
            onClick={onDelete}
            variant="destructive"
            disabled={isLastConnection}
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>{t("common.delete")}</span>
          </StyledDropdownMenuItem>
        </StyledDropdownMenuContent>
      </DropdownMenu>
    </SettingsRow>
  )
}

// ============================================
// Workspace Override Card Component
// ============================================

interface WorkspaceOverrideCardProps {
  workspace: Workspace
  llmConnections: LlmConnectionWithStatus[]
  onSettingsChange: () => void
}

const WORKSPACE_SETTING_LABELS: Partial<Record<keyof WorkspaceSettings, string>> = {
  defaultLlmConnection: 'workspace connection override',
  model: 'workspace model override',
  thinkingLevel: 'workspace thinking override',
}

function WorkspaceOverrideCard({ workspace, llmConnections, onSettingsChange }: WorkspaceOverrideCardProps) {
  const { t } = useTranslation()
  const [isExpanded, setIsExpanded] = useState(false)
  const [settings, setSettings] = useState<WorkspaceSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Fetch workspace icon as data URL (file:// URLs don't work in renderer)
  const iconUrl = useWorkspaceIcon(workspace)

  // Load workspace settings
  useEffect(() => {
    const loadSettings = async () => {
      if (!window.electronAPI) return
      setIsLoading(true)
      try {
        const ws = await window.electronAPI.getWorkspaceSettings(workspace.id)
        setSettings(ws)
      } catch (error) {
        console.error('Failed to load workspace settings:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadSettings()
  }, [workspace.id])

  // Save workspace setting helper (optimistic update with rollback)
  const updateSetting = useCallback(async <K extends keyof WorkspaceSettings>(key: K, value: WorkspaceSettings[K]) => {
    if (!window.electronAPI) return

    const previousValue = settings?.[key]

    // Optimistic UI update for immediate feedback
    setSettings(prev => prev ? { ...prev, [key]: value } : prev)

    try {
      await window.electronAPI.updateWorkspaceSetting(workspace.id, key, value)
      // The backend may reconcile a model override when its connection
      // changes. Read the saved state so the selector matches the next run.
      if (key === 'defaultLlmConnection') {
        const persisted = await window.electronAPI.getWorkspaceSettings(workspace.id).catch(() => null)
        if (persisted) setSettings(persisted)
      }
      onSettingsChange()
    } catch (error) {
      // Roll back only the changed key
      setSettings(prev => prev ? { ...prev, [key]: previousValue } : prev)

      const rawMessage = error instanceof Error ? error.message : 'Unknown error'
      const message = rawMessage.includes('MODEL_UNAVAILABLE_FOR_CONNECTION')
        ? t('chat.modelUnavailableForConnection')
        : rawMessage
      const settingLabel = WORKSPACE_SETTING_LABELS[key] ?? String(key)
      console.error(`Failed to save ${String(key)}:`, error)
      toast.error(t("toast.failedToSaveSetting", { setting: settingLabel }), {
        description: message,
      })
    }
  }, [workspace.id, onSettingsChange, settings])

  const handleConnectionChange = useCallback((slug: string) => {
    // 'global' means use app default (clear workspace override)
    updateSetting('defaultLlmConnection', slug === 'global' ? undefined : slug)
  }, [updateSetting])

  const handleModelChange = useCallback((model: string) => {
    // 'global' means use app default (clear workspace override)
    updateSetting('model', model === 'global' ? undefined : model)
  }, [updateSetting])

  const handleThinkingChange = useCallback((level: string) => {
    // 'global' means use app default (clear workspace override)
    updateSetting('thinkingLevel', level === 'global' ? undefined : level as ThinkingLevel)
  }, [updateSetting])

  // Determine if workspace has any overrides
  const hasOverrides = settings && (
    settings.defaultLlmConnection ||
    settings.model ||
    settings.thinkingLevel
  )

  // Get display values
  const currentConnection = settings?.defaultLlmConnection || 'global'
  const currentModel = settings?.model || 'global'
  const currentThinking = settings?.thinkingLevel || 'global'

  // Derive workspace's effective connection (override or default)
  const workspaceEffectiveConnection = useMemo(() => {
    const connSlug = settings?.defaultLlmConnection
    return connSlug ? llmConnections.find(c => c.slug === connSlug) : llmConnections.find(c => c.isDefault)
  }, [settings?.defaultLlmConnection, llmConnections])
  const workspaceEffectiveModel = settings?.model || workspaceEffectiveConnection?.defaultModel || ''
  const workspaceModelDefinition = getConnectionModelDefinition(workspaceEffectiveConnection, workspaceEffectiveModel)
  const workspaceThinkingLevels = getThinkingLevelsForModel(workspaceModelDefinition)
  const workspaceThinkingUnsupported = workspaceModelDefinition?.supportsThinking === false && workspaceThinkingLevels.length === 0

  // Get summary text for collapsed state
  const getSummary = () => {
    if (!hasOverrides) return t("settings.ai.usingDefaults")
    const parts: string[] = []
    if (settings?.defaultLlmConnection) {
      const conn = llmConnections.find(c => c.slug === settings.defaultLlmConnection)
      parts.push(conn?.name || settings.defaultLlmConnection)
    }
    if (settings?.model) {
      parts.push(getModelShortName(settings.model))
    }
    if (settings?.thinkingLevel) {
      const level = THINKING_LEVELS.find(l => l.id === settings.thinkingLevel)
      parts.push(level ? t(level.nameKey) : settings.thinkingLevel)
    }
    return parts.join(' · ')
  }

  return (
    <SettingsCard>
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between py-3 px-4 hover:bg-foreground/[0.02] transition-colors"
      >
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'w-6 h-6 rounded-full overflow-hidden bg-foreground/5 flex items-center justify-center',
              'ring-1 ring-border/50'
            )}
          >
            {iconUrl ? (
              <img src={iconUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-xs font-medium text-muted-foreground">
                {workspace.name?.charAt(0)?.toUpperCase() || 'W'}
              </span>
            )}
          </div>
          <div className="text-left">
            <div className="text-sm font-medium">{workspace.name}</div>
            <div className="text-xs text-muted-foreground">
              {isLoading ? t("common.loading") : getSummary()}
            </div>
          </div>
        </div>
        {isExpanded ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="border-t border-border/50 px-4 py-2">
              <SettingsMenuSelectRow
                label={t("settings.ai.connection")}
                description={t("settings.ai.connectionDesc")}
                value={currentConnection}
                onValueChange={handleConnectionChange}
                options={[
                  { value: 'global', label: t("settings.ai.useDefault"), description: t("settings.ai.inheritFromApp") },
                  ...llmConnections.map((conn) => ({
                    value: conn.slug,
                    label: conn.name,
                    description: getConnectionProviderLabel(conn),
                  })),
                ]}
              />
              <SettingsMenuSelectRow
                label={t("settings.ai.model")}
                description={t("settings.ai.modelDesc")}
                value={currentModel}
                onValueChange={handleModelChange}
                options={[
                  { value: 'global', label: t("settings.ai.useDefault"), description: t("settings.ai.inheritFromApp") },
                  ...getModelOptionsForConnection(workspaceEffectiveConnection).map(o => ({
                    ...o, description: o.descriptionKey ? t(o.descriptionKey) : o.description,
                  })),
                ]}
              />
              <SettingsMenuSelectRow
                label={t("settings.ai.thinking")}
                description={workspaceThinkingUnsupported ? t('thinking.notSupported') :
                  workspaceThinkingLevels.length === 0 ? t('common.unavailable') : t("settings.ai.thinkingDesc")}
                value={workspaceThinkingUnsupported ? 'unavailable' : currentThinking}
                onValueChange={handleThinkingChange}
                disabled={workspaceThinkingLevels.length === 0}
                options={workspaceThinkingUnsupported ? [
                  { value: 'unavailable', label: t('thinking.notSupported') },
                ] : workspaceThinkingLevels.length === 0 ? [
                  { value: currentThinking, label: currentThinking === 'global' ? t('settings.ai.useDefault') : t(getThinkingLevelNameKey(currentThinking as ThinkingLevel)) },
                ] : [
                  { value: 'global', label: t("settings.ai.useDefault"), description: t("settings.ai.inheritFromApp") },
                  ...workspaceThinkingLevels.map(({ id, nameKey, descriptionKey }) => ({
                    value: id,
                    label: t(nameKey),
                    description: t(descriptionKey),
                  })),
                ]}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </SettingsCard>
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

// ============================================
// Main Component
// ============================================

export default function AiSettingsPage() {
  const { t } = useTranslation()
  const { llmConnections, refreshLlmConnections, activeWorkspaceId } = useAppShellContext()
  const [selectedConnectionSlug, setSelectedConnectionSlug] = useState<string | null>(null)
  const [showProviderCatalog, setShowProviderCatalog] = useState(false)
  const pendingCreatedSlugs = useRef<Set<string> | null>(null)

  // API Setup overlay state
  const [showApiSetup, setShowApiSetup] = useState(false)
  const [editingConnectionSlug, setEditingConnectionSlug] = useState<string | null>(null)
  const [editInitialValues, setEditInitialValues] = useState<{
    connectionSlug?: string
    apiKey?: string
    baseUrl?: string
    connectionDefaultModel?: string
    activePreset?: string
    models?: string[]
    customApi?: CustomEndpointApi
  } | undefined>(undefined)

  // Workspaces for override cards
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])

  // Default settings state (app-level)
  const [defaultThinking, setDefaultThinking] = useState<ThinkingLevel>(DEFAULT_THINKING_LEVEL)
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
    models: Array<{ id: string; name: string; kind: 'image' | 'video' }>
    status: 'available' | 'partial' | 'unavailable' | 'documented'
  } | null>(null)

  // Credential health state (for startup warning banner)
  const [credentialHealthIssues, setCredentialHealthIssues] = useState<CredentialHealthIssue[]>([])

  // Rename dialog state
  const [renameDialogOpen, setRenameDialogOpen] = useState(false)
  const [renamingConnection, setRenamingConnection] = useState<{ slug: string; name: string } | null>(null)
  const [renameValue, setRenameValue] = useState('')

  // Load workspaces, default settings, and credential health
  useEffect(() => {
    const load = async () => {
      if (!window.electronAPI) return
      try {
        const ws = await window.electronAPI.getWorkspaces()
        setWorkspaces(ws)

        const defaultThinkingLevel = await window.electronAPI.getDefaultThinkingLevel()
        setDefaultThinking(defaultThinkingLevel)

        const extendedCache = await window.electronAPI.getExtendedPromptCache()
        setExtendedPromptCache(extendedCache)

        const enable1M = await window.electronAPI.getEnable1MContext()
        setEnable1MContext(enable1M)

        const rtkOn = await window.electronAPI.getRtkEnabled()
        setRtkEnabled(rtkOn)

        const status = await window.electronAPI.getRtkStatus()
        setRtkStatus(status)

        // Check credential health for potential issues (corruption, machine migration)
        const health = await window.electronAPI.getCredentialHealth()
        if (!health.healthy) {
          setCredentialHealthIssues(health.issues)
        }
      } catch (error) {
        console.error('Failed to load settings:', error)
      }
    }
    load()
  }, [activeWorkspaceId])

  // Add/edit remains in the selected provider panel; the connection hook still owns saving.
  const openApiSetup = useCallback((connectionSlug?: string) => {
    setEditingConnectionSlug(connectionSlug || null)
    setShowApiSetup(true)
  }, [])

  const closeApiSetup = useCallback(() => {
    setShowApiSetup(false)
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
    onConfigSaved: refreshLlmConnections,
    onComplete: () => {
      closeApiSetup()
      refreshLlmConnections?.()
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
    refreshLlmConnections?.()
    apiSetupOnboarding.reset()
    // Clear any credential health issues after successful re-authentication
    setCredentialHealthIssues([])
    setEditInitialValues(undefined)
  }, [closeApiSetup, refreshLlmConnections, apiSetupOnboarding])

  // Handler for closing the modal via X button or Escape - resets state and cancels OAuth
  const handleCloseApiSetup = useCallback(() => {
    closeApiSetup()
    apiSetupOnboarding.reset()
    setEditInitialValues(undefined)
    pendingCreatedSlugs.current = null
  }, [closeApiSetup, apiSetupOnboarding])

  // Settings has no onboarding completion page: return to the selected connection after save.
  useEffect(() => {
    if (showApiSetup && apiSetupOnboarding.state.step === 'complete') {
      handleApiSetupFinish()
    }
  }, [showApiSetup, apiSetupOnboarding.state.step, handleApiSetupFinish])

  const handleAddConnection = useCallback((choice: ProviderChoice, preset?: string) => {
    pendingCreatedSlugs.current = new Set(existingSlugs)
    setShowProviderCatalog(false)
    setEditInitialValues(preset ? { activePreset: preset } : undefined)
    requestAnimationFrame(() => {
      openApiSetup()
      apiSetupOnboarding.handleSelectProvider(choice)
    })
  }, [apiSetupOnboarding, existingSlugs, openApiSetup])

  const handleOpenProviderCatalog = useCallback(() => {
    closeApiSetup()
    apiSetupOnboarding.reset()
    setEditInitialValues(undefined)
    pendingCreatedSlugs.current = null
    setShowProviderCatalog(true)
  }, [apiSetupOnboarding, closeApiSetup])

  // After connection setup, show its model list in the same provider detail panel.
  useEffect(() => {
    if (!pendingCreatedSlugs.current) return
    const created = llmConnections.find(connection => !pendingCreatedSlugs.current!.has(connection.slug))
    if (created) {
      setSelectedConnectionSlug(created.slug)
      pendingCreatedSlugs.current = null
    }
  }, [llmConnections])

  // Handler for re-authenticate button in credential health banner
  const handleReauthenticate = useCallback(() => {
    // Open API setup for the default connection (or first connection if available)
    const defaultConn = llmConnections.find(c => c.isDefault) || llmConnections[0]
    if (defaultConn) {
      openApiSetup(defaultConn.slug)
    } else {
      openApiSetup()
    }
  }, [llmConnections, openApiSetup])

  // Connection action handlers
  const handleRenameClick = useCallback((connection: LlmConnectionWithStatus) => {
    setRenamingConnection({ slug: connection.slug, name: connection.name })
    setRenameValue(connection.name)
    // Defer dialog open to next frame to let dropdown fully unmount first
    requestAnimationFrame(() => {
      setRenameDialogOpen(true)
    })
  }, [])

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
    openApiSetup(connection.slug)
    if (connection.authType === 'oauth') {
      const method = connection.providerType === 'pi'
                   ? (connection.piAuthProvider === 'github-copilot' ? 'pi_copilot_oauth'
                     : connection.piAuthProvider === 'xai' ? 'pi_xai_oauth' : 'pi_chatgpt_oauth')
                   : 'claude_oauth'
      apiSetupOnboarding.jumpToCredentials(method)
      requestAnimationFrame(() => apiSetupOnboarding.handleStartOAuth(method, connection.slug))
    }
  }, [apiSetupOnboarding, openApiSetup])

  const handleEditConnection = useCallback((connection: LlmConnectionWithStatus) => {
    // Build model string from connection's models array
    const modelStr = connection.models
      ?.map((m: string | ModelDefinition) => typeof m === 'string' ? m : m.id)
      .join(', ') || connection.defaultModel || ''

    // Set initial values before opening overlay so ApiKeyInput mounts with them
    const modelIds = connection.models
      ?.map((m: string | ModelDefinition) => typeof m === 'string' ? m : m.id)
      .filter(Boolean)

    const isCustomEndpointConnection = !!connection.customEndpoint && !!connection.baseUrl?.trim()

    setEditInitialValues({
      connectionSlug: connection.slug,
      baseUrl: connection.baseUrl,
      connectionDefaultModel: isCustomEndpointConnection ? modelStr : connection.defaultModel,
      activePreset: isCustomEndpointConnection ? 'custom' : (connection.piAuthProvider || undefined),
      models: modelIds,
      customApi: connection.customEndpoint?.api,
    })

    // Keep the edit form in this provider's detail panel.
    setSelectedConnectionSlug(connection.slug)
    openApiSetup(connection.slug)
    const method = getApiKeyMethodForConnection(connection)
    apiSetupOnboarding.jumpToCredentials(method)
  }, [apiSetupOnboarding, openApiSetup])

  const handleDeleteConnection = useCallback(async (slug: string) => {
    if (!window.electronAPI) return
    try {
      const result = await window.electronAPI.deleteLlmConnection(slug)
      if (result.success) {
        refreshLlmConnections?.()
      } else {
        console.error('Failed to delete connection:', result.error)
      }
    } catch (error) {
      console.error('Failed to delete connection:', error)
    }
  }, [refreshLlmConnections])

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

  const handleRefreshModels = useCallback(async (slug: string) => {
    if (refreshingModelSlug || !window.electronAPI) return
    setRefreshingModelSlug(slug)
    try {
      const result = await window.electronAPI.refreshLlmConnectionModels(slug)
      if (!result.success) throw new Error(result.error || 'Model refresh failed')
      await refreshLlmConnections()
      setMediaRefreshVersion(version => version + 1)
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
    return a.name.localeCompare(b.name)
  }), [llmConnections])
  const selectedConnection = llmConnections.find(c => c.slug === selectedConnectionSlug)
    ?? defaultConnection ?? sortedConnections[0]
  const selectedHasXaiApiCatalog = selectedConnection?.providerType === 'pi'
    && selectedConnection.piAuthProvider === 'xai'
    && selectedConnection.authType === 'api_key'
    && selectedConnection.isAuthenticated
  const selectedHasCodexSubscriptionCatalog = selectedConnection?.providerType === 'pi'
    && selectedConnection.piAuthProvider === 'openai-codex'
    && selectedConnection.authType === 'oauth'
    && selectedConnection.isAuthenticated
  const selectedHasMediaCatalog = selectedHasXaiApiCatalog || selectedHasCodexSubscriptionCatalog
  useEffect(() => {
    if (!selectedHasMediaCatalog || !selectedConnection) {
      setMediaCatalog(null)
      return
    }
    let cancelled = false
    const slug = selectedConnection.slug
    const provider = selectedHasCodexSubscriptionCatalog ? 'openai-codex' : 'xai'
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
  }, [selectedConnection?.slug, selectedHasMediaCatalog, selectedHasCodexSubscriptionCatalog, mediaRefreshVersion])
  const allSelectedModelOptions = useMemo(
    () => getModelOptionsForConnection(selectedConnection),
    [selectedConnection],
  )
  const [modelQuery, setModelQuery] = useState('')
  const selectedModelOptions = useMemo(() => {
    const query = modelQuery.trim().toLowerCase()
    if (!query) return allSelectedModelOptions
    return allSelectedModelOptions.filter(option =>
      `${option.label} ${option.value} ${option.description}`.toLowerCase().includes(query),
    )
  }, [allSelectedModelOptions, modelQuery])
  useEffect(() => {
    setModelQuery('')
  }, [selectedConnection?.slug])
  const selectedCanRefreshModels = !!selectedConnection && !isCompatProvider(selectedConnection.providerType)
    && (selectedConnection.modelSelectionMode !== 'userDefined3Tier'
      || selectedConnection.piAuthProvider === 'github-copilot'
      || selectedConnection.piAuthProvider === 'xai')

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

  const defaultModel = defaultConnection?.defaultModel ?? ''
  const hasAnthropicApiConnection = llmConnections.some(connection =>
    connection.providerType === 'anthropic' && connection.authType === 'api_key')
  const defaultModelDefinition = getConnectionModelDefinition(defaultConnection, defaultModel)
  const defaultThinkingLevels = getThinkingLevelsForModel(defaultModelDefinition)
  const defaultThinkingUnsupported = defaultModelDefinition?.supportsThinking === false && defaultThinkingLevels.length === 0
  const effectiveDefaultThinking = reconcileThinkingLevelForModel(defaultThinking, defaultModelDefinition)

  // Each connection owns its selected model; changing another connection never changes the default.
  const handleConnectionModelChange = useCallback(async (connection: LlmConnectionWithStatus, model: string) => {
    if (!window.electronAPI) return
    try {
      const result = await window.electronAPI.setLlmConnectionModel(connection.slug, model)
      if (result.success) await refreshLlmConnections()
      else toast.error(result.error?.includes('MODEL_UNAVAILABLE_FOR_CONNECTION')
        ? t('chat.modelUnavailableForConnection') : result.error || t('settings.ai.modelRefreshFailed'))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('settings.ai.modelRefreshFailed'))
    }
  }, [refreshLlmConnections, t])

  const handleDefaultThinkingChange = useCallback(async (level: ThinkingLevel) => {
    if (!window.electronAPI) return

    const previous = defaultThinking
    setDefaultThinking(level)

    try {
      const result = await window.electronAPI.setDefaultThinkingLevel(level)
      if (!result.success) {
        console.error('Failed to set default thinking level:', result.error)
        setDefaultThinking(previous)
      }
    } catch (error) {
      console.error('Failed to set default thinking level:', error)
      setDefaultThinking(previous)
    }
  }, [defaultThinking])

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

  // Refresh callback for workspace cards
  const handleWorkspaceSettingsChange = useCallback(() => {
    // Refresh context so changes propagate immediately
    refreshLlmConnections?.()
  }, [refreshLlmConnections])

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 min-h-0 mask-fade-y">
        <ScrollArea className="h-full">
          <div className="px-5 py-7 max-w-3xl mx-auto">
            <header className="mb-3 px-1">
              <h1 className="text-base font-semibold">{t('settings.ai.title')}</h1>
              <p className="mt-1 text-sm text-muted-foreground">{t('settings.ai.description')}</p>
            </header>
            {/* Credential Health Warning Banner */}
            <CredentialHealthBanner
              issues={credentialHealthIssues}
              onReauthenticate={handleReauthenticate}
            />

            <div className="space-y-8">
              <div className="overflow-hidden rounded-[12px] border border-border/60 bg-background shadow-minimal">
                  <div className="flex flex-col md:max-h-[min(65dvh,40rem)] md:flex-row">
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
                            aria-current={!showApiSetup && !showProviderCatalog && selectedConnection?.slug === conn.slug ? 'page' : undefined}
                            className={cn(
                              'flex w-full min-w-0 items-center gap-2 rounded-lg px-2.5 py-2.5 text-left text-[13px] outline-none transition-colors',
                              'hover:bg-foreground/[0.05] focus-visible:ring-1 focus-visible:ring-ring',
                              !showApiSetup && !showProviderCatalog && selectedConnection?.slug === conn.slug && 'bg-background shadow-minimal',
                            )}
                          >
                            <ConnectionIcon connection={conn} size={18} />
                            <span className="min-w-0 flex-1 truncate font-medium">{conn.name}</span>
                            <span
                              className={cn('size-1.5 shrink-0 rounded-full', conn.isAuthenticated ? 'bg-success' : 'bg-foreground/20')}
                              aria-label={conn.isAuthenticated ? t('settings.ai.connected') : t('settings.ai.notAuthenticated')}
                            />
                          </button>
                        ))}
                        {sortedConnections.length === 0 && (
                          <p className="px-2 py-3 text-xs leading-5 text-muted-foreground">{t('settings.ai.noConnections')}</p>
                        )}
                      </nav>
                      <div className="border-t border-border/60 p-2">
                        <Button size="sm" variant="outline" onClick={handleOpenProviderCatalog} className="w-full justify-start gap-2" aria-label={t('settings.ai.addConnection')}>
                          <Plus className="h-4 w-4" />
                          {t('settings.ai.addConnection')}
                        </Button>
                      </div>
                    </aside>

                    <section className="min-w-0 flex-1 md:min-h-0 md:overflow-y-auto">
                      {showProviderCatalog || (!showApiSetup && !selectedConnection) ? (
                        <ProviderCatalog onSelect={handleAddConnection} />
                      ) : showApiSetup ? (
                        <div className="max-w-2xl space-y-4 p-5">
                          <div className="flex justify-end">
                            <button type="button" onClick={handleCloseApiSetup} aria-label={t('common.close')} className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-foreground/[0.05] hover:text-foreground focus-visible:ring-1 focus-visible:ring-ring">
                              <X className="h-4 w-4" />
                            </button>
                          </div>
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
                                initialValues={editInitialValues}
                              />
                              <div className="flex justify-end gap-2">
                                <Button variant="outline" size="sm" onClick={handleCloseApiSetup}>{t('common.cancel')}</Button>
                                <Button size="sm" type="submit" form="api-key-form" disabled={apiSetupOnboarding.state.credentialStatus === 'validating'}>
                                  {t(apiSetupOnboarding.state.credentialStatus === 'validating' ? 'common.validating' : 'common.save')}
                                </Button>
                              </div>
                            </>
                          ) : apiSetupOnboarding.state.step === 'credentials' && apiSetupOnboarding.state.apiSetupMethod ? (
                            <CredentialsStep
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
                              onSubmit={apiSetupOnboarding.handleSubmitLocalModel}
                              onBack={handleOpenProviderCatalog}
                              status={apiSetupOnboarding.state.credentialStatus === 'validating' ? 'validating' : apiSetupOnboarding.state.credentialStatus === 'error' ? 'error' : 'idle'}
                              errorMessage={apiSetupOnboarding.state.errorMessage}
                            />
                          ) : null}
                        </div>
                      ) : selectedConnection ? (
                        <div className="min-w-0">
                          <ConnectionRow
                            connection={selectedConnection}
                            isLastConnection={llmConnections.length <= 1}
                            onRenameClick={() => handleRenameClick(selectedConnection)}
                            onDelete={() => handleDeleteConnection(selectedConnection.slug)}
                            onSetDefault={() => handleSetDefaultConnection(selectedConnection.slug)}
                            onValidate={() => handleValidateConnection(selectedConnection.slug)}
                            onReauthenticate={() => handleReauthenticateConnection(selectedConnection)}
                            onEdit={() => handleEditConnection(selectedConnection)}
                            onSetMidStreamBehavior={(behavior) => handleSetMidStreamBehavior(selectedConnection, behavior)}
                            validationState={validationStates[selectedConnection.slug]?.state || 'idle'}
                            validationError={validationStates[selectedConnection.slug]?.error}
                            isDuplicateAccount={!!selectedConnection.oauthAccountUuid && duplicateAccountUuids.has(selectedConnection.oauthAccountUuid)}
                          />

                          {selectedConnection.providerType === 'pi' && selectedConnection.piAuthProvider === 'xai' && selectedConnection.authType === 'oauth'
                            && <GrokSubscriptionUsage key={selectedConnection.slug} connectionSlug={selectedConnection.slug} />}

                          <div className="border-t border-border/60">
                            <div className="flex flex-wrap items-end justify-between gap-3 px-5 py-4">
                              <div>
                                <h3 className="text-sm font-semibold">{t('settings.ai.modelList')}</h3>
                                <p className="mt-0.5 text-xs text-muted-foreground">{t('settings.ai.modelDesc')}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="relative w-44">
                                  <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                                  <Input
                                    value={modelQuery}
                                    onChange={(event) => setModelQuery(event.target.value)}
                                    placeholder={t('common.search')}
                                    aria-label={t('common.search')}
                                    className="h-8 rounded-lg pl-8 pr-2 text-xs"
                                  />
                                </div>
                                {selectedCanRefreshModels && <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleRefreshModels(selectedConnection.slug)}
                                  disabled={refreshingModelSlug !== null}
                                  aria-label={t('settings.ai.refreshModels')}
                                >
                                  <RefreshCcw className={cn('size-3.5', refreshingModelSlug === selectedConnection.slug && 'animate-spin')} />
                                  <span className="hidden sm:inline">{t(refreshingModelSlug === selectedConnection.slug ? 'settings.ai.refreshingModels' : 'settings.ai.refreshModels')}</span>
                                </Button>}
                              </div>
                            </div>
                            {selectedModelOptions.length > 0 ? (
                              <div className="border-t border-border/60">
                                {selectedModelOptions.map(option => {
                                  const definition = getConnectionModelDefinition(selectedConnection, option.value)
                                  const thinkingLevels = getThinkingLevelsForModel(definition)
                                  const isDefault = option.value === selectedConnection.defaultModel
                                  return (
                                    <button
                                      key={option.value}
                                      type="button"
                                      onClick={() => { if (!isDefault) handleConnectionModelChange(selectedConnection, option.value) }}
                                      aria-current={isDefault ? 'true' : undefined}
                                      className="flex w-full items-center gap-3 border-b border-border/60 px-5 py-3.5 text-left transition-colors last:border-b-0 hover:bg-foreground/[0.035] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ring"
                                    >
                                      <span className={cn('flex size-6 shrink-0 items-center justify-center rounded-full border', isDefault ? 'border-foreground bg-foreground text-background' : 'border-border text-transparent')}>
                                        <Check className="size-3.5" />
                                      </span>
                                      <span className="min-w-0 flex-1">
                                        <span className="block truncate text-sm font-medium">{option.label}</span>
                                        <span className="mt-0.5 block truncate text-xs text-muted-foreground">{option.label !== option.value ? option.value : (option.descriptionKey ? t(option.descriptionKey) : option.description)}</span>
                                      </span>
                                      <span className="flex shrink-0 items-center gap-1.5 text-[11px] text-muted-foreground">
                                        {definition?.contextWindow ? <span className="inline-flex items-center gap-1 rounded-md bg-foreground/[0.05] px-1.5 py-1" title={t('chat.contextUsage.contextWindow')}><Gauge className="size-3" />{formatTokenCount(definition.contextWindow)}</span> : null}
                                        {thinkingLevels.length > 0 && <span className="inline-flex items-center gap-1 rounded-md bg-foreground/[0.05] px-1.5 py-1"><Brain className="size-3" />{t('settings.ai.thinking')}</span>}
                                      </span>
                                    </button>
                                  )
                                })}
                              </div>
                            ) : (
                              <p className="border-t border-border/60 px-5 py-4 text-sm text-muted-foreground">{t('settings.ai.noModels')}</p>
                            )}
                            {selectedConnection.isDefault && (
                              <div className="border-t border-border/60 px-5 py-1">
                                <SettingsMenuSelectRow
                                  label={t('settings.ai.thinking')}
                                  description={defaultThinkingUnsupported ? t('thinking.notSupported') :
                                    defaultThinkingLevels.length === 0 ? t('common.unavailable') : t('settings.ai.thinkingDesc')}
                                  value={defaultThinkingUnsupported ? 'unavailable' :
                                    defaultThinkingLevels.length === 0 ? defaultThinking : effectiveDefaultThinking}
                                  onValueChange={(value) => handleDefaultThinkingChange(value as ThinkingLevel)}
                                  disabled={defaultThinkingLevels.length === 0}
                                  options={defaultThinkingUnsupported ? [
                                    { value: 'unavailable', label: t('thinking.notSupported') },
                                  ] : defaultThinkingLevels.length === 0 ? [
                                    { value: defaultThinking, label: t(getThinkingLevelNameKey(defaultThinking)) },
                                  ] : defaultThinkingLevels.map(({ id, nameKey, descriptionKey }) => ({
                                    value: id, label: t(nameKey), description: t(descriptionKey),
                                  }))}
                                />
                              </div>
                            )}
                          </div>
                          {selectedHasMediaCatalog && (
                            <div className="border-t border-border/60 px-5 py-4">
                              <h3 className="text-sm font-semibold">{t('settings.ai.mediaModels')}</h3>
                              <p className="mt-0.5 text-xs text-muted-foreground">{t(selectedHasCodexSubscriptionCatalog ? 'settings.ai.mediaModelsCodexDesc' : 'settings.ai.mediaModelsDesc')}</p>
                              {mediaCatalog?.slug === selectedConnection.slug ? (
                                <>
                                  {mediaCatalog.status !== 'available' && <p className="mt-3 text-xs text-muted-foreground">
                                    {t(mediaCatalog.status === 'documented' ? 'settings.ai.mediaModelsCodexUnverified' :
                                      mediaCatalog.status === 'partial' ? 'settings.ai.mediaModelsPartial' : 'settings.ai.mediaModelsUnavailable')}
                                  </p>}
                                  {(['image', 'video'] as const).map(kind => {
                                    const rows = mediaCatalog.models.filter(model => model.kind === kind
                                      && `${model.name} ${model.id}`.toLowerCase().includes(modelQuery.trim().toLowerCase()))
                                    if (!rows.length) return null
                                    return <div key={kind} className="mt-4">
                                      <h4 className="mb-1 text-xs font-medium text-muted-foreground">{t(kind === 'image' ? 'settings.ai.mediaImageModels' : 'settings.ai.mediaVideoModels')}</h4>
                                      {rows.map(model => <div key={`${kind}:${model.id}`} className="border-b border-border/60 py-2 last:border-b-0">
                                        <span className="block truncate text-sm font-medium">{model.name}</span>
                                        {model.name !== model.id && <span className="block truncate text-xs text-muted-foreground">{model.id}</span>}
                                      </div>)}
                                    </div>
                                  })}
                                  {mediaCatalog.status === 'available' && !mediaCatalog.models.length && <p className="mt-3 text-xs text-muted-foreground">{t('settings.ai.mediaModelsEmpty')}</p>}
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

              {workspaces.length > 0 && llmConnections.length > 0 && (
                <SettingsSection title={t('settings.ai.workspaceOverrides')} description={t('settings.ai.workspaceOverridesDesc')}>
                  <div className="space-y-2">
                    {workspaces.map((workspace) => (
                      <WorkspaceOverrideCard key={workspace.id} workspace={workspace} llmConnections={llmConnections} onSettingsChange={handleWorkspaceSettingsChange} />
                    ))}
                  </div>
                </SettingsSection>
              )}

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

              {/* Rename Connection Dialog */}
              <RenameDialog
                open={renameDialogOpen}
                onOpenChange={setRenameDialogOpen}
                title={t("settings.ai.renameConnection")}
                value={renameValue}
                onValueChange={setRenameValue}
                onSubmit={handleRenameSubmit}
                placeholder={t("settings.ai.enterConnectionName")}
              />
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
