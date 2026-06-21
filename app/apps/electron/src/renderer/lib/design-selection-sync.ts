import type { DesignSelection } from '@craft-agent/shared/protocol'
import { designClient } from '@/atoms/design'
import { refreshDesignSelectionFromDom } from './design-selection-refresh'

export async function syncSelectionAfterDomMutation(
  sessionId: string,
  selection: DesignSelection,
): Promise<DesignSelection> {
  const refreshed = await refreshDesignSelectionFromDom(sessionId, selection)
  await designClient.setSelection({ sessionId, selection: refreshed })
  return refreshed
}
