/**
 * ApiKeyInput - Reusable API key entry form control
 *
 * Renders a password input for the API key, a preset selector for Base URL,
 * and an optional Model override field.
 *
 * Does NOT include layout wrappers or action buttons — the parent
 * controls placement via the form ID ("api-key-form") for submit binding.
 *
 * Used in: Onboarding CredentialsStep, Settings API dialog
 */

import { useState, useEffect, useCallback, useRef } from "react"
import { useTranslation } from "react-i18next"
import { Command as CommandPrimitive } from "cmdk"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  StyledDropdownMenuContent,
  StyledDropdownMenuItem,
} from "@/components/ui/styled-dropdown"
import { cn } from "@/lib/utils"
import { Check, ChevronDown, Eye, EyeOff, Loader2 } from "lucide-react"
import { baseUrlForPiPreset, initialBaseUrlForPreset, resolvePreferredModel, type PiModelInfo } from "./provider-models"
import {
  resolveCustomEndpointPayload,
  resolvePiAuthProviderForSubmit,
  resolvePresetStateForBaseUrlChange,
  type PresetKey,
} from "./submit-helpers"

import type { CustomEndpointApi, CustomEndpointConfig } from '@config/llm-connections'

export type ApiKeyStatus = 'idle' | 'validating' | 'success' | 'error'

export type { CustomEndpointApi }

export interface ApiKeySubmitData {
  apiKey: string
  baseUrl?: string
  connectionDefaultModel?: string
  models?: string[]
  piAuthProvider?: string
  modelSelectionMode?: 'automaticallySyncedFromProvider' | 'userDefined3Tier'
  /** Custom endpoint protocol — set when user configures an arbitrary API endpoint */
  customEndpoint?: CustomEndpointConfig
  /** IAM credentials for Pi+Bedrock (piAuthProvider='amazon-bedrock') setup */
  iamCredentials?: {
    accessKeyId: string
    secretAccessKey: string
    sessionToken?: string
  }
  /** AWS region for Pi+Bedrock */
  awsRegion?: string
  /** Bedrock authentication method — determines auth type for Pi+Bedrock connections */
  bedrockAuthMethod?: 'iam_credentials' | 'environment'
}

export interface ApiKeyInputProps {
  /** Current validation status */
  status: ApiKeyStatus
  /** Error message to display when status is 'error' */
  errorMessage?: string
  /** Called when the form is submitted with the key and optional endpoint config */
  onSubmit: (data: ApiKeySubmitData) => void
  /** Form ID for external submit button binding (default: "api-key-form") */
  formId?: string
  /** Disable the input (e.g. during validation) */
  disabled?: boolean
  /** Provider type determines which presets and placeholders to show */
  providerType?: 'anthropic' | 'openai' | 'pi' | 'google' | 'pi_api_key'
  /** Settings already chose the provider in its catalog; keep one selection owner. */
  providerLocked?: boolean
  /** Pre-fill values when editing an existing connection */
  initialValues?: {
    connectionSlug?: string
    apiKey?: string
    baseUrl?: string
    connectionDefaultModel?: string
    activePreset?: string
    models?: string[]
    /** Pre-fill the protocol toggle for custom endpoints */
    customApi?: CustomEndpointApi
  }
}

export interface ApiKeyProviderPreset {
  key: PresetKey
  label: string
  url: string
  placeholder?: string
  /** Requires the Pi SDK for authentication (e.g. OpenAI-compatible-only endpoint) — hidden in Anthropic API Key mode. */
  piOnly?: boolean
}

