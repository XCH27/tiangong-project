/**
 * Provider subscription reading on the existing AI settings page.
 *
 * The lines come from readSubscriptionForHuman, which shares
 * observeSubscription with the agent DTO. Missing fields render as unknown.
 */

import { useTranslation } from 'react-i18next'
import { readSubscriptionForHuman } from '@craft-agent/shared/protocol'
import { SettingsCard, SettingsRow, SettingsSection } from '@/components/settings'

export function SubscriptionUsageSection({ source }: { source?: unknown }) {
  const { t } = useTranslation()
  const reading = readSubscriptionForHuman(source)

  return (
    <SettingsSection title={t('settings.ai.usage')} description={t('settings.ai.usageDesc')}>
      <SettingsCard>
        <SettingsRow label={t('settings.ai.usageTier')} description={reading.tier} />
        <SettingsRow label={t('settings.ai.usageQuota')} description={reading.quota} />
        <SettingsRow label={t('settings.ai.usageRemaining')} description={reading.remaining} />
      </SettingsCard>
    </SettingsSection>
  )
}
