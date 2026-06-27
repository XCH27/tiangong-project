/**
 * Settings Icons
 *
 * Shared Lucide icon mapping for settings pages. Used by both:
 * - AppMenu (logo dropdown settings submenu)
 * - SettingsNavigator (settings sidebar panel)
 */

import {
  Brain,
  Building2,
  Database,
  ExternalLink,
  Github,
  Keyboard,
  MessageSquare,
  Palette,
  Route,
  Server,
  ShieldCheck,
  Sparkles,
  Tag,
  Terminal,
  ToggleRight,
  UserCircle,
} from 'lucide-react'
import type { SettingsSubpage } from '../../../shared/types'

type IconProps = { className?: string }

export const AppSettingsIcon = ({ className }: IconProps) => <ToggleRight className={className} />
export const AiSettingsIcon = ({ className }: IconProps) => <Sparkles className={className} />
export const ModelRoutingSettingsIcon = ({ className }: IconProps) => <Route className={className} />
export const CliRuntimeSettingsIcon = ({ className }: IconProps) => <Terminal className={className} />
export const ExternalJobsSettingsIcon = ({ className }: IconProps) => <ExternalLink className={className} />
export const GitHubSettingsIcon = ({ className }: IconProps) => <Github className={className} />
export const ManagerAgentIcon = ({ className }: IconProps) => <Brain className={className} />
export const MemorySettingsIcon = ({ className }: IconProps) => <Database className={className} />
export const AppearanceIcon = ({ className }: IconProps) => <Palette className={className} />
export const InputIcon = ({ className }: IconProps) => <Keyboard className={className} />
export const WorkspaceIcon = ({ className }: IconProps) => <Building2 className={className} />
export const PermissionsIcon = ({ className }: IconProps) => <ShieldCheck className={className} />
export const LabelsIcon = ({ className }: IconProps) => <Tag className={className} />
export const MessagingSettingsIcon = ({ className }: IconProps) => <MessageSquare className={className} />
export const ServerSettingsIcon = ({ className }: IconProps) => <Server className={className} />
export const ShortcutsIcon = ({ className }: IconProps) => <Keyboard className={className} />
export const PreferencesIcon = ({ className }: IconProps) => <UserCircle className={className} />

/**
 * Map of settings subpage IDs to their icon components.
 * Used by both AppMenu and SettingsNavigator for consistent icons.
 */
export const SETTINGS_ICONS: Record<SettingsSubpage, React.ComponentType<IconProps>> = {
  app: AppSettingsIcon,
  ai: AiSettingsIcon,
  modelRouting: ModelRoutingSettingsIcon,
  cliRuntime: CliRuntimeSettingsIcon,
  externalJobs: ExternalJobsSettingsIcon,
  github: GitHubSettingsIcon,
  managerAgent: ManagerAgentIcon,
  memory: MemorySettingsIcon,
  appearance: AppearanceIcon,
  input: InputIcon,
  workspace: WorkspaceIcon,
  permissions: PermissionsIcon,
  labels: LabelsIcon,
  messaging: MessagingSettingsIcon,
  server: ServerSettingsIcon,
  shortcuts: ShortcutsIcon,
  preferences: PreferencesIcon,
}
