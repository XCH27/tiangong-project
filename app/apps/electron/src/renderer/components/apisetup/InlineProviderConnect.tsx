import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  type ProviderCatalogEntry,
} from '@config/provider-catalog'
import { Button } from '@/components/ui/button'
import { ProviderConnectForm } from './ProviderConnectForm'
import {
  EMPTY_ADD_MODEL_DRAFT,
  buildSubmission,
  effectiveAuthMode,
  expandProvider,
  setDiscovery,
  validateDraft,
  type AddModelDraft,
  type AddModelSubmission,
} from './add-model-model'

export interface InlineProviderConnectProps {
  entry: ProviderCatalogEntry
  onClose: () => void
  onSubmit: (submission: AddModelSubmission) => Promise<void> | void
  onOAuthConnect: (entry: ProviderCatalogEntry) => void
  /** Load the bundled provider catalog before a credential is entered. */
  preloadModels: (entry: ProviderCatalogEntry) => Promise<readonly string[]>
  /** Ask the provider what it serves, with the credential in the draft. */
  discoverModels: (
    entry: ProviderCatalogEntry,
    credential: { apiKey: string; baseUrl?: string },
  ) => Promise<readonly string[]>
}

/**
 * Page-owned provider connection dropdown.
 *
 * The provider row is already the selector, so opening a modal to repeat its
 * name creates a second interaction grammar. This panel expands directly below
 * that row and keeps credential, endpoint, model selection, and actions in one
 * reversible page context.
 */
export function InlineProviderConnect({
  entry,
  onClose,
  onSubmit,
  onOAuthConnect,
  preloadModels,
  discoverModels,
}: InlineProviderConnectProps) {
  const { t } = useTranslation()
  const [draft, setDraft] = React.useState<AddModelDraft>(() =>
    expandProvider(EMPTY_ADD_MODEL_DRAFT, entry.id),
  )
  const [submitting, setSubmitting] = React.useState(false)

  // A credential belongs to one provider. Changing the expanded row starts a
  // fresh draft so a key can never leak into another provider's request.
  React.useEffect(() => {
    setDraft(expandProvider(EMPTY_ADD_MODEL_DRAFT, entry.id))
    let cancelled = false
    void preloadModels(entry)
      .then((models) => {
        if (cancelled) return
        setDraft((current) =>
          setDiscovery(current, entry.id, { status: 'ready', models }),
        )
      })
      .catch(() => {
        // Live discovery after credential entry remains available.
      })
    return () => {
      cancelled = true
    }
  }, [entry, preloadModels])

  const validation = validateDraft(draft)

  const runDiscovery = React.useCallback(
    async (target: ProviderCatalogEntry) => {
      const currentDiscovery = draft.discovery[target.id]
      const preloadedModels =
        currentDiscovery?.status === 'ready' ? currentDiscovery.models : []
      setDraft((current) => setDiscovery(current, target.id, { status: 'loading' }))
      try {
        const models = await discoverModels(target, {
          apiKey: draft.apiKey.trim(),
          baseUrl: draft.baseUrlOverride.trim() || target.baseUrl,
        })
        setDraft((current) => setDiscovery(current, target.id, { status: 'ready', models }))
      } catch (error) {
        setDraft((current) =>
          setDiscovery(
            current,
            target.id,
            preloadedModels.length > 0
              ? { status: 'ready', models: preloadedModels }
              : {
                  status: 'error',
                  message: error instanceof Error ? error.message : String(error),
                },
          ),
        )
      }
    },
    [discoverModels, draft.apiKey, draft.baseUrlOverride],
  )

  const handleSubmit = async () => {
    const submission = buildSubmission(draft)
    if (!submission) return
    setSubmitting(true)
    try {
      await onSubmit(submission)
      onClose()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="border-t border-foreground/10 px-4 py-4"
      aria-label={t('settings.ai.connect')}
    >
      <div className="mx-auto flex max-w-2xl flex-col gap-4">
        <ProviderConnectForm
          entry={entry}
          draft={draft}
          onChange={setDraft}
          onOAuthConnect={onOAuthConnect}
          onDiscoverModels={runDiscovery}
        />

        {effectiveAuthMode(entry, draft) === 'api-key' && (
          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
            >
              {t('addModel.cancel')}
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={!validation.canSubmit || submitting}
            >
              {t('addModel.submit')}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
