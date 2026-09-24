import AlibabaMono from '@lobehub/icons/es/Alibaba/components/Mono'
import AnthropicMono from '@lobehub/icons/es/Anthropic/components/Mono'
import AwsMono from '@lobehub/icons/es/Aws/components/Mono'
import AzureMono from '@lobehub/icons/es/Azure/components/Mono'
import BedrockMono from '@lobehub/icons/es/Bedrock/components/Mono'
import CerebrasMono from '@lobehub/icons/es/Cerebras/components/Mono'
import DeepSeekMono from '@lobehub/icons/es/DeepSeek/components/Mono'
import GithubCopilotMono from '@lobehub/icons/es/GithubCopilot/components/Mono'
import GoogleMono from '@lobehub/icons/es/Google/components/Mono'
import GroqMono from '@lobehub/icons/es/Groq/components/Mono'
import HuggingFaceMono from '@lobehub/icons/es/HuggingFace/components/Mono'
import MinimaxMono from '@lobehub/icons/es/Minimax/components/Mono'
import MistralMono from '@lobehub/icons/es/Mistral/components/Mono'
import MoonshotMono from '@lobehub/icons/es/Moonshot/components/Mono'
import OllamaMono from '@lobehub/icons/es/Ollama/components/Mono'
import OpenAIMono from '@lobehub/icons/es/OpenAI/components/Mono'
import OpenRouterMono from '@lobehub/icons/es/OpenRouter/components/Mono'
import QwenMono from '@lobehub/icons/es/Qwen/components/Mono'
import VercelMono from '@lobehub/icons/es/Vercel/components/Mono'
import XAIMono from '@lobehub/icons/es/XAI/components/Mono'
import ZhiPuMono from '@lobehub/icons/es/ZhiPu/components/Mono'

// Import only the SVGs rendered by this app. The package-level ProviderIcon
// pulls in @lobehub/ui and its unrelated editor/theme dependencies.
const brandIcons = {
  alibaba: AlibabaMono,
  anthropic: AnthropicMono,
  aws: AwsMono,
  azure: AzureMono,
  bedrock: BedrockMono,
  cerebras: CerebrasMono,
  deepseek: DeepSeekMono,
  githubcopilot: GithubCopilotMono,
  google: GoogleMono,
  groq: GroqMono,
  huggingface: HuggingFaceMono,
  minimax: MinimaxMono,
  mistral: MistralMono,
  moonshot: MoonshotMono,
  ollama: OllamaMono,
  openai: OpenAIMono,
  openrouter: OpenRouterMono,
  qwen: QwenMono,
  vercel: VercelMono,
  vercelaigateway: VercelMono,
  xai: XAIMono,
  zhipu: ZhiPuMono,
} as const

export function hasProviderBrandIcon(provider: string | null | undefined): provider is keyof typeof brandIcons {
  return !!provider && Object.prototype.hasOwnProperty.call(brandIcons, provider)
}

export function ProviderBrandIcon({ provider, size }: { provider: keyof typeof brandIcons; size: number }) {
  const Icon = brandIcons[provider]
  return <Icon size={size} aria-hidden />
}
