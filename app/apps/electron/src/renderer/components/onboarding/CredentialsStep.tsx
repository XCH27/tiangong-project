/**
 * CredentialsStep - Onboarding step wrapper for API key or OAuth flow
 *
 * Thin wrapper that composes ApiKeyInput or OAuthConnect controls
 * with StepFormLayout for the onboarding wizard context.
 */

import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { Check, ExternalLink, Loader2 } from "lucide-react"
import type { ApiSetupMethod } from "./APISetupStep"
import { StepFormLayout, BackButton, ContinueButton } from "./primitives"
import { Button } from "@/components/ui/button"
import {
  ApiKeyInput,
  type ApiKeyStatus,
  type ApiKeySubmitData,
  OAuthConnect,
  type OAuthStatus,
} from "../apisetup"
import type { CustomEndpointApi } from '@config/llm-connections'

export type CredentialStatus = ApiKeyStatus | OAuthStatus

interface CredentialsStepProps {
  /** Keep onboarding's centered step outside Settings; Settings uses the provider detail column. */
  presentation?: 'onboarding' | 'settings'
  apiSetupMethod: ApiSetupMethod
  status: CredentialStatus
  errorMessage?: string
  onSubmit: (data: ApiKeySubmitData) => void
  onStartOAuth?: (methodOverride?: ApiSetupMethod) => void
  onBack: () => void
  // Two-step OAuth flow
  isWaitingForCode?: boolean
  onSubmitAuthCode?: (code: string) => void
  onCancelOAuth?: () => void
  // Device flow (Copilot)
  copilotDeviceCode?: { userCode: string; verificationUri: string }
  // Edit mode (pre-fill existing connection values)
  editInitialValues?: {
    connectionSlug?: string
    apiKey?: string
    baseUrl?: string
    connectionDefaultModel?: string
    activePreset?: string
    models?: string[]
    customApi?: CustomEndpointApi
  }
}

function CredentialLayout({ presentation, title, description, actions, children }: {
  presentation: 'onboarding' | 'settings'
  title: string
  description: string
  actions: React.ReactNode
  children: React.ReactNode
}) {
  if (presentation === 'onboarding') {
    return <StepFormLayout title={title} description={description} actions={actions}>{children}</StepFormLayout>
  }
  return <div className="space-y-4">
    {description && <p className="text-xs text-muted-foreground">{description}</p>}
    {children}
    <div className="flex flex-wrap justify-end gap-2">{actions}</div>
  </div>
}

function CredentialActions({ presentation, backLabel, onBack, backDisabled, showSettingsCancel = false, primaryLabel, onPrimary, type = 'button', form, loading, loadingLabel, external = false }: {
  presentation: 'onboarding' | 'settings'
  backLabel: string
  onBack: () => void
  backDisabled?: boolean
  showSettingsCancel?: boolean
  primaryLabel: string
  onPrimary?: () => void
  type?: 'button' | 'submit'
  form?: string
  loading: boolean
  loadingLabel: string
  external?: boolean
}) {
  if (presentation === 'onboarding') {
    return <>
      <BackButton onClick={onBack} disabled={backDisabled}>{backLabel}</BackButton>
      <ContinueButton onClick={onPrimary} type={type} form={form} className={external ? 'gap-2' : undefined} loading={loading} loadingText={loadingLabel}>
        {external && <ExternalLink className="size-4" />}{primaryLabel}
      </ContinueButton>
    </>
  }
  return <>
    {showSettingsCancel && <Button size="sm" variant="outline" onClick={onBack} disabled={backDisabled}>{backLabel}</Button>}
    <Button size="sm" onClick={onPrimary} type={type} form={form} disabled={loading} className="gap-2">
      {loading ? <Loader2 className="size-3.5 animate-spin" /> : external && <ExternalLink className="size-3.5" />}
      {loading ? loadingLabel : primaryLabel}
    </Button>
  </>
}

