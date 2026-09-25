import { useTranslation } from 'react-i18next'
import type { ModelDefinition } from '@config/models'

type CapabilityModel = Pick<ModelDefinition, 'contextWindow' | 'supportsImages' | 'supportsThinking' | 'reasoningEfforts' | 'supportsFastMode' | 'modalities'> & {
  reasoning?: boolean
}

function formatContext(tokens: number): string {
  const unit = tokens >= 1_000_000 ? 1_000_000 : 1_000
  return `${Number((tokens / unit).toFixed(1))}${unit === 1_000_000 ? 'M' : 'K'}`
}

/** Only render capabilities backed by the current catalog or a manual correction. */
export function ModelCapabilityBadges({ model }: { model?: CapabilityModel }) {
  const { t } = useTranslation()
  const labels: Array<{ text: string; title: string; context?: boolean }> = []
  if (model?.contextWindow && Number.isFinite(model.contextWindow) && model.contextWindow > 0) {
    labels.push({ text: formatContext(model.contextWindow), title: `${t('chat.contextUsage.contextWindow')}: ${formatContext(model.contextWindow)}`, context: true })
  }
  const input = model?.modalities?.input
  if (model?.supportsImages === true || input?.includes('image')) labels.push({ text: t('settings.ai.modelInput.image'), title: t('settings.ai.modelInput.image') })
  if (input?.includes('video')) labels.push({ text: t('settings.ai.modelInput.video'), title: t('settings.ai.modelInput.video') })
  if (input?.includes('audio')) labels.push({ text: t('settings.ai.modelInput.audio'), title: t('settings.ai.modelInput.audio') })
  if (model?.reasoningEfforts?.length) {
    labels.push({ text: t('apiSetup.reasoning'), title: `${t('apiSetup.reasoning')}: ${model.reasoningEfforts.map(level => t(`thinking.${level}`)).join(' / ')}` })
  } else if (model?.supportsThinking === true || model?.reasoning === true) {
    labels.push({ text: t('apiSetup.reasoning'), title: t('apiSetup.reasoning') })
  }
  if (model?.supportsFastMode === true) labels.push({ text: t('settings.ai.fastMode'), title: t('settings.ai.fastMode') })
  if (!labels.length) return <span className="text-xs text-muted-foreground">{t('common.unknown')}</span>
  return <span className="inline-flex max-w-full flex-wrap items-center gap-1.5" aria-label={labels.map(label => label.title).join(', ')}>
    {labels.map(label => <span key={label.title} title={label.title} className={label.context
      ? 'inline-flex h-5 shrink-0 items-center rounded-[4px] border border-border/60 bg-background px-1.5 font-mono text-xs text-muted-foreground'
      : 'inline-flex h-5 shrink-0 items-center rounded-full border border-border/60 bg-background px-1.5 text-xs text-muted-foreground'}>{label.text}</span>)}
  </span>
}
