import { useMemo, type ReactNode } from "react"
import { LEADER_LABEL_ID, parseLabelEntry } from "@craft-agent/shared/labels"
import { EntityListLabelBadge } from "@/components/ui/entity-list-label-badge"
import { useSessionListContext } from "@/context/SessionListContext"
import type { SessionMeta } from "@/atoms/sessions"
import type { LabelConfig } from "@craft-agent/shared/labels"

interface SessionBadgesProps {
  item: SessionMeta
  /** Non-label session identifiers appear before identity and functional labels. */
  modelAvatar?: ReactNode
  teamSequence?: string
}

export function SessionBadges({ item, modelAvatar, teamSequence }: SessionBadgesProps) {
  const ctx = useSessionListContext()

  const resolvedLabels = useMemo(() => {
    if (!item.labels || item.labels.length === 0 || ctx.flatLabels.length === 0) return []
    const labels = item.labels
      .map(entry => {
        const parsed = parseLabelEntry(entry)
        const config = ctx.flatLabels.find(l => l.id === parsed.id)
        if (!config) return null
        return { config, rawValue: parsed.rawValue }
      })
      .filter((l): l is { config: LabelConfig; rawValue: string | undefined } => l != null)

    // The leader is an identity, not a functional label. Keep it immediately
    // after the model and stable team sequence regardless of assignment order.
    return labels.sort((a, b) => Number(b.config.id === LEADER_LABEL_ID) - Number(a.config.id === LEADER_LABEL_ID))
  }, [item.labels, ctx.flatLabels])

  if (!modelAvatar && !teamSequence && resolvedLabels.length === 0) return null

  return (
    <>
      {modelAvatar}
      {teamSequence && (
        <span
          className="text-[10px] font-medium tabular-nums text-foreground/45 bg-foreground/[0.06] rounded px-1 py-0.5 flex-shrink-0"
          title="团队序号"
        >
          {teamSequence}
        </span>
      )}
      {resolvedLabels.map(({ config, rawValue }, idx) => (
        <EntityListLabelBadge
          key={`${config.id}-${idx}`}
          label={config}
          rawValue={rawValue}
          sessionLabels={item.labels || []}
          onLabelsChange={(updated) => ctx.onLabelsChange?.(item.id, updated)}
        />
      ))}
    </>
  )
}