// Anthropic provider presets - for Claude Code backend
// Also used by Pi API key flow (same providers, routed via Pi SDK)
export const API_KEY_PROVIDER_PRESETS: readonly ApiKeyProviderPreset[] = [
  { key: 'anthropic', label: 'Anthropic', url: 'https://api.anthropic.com', placeholder: 'sk-ant-...' },
  { key: 'openai', label: 'OpenAI', url: 'https://api.openai.com/v1', placeholder: 'sk-...' },
  { key: 'openai-eu', label: 'OpenAI EU', url: 'https://eu.api.openai.com/v1', placeholder: 'sk-...' },
  { key: 'openai-us', label: 'OpenAI US', url: 'https://us.api.openai.com/v1', placeholder: 'sk-...' },
  { key: 'google', label: 'Google AI Studio', url: 'https://generativelanguage.googleapis.com/v1beta', placeholder: 'AIza...' },
  { key: 'openrouter', label: 'OpenRouter', url: 'https://openrouter.ai/api/v1', placeholder: 'sk-or-...' },
  { key: 'azure-openai-responses', label: 'Azure OpenAI', url: '', placeholder: 'Paste your key here...' },
  { key: 'amazon-bedrock', label: 'Amazon Bedrock', url: 'https://bedrock-runtime.us-east-1.amazonaws.com', placeholder: 'AKIA...' },
  { key: 'groq', label: 'Groq', url: 'https://api.groq.com/openai/v1', placeholder: 'gsk_...' },
  { key: 'mistral', label: 'Mistral', url: 'https://api.mistral.ai/v1', placeholder: 'Paste your key here...' },
  { key: 'deepseek', label: 'DeepSeek', url: 'https://api.deepseek.com', placeholder: 'sk-...' },
  { key: 'xai', label: 'xAI (Grok)', url: 'https://api.x.ai/v1', placeholder: 'xai-...' },
  { key: 'cerebras', label: 'Cerebras', url: 'https://api.cerebras.ai/v1', placeholder: 'csk-...' },
  { key: 'zai', label: 'z.ai (GLM)', url: 'https://api.z.ai/api/coding/paas/v4', placeholder: 'Paste your key here...' },
  { key: 'huggingface', label: 'Hugging Face', url: 'https://router.huggingface.co/v1', placeholder: 'hf_...' },
  { key: 'minimax-global', label: 'Minimax Global', url: 'https://api.minimax.io/anthropic', placeholder: 'Paste your key here...', piOnly: true },
  { key: 'minimax-cn', label: 'Minimax CN', url: 'https://api.minimaxi.com/anthropic', placeholder: 'Paste your key here...', piOnly: true },
  { key: 'kimi-coding', label: 'Kimi (Coding)', url: 'https://api.kimi.com/coding', placeholder: 'sk-kimi-...' },
  { key: 'moonshotai', label: 'Moonshot AI', url: 'https://api.moonshot.ai/v1', placeholder: 'sk-...', piOnly: true },
  { key: 'moonshotai-cn', label: 'Moonshot AI (CN)', url: 'https://api.moonshot.cn/v1', placeholder: 'sk-...', piOnly: true },
  { key: 'vercel-ai-gateway', label: 'Vercel AI Gateway', url: 'https://ai-gateway.vercel.sh', placeholder: 'Paste your key here...' },
  { key: 'manifest', label: 'Manifest', url: 'https://app.manifest.build/v1', placeholder: 'mnfst_...' },
  { key: 'custom', label: 'Custom', url: '', placeholder: 'Paste your key here...' },
]

/**
 * Presets without a Pi SDK provider entry that nonetheless expose a known
 * OpenAI-compatible protocol. They behave like 'custom' on submit (customEndpoint
 * gets pinned to openai-completions) but stay branded in the dropdown.
 */
const OPENAI_COMPAT_CUSTOM_URL_PRESETS: ReadonlySet<string> = new Set(['manifest'])

// OpenAI provider presets - for Codex backend
// Only direct OpenAI is supported; 3PP providers (OpenRouter, Vercel, Ollama) should be
// configured via the Anthropic/Claude connection which routes through the Claude Agent SDK.
const OPENAI_PRESETS: ApiKeyProviderPreset[] = [
  { key: 'openai', label: 'OpenAI', url: '' },
]

// Pi provider presets - unified API for 20+ LLM providers
const PI_PRESETS: ApiKeyProviderPreset[] = [
  { key: 'pi', label: 'Craft Agents Backend (Direct)', url: '' },
  { key: 'openrouter', label: 'OpenRouter', url: 'https://openrouter.ai/api' },
  { key: 'custom', label: 'Custom', url: '' },
]

// Google AI Studio preset - single endpoint, no custom URL needed
const GOOGLE_PRESETS: ApiKeyProviderPreset[] = [
  { key: 'google', label: 'Google AI Studio', url: '' },
]

const COMPAT_ANTHROPIC_DEFAULTS = 'claude-opus-4-8, claude-opus-4-7, claude-sonnet-4-6, claude-haiku-4-5'
const COMPAT_OPENAI_DEFAULTS = 'openai/gpt-5.2-codex, openai/gpt-5.1-codex-mini'
const COMPAT_MINIMAX_DEFAULTS = 'MiniMax-M2.5, MiniMax-M2.5-highspeed'
const COMPAT_KIMI_DEFAULTS = 'k3, kimi-for-coding, kimi-for-coding-highspeed'

function getPresetsForProvider(providerType: 'anthropic' | 'openai' | 'pi' | 'google' | 'pi_api_key'): readonly ApiKeyProviderPreset[] {
  if (providerType === 'pi_api_key') return API_KEY_PROVIDER_PRESETS
  if (providerType === 'google') return GOOGLE_PRESETS
  if (providerType === 'pi') return PI_PRESETS
  if (providerType === 'openai') return OPENAI_PRESETS
  // Anthropic mode: exclude presets that only work via Pi SDK
  return API_KEY_PROVIDER_PRESETS.filter(p => !p.piOnly)
}

function getPresetForUrl(url: string, presets: readonly ApiKeyProviderPreset[]): PresetKey {
  const match = presets.find(p => p.key !== 'custom' && p.url === url)
  return match?.key ?? 'custom'
}

