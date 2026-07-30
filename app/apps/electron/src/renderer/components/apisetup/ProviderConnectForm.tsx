import { useTranslation } from 'react-i18next'
import type { ProviderAuthKind, ProviderCatalogEntry } from '@config/provider-catalog'
import { SettingsSecretInput, SettingsSegmentedControl } from '@/components/settings'
import { SettingsInput } from '@/components/settings'
import { Button } from '@/components/ui/button'
import { ModelMultiSelect } from './ModelMultiSelect'
import {
  addCustomModel,
  canDiscoverModels,
  connectFields,
  removeModel,
  setAuthMode,
  setCredentialField,
  toggleModel,
  type AddModelDraft,
} from './add-model-model'

export interface ProviderConnectFormProps {
  entry: ProviderCatalogEntry
  draft: AddModelDraft
  onChange: (draft: AddModelDraft) => void
  onOAuthConnect: (entry: ProviderCatalogEntry) => void
  /** Ask the provider what it serves, using the credential entered above. */
  onDiscoverModels: (entry: ProviderCatalogEntry) => void
}

/**
 * Renders whatever boxes the provider actually needs.
 *
 * The field list comes from `connectFields()`, so this component holds no
 * per-provider branching. A provider selling only metered access never shows a
 * plan chooser; a subscription never shows a key or model box. Adding a provider
 * is a catalog entry, not an edit here.
 */
export function ProviderConnectForm({
  entry,
  draft,
  onChange,
  onOAuthConnect,
  onDiscoverModels,
}: ProviderConnectFormProps) {
  const { t } = useTranslation()

  // Discovery is triggered when the credential leaves the field rather than on
  // every keystroke: a partially typed key would just produce a failed request
  // and an error the user has not earned yet.
  const discoverIfPossible = () => {
    if (canDiscoverModels(entry, draft)) onDiscoverModels(entry)
  }

  const authLabel = (kind: ProviderAuthKind) =>
    kind === 'oauth' ? t('addModel.auth.plan') : t('addModel.auth.apiKey')

  return (
    <div className="flex flex-col gap-3">
      {connectFields(entry, draft).map((field) => {
        switch (field.kind) {
          case 'auth-mode':
            return (
              <label key="auth-mode" className="flex flex-col gap-1.5">
                <span className="text-sm font-medium">{t('addModel.field.auth')}</span>
                <SettingsSegmentedControl
                  value={field.value}
                  onValueChange={(value) =>
                    onChange(setAuthMode(draft, entry.id, value as ProviderAuthKind))
                  }
                  options={field.options.map((kind) => ({ value: kind, label: authLabel(kind) }))}
                />
              </label>
            )

          case 'oauth':
            return (
              <Button
                key="oauth"
                type="button"
                onClick={() => onOAuthConnect(entry)}
                className="w-full"
              >
                {t('addModel.connectPlan', { provider: field.providerLabel })}
              </Button>
            )

          case 'api-key':
            return (
              <div key="api-key" className="flex flex-col gap-1.5">
                <div className="flex items-baseline justify-between">
                  <span className="text-sm font-medium">
                    <span className="text-destructive">*</span> {t('addModel.field.apiKey')}
                  </span>
                  {field.apiKeyUrl && (
                    <a
                      href={field.apiKeyUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm underline underline-offset-2 opacity-80 hover:opacity-100"
                    >
                      {t('addModel.getApiKey')}
                    </a>
                  )}
                </div>
                <SettingsSecretInput
                  value={draft.apiKey}
                  onChange={(apiKey) => onChange(setCredentialField(draft, { apiKey }))}
                  onBlur={discoverIfPossible}
                  placeholder={field.placeholder}
                />
              </div>
            )

          case 'base-url':
            return (
              <label key="base-url" className="flex flex-col gap-1.5">
                <span className="text-sm font-medium">
                  {field.required && <span className="text-destructive">* </span>}
                  {t('addModel.field.baseUrl')}
                </span>
                <SettingsInput
                  value={draft.baseUrlOverride}
                  onChange={(baseUrlOverride) =>
                    onChange(setCredentialField(draft, { baseUrlOverride }))
                  }
                  onBlur={discoverIfPossible}
                  // A known endpoint shows as the placeholder so the box reads as
                  // "override this" rather than "fill this in".
                  placeholder={field.placeholder ?? t('addModel.field.baseUrlHint')}
                />
              </label>
            )

          case 'models':
            return (
              <div key="models" className="flex flex-col gap-1.5">
                <span className="text-sm font-medium">
                  <span className="text-destructive">*</span> {t('addModel.field.models')}
                </span>
                <ModelMultiSelect
                  discovery={field.discovery}
                  fallback={field.fallback}
                  selected={field.selected}
                  onToggle={(modelId) => onChange(toggleModel(draft, entry.id, modelId))}
                  onAddCustom={(modelId) => onChange(addCustomModel(draft, entry.id, modelId))}
                  onRemove={(modelId) => onChange(removeModel(draft, entry.id, modelId))}
                  onRetry={() => onDiscoverModels(entry)}
                />
              </div>
            )

          default:
            return field satisfies never
        }
      })}
    </div>
  )
}