export function CredentialsStep({
  presentation = 'onboarding',
  apiSetupMethod,
  status,
  errorMessage,
  onSubmit,
  onStartOAuth,
  onBack,
  isWaitingForCode,
  onSubmitAuthCode,
  onCancelOAuth,
  copilotDeviceCode,
  editInitialValues,
}: CredentialsStepProps) {
  const { t } = useTranslation()
  const isClaudeOAuth = apiSetupMethod === 'claude_oauth'
  const isChatGptOAuth = apiSetupMethod === 'pi_chatgpt_oauth'
  const isCopilotOAuth = apiSetupMethod === 'pi_copilot_oauth'
  const isXaiOAuth = apiSetupMethod === 'pi_xai_oauth'
  const isAnthropicApiKey = apiSetupMethod === 'anthropic_api_key'
  const isPiApiKey = apiSetupMethod === 'pi_api_key'
  const isApiKey = isAnthropicApiKey || isPiApiKey

  // Copilot device code clipboard handling
  const [copiedCode, setCopiedCode] = useState(false)

  // Auto-copy device code to clipboard when it appears
  useEffect(() => {
    if (copilotDeviceCode?.userCode) {
      navigator.clipboard.writeText(copilotDeviceCode.userCode).then(() => {
        setCopiedCode(true)
        setTimeout(() => setCopiedCode(false), 2000)
      }).catch(() => {
        // Clipboard write failed, user can still click to copy
      })
    }
  }, [copilotDeviceCode?.userCode])

  const handleCopyCode = () => {
    if (copilotDeviceCode?.userCode) {
      navigator.clipboard.writeText(copilotDeviceCode.userCode).then(() => {
        setCopiedCode(true)
        setTimeout(() => setCopiedCode(false), 2000)
      })
    }
  }

  // --- ChatGPT OAuth flow (native browser OAuth) ---
  if (isChatGptOAuth) {
    return (
      <CredentialLayout
        presentation={presentation}
        title={t("onboarding.credentials.connectChatGPT")}
        description={presentation === 'settings' ? '' : t("onboarding.credentials.connectChatGPTDesc")}
        actions={<CredentialActions presentation={presentation} backLabel={t(status === 'validating' ? 'common.cancel' : 'common.back')} onBack={status === 'validating' ? (onCancelOAuth ?? onBack) : onBack} showSettingsCancel={status === 'validating'} primaryLabel={t('onboarding.credentials.signInChatGPT')} onPrimary={() => onStartOAuth?.()} loading={status === 'validating'} loadingLabel={t('common.connecting')} external />}
      >
        <div className="space-y-4">
          <div className="rounded-xl bg-foreground-2 p-4 text-sm text-muted-foreground">
            <p>{t("onboarding.credentials.chatGPTInstructions")}</p>
          </div>
          {status === 'error' && errorMessage && (
            <div className="rounded-lg bg-destructive/10 text-destructive text-sm p-3">
              {errorMessage}
            </div>
          )}
          {status === 'success' && (
            <div className="rounded-lg bg-success/10 text-success text-sm p-3">
              {t("onboarding.credentials.chatGPTConnected")}
            </div>
          )}
        </div>
      </CredentialLayout>
    )
  }

  // --- Copilot OAuth flow (device flow) ---
  if (isCopilotOAuth || isXaiOAuth) {
    return (
      <CredentialLayout
        presentation={presentation}
        title={t(isXaiOAuth ? 'onboarding.credentials.connectGrok' : 'onboarding.credentials.connectGitHub')}
        description={presentation === 'settings' ? '' : t(isXaiOAuth ? 'onboarding.credentials.connectGrokDesc' : 'onboarding.credentials.connectGitHubDesc')}
        actions={<CredentialActions presentation={presentation} backLabel={t(status === 'validating' ? 'common.cancel' : 'common.back')} onBack={status === 'validating' ? (onCancelOAuth ?? onBack) : onBack} showSettingsCancel={status === 'validating'} primaryLabel={t(isXaiOAuth ? 'onboarding.credentials.signInGrok' : 'onboarding.credentials.signInGitHub')} onPrimary={() => onStartOAuth?.()} loading={status === 'validating'} loadingLabel={t('onboarding.credentials.waitingForAuth')} external />}
      >
        <div className="space-y-4">
          {copilotDeviceCode ? (
            <div className={presentation === 'settings' ? 'space-y-3 rounded-[6px] bg-foreground/[0.03] p-3 text-sm' : 'rounded-xl bg-foreground-2 p-4 text-sm space-y-3'}>
              <p className="text-muted-foreground">
                {t(isXaiOAuth ? 'onboarding.credentials.enterCodeOnGrok' : 'onboarding.credentials.enterCodeOnGitHub')}
              </p>
              <div className={presentation === 'settings' ? 'flex flex-wrap items-center gap-2' : 'flex flex-col items-center justify-center gap-2'}>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className={presentation === 'settings' ? 'rounded-[6px] border border-border bg-background px-3 py-1.5 font-mono text-sm font-semibold tracking-wider text-foreground hover:bg-foreground/[0.03]' : 'text-2xl font-mono font-bold tracking-widest text-foreground px-4 py-2 rounded-lg bg-background border border-border hover:bg-foreground-2 transition-colors cursor-pointer'}
                >
                  {copilotDeviceCode.userCode}
                </button>
                <span className={`text-xs text-muted-foreground flex items-center gap-1 transition-opacity ${copiedCode ? 'opacity-100' : 'opacity-0'}`}>
                  <Check className="size-3" />
                  {t("onboarding.credentials.copiedToClipboard")}
                </span>
              </div>
              <p className="text-muted-foreground text-xs">
                {t(isXaiOAuth ? 'onboarding.credentials.browserOpenedGrok' : 'onboarding.credentials.browserOpenedGitHub')}
              </p>
            </div>
          ) : (
            <div className={presentation === 'settings' ? 'text-sm text-muted-foreground' : 'rounded-xl bg-foreground-2 p-4 text-sm text-muted-foreground text-center'}>
              <p>{t(isXaiOAuth ? 'onboarding.credentials.clickToSignInGrok' : 'onboarding.credentials.clickToSignInGitHub')}</p>
            </div>
          )}
          {status === 'error' && errorMessage && (
            <div className="rounded-lg bg-destructive/10 text-destructive text-sm p-3 text-center">
              {errorMessage}
            </div>
          )}
          {status === 'success' && (
            <div className="rounded-lg bg-success/10 text-success text-sm p-3 text-center">
              {t(isXaiOAuth ? 'onboarding.credentials.grokConnected' : 'onboarding.credentials.copilotConnected')}
            </div>
          )}
        </div>
      </CredentialLayout>
    )
  }

  // --- Claude OAuth flow ---
  if (isClaudeOAuth) {
    // Waiting for authorization code entry
    if (isWaitingForCode) {
      return (
        <CredentialLayout
          presentation={presentation}
          title={t("onboarding.credentials.enterAuthCode")}
          description={t("onboarding.credentials.copyCodeInstruction")}
          actions={<CredentialActions presentation={presentation} backLabel={t('common.cancel')} onBack={onCancelOAuth ?? onBack} backDisabled={status === 'validating'} showSettingsCancel primaryLabel={t('common.continue')} type="submit" form="auth-code-form" loading={status === 'validating'} loadingLabel={t('common.connecting')} />}
        >
          <OAuthConnect
            status={status as OAuthStatus}
            errorMessage={errorMessage}
            isWaitingForCode={true}
            onStartOAuth={onStartOAuth!}
            onSubmitAuthCode={onSubmitAuthCode}
            onCancelOAuth={onCancelOAuth}
          />
        </CredentialLayout>
      )
    }

    return (
      <CredentialLayout
        presentation={presentation}
        title={t("onboarding.credentials.connectClaude")}
        description={t("onboarding.credentials.claudeSubscriptionDesc")}
        actions={<CredentialActions presentation={presentation} backLabel={t('common.back')} onBack={onBack} backDisabled={status === 'validating'} primaryLabel={t('onboarding.credentials.signInClaude')} onPrimary={() => onStartOAuth?.()} loading={status === 'validating'} loadingLabel={t('common.connecting')} external />}
      >
        <OAuthConnect
          status={status as OAuthStatus}
          errorMessage={errorMessage}
          isWaitingForCode={false}
          onStartOAuth={onStartOAuth!}
          onSubmitAuthCode={onSubmitAuthCode}
          onCancelOAuth={onCancelOAuth}
        />
      </CredentialLayout>
    )
  }

  // --- API Key flow ---
  // Determine provider type and description based on selected method
  const providerType = isPiApiKey ? 'pi_api_key' : 'anthropic'
  const apiKeyDescription = isPiApiKey
    ? t('onboarding.credentials.apiKeyDescriptionPi')
    : t('onboarding.credentials.apiKeyDescriptionAnthropic')

  const apiKeyInputKey = [
    apiSetupMethod,
    editInitialValues?.activePreset ?? '',
    editInitialValues?.connectionSlug ?? '',
    editInitialValues?.baseUrl ?? '',
    editInitialValues?.connectionDefaultModel ?? '',
    (editInitialValues?.models ?? []).join('|'),
    editInitialValues?.customApi ?? '',
  ].join('::')

  return (
    <StepFormLayout
      title={t("onboarding.credentials.apiConfiguration")}
      description={apiKeyDescription}
      actions={
        <>
          <BackButton onClick={onBack} disabled={status === 'validating'}>{t('common.back')}</BackButton>
          <ContinueButton
            type="submit"
            form="api-key-form"
            disabled={false}
            loading={status === 'validating'}
            loadingText={t("common.validating")}
          >{t('common.continue')}</ContinueButton>
        </>
      }
    >
      <ApiKeyInput
        key={apiKeyInputKey}
        status={status as ApiKeyStatus}
        errorMessage={errorMessage}
        onSubmit={onSubmit}
        providerType={providerType}
        initialValues={editInitialValues}
      />
    </StepFormLayout>
  )
}
