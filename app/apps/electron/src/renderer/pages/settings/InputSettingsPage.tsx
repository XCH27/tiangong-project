/**
 * InputSettingsPage
 *
 * Input behavior settings that control how the chat input works.
 *
 * Settings:
 * - Auto Capitalisation (on/off)
 * - Spell Check (on/off)
 * - Send Message Key (Enter or ⌘+Enter)
 */

import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { PanelHeader } from '@/components/app-shell/PanelHeader'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Spinner } from '@craft-agent/ui'

import { isMac } from '@/lib/platform'
import type { DetailsPageMeta } from '@/lib/navigation-registry'

import {
  SettingsSection,
  SettingsCard,
  SettingsToggle,
  SettingsMenuSelectRow,
} from '@/components/settings'

export const meta: DetailsPageMeta = {
  navigator: 'settings',
  slug: 'input',
}

// ============================================
// Main Component
// ============================================

export default function InputSettingsPage() {
  const { t } = useTranslation()

  // Auto-capitalisation state
  const [autoCapitalisation, setAutoCapitalisation] = useState(true)

  // Spell check state (default off)
  const [spellCheck, setSpellCheck] = useState(false)

  // Send message key state
  const [sendMessageKey, setSendMessageKey] = useState<'enter' | 'cmd-enter'>('enter')

  // Gate rendering until persisted settings are loaded so toggles don't flash
  // defaults and immediately overwrite stored values.
  const [loaded, setLoaded] = useState(false)

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      if (!window.electronAPI) {
        setLoaded(true)
        return
      }
      try {
        const [autoCapEnabled, spellCheckEnabled, sendKey] = await Promise.all([
          window.electronAPI.getAutoCapitalisation(),
          window.electronAPI.getSpellCheck(),
          window.electronAPI.getSendMessageKey(),
        ])
        setAutoCapitalisation(autoCapEnabled)
        setSpellCheck(spellCheckEnabled)
        setSendMessageKey(sendKey)
      } catch (error) {
        console.error('Failed to load input settings:', error)
      } finally {
        setLoaded(true)
      }
    }
    loadSettings()
  }, [])

  const handleAutoCapitalisationChange = useCallback(async (enabled: boolean) => {
    setAutoCapitalisation(enabled)
    try {
      await window.electronAPI.setAutoCapitalisation(enabled)
    } catch (error) {
      console.error('Failed to save auto-capitalisation setting:', error)
      setAutoCapitalisation(!enabled)
      toast.error(t('common.failed'))
    }
  }, [t])

  const handleSpellCheckChange = useCallback(async (enabled: boolean) => {
    setSpellCheck(enabled)
    try {
      await window.electronAPI.setSpellCheck(enabled)
    } catch (error) {
      console.error('Failed to save spell check setting:', error)
      setSpellCheck(!enabled)
      toast.error(t('common.failed'))
    }
  }, [t])

  const handleSendMessageKeyChange = useCallback(async (value: string) => {
    const key = value as 'enter' | 'cmd-enter'
    const previous = sendMessageKey
    setSendMessageKey(key)
    try {
      await window.electronAPI.setSendMessageKey(key)
    } catch (error) {
      console.error('Failed to save send-message key:', error)
      setSendMessageKey(previous)
      toast.error(t('common.failed'))
    }
  }, [sendMessageKey, t])

  if (!loaded) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <PanelHeader title={t("settings.input.title")} />
      <div className="flex-1 min-h-0 mask-fade-y">
        <ScrollArea className="h-full">
          <div className="px-5 py-7 max-w-3xl mx-auto">
            <div className="space-y-8">
              {/* Typing Behavior */}
              <SettingsSection title={t("settings.input.typing")} description={t("settings.input.typingDesc")}>
                <SettingsCard>
                  <SettingsToggle
                    label={t("settings.input.autoCapitalisation")}
                    description={t("settings.input.autoCapitalisationDesc")}
                    checked={autoCapitalisation}
                    onCheckedChange={handleAutoCapitalisationChange}
                  />
                  <SettingsToggle
                    label={t("settings.input.spellCheck")}
                    description={t("settings.input.spellCheckDesc")}
                    checked={spellCheck}
                    onCheckedChange={handleSpellCheckChange}
                  />
                </SettingsCard>
              </SettingsSection>

              {/* Send Behavior */}
              <SettingsSection title={t("settings.input.sending")} description={t("settings.input.sendingDesc")}>
                <SettingsCard>
                  <SettingsMenuSelectRow
                    label={t("settings.input.sendMessageWith")}
                    description={t("settings.input.sendMessageWithDesc")}
                    value={sendMessageKey}
                    onValueChange={handleSendMessageKeyChange}
                    options={[
                      { value: 'enter', label: t("settings.input.enterKey"), description: t("settings.input.enterKeyDesc") },
                      { value: 'cmd-enter', label: isMac ? t("settings.input.cmdEnterKey") : t("settings.input.ctrlEnterKey"), description: t("settings.input.cmdEnterKeyDesc") },
                    ]}
                  />
                </SettingsCard>
              </SettingsSection>
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
