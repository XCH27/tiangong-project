/** Settings categories occupy the same sidebar slot and use the same rows as the main navigation. */
import { useTranslation } from 'react-i18next'
import type { DetailsPageMeta } from '@/lib/navigation-registry'
import type { SettingsSubpage } from '../../../shared/types'
import { SETTINGS_ITEMS } from '../../../shared/menu-schema'
import { SETTINGS_ICONS } from '@/components/icons/SettingsIcons'
import { LeftSidebar, type LinkItem } from '@/components/app-shell/LeftSidebar'

export const meta: DetailsPageMeta = {
  navigator: 'settings',
  slug: 'navigator',
}

type GroupId = 'basic' | 'agent' | 'connection'

const SETTINGS_GROUP: Record<SettingsSubpage, GroupId> = {
  app: 'basic',
  appearance: 'basic',
  input: 'basic',
  workspace: 'basic',
  shortcuts: 'basic',
  ai: 'agent',
  permissions: 'agent',
  labels: 'agent',
  preferences: 'agent',
  messaging: 'connection',
  server: 'connection',
}

const GROUPS: { id: GroupId; labelKey?: string }[] = [
  { id: 'basic', labelKey: 'settings.group.basic' },
  { id: 'agent', labelKey: 'settings.group.agent' },
  { id: 'connection', labelKey: 'settings.group.connection' },
]

interface SettingsNavigatorProps {
  selectedSubpage: SettingsSubpage
  onSelectSubpage: (subpage: SettingsSubpage) => void
}

export default function SettingsNavigator({ selectedSubpage, onSelectSubpage }: SettingsNavigatorProps) {
  const { t } = useTranslation()

  return (
    <nav aria-label={t('sidebar.settings')} className="min-h-0 flex-1 py-1">
      {GROUPS.map(group => {
        const links: LinkItem[] = SETTINGS_ITEMS
          .filter(item => SETTINGS_GROUP[item.id] === group.id)
          .map(item => {
            const Icon = SETTINGS_ICONS[item.id]
            return {
              id: `settings:${item.id}`,
              title: t(item.labelKey),
              icon: <Icon className="h-3.5 w-3.5" />,
              variant: selectedSubpage === item.id ? 'default' : 'ghost',
              onClick: () => onSelectSubpage(item.id),
            }
          })
        if (links.length === 0) return null
        return (
          <div
            key={group.id}
            className="mb-3"
          >
            {group.labelKey && <div className="px-4 pb-1 text-[11px] font-medium text-foreground/40">
              {t(group.labelKey)}
            </div>}
            <LeftSidebar isCollapsed={false} links={links} />
          </div>
        )
      })}
    </nav>
  )
}
