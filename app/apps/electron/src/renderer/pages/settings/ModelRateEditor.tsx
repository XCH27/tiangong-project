import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Check, X } from 'lucide-react'
import type { ModelPricing, TokenRates } from '@craft-agent/shared/config/model-pricing'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'

/**
 * Typing in what a model costs.
 *
 * It lives on the Usage page rather than in AI settings because that is where
 * the gap is noticed: the reader is looking at "no rate" next to a model that
 * moved four million tokens, and the fix belongs next to the complaint. Sending
 * them to another page to find the same model in a list of forty is how the
 * blank stays blank.
 *
 * Four fields, not one. Collapsing cache into input is the single most common
 * way a self-built cost display goes wrong, and it goes wrong in the direction
 * that matters: cache reads are roughly a tenth of input, cache writes are
 * above it, and agent work is overwhelmingly cache-heavy. A one-rate estimate
 * of an iterative session is off by multiples, not percent.
 */

export interface ModelRateEditorProps {
  modelId: string
  initial?: ModelPricing
  onCancel: () => void
  onSave: (pricing: ModelPricing) => void | Promise<void>
}

type Field = keyof TokenRates

const FIELDS: readonly Field[] = ['input', 'output', 'cacheRead', 'cacheWrite']

export function ModelRateEditor({ modelId, initial, onCancel, onSave }: ModelRateEditorProps) {
  const { t } = useTranslation()
  const [draft, setDraft] = React.useState<Record<Field, string>>(() => ({
    input: numberToInput(initial?.base.input),
    output: numberToInput(initial?.base.output),
    cacheRead: numberToInput(initial?.base.cacheRead),
    cacheWrite: numberToInput(initial?.base.cacheWrite),
  }))
  const [subscription, setSubscription] = React.useState(initial?.subscription === true)
  const [saving, setSaving] = React.useState(false)

  const parsed = React.useMemo(() => {
    const out: Partial<Record<Field, number>> = {}
    for (const field of FIELDS) {
      const value = Number(draft[field])
      if (draft[field].trim() === '' || !Number.isFinite(value) || value < 0) return null
      out[field] = value
    }
    return out as TokenRates
  }, [draft])

  const submit = async () => {
    if (!parsed || saving) return
    setSaving(true)
    try {
      await onSave({
        currency: 'USD',
        base: parsed,
        ...(subscription ? { subscription: true } : {}),
        // Stamped so `isPricingStale` can flag it later. A rate typed once and
        // never revisited is exactly the kind that quietly goes wrong.
        updatedAt: Date.now(),
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    // Inline expansion inside the existing card, not a dialog: reversible
    // compact editing is the inline case (UI-SPEC §8, "inline versus dialog").
    <div className="space-y-3 border-t border-border px-4 py-3">
      <div className="text-xs text-foreground/60">
        {t('settings.usage.rateFor', { model: modelId })}
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {FIELDS.map((field) => (
          <label key={field} className="flex flex-col gap-1">
            <span className="text-[11px] text-foreground/50">
              {t(`settings.usage.rate.${field}`)}
            </span>
            <Input
              inputMode="decimal"
              value={draft[field]}
              placeholder="0"
              onChange={(event) =>
                setDraft((current) => ({ ...current, [field]: event.target.value }))
              }
              onKeyDown={(event) => {
                if (event.key === 'Enter') void submit()
                if (event.key === 'Escape') onCancel()
              }}
              className="h-8 tabular-nums"
            />
          </label>
        ))}
      </div>

      {/*
        Subscription usage is valued but not charged, so it is summed apart.
        Folding an allowance draw into spend produces a total matching no bill.
      */}
      <label className="flex items-center gap-2 text-xs text-foreground/60">
        <Switch checked={subscription} onCheckedChange={setSubscription} />
        <span>{t('settings.usage.rate.subscription')}</span>
      </label>

      <div className="flex items-center gap-2">
        <Button size="sm" onClick={() => void submit()} disabled={!parsed || saving}>
          <Check className="mr-1 h-3.5 w-3.5" />
          {t('common.save')}
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel} disabled={saving}>
          <X className="mr-1 h-3.5 w-3.5" />
          {t('common.cancel')}
        </Button>
        <span className="text-[11px] text-foreground/50">
          {t('settings.usage.rate.perMillion')}
        </span>
      </div>
    </div>
  )
}

/**
 * Empty rather than "0" when unset.
 *
 * A pre-filled zero is a rate the user never entered, and saving the form
 * without touching it would record "this model is free" as though it had been
 * asserted.
 */
function numberToInput(value: number | undefined): string {
  return value === undefined ? '' : `${value}`
}
