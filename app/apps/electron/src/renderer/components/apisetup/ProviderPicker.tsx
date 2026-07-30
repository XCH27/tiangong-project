import { useTranslation } from 'react-i18next'
import { ChevronRight, Search } from 'lucide-react'
import {
  groupProviderCatalog,
  type ProviderCatalogEntry,
} from '@config/provider-catalog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ProviderBrandIcon } from '@/components/icons/ProviderBrandIcon'

export interface ProviderPickerProps {
  query: string
  onQueryChange: (query: string) => void
  onSelect: (providerId: string) => void
}

/**
 * Step one of the connect flow: choose a provider.
 *
 * A searchable, grouped list rather than a flat dropdown — at 23 entries an
 * alphabetical wall makes the four providers most people want as hard to find as
 * the ones almost nobody does. Selecting drills into the provider's form; the
 * dialog header turns into a back control. Nothing expands in place, so the form
 * always gets the full width.
 */
export function ProviderPicker({ query, onQueryChange, onSelect }: ProviderPickerProps) {
  const { t } = useTranslation()
  const groups = groupProviderCatalog(query)

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <div className="relative">
        <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50" />
        <Input
          autoFocus
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder={t('addModel.searchProviders')}
          className="pl-8"
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {groups.map((group) => (
          <div key={group.id}>
            <div className="px-2 pb-1 pt-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t(`addModel.group.${group.id}`)}
            </div>
            {group.entries.map((entry) => (
              <ProviderRow
                key={entry.id}
                entry={entry}
                label={entry.label}
                hint={regionHint(entry, t)}
                onSelect={() => onSelect(entry.id)}
              />
            ))}
          </div>
        ))}

        {groups.length === 0 && (
          <div className="px-2 py-6 text-center text-sm text-muted-foreground">
            {t('addModel.noProviders')}
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Region is shown because several brands run separate CN and global deployments
 * with different endpoints and accounts — a credential for one is rejected by
 * the other, and the two are otherwise indistinguishable in a list.
 */
function regionHint(
  entry: ProviderCatalogEntry,
  t: (key: string) => string,
): string | undefined {
  if (!entry.region) return undefined
  return t(`addModel.region.${entry.region}`)
}

function ProviderRow({
  entry,
  label,
  hint,
  onSelect,
}: {
  entry: ProviderCatalogEntry
  label: string
  hint?: string
  onSelect: () => void
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      onClick={onSelect}
      className="h-auto w-full justify-start px-2 py-2 font-normal"
    >
      <ProviderBrandIcon
        providerId={entry.id}
        baseUrl={entry.baseUrl}
        piAuthProvider={entry.piProvider}
      />
      <span className="flex-1 truncate">{label}</span>
      {hint && <span className="shrink-0 text-xs text-muted-foreground">{hint}</span>}
      <ChevronRight className="h-4 w-4 shrink-0 opacity-40" />
    </Button>
  )
}
