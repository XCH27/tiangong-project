import type { TFunction } from 'i18next'
import { getSystemLabel, type LabelConfig } from '@craft-agent/shared/labels'

/** Localize untouched starter labels without changing stored IDs or user-authored names. */
export function getLocalizedLabelName(
  t: TFunction,
  label: Pick<LabelConfig, 'id' | 'name'>,
): string {
  const systemLabel = getSystemLabel(label.id)
  return systemLabel?.defaultName === label.name
    ? t(systemLabel.nameKey, { defaultValue: label.name })
    : label.name
}
