import { useTranslation } from 'react-i18next'
import type { ModelDefinition } from '@config/models'
import type { MediaCatalogModel } from '@config/model-fetcher'

type CapabilityModel = Partial<Pick<ModelDefinition, 'contextWindow' | 'provider' | 'supportsImages' | 'supportsOcr' | 'modalities'>>
type ChatTag = 'vision' | 'video' | 'audio' | 'ocr' | 'file'

function formatContext(tokens: number): string {
  const unit = tokens >= 1_000_000 ? 1_000_000 : 1_000
  return `${Number((tokens / unit).toFixed(1))}${unit === 1_000_000 ? 'M' : 'K'}`
}

/** This is mounted on chat-routable rows only. File means native PDF input on Claude SDK, not a tool path. */
export function getChatModelCapabilityTags(model?: CapabilityModel): ChatTag[] {
  if (!model) return []
  const input = model.modalities?.input ?? []
  const tags: ChatTag[] = []
  if (model.supportsImages === true || (model.supportsImages !== false && input.includes('image'))) tags.push('vision')
  if (input.includes('video')) tags.push('video')
  if (input.includes('audio')) tags.push('audio')
  if (model.supportsOcr === true || (model.supportsOcr !== false && input.includes('ocr'))) tags.push('ocr')
  if (model.provider === 'anthropic') tags.push('file')
  return tags
}

/** A media catalog row identifies a separate route, not a chat-model feature or entitlement. */
export function getMediaCapabilityLabelKey(model: MediaCatalogModel): string | null {
  if (model.kind === 'image') return 'settings.ai.mediaImageModels'
  if (model.kind === 'video') return 'settings.ai.mediaVideoModels'
  if (model.kind !== 'audio' || !model.audioMode) return null
  return `settings.ai.mediaAudio.${model.audioMode}`
}

/** Show context first, then only capability claims from the catalog or a manual correction. */
export function ModelCapabilityBadges({ model }: { model?: CapabilityModel }) {
  const { t } = useTranslation()
  const context = model?.contextWindow && Number.isFinite(model.contextWindow) && model.contextWindow > 0
    ? formatContext(model.contextWindow) : t('common.unknown')
  const contextTitle = `${t('chat.contextUsage.contextWindow')}: ${context}`
  const labels: Array<{ text: string; title: string }> = getChatModelCapabilityTags(model).map(tag => {
    if (tag === 'file') return { text: t('menu.file'), title: t('settings.ai.nativePdfInput') }
    if (tag === 'ocr') return { text: 'OCR', title: 'OCR' }
    const key = `settings.ai.modelInput.${tag === 'vision' ? 'image' : tag}`
    return { text: t(key), title: t(key) }
  })
  return <span className="inline-flex max-w-full flex-wrap items-center gap-1.5" aria-label={[contextTitle, ...labels.map(label => label.title)].join(', ')}>
    <span title={contextTitle} className="inline-flex h-5 shrink-0 items-center rounded-[4px] border border-border/60 bg-background px-1.5 font-mono text-xs text-muted-foreground">{context}</span>
    {labels.map(label => <span key={label.title} title={label.title} className="inline-flex h-5 shrink-0 items-center rounded-full border border-border/60 bg-background px-1.5 text-xs text-muted-foreground">{label.text}</span>)}
  </span>
}
