import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import type { DiffViewerSettings } from '@craft-agent/ui'

/** Both review presentations use Craft's existing preferences file. */
export function useDiffViewerSettings() {
  const { t } = useTranslation()
  const [settings, setSettings] = useState<Partial<DiffViewerSettings>>({})
  useEffect(() => {
    let active = true
    window.electronAPI.readPreferences().then(({ content }) => {
      try { if (active) setSettings(JSON.parse(content).diffViewer ?? {}) } catch { /* defaults */ }
    }).catch(() => {})
    return () => { active = false }
  }, [])
  const update = useCallback((next: DiffViewerSettings) => {
    setSettings(next)
    void window.electronAPI.readPreferences().then(({ content }) => {
      // Preserve the existing document; a malformed file must not be overwritten.
      const preferences = JSON.parse(content)
      return window.electronAPI.writePreferences(JSON.stringify({ ...preferences, diffViewer: next, updatedAt: Date.now() }, null, 2))
    }).catch(() => toast.error(t('toast.failedToSaveSetting', { setting: t('chat.review.title') })))
  }, [t])
  return [settings, update] as const
}
