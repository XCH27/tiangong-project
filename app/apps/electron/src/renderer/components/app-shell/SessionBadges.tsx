import { useMemo } from "react"
import { parseLabelEntry } from "@craft-agent/shared/labels"
import { EntityListLabelBadge } from "@/components/ui/entity-list-label-badge"
import { useSessionListContext } from "@/context/SessionListContext"
import type { SessionMeta } from "@/atoms/sessions"
import type { LabelConfig } from "@craft-agent/shared/labels"

interface SessionBadgesProps {
  item: SessionMeta
}

export function SessionBadges({ item }: SessionBadgesProps) {
  const ctx = useSessionListContext()

  return (
    <SessionLabelBadges
      item={item}
      flatLabels={ctx.flatLabels}
      onLabelsChange={(updated) => ctx.onLabelsChange?.(item.id, updated)}
    />
  )
}

interface SessionLabelBadgesProps {
  item: SessionMeta
  flatLabels: LabelConfig[]
  onLabelsChange?: (labels: string[]) => void
  readOnly?: boolean
}

/**
 * Shared Session badge projection for surfaces outside SessionList.
 * Resolution and EntityListLabelBadge rendering stay identical; callers only
 * provide the same label authority that SessionListContext normally supplies.
 */
export function SessionLabelBadges({
  item,
  flatLabels,
  onLabelsChange,
  readOnly,
}: SessionLabelBadgesProps) {
  const resolvedLabels = useMemo(() => {
    if (!item.labels || item.labels.length === 0 || flatLabels.length === 0) return []
    return item.labels
      .map(entry => {
        const parsed = parseLabelEntry(entry)
        const config = flatLabels.find(l => l.id === parsed.id)
        if (!config) return null
        return { config, rawValue: parsed.rawValue }
      })
      .filter((l): l is { config: LabelConfig; rawValue: string | undefined } => l != null)
  }, [item.labels, flatLabels])

  if (resolvedLabels.length === 0) return null

  return (
    <>
      {resolvedLabels.map(({ config, rawValue }, idx) => (
        <EntityListLabelBadge
          key={`${config.id}-${idx}`}
          label={config}
          rawValue={rawValue}
          sessionLabels={item.labels || []}
          onLabelsChange={onLabelsChange}
          readOnly={readOnly}
        />
      ))}
    </>
  )
}
