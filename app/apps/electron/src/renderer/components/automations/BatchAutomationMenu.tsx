/**
 * BatchAutomationMenu - Context menu content for batch operations on multi-selected automations.
 *
 * Self-contained component that uses hooks to access selection state, automation metadata,
 * and mutation callbacks. Renders polymorphic menu items via useMenuComponents() so it
 * works in both DropdownMenu and ContextMenu scenarios.
 *
 * Mirrors the BatchSessionMenu pattern with automation-specific actions:
 * Enable/Disable All and Delete.
 */

import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useAtomValue } from 'jotai'
import { Power, PowerOff, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useMenuComponents } from '@/components/ui/menu-context'
import { automationSelection } from '@/hooks/useEntitySelection'
import { automationsAtom } from '@/atoms/automations'
import { useAppShellContext } from '@/context/AppShellContext'
import {
  getBatchOperationErrorMessage,
  runSequentialAutomationOperations,
} from './batch-operation'

const {
  useSelection: useAutomationSelection,
  useSelectedIds: useAutomationSelectedIds,
} = automationSelection

export function BatchAutomationMenu() {
  const { t } = useTranslation()
  const { MenuItem, Separator } = useMenuComponents()

  const selectedIds = useAutomationSelectedIds()
  const { removeFromSelection } = useAutomationSelection()
  const automations = useAtomValue(automationsAtom)

  const {
    activeWorkspaceId,
  } = useAppShellContext()

  // Resolve selected automations metadata
  const selectedAutomations = useMemo(() => {
    return [...selectedIds]
      .map(id => automations.find(a => a.id === id))
      .filter((a): a is NonNullable<typeof a> => a != null)
  }, [selectedIds, automations])

  // Check if all selected are enabled
  const allEnabled = useMemo(() => {
    return selectedAutomations.length > 0 && selectedAutomations.every(a => a.enabled)
  }, [selectedAutomations])

  // Batch toggle — sequential IPC to avoid read-modify-write race on automations.json
  const handleBatchToggle = useCallback(async () => {
    if (!activeWorkspaceId) return
    const targetEnabled = !allEnabled
    const count = selectedAutomations.length
    const result = await runSequentialAutomationOperations(selectedAutomations, (automation) =>
      window.electronAPI.setAutomationEnabled(
        activeWorkspaceId,
        automation.event,
        automation.matcherIndex,
        targetEnabled,
      ),
    )
    removeFromSelection(result.succeeded.map((automation) => automation.id))
    if (result.failed.length > 0) {
      const message = getBatchOperationErrorMessage(result.failed[0].error)
      toast.error(t('toast.failedToToggleAutomation'), { description: message })
      return
    }
    toast(targetEnabled
      ? t('automations.batchEnabled', { count })
      : t('automations.batchDisabled', { count })
    )
  }, [activeWorkspaceId, selectedAutomations, allEnabled, removeFromSelection, t])

  // Batch delete — sequential IPC in reverse matcherIndex order so earlier indices stay valid
  const handleBatchDelete = useCallback(async () => {
    if (!activeWorkspaceId) return
    const count = selectedAutomations.length
    const sorted = [...selectedAutomations].sort((a, b) => b.matcherIndex - a.matcherIndex)
    const result = await runSequentialAutomationOperations(sorted, (automation) =>
      window.electronAPI.deleteAutomation(
        activeWorkspaceId,
        automation.event,
        automation.matcherIndex,
      ),
    )
    removeFromSelection(result.succeeded.map((automation) => automation.id))
    if (result.failed.length > 0) {
      const message = getBatchOperationErrorMessage(result.failed[0].error)
      toast.error(t('toast.failedToDeleteAutomation'), { description: message })
      return
    }
    toast(t('automations.batchDeleted', { count }))
  }, [activeWorkspaceId, selectedAutomations, removeFromSelection, t])

  const count = selectedIds.size

  return (
    <>
      {/* Header showing selection count */}
      <div className="px-2 py-1.5 text-xs text-muted-foreground font-medium">
        {t('automations.batchSelected', { count })}
      </div>
      <Separator />

      {/* Enable/Disable All */}
      <MenuItem onClick={handleBatchToggle}>
        {allEnabled ? (
          <PowerOff className="h-3.5 w-3.5" />
        ) : (
          <Power className="h-3.5 w-3.5" />
        )}
        <span className="flex-1">{allEnabled ? t('automations.menuDisableAll') : t('automations.menuEnableAll')}</span>
      </MenuItem>

      <Separator />

      {/* Delete */}
      {activeWorkspaceId && (
        <MenuItem onClick={handleBatchDelete} variant="destructive">
          <Trash2 className="h-3.5 w-3.5" />
          <span className="flex-1">{t('automations.menuDelete')}</span>
        </MenuItem>
      )}
    </>
  )
}