function parseModelList(value: string): string[] {
  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
}

// ============================================================
// Pi model tier selection (for providers with many models)
// ============================================================

export function ApiKeyInput({
  status,
  errorMessage,
  onSubmit,
  formId = "api-key-form",
  disabled,
  providerType = 'anthropic',
  providerLocked = false,
  initialValues,
}: ApiKeyInputProps) {
  // Get presets based on provider type
  const presets = getPresetsForProvider(providerType)
  const defaultPreset = presets[0]

  // Compute initial preset: explicit (Pi piAuthProvider), derived from URL, or default
  const initialPreset = initialValues?.activePreset
    ?? (initialValues?.baseUrl ? getPresetForUrl(initialValues.baseUrl, presets) : defaultPreset.key)

  const { t, i18n } = useTranslation()
  const [apiKey, setApiKey] = useState(initialValues?.apiKey ?? '')
  const [showValue, setShowValue] = useState(false)
  const [baseUrl, setBaseUrl] = useState(initialBaseUrlForPreset(initialPreset, presets, initialValues?.baseUrl))
  const [activePreset, setActivePreset] = useState<PresetKey>(initialPreset)
  const [lastNonCustomPreset, setLastNonCustomPreset] = useState<PresetKey | null>(
    initialPreset !== 'custom' ? initialPreset : defaultPreset.key
  )
  const [connectionDefaultModel, setConnectionDefaultModel] = useState(initialValues?.connectionDefaultModel ?? '')
  const [customApi, setCustomApi] = useState<CustomEndpointApi>(initialValues?.customApi ?? 'openai-completions')
  const [modelError, setModelError] = useState<string | null>(null)

  // Bedrock auth state
  const [bedrockAuthMethod, setBedrockAuthMethod] = useState<'iam_credentials' | 'environment'>('iam_credentials')
  const [awsAccessKeyId, setAwsAccessKeyId] = useState('')
  const [awsSecretAccessKey, setAwsSecretAccessKey] = useState('')
  const [awsSessionToken, setAwsSessionToken] = useState('')
  const [awsRegion, setAwsRegion] = useState('us-east-1')

  // One optional default choice; available models remain provider-managed.
  const [piModels, setPiModels] = useState<PiModelInfo[]>([])
  const [piModelsLoading, setPiModelsLoading] = useState(initialPreset === 'xai')
  const [piCatalogSource, setPiCatalogSource] = useState<'provider' | 'sdk'>('sdk')
  const [piCatalogError, setPiCatalogError] = useState<string | null>(null)
  const [selectedModel, setSelectedModel] = useState('')
  const [openModelPicker, setOpenModelPicker] = useState(false)
  const [modelFilter, setModelFilter] = useState('')
  const modelFilterInputRef = useRef<HTMLInputElement>(null)
  const hydratedModelProviderRef = useRef<string | null>(null)
  const modelRequestIdRef = useRef(0)

  const isDisabled = disabled || status === 'validating'

  const isPiApiKeyFlow = providerType === 'pi_api_key'
  const isBedrock = activePreset === 'amazon-bedrock'
  // Hide endpoint/model fields for providers with well-known endpoints handled by the SDK
  const DEFAULT_ENDPOINT_PROVIDERS = new Set(['anthropic', 'openai', 'pi', 'google'])
  const isDefaultProviderPreset = DEFAULT_ENDPOINT_PROVIDERS.has(activePreset)

  // Provider-specific placeholders from the active preset
  const activePresetObj = presets.find(p => p.key === activePreset)
  const apiKeyPlaceholder = activePresetObj?.placeholder
    ?? (providerType === 'google' ? 'AIza...'
    : providerType === 'pi' ? 'pi-...'
    : providerType === 'openai' ? 'sk-...'
    : 'Paste your key here...')

  // Fetch Pi SDK models when a provider is selected in pi_api_key flow.
  // Returns SDK seeds for the optional default picker. The stored connection
  // refreshes account membership after credentials are saved.
  const loadPiModels = useCallback(async (provider: string) => {
    const requestId = ++modelRequestIdRef.current
    if (!isPiApiKeyFlow || !provider || provider === 'custom' || DEFAULT_ENDPOINT_PROVIDERS.has(provider) || OPENAI_COMPAT_CUSTOM_URL_PRESETS.has(provider)) {
      setPiModels([])
      setPiCatalogError(null)
      return
    }
    setPiModelsLoading(true)
    try {
      const liveKey = provider === 'xai' && apiKey.trim() && !apiKey.includes('••')
        ? apiKey.trim()
        : undefined
      const storedConnectionSlug = provider === 'xai' && !liveKey && provider === initialPreset
        ? initialValues?.connectionSlug
        : undefined
      const result = await window.electronAPI.getPiProviderModels(provider, liveKey, storedConnectionSlug)
      if (requestId !== modelRequestIdRef.current) return
      setPiModels(result.models)
      setPiCatalogSource(result.source ?? 'sdk')
      setPiCatalogError(result.error ?? null)

      if (hydratedModelProviderRef.current !== provider) {
        const savedDefault = provider === initialPreset ? initialValues?.connectionDefaultModel : undefined
        setSelectedModel(resolvePreferredModel(
          result.models,
          result.source === 'provider' && savedDefault && !result.models.some(model => model.id === savedDefault)
            ? undefined
            : savedDefault,
        ))
        hydratedModelProviderRef.current = provider
      } else if (result.source === 'provider') {
        // A new API key can expose a different account catalog. Keep a
        // selected model only while the current account still offers it.
        setSelectedModel(previous => previous && result.models.some(model => model.id === previous)
          ? previous
          : '')
      }
    } catch (err) {
      if (requestId !== modelRequestIdRef.current) return
      console.error('[ApiKeyInput] Failed to load models for', provider, err)
      setPiModels([])
      setPiCatalogError(err instanceof Error ? err.message : String(err))
    } finally {
      if (requestId === modelRequestIdRef.current) setPiModelsLoading(false)
    }
  }, [isPiApiKeyFlow, apiKey, initialPreset, initialValues?.connectionDefaultModel, initialValues?.connectionSlug])

  useEffect(() => {
    if (isPiApiKeyFlow && activePreset !== 'custom' && !DEFAULT_ENDPOINT_PROVIDERS.has(activePreset) && !isBedrock) {
      setPiModelsLoading(true)
    }
    const timer = setTimeout(() => { void loadPiModels(activePreset) }, activePreset === 'xai' ? 350 : 0)
    return () => { clearTimeout(timer); modelRequestIdRef.current++ }
  }, [activePreset, isBedrock, isPiApiKeyFlow, loadPiModels])

  // Whether to show the provider-model picker instead of a custom ID field.
  const hasPiModels = isPiApiKeyFlow && piModels.length > 0 && !isDefaultProviderPreset && activePreset !== 'custom' && !isBedrock
  const showPiCatalog = hasPiModels || (isPiApiKeyFlow && (activePreset === 'xai' || piModelsLoading))

  useEffect(() => {
    if (!openModelPicker) return
    const timer = setTimeout(() => modelFilterInputRef.current?.focus(), 0)
    return () => clearTimeout(timer)
  }, [openModelPicker])

  const handlePresetSelect = (preset: ApiKeyProviderPreset) => {
    setActivePreset(preset.key)
    if (preset.key !== 'custom') {
      setLastNonCustomPreset(preset.key)
    }
    if (preset.key === 'custom') {
      setBaseUrl('')
    } else {
      setBaseUrl(preset.url)
    }
    setModelError(null)
    // Pre-fill recommended model for Ollama; clear for all others
    // (Default provider presets hide the field entirely, others default to provider model IDs when empty)
    if (preset.key === 'ollama') {
      setConnectionDefaultModel('qwen3-coder')
    } else if (preset.key === 'openrouter' || preset.key === 'vercel-ai-gateway') {
      setConnectionDefaultModel(providerType === 'openai' ? COMPAT_OPENAI_DEFAULTS : COMPAT_ANTHROPIC_DEFAULTS)
    } else if (preset.key === 'minimax-global' || preset.key === 'minimax-cn') {
      setConnectionDefaultModel(COMPAT_MINIMAX_DEFAULTS)
    } else if (preset.key === 'kimi-coding') {
      setConnectionDefaultModel(COMPAT_KIMI_DEFAULTS)
    } else if (preset.key === 'manifest') {
      setConnectionDefaultModel('auto')
    } else if (preset.key === 'custom' || OPENAI_COMPAT_CUSTOM_URL_PRESETS.has(preset.key)) {
      setConnectionDefaultModel(providerType === 'openai' ? COMPAT_OPENAI_DEFAULTS : COMPAT_ANTHROPIC_DEFAULTS)
    } else {
      setConnectionDefaultModel('')
    }
  }

  const handleBaseUrlChange = (value: string) => {
    setBaseUrl(value)
    const presetKey = getPresetForUrl(value, presets)
    const currentPresetObj = presets.find(p => p.key === activePreset)
    const nextPresetState = resolvePresetStateForBaseUrlChange({
      matchedPreset: presetKey,
      activePreset,
      activePresetHasEmptyUrl: currentPresetObj?.url === '',
      lastNonCustomPreset,
    })
    setActivePreset(nextPresetState.activePreset)
    setLastNonCustomPreset(nextPresetState.lastNonCustomPreset)
    setModelError(null)
    if (!connectionDefaultModel.trim()) {
      if (presetKey === 'ollama') {
        setConnectionDefaultModel('qwen3-coder')
      } else if (presetKey === 'manifest') {
        setConnectionDefaultModel('auto')
      } else if (presetKey === 'minimax-global' || presetKey === 'minimax-cn') {
        setConnectionDefaultModel(COMPAT_MINIMAX_DEFAULTS)
      } else if (presetKey === 'kimi-coding') {
        setConnectionDefaultModel(COMPAT_KIMI_DEFAULTS)
      } else if (presetKey === 'openrouter' || presetKey === 'vercel-ai-gateway' || presetKey === 'custom') {
        setConnectionDefaultModel(providerType === 'openai' ? COMPAT_OPENAI_DEFAULTS : COMPAT_ANTHROPIC_DEFAULTS)
      }
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const effectivePiAuthProvider = isPiApiKeyFlow
      ? resolvePiAuthProviderForSubmit(activePreset, lastNonCustomPreset)
      : undefined

    // Pi API key flow: keep a single optional default, then sync the full
    // account catalog. Price does not imply model capability or speed.
    if (hasPiModels || (isPiApiKeyFlow && activePreset === 'xai')) {
      onSubmit({
        apiKey: apiKey.trim(),
        // The xAI preset uses Pi's native endpoint. Sending the visible
        // official URL as a custom baseUrl bypasses account discovery in the
        // setup handler and turns the connection into an unverified preset.
        baseUrl: baseUrlForPiPreset(activePreset, baseUrl),
        connectionDefaultModel: selectedModel || undefined,
        piAuthProvider: effectivePiAuthProvider,
        modelSelectionMode: 'automaticallySyncedFromProvider',
      })
      return
    }

    // Bedrock — routes through Pi SDK with piAuthProvider='amazon-bedrock'.
    // Submit with auth method and optional IAM credentials.
    if (isBedrock) {
      if (bedrockAuthMethod === 'iam_credentials' && !awsAccessKeyId.trim()) {
        setModelError(t('apiSetup.errors.accessKeyIdRequired'))
        return
      }
      if (bedrockAuthMethod === 'iam_credentials' && !awsSecretAccessKey.trim()) {
        setModelError(t('apiSetup.errors.secretAccessKeyRequired'))
        return
      }
      const parsedModels = parseModelList(connectionDefaultModel)
      onSubmit({
        apiKey: '',
        piAuthProvider: effectivePiAuthProvider,
        bedrockAuthMethod,
        awsRegion: awsRegion.trim() || 'us-east-1',
        ...(bedrockAuthMethod === 'iam_credentials' ? {
          iamCredentials: {
            accessKeyId: awsAccessKeyId.trim(),
            secretAccessKey: awsSecretAccessKey.trim(),
            ...(awsSessionToken.trim() ? { sessionToken: awsSessionToken.trim() } : {}),
          },
        } : {}),
        connectionDefaultModel: parsedModels[0],
        models: parsedModels.length > 0 ? parsedModels : undefined,
      })
      return
    }

    const effectiveBaseUrl = baseUrl.trim()

    const parsedModels = parseModelList(connectionDefaultModel)

    const isUsingDefaultEndpoint = isDefaultProviderPreset || !effectiveBaseUrl
    const requiresModel = !isDefaultProviderPreset && !!effectiveBaseUrl
    if (requiresModel && parsedModels.length === 0) {
      setModelError(t('apiSetup.errors.defaultModelRequired'))
      return
    }

    // Include custom endpoint protocol when user configured a custom base URL.
    // Branded openai-compat presets (e.g. Manifest) are pinned to openai-completions
    // and routed via the Pi SDK's openai adapter.
    const { customEndpoint, piAuthProvider: resolvedPiAuthProvider } = resolveCustomEndpointPayload({
      activePreset,
      baseUrl: effectiveBaseUrl,
      customApi,
      brandedOpenAiCompatPresets: OPENAI_COMPAT_CUSTOM_URL_PRESETS,
      fallbackPiAuthProvider: effectivePiAuthProvider,
    })

    onSubmit({
      apiKey: apiKey.trim(),
      baseUrl: isUsingDefaultEndpoint ? undefined : effectiveBaseUrl,
      connectionDefaultModel: parsedModels[0],
      models: parsedModels.length > 0 ? parsedModels : undefined,
      piAuthProvider: resolvedPiAuthProvider,
      modelSelectionMode: isPiApiKeyFlow
        ? (parsedModels.length > 0 ? 'userDefined3Tier' : 'automaticallySyncedFromProvider')
        : undefined,
      customEndpoint,
    })
  }

  return (
    <form id={formId} onSubmit={handleSubmit} className="space-y-6">
      {/* Pick the provider before asking for its credentials. The same preset
          selector also drives the endpoint and model fields below. */}
      {presets.length > 1 && !providerLocked && (
        <div className="flex items-center justify-between">
          <Label>{t('apiSetup.provider')}</Label>
          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label={t('apiSetup.provider')}
              autoFocus={isPiApiKeyFlow}
              disabled={isDisabled}
              className="flex h-6 items-center gap-1 rounded-[6px] bg-background shadow-minimal pl-2.5 pr-2 text-[12px] font-medium text-foreground/50 hover:bg-foreground/5 hover:text-foreground focus:outline-none"
            >
              {presets.find(p => p.key === activePreset)?.label}
              <ChevronDown className="size-2.5 opacity-50" />
            </DropdownMenuTrigger>
            <StyledDropdownMenuContent align="end" className="z-floating-menu">
              {presets.map((preset) => (
                <StyledDropdownMenuItem
                  key={preset.key}
                  onClick={() => handlePresetSelect(preset)}
                  className="justify-between"
                >
                  {preset.label}
                  <Check className={cn("size-3", activePreset === preset.key ? "opacity-100" : "opacity-0")} />
                </StyledDropdownMenuItem>
              ))}
            </StyledDropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* API Key — hidden for Bedrock (uses IAM/Environment auth) */}
      {!isBedrock && (<div className="space-y-2">
        <Label htmlFor="api-key">{t('apiSetup.apiKey')}</Label>
        <div className={cn(
          "relative rounded-md shadow-minimal transition-colors",
          "bg-foreground-2 focus-within:bg-background"
        )}>
          <Input
            id="api-key"
            type={showValue ? 'text' : 'password'}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={apiKeyPlaceholder}
            className={cn(
              "pr-10 border-0 bg-transparent shadow-none",
              status === 'error' && "focus-visible:ring-destructive"
            )}
            disabled={isDisabled}
            autoFocus={!isPiApiKeyFlow || providerLocked}
          />
          <button
            type="button"
            onClick={() => setShowValue(!showValue)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            tabIndex={-1}
          >
            {showValue ? (
              <EyeOff className="size-4" />
            ) : (
              <Eye className="size-4" />
            )}
          </button>
        </div>
      </div>)}

      {/* A provider-managed endpoint stays hidden; editable addresses have their own field. */}
      {presets.length > 1 && !isDefaultProviderPreset && !isBedrock && (!providerLocked || activePreset === 'custom' || activePreset === 'azure-openai-responses' || Boolean(initialValues?.baseUrl && initialValues.baseUrl !== activePresetObj?.url)) && (
        <div className="space-y-2">
          <Label htmlFor="base-url">{t('apiSetup.endpoint')}</Label>
          <div className={cn(
            "rounded-md shadow-minimal transition-colors",
            "bg-foreground-2 focus-within:bg-background"
          )}>
            <Input
              id="base-url"
              type="text"
              value={baseUrl}
              onChange={(e) => handleBaseUrlChange(e.target.value)}
              placeholder={t('apiSetup.endpointPlaceholder')}
              className="border-0 bg-transparent shadow-none"
              disabled={isDisabled}
            />
          </div>
        </div>
      )}

      {/* Protocol Toggle — visible as soon as Custom preset is selected */}
      {activePreset === 'custom' && !isDefaultProviderPreset && (
        <div className="space-y-2">
          <Label>{t('apiSetup.protocol')}</Label>
          <div className={cn(
            "flex rounded-md shadow-minimal overflow-hidden",
            "bg-foreground-2",
            isDisabled && "opacity-50 pointer-events-none"
          )}>
            {([
              { value: 'openai-completions' as const, label: t('apiSetup.format.openaiCompatible') },
              { value: 'anthropic-messages' as const, label: t('apiSetup.format.anthropicCompatible') },
            ]).map(({ value, label }) => (
              <button
                key={value}
                type="button"
                disabled={isDisabled}
                onClick={() => setCustomApi(value)}
                className={cn(
                  "flex-1 py-1.5 text-[12px] font-medium transition-colors",
                  customApi === value
                    ? "bg-background text-foreground shadow-minimal"
                    : "text-foreground/50 hover:text-foreground/70"
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <p className="text-xs text-foreground/30">
            {t('apiSetup.customProtocolHint')}
          </p>
        </div>
      )}

      {/* Bedrock Auth Section */}
      {isBedrock && (
        <>
          {/* Auth Method Toggle */}
          <div className="space-y-2">
            <Label>{t('apiSetup.authentication')}</Label>
            <div className={cn(
              "flex rounded-md shadow-minimal overflow-hidden",
              "bg-foreground-2",
              isDisabled && "opacity-50 pointer-events-none"
            )}>
              {([
                { value: 'iam_credentials' as const, label: t('apiSetup.credentials.iam') },
                { value: 'environment' as const, label: t('apiSetup.credentials.environment') },
              ]).map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => setBedrockAuthMethod(value)}
                  className={cn(
                    "flex-1 py-1.5 text-[12px] font-medium transition-colors",
                    bedrockAuthMethod === value
                      ? "bg-background text-foreground shadow-minimal"
                      : "text-foreground/50 hover:text-foreground/70"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* IAM Credential Fields */}
          {bedrockAuthMethod === 'iam_credentials' && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="aws-access-key-id" className="text-muted-foreground font-normal text-xs">
                  {t('apiSetup.accessKeyId')}
                </Label>
                <div className={cn("rounded-md shadow-minimal transition-colors", "bg-foreground-2 focus-within:bg-background")}>
                  <Input
                    id="aws-access-key-id"
                    type="text"
                    value={awsAccessKeyId}
                    onChange={(e) => setAwsAccessKeyId(e.target.value)}
                    placeholder="AKIA..."
                    className="border-0 bg-transparent shadow-none"
                    disabled={isDisabled}
                    autoFocus
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="aws-secret-key" className="text-muted-foreground font-normal text-xs">
                  {t('apiSetup.secretAccessKey')}
                </Label>
                <div className={cn("relative rounded-md shadow-minimal transition-colors", "bg-foreground-2 focus-within:bg-background")}>
                  <Input
                    id="aws-secret-key"
                    type={showValue ? 'text' : 'password'}
                    value={awsSecretAccessKey}
                    onChange={(e) => setAwsSecretAccessKey(e.target.value)}
                    placeholder={t("apiSetup.secretAccessKey")}
                    className="pr-10 border-0 bg-transparent shadow-none"
                    disabled={isDisabled}
                  />
                  <button
                    type="button"
                    onClick={() => setShowValue(!showValue)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showValue ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="aws-session-token" className="text-muted-foreground font-normal text-xs">
                  {t('apiSetup.sessionToken')} <span className="text-foreground/30">· {t('apiSetup.optional')}</span>
                </Label>
                <div className={cn("rounded-md shadow-minimal transition-colors", "bg-foreground-2 focus-within:bg-background")}>
                  <Input
                    id="aws-session-token"
                    type="text"
                    value={awsSessionToken}
                    onChange={(e) => setAwsSessionToken(e.target.value)}
                    placeholder={t("apiSetup.temporaryCredentials")}
                    className="border-0 bg-transparent shadow-none"
                    disabled={isDisabled}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Environment info */}
          {bedrockAuthMethod === 'environment' && (
            <div className="rounded-md bg-foreground-2 p-3">
              <p className="text-xs text-foreground/50">
                {t('apiSetup.awsCredentialChain')}
              </p>
            </div>
          )}

          {/* AWS Region */}
          <div className="space-y-1.5">
            <Label htmlFor="aws-region" className="text-muted-foreground font-normal text-xs">
              {t('apiSetup.awsRegion')}
            </Label>
            <div className={cn("rounded-md shadow-minimal transition-colors", "bg-foreground-2 focus-within:bg-background")}>
              <Input
                id="aws-region"
                type="text"
                value={awsRegion}
                onChange={(e) => setAwsRegion(e.target.value)}
                placeholder="us-east-1"
                className="border-0 bg-transparent shadow-none"
                disabled={isDisabled}
              />
            </div>
          </div>
        </>
      )}

      {/* Model Selection — one optional default; account catalog syncs after save */}
      {showPiCatalog ? (
        <div className="space-y-3">
          {piModelsLoading ? (
            <div className="flex items-center gap-2 py-3 text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin" />
              <span className="text-xs">{t("apiSetup.loadingModels")}</span>
            </div>
          ) : piCatalogError ? (
            <p role="alert" className="text-xs text-destructive">{t('apiSetup.catalogUnavailable')}: {piCatalogError}</p>
          ) : (
            <>
              <p className="text-xs text-muted-foreground">
                {t(piCatalogSource === 'provider' ? 'apiSetup.accountCatalog' : 'apiSetup.bundledCatalog')}
              </p>
              <div className="space-y-1.5">
                <Label className="text-muted-foreground font-normal text-xs">{t('apiSetup.defaultModel')}</Label>
                <Popover open={openModelPicker} onOpenChange={(open) => {
                  setOpenModelPicker(open)
                  if (!open) setModelFilter('')
                }}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      disabled={isDisabled}
                      aria-label={t('apiSetup.defaultModel')}
                      className={cn(
                        "flex h-9 w-full items-center justify-between rounded-md px-3 text-sm",
                        "bg-foreground-2 shadow-minimal transition-colors",
                        "hover:bg-background focus:outline-none focus:bg-background",
                        isDisabled && "opacity-50 pointer-events-none"
                      )}
                    >
                      <span className="truncate text-foreground">
                        {piModels.find(m => m.id === selectedModel)?.name
                          ?? (selectedModel ? selectedModel.replace(/^pi\//, '') : t('apiSetup.automatic'))}
                      </span>
                      <ChevronDown className="size-3 opacity-50 shrink-0" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    side="bottom"
                    align="start"
                    sideOffset={4}
                    collisionPadding={8}
                    className="w-[var(--radix-popover-trigger-width)] min-w-[200px] max-w-[400px] overflow-hidden rounded-[8px] bg-background p-0 text-foreground shadow-modal-small"
                  >
                    <CommandPrimitive shouldFilter={false}>
                      <div className="border-b border-border/50 px-3 py-2">
                        <CommandPrimitive.Input
                          ref={modelFilterInputRef}
                          value={modelFilter}
                          onValueChange={setModelFilter}
                          placeholder={t('apiSetup.searchModels')}
                          className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/50 placeholder:select-none"
                        />
                      </div>
                      <CommandPrimitive.List className="max-h-[240px] overflow-y-auto p-1 [&_[cmdk-list-sizer]]:space-y-px">
                        <CommandPrimitive.Empty className="py-3 text-center text-sm text-muted-foreground">{t('apiSetup.noModelsFound')}</CommandPrimitive.Empty>
                        <CommandPrimitive.Item
                          value="automatic"
                          onSelect={() => { setSelectedModel(''); setOpenModelPicker(false) }}
                          className="flex cursor-pointer select-none items-center justify-between rounded-[6px] px-3 py-1.5 text-[13px] outline-none data-[selected=true]:bg-foreground/5"
                        >
                          <span>{t('apiSetup.automatic')}</span>
                          <Check className={cn('size-3 shrink-0', selectedModel === '' ? 'opacity-100' : 'opacity-0')} />
                        </CommandPrimitive.Item>
                        {piModels
                          .filter(m => (m.name + ' ' + m.id).toLowerCase().includes(modelFilter.toLowerCase()))
                          .map((model) => (
                            <CommandPrimitive.Item
                              key={model.id}
                              value={model.id}
                              onSelect={() => { setSelectedModel(model.id); setOpenModelPicker(false) }}
                              className="flex cursor-pointer select-none items-center justify-between gap-3 rounded-[6px] px-3 py-1.5 text-[13px] outline-none data-[selected=true]:bg-foreground/5"
                            >
                              <div className="flex min-w-0 items-center gap-2">
                                <span className="truncate">{model.name}</span>
                                {model.reasoning && <span className="shrink-0 text-[10px] text-foreground/30">{t('apiSetup.reasoning')}</span>}
                              </div>
                              <div className="flex shrink-0 items-center gap-2">
                                {model.contextWindow > 0 && (
                                  <span className="tabular-nums text-[10px] text-muted-foreground" title={t('chat.contextUsage.contextWindow')}>
                                    {new Intl.NumberFormat(i18n.language, { notation: 'compact', maximumFractionDigits: 1 }).format(model.contextWindow)}
                                  </span>
                                )}
                                <Check className={cn('size-3', selectedModel === model.id ? 'opacity-100' : 'opacity-0')} />
                              </div>
                            </CommandPrimitive.Item>
                          ))}
                      </CommandPrimitive.List>
                    </CommandPrimitive>
                  </PopoverContent>
                </Popover>
              </div>
              {modelError && (
                <p className="text-xs text-destructive">{modelError}</p>
              )}
            </>
          )}
        </div>
      ) : !isDefaultProviderPreset && (
        <div className="space-y-2">
          <Label htmlFor="connection-default-model" className="text-muted-foreground font-normal">
            {t('apiSetup.defaultModel')}{' '}
            <span className="text-foreground/30">
              · {t(!isBedrock && baseUrl.trim() ? 'apiSetup.required' : 'apiSetup.optional')}
            </span>
          </Label>
          <div className={cn(
            "rounded-md shadow-minimal transition-colors",
            "bg-foreground-2 focus-within:bg-background",
            modelError && "ring-1 ring-destructive/40"
          )}>
            <Input
              id="connection-default-model"
              type="text"
              value={connectionDefaultModel}
              onChange={(e) => {
                setConnectionDefaultModel(e.target.value)
                setModelError(null)
              }}
              placeholder="e.g. claude-opus-4-8, claude-opus-4-7, claude-sonnet-4-6, claude-haiku-4-5"
              className="border-0 bg-transparent shadow-none"
              disabled={isDisabled}
            />
          </div>
          {modelError && (
            <p className="text-xs text-destructive">{modelError}</p>
          )}
          <p className="text-xs text-foreground/30">
            {t('apiSetup.customModelListHint')}
          </p>
          {(activePreset === 'custom' || !activePreset) && (
            <p className="text-xs text-foreground/30">
              {t('apiSetup.customModelRequiredHint')}
            </p>
          )}
        </div>
      )}

      {/* Error message */}
      {status === 'error' && errorMessage && (
        <p className="text-sm text-destructive">{errorMessage}</p>
      )}
    </form>
  )
}
