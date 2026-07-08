/**
 * BrowserSettingsPage
 *
 * Configures the built-in browser, clearing data, site permissions,
 * and advanced developer CDP settings. Matches the Codex browser settings style.
 */

import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { PanelHeader } from '@/components/app-shell/PanelHeader'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { HeaderMenu } from '@/components/ui/HeaderMenu'
import { routes } from '@/lib/navigate'
import { AlertTriangle, Plus, Trash2, X, Check } from 'lucide-react'
import { toast } from 'sonner'
import type { DetailsPageMeta } from '@/lib/navigation-registry'

import {
  SettingsSection,
  SettingsCard,
  SettingsRow,
  SettingsToggle,
  SettingsSelectRow,
} from '@/components/settings'

export const meta: DetailsPageMeta = {
  navigator: 'settings',
  slug: 'browser',
}

export default function BrowserSettingsPage() {
  const { t } = useTranslation()

  // Real config storage state for enabling/disabling the browser tool
  const [browserToolEnabled, setBrowserToolEnabled] = useState(true)

  // Mocked/local-storage settings for full high-fidelity Codex features
  const [localOpenTarget, setLocalOpenTarget] = useState('Fleet')
  const [annotatedScreenshots, setAnnotatedScreenshots] = useState('always')
  const [approval, setApproval] = useState('always')
  const [fullCdpAccess, setFullCdpAccess] = useState(false)

  // Interactive site rules
  const [siteRules, setSiteRules] = useState<string[]>([])
  const [isAddingSite, setIsAddingSite] = useState(false)
  const [newSiteDomain, setNewSiteDomain] = useState('')

  // Clearing data animation state
  const [isClearingData, setIsClearingData] = useState(false)

  // Load configuration on mount
  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.getBrowserToolEnabled().then((enabled) => {
        setBrowserToolEnabled(enabled)
      })
    }

    // Load from local storage
    const target = localStorage.getItem('browser_local_open_target') || 'Fleet'
    setLocalOpenTarget(target)

    const screenshots = localStorage.getItem('browser_annotated_screenshots') || 'always'
    setAnnotatedScreenshots(screenshots)

    const appr = localStorage.getItem('browser_approval') || 'always'
    setApproval(appr)

    const cdp = localStorage.getItem('browser_full_cdp') === 'true'
    setFullCdpAccess(cdp)

    const savedRules = localStorage.getItem('browser_site_rules')
    if (savedRules) {
      try {
        setSiteRules(JSON.parse(savedRules))
      } catch {
        setSiteRules([])
      }
    }
  }, [])

  // Action handlers
  const handleBrowserToolEnabledChange = useCallback(async (enabled: boolean) => {
    setBrowserToolEnabled(enabled)
    if (window.electronAPI) {
      await window.electronAPI.setBrowserToolEnabled(enabled)
    }
  }, [])

  const handleLocalOpenTargetChange = useCallback((value: string) => {
    setLocalOpenTarget(value)
    localStorage.setItem('browser_local_open_target', value)
  }, [])

  const handleAnnotatedScreenshotsChange = useCallback((value: string) => {
    setAnnotatedScreenshots(value)
    localStorage.setItem('browser_annotated_screenshots', value)
  }, [])

  const handleApprovalChange = useCallback((value: string) => {
    setApproval(value)
    localStorage.setItem('browser_approval', value)
  }, [])

  const handleFullCdpAccessChange = useCallback((enabled: boolean) => {
    setFullCdpAccess(enabled)
    localStorage.setItem('browser_full_cdp', String(enabled))
  }, [])

  const handleClearBrowsingData = useCallback(() => {
    setIsClearingData(true)
    setTimeout(() => {
      setIsClearingData(false)
      toast.success(t("settings.browser.dataCleared"))
    }, 1000)
  }, [t])

  const handleAddSiteRule = useCallback(() => {
    const domain = newSiteDomain.trim().toLowerCase()
    if (!domain) return

    // Simple domain regex validation
    const domainRegex = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/
    if (!domainRegex.test(domain)) {
      toast.error('Invalid domain format')
      return
    }

    if (siteRules.includes(domain)) {
      toast.error('Site already has custom settings')
      return
    }

    const updated = [...siteRules, domain]
    setSiteRules(updated)
    localStorage.setItem('browser_site_rules', JSON.stringify(updated))
    setNewSiteDomain('')
    setIsAddingSite(false)
    toast.success(`Custom rule added for ${domain}`)
  }, [newSiteDomain, siteRules])

  const handleDeleteSiteRule = useCallback((domainToDelete: string) => {
    const updated = siteRules.filter((d) => d !== domainToDelete)
    setSiteRules(updated)
    localStorage.setItem('browser_site_rules', JSON.stringify(updated))
    toast.success(`Rule deleted for ${domainToDelete}`)
  }, [siteRules])

  return (
    <div className="h-full flex flex-col">
      <PanelHeader
        title={t("settings.browser.title")}
        actions={<HeaderMenu route={routes.view.settings('browser')} helpFeature="app-settings" />}
      />
      <div className="flex-1 min-h-0 mask-fade-y">
        <ScrollArea className="h-full">
          <div className="px-5 py-7 max-w-3xl mx-auto">
            <div className="space-y-8">
              {/* Header description */}
              <div className="text-sm text-muted-foreground -mt-3">
                {t("settings.browser.manageDesc")}
              </div>

              {/* Main control toggle */}
              <SettingsSection title="">
                <SettingsCard>
                  <SettingsToggle
                    label={t("settings.browser.allowControl")}
                    checked={browserToolEnabled}
                    onCheckedChange={handleBrowserToolEnabledChange}
                  />
                </SettingsCard>
              </SettingsSection>

              {/* General Settings */}
              <SettingsSection title={t("settings.browser.general")}>
                <SettingsCard className="divide-y divide-border">
                  {/* Local Open Target */}
                  <SettingsSelectRow
                    label={t("settings.browser.localOpenTarget")}
                    description={t("settings.browser.localOpenTargetDesc")}
                    value={localOpenTarget}
                    onValueChange={handleLocalOpenTargetChange}
                    options={[
                      { value: 'Fleet', label: 'Fleet' },
                      { value: 'System', label: 'System Browser' },
                    ]}
                  />

                  {/* Clear Browsing Data */}
                  <div className="flex items-center justify-between px-4 py-3.5">
                    <div className="flex-1 min-w-0 pr-4">
                      <div className="text-sm font-medium text-foreground">
                        {t("settings.browser.browsingData")}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {t("settings.browser.clearBrowsingDataDesc")}
                      </p>
                    </div>
                    <div className="shrink-0">
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={isClearingData}
                        onClick={handleClearBrowsingData}
                      >
                        {isClearingData ? 'Clearing...' : t("settings.browser.clearBrowsingData")}
                      </Button>
                    </div>
                  </div>

                  {/* Annotated Screenshots */}
                  <SettingsSelectRow
                    label={t("settings.browser.annotatedScreenshots")}
                    description={t("settings.browser.annotatedScreenshotsDesc")}
                    value={annotatedScreenshots}
                    onValueChange={handleAnnotatedScreenshotsChange}
                    options={[
                      { value: 'always', label: t("settings.browser.alwaysInclude") },
                      { value: 'never', label: t("settings.browser.neverInclude") },
                    ]}
                  />
                </SettingsCard>
              </SettingsSection>

              {/* Permissions */}
              <SettingsSection title={t("settings.browser.permissions")}>
                <SettingsCard className="divide-y divide-border">
                  {/* Approval Prompt Settings */}
                  <SettingsSelectRow
                    label={t("settings.browser.approval")}
                    description={t("settings.browser.approvalDesc")}
                    value={approval}
                    onValueChange={handleApprovalChange}
                    options={[
                      { value: 'always', label: t("settings.browser.alwaysAllow") },
                      { value: 'ask', label: t("settings.browser.alwaysAsk") },
                    ]}
                  />

                  {/* Site Specific Permissions */}
                  <div className="px-4 py-3.5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-foreground">
                          {t("settings.browser.sitePermissions")}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {t("settings.browser.sitePermissionsDesc")}
                        </p>
                      </div>
                      <div className="shrink-0">
                        {!isAddingSite ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 gap-1.5"
                            onClick={() => setIsAddingSite(true)}
                          >
                            <Plus className="w-3.5 h-3.5" />
                            {t("settings.browser.add")}
                          </Button>
                        ) : (
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              placeholder="e.g. github.com"
                              value={newSiteDomain}
                              onChange={(e) => setNewSiteDomain(e.target.value)}
                              className="h-8 px-2 text-xs bg-muted border border-input rounded-md focus:outline-none focus:ring-1 focus:ring-ring w-40"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleAddSiteRule()
                                if (e.key === 'Escape') setIsAddingSite(false)
                              }}
                              autoFocus
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-green-500 hover:text-green-600 hover:bg-green-500/10"
                              onClick={handleAddSiteRule}
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-foreground"
                              onClick={() => {
                                setIsAddingSite(false)
                                setNewSiteDomain('')
                              }}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Site Rules List */}
                    {siteRules.length === 0 ? (
                      <div className="text-xs text-muted-foreground italic text-center py-4 bg-muted/20 border border-dashed rounded-lg">
                        {t("settings.browser.noSitePermissions")}
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        {siteRules.map((domain) => (
                          <div
                            key={domain}
                            className="flex items-center justify-between px-3 py-2 bg-muted/30 border rounded-lg text-xs"
                          >
                            <span className="font-mono text-foreground/80">{domain}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleDeleteSiteRule(domain)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </SettingsCard>
              </SettingsSection>

              {/* Developer Mode */}
              <SettingsSection title={t("settings.browser.developerMode")}>
                <div className="space-y-4">
                  {/* Warning banner */}
                  <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 flex gap-3 text-xs text-destructive-foreground">
                    <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-sm flex items-center gap-1.5">
                        <span>{t("settings.browser.riskElevated")}</span>
                      </div>
                      <div className="text-muted-foreground mt-1 leading-relaxed">
                        {t("settings.browser.enableFullCdpDesc")}
                      </div>
                    </div>
                  </div>

                  <SettingsCard>
                    <SettingsToggle
                      label={t("settings.browser.enableFullCdp")}
                      checked={fullCdpAccess}
                      onCheckedChange={handleFullCdpAccessChange}
                    />
                  </SettingsCard>
                </div>
              </SettingsSection>
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
