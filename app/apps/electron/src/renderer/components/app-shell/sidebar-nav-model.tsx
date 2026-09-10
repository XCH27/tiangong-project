/**
 * The left sidebar's item tree, as data.
 *
 * The order here is the product's claim about what this software is for. It
 * used to read: search, data sources, skills, expert kits, automations,
 * projects, conversations — every surface you configure once, above the two you
 * open every day. A person launching Fleet met four settings screens before
 * reaching their own work.
 *
 * So the tree is now in two blocks with a separator between them: **work**
 * (projects and their conversations) and **what work runs on** (sources,
 * skills, kits, automations). Craft v0.10.5 makes the same claim in its own
 * vocabulary — `nav:allSessions` is its first row and sources/skills/automations
 * sit below — so this restores the baseline's shape rather than inventing one.
 *
 * The five type rows that used to hang under Sources and Automations
 * (`nav:sources:api`, `:mcp`, `nav:automations:scheduled`, `:event`,
 * `:agentic`) are gone from the sidebar. They were filters wearing the costume
 * of places: each navigated to a route that showed the same list with one
 * predicate applied. The filters themselves are not gone — they moved into the
 * list panel's own header menu, beside the session filter that was already
 * there, and every `sources/api`-style route still resolves. Simplifying is not
 * deleting.
 */

import type { ReactNode } from 'react'
import {
  Search, DatabaseZap, Zap, Layers, ListTodo,
  Folder, MessageSquareText, FolderKanban, Plus,
} from 'lucide-react'
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
  skills: any
  expertKitCount: any
  automations: any
  isExpanded: any
  toggleExpanded: any
  openAddSource: any
  openAddSkill: any
  openAddAutomation: any
  globalSearchHotkey: any
  setGlobalSearchOpen: any
  unboundSessionItems: any
  handleSourcesClick: any
  handleSkillsClick: any
  handleSettingsClick: any
  handleAutomationsClick: any
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
    skills,
    expertKitCount,
    automations,
    isExpanded,
    toggleExpanded,
    openAddSource,
    openAddSkill,
    openAddAutomation,
    globalSearchHotkey,
    setGlobalSearchOpen,
    unboundSessionItems,
    handleSourcesClick,
    handleSkillsClick,
    handleSettingsClick,
    handleAutomationsClick,
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
                    { id: "separator:search-work", type: "separator" },
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
                    { id: "separator:work-tools", type: "separator" },
                    {
                      id: "nav:sources",
                      title: t("sidebar.sources"),
                      label: String(sources.length),
                      icon: DatabaseZap,
                      variant: isSourcesNavigation(navState) ? "default" : "ghost",
                      onClick: handleSourcesClick,
                      dataTutorial: "sources-nav",
                      contextMenu: {
                        type: 'sources',
                        onAddSource: () => openAddSource(),
                      },
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
                      variant: isAutomationsNavigation(navState) ? "default" : "ghost",
                      onClick: handleAutomationsClick,
                      contextMenu: {
                        type: 'automations' as const,
                        onAddAutomation: openAddAutomation,
                      },
                    },
  ]
}
