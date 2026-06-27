import * as React from 'react'

import * as storage from '@/lib/local-storage'
import {
  DEFAULT_TOOL_DOCK_ACTIVE,
  equalToolDockRatios,
  normalizeToolDockActive,
  type ToolDockModuleId,
} from '@/components/app-shell/tool-dock-config'

function normalizeRatios(
  modules: ToolDockModuleId[],
  stored: unknown,
): Record<ToolDockModuleId, number> {
  const fallback = equalToolDockRatios(modules)
  if (!stored || typeof stored !== 'object') return fallback

  const raw = stored as Record<string, number>
  const picked = modules.map((id) => ({ id, value: raw[id] }))
  const total = picked.reduce((sum, item) => sum + (Number.isFinite(item.value) ? item.value : 0), 0)
  if (total <= 0) return fallback

  return Object.fromEntries(
    picked.map((item) => [item.id, item.value / total]),
  ) as Record<ToolDockModuleId, number>
}

export function useWorkspaceToolDock(workspaceId: string | null | undefined) {
  const suffix = workspaceId ?? 'global'

  const [activeModules, setActiveModules] = React.useState<ToolDockModuleId[]>(() =>
    normalizeToolDockActive(storage.get(storage.KEYS.workspaceToolDockActive, DEFAULT_TOOL_DOCK_ACTIVE, suffix)),
  )

  const [ratios, setRatios] = React.useState<Record<ToolDockModuleId, number>>(() =>
    normalizeRatios(
      normalizeToolDockActive(storage.get(storage.KEYS.workspaceToolDockActive, DEFAULT_TOOL_DOCK_ACTIVE, suffix)),
      storage.get(storage.KEYS.workspaceToolDockRatios, null, suffix),
    ),
  )

  React.useEffect(() => {
    const nextActive = normalizeToolDockActive(
      storage.get(storage.KEYS.workspaceToolDockActive, DEFAULT_TOOL_DOCK_ACTIVE, suffix),
    )
    setActiveModules(nextActive)
    setRatios(normalizeRatios(nextActive, storage.get(storage.KEYS.workspaceToolDockRatios, null, suffix)))
  }, [suffix])

  React.useEffect(() => {
    storage.set(storage.KEYS.workspaceToolDockActive, activeModules, suffix)
  }, [activeModules, suffix])

  React.useEffect(() => {
    storage.set(storage.KEYS.workspaceToolDockRatios, ratios, suffix)
  }, [ratios, suffix])

  React.useEffect(() => {
    setRatios((prev) => {
      const next = normalizeRatios(activeModules, prev)
      const same = activeModules.every((id) => Math.abs((prev[id] ?? 0) - (next[id] ?? 0)) < 0.001)
      return same ? prev : next
    })
  }, [activeModules])

  const isModuleActive = React.useCallback(
    (id: ToolDockModuleId) => activeModules.includes(id),
    [activeModules],
  )

  const toggleModule = React.useCallback((id: ToolDockModuleId) => {
    setActiveModules((prev) => {
      if (prev.includes(id)) {
        const next = prev.filter((item) => item !== id)
        return next.length > 0 ? next : prev
      }
      return [...prev, id]
    })
  }, [])

  const closeModule = React.useCallback((id: ToolDockModuleId) => {
    setActiveModules((prev) => {
      if (prev.length <= 1) return prev
      return prev.filter((item) => item !== id)
    })
  }, [])

  const resizeAdjacentModules = React.useCallback((
    upperId: ToolDockModuleId,
    lowerId: ToolDockModuleId,
    deltaRatio: number,
  ) => {
    setRatios((prev) => {
      const upper = prev[upperId] ?? 0
      const lower = prev[lowerId] ?? 0
      const combined = upper + lower
      if (combined <= 0) return prev

      const minShare = 0.12
      let nextUpper = upper + deltaRatio
      let nextLower = lower - deltaRatio
      nextUpper = Math.max(minShare, Math.min(combined - minShare, nextUpper))
      nextLower = combined - nextUpper

      return { ...prev, [upperId]: nextUpper, [lowerId]: nextLower }
    })
  }, [])

  const resetRatios = React.useCallback(() => {
    setRatios(equalToolDockRatios(activeModules))
  }, [activeModules])

  return {
    activeModules,
    ratios,
    isModuleActive,
    toggleModule,
    closeModule,
    resizeAdjacentModules,
    resetRatios,
  }
}
