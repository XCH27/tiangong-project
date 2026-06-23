/**
 * Provider Icons
 *
 * Maps LLM provider types and base URLs to their respective brand icons.
 * Used in AI Settings page and anywhere connection logos are needed.
 */

import awsIcon from '@/assets/provider-icons/aws.svg'
import azureIcon from '@/assets/provider-icons/azure.svg'
import claudeIcon from '@/assets/provider-icons/claude.svg'
import copilotIcon from '@/assets/provider-icons/copilot.svg'
import googleIcon from '@/assets/provider-icons/google.svg'
import huggingfaceIcon from '@/assets/provider-icons/huggingface.svg'
import kimiIcon from '@/assets/provider-icons/kimi.svg'
import minimaxIcon from '@/assets/provider-icons/minimax.svg'
import mistralIcon from '@/assets/provider-icons/mistral.svg'
import ollamaIcon from '@/assets/provider-icons/ollama.svg'
import openaiIcon from '@/assets/provider-icons/openai.svg'
import openrouterIcon from '@/assets/provider-icons/openrouter.svg'
import piIcon from '@/assets/provider-icons/pi.svg'
import vercelIcon from '@/assets/provider-icons/vercel.svg'

import type { LlmProviderType } from '@craft-agent/shared/config/llm-connections'

/**
 * Icon URLs for each provider
 */
export const providerIcons = {
  anthropic: claudeIcon,
  aws: awsIcon,
  azure: azureIcon,
  copilot: copilotIcon,
  google: googleIcon,
  huggingface: huggingfaceIcon,
  kimi: kimiIcon,
  minimax: minimaxIcon,
  mistral: mistralIcon,
  ollama: ollamaIcon,
  openai: openaiIcon,
  openrouter: openrouterIcon,
  pi: piIcon,
  vercel: vercelIcon,
} as const

export type ProviderIconKey = keyof typeof providerIcons

/** Human-readable provider names */
const providerDisplayNames: Record<string, string> = {
  anthropic: 'Anthropic',
  openai: 'OpenAI',
  openai_compat: 'OpenAI',
  copilot: 'GitHub Copilot',
  antigravity: 'Antigravity',
  deepseek: 'DeepSeek',
  groq: 'Groq',
  kimi: 'Kimi',
  minimax: 'Minimax',
  ollama: 'Ollama',
  openrouter: 'OpenRouter',
  pi: 'Craft Agents Backend',
  pi_compat: 'Craft Agents Backend',
  vercel: 'Vercel',
  xai: 'xAI',
  zai: 'Z.ai',
}

/** Get a human-readable provider name from provider type and optional base URL */
export function getProviderDisplayName(providerType: string, baseUrl?: string | null): string {
  // Try URL detection first for compat providers
  if (baseUrl) {
    const url = baseUrl.toLowerCase()
    if (url.includes('openrouter.ai')) return 'OpenRouter'
    if (url.includes('ollama')) return 'Ollama'
    if (url.includes('kimi.com')) return 'Kimi'
    if (url.includes('minimax.io') || url.includes('minimaxi.com')) return 'Minimax'
    if (url.includes('v0.dev') || url.includes('vercel')) return 'Vercel'
    if (url.includes('manifest.build')) return 'Manifest'
    if (url.includes('x.ai')) return 'xAI'
    if (url.includes('groq.com')) return 'Groq'
    if (url.includes('deepseek.com')) return 'DeepSeek'
    if (url.includes('z.ai')) return 'Z.ai'
    if (url.includes('antigravity')) return 'Antigravity'
  }
  return providerDisplayNames[providerType] || providerType
}

/**
 * Detect provider from base URL
 */
function detectProviderFromUrl(baseUrl: string): ProviderIconKey | null {
  const url = baseUrl.toLowerCase()

  if (url.includes('openrouter.ai')) return 'openrouter'
  if (url.includes('ollama')) return 'ollama'
  if (url.includes('api.anthropic.com')) return 'anthropic'
  if (url.includes('api.openai.com')) return 'openai'
  if (url.includes('v0.dev') || url.includes('vercel')) return 'vercel'
  if (url.includes('generativelanguage.googleapis.com') || url.includes('ai.google')) return 'google'
  if (url.includes('kimi.com')) return 'kimi'
  if (url.includes('minimax.io') || url.includes('minimaxi.com')) return 'minimax'
  if (url.includes('mistral.ai')) return 'mistral'
  if (url.includes('bedrock')) return 'aws'
  if (url.includes('huggingface.co')) return 'huggingface'

  return null
}

function faviconUrl(domain: string): string {
  return `https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&size=128&url=https://${domain}`
}

