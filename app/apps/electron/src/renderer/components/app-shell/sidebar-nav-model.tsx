/**
 * The left sidebar's item tree, as data.
 *
 * These 223 lines lived inside `AppShellContent`, which is how a component
 * reaches 4,188 lines: the nav model is pure construction — no state, no
 * effects, just state in and items out — and it had no reason to be inside a
 * component except that it was written there.
 *
 * Moved verbatim. The body is unchanged and every value it reads arrives through
 * one destructured parameter, so this is a relocation rather than a rewrite:
 * behaviour cannot drift, and the diff of the body is empty.
 */

import type { ReactNode } from 'react'
import {
  Search, DatabaseZap, Globe, Zap, Layers, ListTodo, Clock, Radio, Bot,
  Folder, MessageSquareText, FolderKanban, Plus,
} from 'lucide-react'
import { McpIcon } from '@/components/icons/McpIcon'
import {
  DropdownMenu,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { SidebarItem } from './LeftSidebar'

export interface SidebarNavInput {
  t: (key: string, options?: Record<string, unknown>) => string
  navState: any
  sources: any
  workspaceProjectItems: any
  sidebarTrailingIconButtonClassName: any
  setSearchQuery: any
  setSearchActive: any
  sessionFilter: any
  routes: any
  openProjectCreateLocal: any
  openProjectCreateCloud: any
  navigate: any
  hasSessionDetail: any
  focusZone: any
  StyledDropdownMenuContent: any
  SidebarMenu: any
  MoreHorizontal: any
  DropdownMenuProvider: any
  sourceFilter: any
  sourceTypeCounts: any
  skills: any
  expertKitCount: any
  automations: any
  automationFilter: any
  automationTypeCounts: any
  isExpanded: any
  toggleExpanded: any
  openAddSource: any
  openAddSkill: any
  openAddAutomation: any
  globalSearchHotkey: any
  setGlobalSearchOpen: any
  unboundSessionItems: any
  handleSourcesClick: any
  handleSourcesApiClick: any
  handleSourcesMcpClick: any
  handleSkillsClick: any
  handleSettingsClick: any
  handleAutomationsClick: any
  handleAutomationsScheduledClick: any
  handleAutomationsEventClick: any
  handleAutomationsAgenticClick: any
  handleConversationsClick: any
  isSkillsNavigation: any
  isSourcesNavigation: any
  isAutomationsNavigation: any
  isSettingsNavigation: any
}

/* eslint-disable @typescript-eslint/no-explicit-any -- the inputs keep the
   shapes they had as locals; typing them properly is the next extraction, not
   this one, and inventing types here would make the move a rewrite. */
export function buildSidebarNav(input: SidebarNavInput): SidebarItem[] {
  const {
    t,
    navState,
    sources,
    workspaceProjectItems,
    sidebarTrailingIconButtonClassName,
    setSearchQuery,
    setSearchActive,
    sessionFilter,
    routes,
    openProjectCreateLocal,
    openProjectCreateCloud,
    navigate,
    hasSessionDetail,
    focusZone,
    StyledDropdownMenuContent,
    SidebarMenu,
    MoreHorizontal,
    DropdownMenuProvider,
    sourceFilter,
    sourceTypeCounts,
    skills,
    expertKitCount,
    automations,
    automationFilter,
    automationTypeCounts,
    isExpanded,
    toggleExpanded,
    openAddSource,
    openAddSkill,
    openAddAutomation,
    globalSearchHotkey,
    setGlobalSearchOpen,
    unboundSessionItems,
    handleSourcesClick,
    handleSourcesApiClick,
    handleSourcesMcpClick,
    handleSkillsClick,
    handleSettingsClick,
    handleAutomationsClick,
    handleAutomationsScheduledClick,
    handleAutomationsEventClick,
    handleAutomationsAgenticClick,
    handleConversationsClick,
    isSkillsNavigation,
    isSourcesNavigation,
    isAutomationsNavigation,
    isSettingsNavigation,
  } = input

  return [
                    // --- Global search (separate section above Sources; same SidebarButton language) ---
                    {
                      id: "nav:search",
                      title: t("sidebar.search"),
                      icon: Search,
                      variant: "ghost",
                      onClick: () => setGlobalSearchOpen(true),
                      dataTutorial: "global-search-button",
                      // Same trailing slot as source/skill counts — hotkey when known
                      label: globalSearchHotkey || undefined,
                    },
                    { id: "separator:search-tools", type: "separator" },
                    // --- Sources & Skills Section ---
                    {
                      id: "nav:sources",
                      title: t("sidebar.sources"),
                      label: String(sources.length),
                      icon: DatabaseZap,
                      variant: (isSourcesNavigation(navState) && !sourceFilter) ? "default" : "ghost",
                      onClick: handleSourcesClick,
                      dataTutorial: "sources-nav",
                      expandable: true,
                      expanded: isExpanded('nav:sources'),
                      onToggle: () => toggleExpanded('nav:sources'),
                      contextMenu: {
                        type: 'sources',
                        onAddSource: () => openAddSource(),
                      },
                      items: [
                        {
                          id: "nav:sources:api",
                          title: t("sidebar.apis"),
                          label: String(sourceTypeCounts.api),
                          icon: Globe,
                          variant: (sourceFilter?.kind === 'type' && sourceFilter.sourceType === 'api') ? "default" : "ghost",
                          onClick: handleSourcesApiClick,
                          contextMenu: {
                            type: 'sources' as const,
                            onAddSource: () => openAddSource('api'),
                            sourceType: 'api',
                          },
                        },
                        {
                          id: "nav:sources:mcp",
                          title: t("sidebar.mcps"),
                          label: String(sourceTypeCounts.mcp),
                          icon: <McpIcon className="h-3.5 w-3.5" />,
                          variant: (sourceFilter?.kind === 'type' && sourceFilter.sourceType === 'mcp') ? "default" : "ghost",
                          onClick: handleSourcesMcpClick,
                          contextMenu: {
                            type: 'sources' as const,
                            onAddSource: () => openAddSource('mcp'),
                            sourceType: 'mcp',
                          },
                        },
                      ],
                    },
                    {
                      id: "nav:skills",
                      title: t("sidebar.skills"),
                      label: String(skills.length),
                      icon: Zap,
                      variant: isSkillsNavigation(navState) ? "default" : "ghost",
                      onClick: handleSkillsClick,
                      contextMenu: {
                        type: 'skills',
                        onAddSkill: openAddSkill,
                      },
                    },
                    {
                      // Expert kits sat only in Settings, three levels from the
                      // sidebar that already lists Skills and Data sources — the
                      // two things a kit is made of. A capability reachable only
                      // through a settings page is a capability most people
                      // never find.
                      id: "nav:expertKits",
                      title: t("sidebar.expertKits"),
                      label: String(expertKitCount),
                      icon: Layers,
                      variant: "ghost",
                      onClick: () => handleSettingsClick('expert-kits'),
                    },
                    {
                      id: "nav:automations",
                      title: t("sidebar.automations"),
                      label: String(automations.length),
                      icon: ListTodo,
                      variant: (isAutomationsNavigation(navState) && !automationFilter) ? "default" : "ghost",
                      onClick: handleAutomationsClick,
                      expandable: true,
                      expanded: isExpanded('nav:automations'),
                      onToggle: () => toggleExpanded('nav:automations'),
                      contextMenu: {
                        type: 'automations' as const,
                        onAddAutomation: openAddAutomation,
                      },
                      items: [
                        {
                          id: "nav:automations:scheduled",
                          title: t("sidebar.scheduled"),
                          label: String(automationTypeCounts.scheduled),
                          icon: Clock,
                          variant: (automationFilter?.kind === 'type' && automationFilter.automationType === 'scheduled') ? "default" : "ghost",
                          onClick: handleAutomationsScheduledClick,
                          contextMenu: { type: 'automations' as const, onAddAutomation: openAddAutomation },
                        },
                        {
                          id: "nav:automations:event",
                          title: t("sidebar.eventBased"),
                          label: String(automationTypeCounts.event),
                          icon: Radio,
                          variant: (automationFilter?.kind === 'type' && automationFilter.automationType === 'event') ? "default" : "ghost",
                          onClick: handleAutomationsEventClick,
                          contextMenu: { type: 'automations' as const, onAddAutomation: openAddAutomation },
                        },
                        {
                          id: "nav:automations:agentic",
                          title: t("sidebar.agentic"),
                          label: String(automationTypeCounts.agentic),
                          icon: Bot,
                          variant: (automationFilter?.kind === 'type' && automationFilter.automationType === 'agentic') ? "default" : "ghost",
                          onClick: handleAutomationsAgenticClick,
                          contextMenu: { type: 'automations' as const, onAddAutomation: openAddAutomation },
                        },
                      ],
                    },
                    { id: "separator:tools-projects", type: "separator" },
                    {
                      id: "nav:projects",
                      title: t("sidebar.projects"),
                      // This is a disclosure heading, not a second Project home.
                      // Pointer and unified keyboard activation both toggle this same branch.
                      variant: "ghost" as const,
                      onClick: () => toggleExpanded('nav:projects'),
                      expandable: workspaceProjectItems.length > 0,
                      expanded: isExpanded('nav:projects'),
                      onToggle: () => toggleExpanded('nav:projects'),
                      contextMenu: {
                        type: 'projects' as const,
                        onAddProject: openProjectCreateLocal,
                        onAddCloudProject: openProjectCreateCloud,
                        // R1: Project home for folder-projects is Project Settings (Workspace
                        // authority), not the nested v0.11 projects list.
                        onManageProjects: () => navigate(routes.view.settings('workspace')),
                      },
                      // Create and more are independent controls; neither activates the heading.
                      trailingAction: (
                        <>
                          <button
                            type="button"
                            className={sidebarTrailingIconButtonClassName}
                            aria-label={t('sidebar.newProject')}
                            title={t('sidebar.newProject')}
                            onClick={(event) => {
                              event.stopPropagation()
                              openProjectCreateLocal()
                            }}
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                type="button"
                                className={sidebarTrailingIconButtonClassName}
                                aria-label={t('common.more')}
                                title={t('common.more')}
                                onClick={(event) => event.stopPropagation()}
                              >
                                <MoreHorizontal className="h-3.5 w-3.5" />
                              </button>
                            </DropdownMenuTrigger>
                            <StyledDropdownMenuContent align="start" side="right">
                              <DropdownMenuProvider>
                                <SidebarMenu
                                  type="projects"
                                  onAddProject={openProjectCreateLocal}
                                  onAddCloudProject={openProjectCreateCloud}
                                  onManageProjects={() => navigate(routes.view.settings('workspace'))}
                                />
                              </DropdownMenuProvider>
                            </StyledDropdownMenuContent>
                          </DropdownMenu>
                        </>
                      ),
                      trailingActionSlots: 2,
                      items: workspaceProjectItems,
                    },
                    // Folder-less work is a sibling of Projects (R1 clause 1). Click = list all unbound.
                    {
                      id: "nav:conversations",
                      title: t("sidebar.conversations"),
                      icon: MessageSquareText,
                      // Exclusive like 自动化: header only when 对话 list is open without a session leaf.
                      variant: (
                        sessionFilter?.kind === 'conversations' && !hasSessionDetail
                          ? "default"
                          : "ghost"
                      ) as "default" | "ghost",
                      onClick: handleConversationsClick,
                      expandable: unboundSessionItems.length > 0,
                      expanded: isExpanded('nav:conversations'),
                      onToggle: () => toggleExpanded('nav:conversations'),
                      // Same trailing "+" slot/hover language as 项目; creates folder-less work.
                      trailingAction: (
                        <button
                          type="button"
                          className={sidebarTrailingIconButtonClassName}
                          aria-label={t('sidebar.newConversation')}
                          title={t('sidebar.newConversation')}
                          onClick={(event) => {
                            event.stopPropagation()
                            setSearchActive(false)
                            setSearchQuery('')
                            navigate(routes.action.newSession({ workdir: 'none' }))
                            setTimeout(() => focusZone('chat', { intent: 'programmatic' }), 50)
                          }}
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      ),
                      items: unboundSessionItems,
                    },
  ]
}