function detectProviderDomainFromUrl(baseUrl: string): string | null {
  const url = baseUrl.toLowerCase()
  if (url.includes('x.ai')) return 'x.ai'
  if (url.includes('groq.com')) return 'groq.com'
  if (url.includes('deepseek.com')) return 'deepseek.com'
  if (url.includes('z.ai')) return 'z.ai'
  if (url.includes('antigravity')) return 'antigravity.google'
  if (url.includes('cerebras.ai')) return 'cerebras.ai'
  return null
}

/**
 * Map Pi SDK auth provider names to icon keys.
 * For Pi connections, we show the actual upstream provider's icon
 * instead of the generic Pi logo.
 */
function piAuthProviderToIcon(piAuthProvider: string): ProviderIconKey | null {
  switch (piAuthProvider) {
    case 'openai':
    case 'openai-codex':
      return 'openai'
    case 'anthropic':
      return 'anthropic'
    case 'github-copilot':
      return 'copilot'
    case 'openrouter':
      return 'openrouter'
    case 'google':
      return 'google'
    case 'kimi-coding':
      return 'kimi'
    case 'minimax':
    case 'minimax-global':
    case 'minimax-cn':
      return 'minimax'
    case 'mistral':
      return 'mistral'
    case 'amazon-bedrock':
      return 'aws'
    case 'azure-openai-responses':
      return 'azure'
    case 'huggingface':
      return 'huggingface'
    case 'vercel-ai-gateway':
      return 'vercel'
    default:
      return null
  }
}

/**
 * Domain map for providers without static SVG icons.
 * Used to generate Google Favicon V2 URLs as fallback.
 */
const PI_AUTH_PROVIDER_DOMAINS: Record<string, string> = {
  antigravity: 'antigravity.google',
  groq: 'groq.com',
  xai: 'x.ai',
  cerebras: 'cerebras.ai',
  deepseek: 'deepseek.com',
  zai: 'z.ai',
}

const PROVIDER_TYPE_DOMAINS: Record<string, string> = {
  antigravity: 'antigravity.google',
  cerebras: 'cerebras.ai',
  deepseek: 'deepseek.com',
  groq: 'groq.com',
  xai: 'x.ai',
  zai: 'z.ai',
}

/**
 * Get provider icon URL for a given provider type and optional base URL.
 * Base URL detection takes precedence for compatible providers (openai_compat, pi_compat).
 * For Pi connections, resolves to the upstream provider's icon via piAuthProvider.
 *
 * @param providerType - The LLM provider type
 * @param baseUrl - Optional custom base URL for detection
 * @param piAuthProvider - Optional Pi SDK auth provider (e.g. 'openai-codex', 'github-copilot')
 * @returns Icon URL string or null if no matching icon
 */
export function getProviderIcon(
  providerType: LlmProviderType | string,
  baseUrl?: string | null,
  piAuthProvider?: string | null
): string | null {
  // For compatible providers, try to detect from URL first
  if (baseUrl && (providerType === 'openai_compat' || providerType === 'pi_compat')) {
    const detectedProvider = detectProviderFromUrl(baseUrl)
    if (detectedProvider) {
      return providerIcons[detectedProvider]
    }
    // Manifest has no bundled SVG — fall back to Google Favicon V2 (same trick used for groq/xai elsewhere).
    if (baseUrl.toLowerCase().includes('manifest.build')) {
      return faviconUrl('app.manifest.build')
    }
    const detectedDomain = detectProviderDomainFromUrl(baseUrl)
    if (detectedDomain) return faviconUrl(detectedDomain)
  }

  // Map provider type to icon
  switch (providerType) {
    case 'anthropic':
      return providerIcons.anthropic
    case 'openai':
    case 'openai_compat':
      return providerIcons.openai
    case 'copilot':
      return providerIcons.copilot
    case 'pi':
    case 'pi_compat': {
      // Resolve to actual upstream provider icon
      if (piAuthProvider) {
        const iconKey = piAuthProviderToIcon(piAuthProvider)
        if (iconKey) return providerIcons[iconKey]
        // Favicon fallback for providers without static SVGs
        const domain = PI_AUTH_PROVIDER_DOMAINS[piAuthProvider]
        if (domain) {
          return faviconUrl(domain)
        }
      }
      return null  // Unknown/custom Pi provider — caller shows brain icon
    }
    default:
      // Try URL detection as fallback
      if (baseUrl) {
        const detectedProvider = detectProviderFromUrl(baseUrl)
        if (detectedProvider) {
          return providerIcons[detectedProvider]
        }
        const detectedDomain = detectProviderDomainFromUrl(baseUrl)
        if (detectedDomain) return faviconUrl(detectedDomain)
      }
      const domain = PROVIDER_TYPE_DOMAINS[providerType]
      if (domain) return faviconUrl(domain)
      return null
  }
}
