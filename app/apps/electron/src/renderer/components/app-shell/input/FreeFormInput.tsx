import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { AnimatePresence, motion } from 'motion/react'
import {
  Paperclip,
  ArrowUp,
  Square,
  Check,
  DatabaseZap,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Image as ImageIcon,
  Plus,
  Zap,
  Lightbulb,
  Target,
  Cloud,
  GitBranch,
  Monitor,
} from 'lucide-react'
import { Icon_Folder, Spinner } from '@craft-agent/ui'

import * as storage from '@/lib/local-storage'
import { Button } from '@/components/ui/button'
import { Kbd, KbdGroup } from '@/components/ui/kbd'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  InlineSlashCommand,
  useInlineSlashCommand,
  type SlashCommandId,
} from '@/components/ui/slash-command-menu'
import {
  InlineMentionMenu,
  useInlineMention,
  type MentionItem,
  type MentionItemType,
} from '@/components/ui/mention-menu'
import { InlineLabelMenu, useInlineLabelMenu } from '@/components/ui/label-menu'
import type { LabelConfig } from '@craft-agent/shared/labels'
import { parseMentions } from '@/lib/mentions'
import {
  RichTextInput,
  type RichTextInputHandle,
} from '@/components/ui/rich-text-input'
import { Tooltip, TooltipContent, TooltipTrigger } from '@craft-agent/ui'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuSub,
} from '@/components/ui/dropdown-menu'
import {
  StyledDropdownMenuContent,
  StyledDropdownMenuItem,
  StyledDropdownMenuSeparator,
  StyledDropdownMenuSubTrigger,
  StyledDropdownMenuSubContent,
} from '@/components/ui/styled-dropdown'
import { cn } from '@/lib/utils'
import { navigate, routes } from '@/lib/navigate'
import { coerceInputText } from '@/lib/input-text'
import { isMac } from '@/lib/platform'
import { applySmartTypography } from '@/lib/smart-typography'
import { AttachmentPreview } from '../AttachmentPreview'
import { ImageSupportWarningBanner } from './ImageSupportWarningBanner'
import {
  ANTHROPIC_MODELS,
  getModelDisplayName,
  getModelContextWindow,
  type ModelDefinition,
} from '@config/models'
import {
  resolveEffectiveConnectionSlug,
  isCompatProvider,
  modelSupportsImages,
} from '@config/llm-connections'
import { useOptionalAppShellContext } from '@/context/AppShellContext'
import { EditPopover, getEditConfig } from '@/components/ui/EditPopover'
import { SourceAvatar } from '@/components/ui/source-avatar'
import { ConnectionIcon } from '@/components/icons/ConnectionIcon'
import { derivePickerMode } from './picker-mode'
import type {
  FileAttachment,
  LoadedSource,
  LoadedSkill,
  Workspace,
} from '../../../../shared/types'
import type { PermissionMode } from '@craft-agent/shared/agent/modes'
import { type ThinkingLevel } from '@craft-agent/shared/agent/thinking-levels'
import { useEscapeInterrupt } from '@/context/EscapeInterruptContext'
import { hasOpenOverlay } from '@/lib/overlay-detection'
import { ToolbarStatusSlot } from './ToolbarStatusSlot'
import { buildPlanApprovalMessage } from '../plan-approval-message'
import {
  useApprovePlanWithCompact,
  type PlanApprovalEventDetail,
} from './use-approve-plan-with-compact'
import { shouldHandleScopedInputEvent } from './input-event-guards'
import {
  clearPendingFocusForSession,
  consumePendingFocusForSession,
} from './focus-input-events'
import {
  getRecentWorkingDirs,
  addRecentWorkingDir,
} from './working-directory-history'
import { CompactModelSelector } from './CompactModelSelector'
import { CompactThinkingSelector } from './CompactThinkingSelector'
import { ThinkingSelector } from './ThinkingSelector'
import { ModelPickerList } from './ModelPickerList'
import {
  buildModelPickerGroups,
  formatTokenCount,
  getConnectionModels,
  stripPiPrefixForDisplay,
  type ModelPickerItem,
} from './model-picker-helpers'
import { useModelVisionToggle } from './useModelVisionToggle'
import { defaultSessionOptions } from '@/hooks/useSessionOptions'
import type { WorkMode } from '@craft-agent/shared/agent/work-mode'
import type { SubscriptionQuotaSnapshot } from '@craft-agent/shared/protocol'
import { AGENTS_PLUGIN_NAME } from '@craft-agent/shared/skills/types'
import { McpIcon } from '@/components/icons/McpIcon'
import { FreeFormInputContextBadge } from './FreeFormInputContextBadge'
import {
  hasKnownContextUsage,
  projectContextUsage,
  resolveContextWindow,
} from './context-usage'
import {
  deriveExecutionTargets,
  filterWorkspacesForExecutionTarget,
  getExecutionTargetId,
  getRemoteTargetDisplayName,
} from './execution-context-options'
import type { ExecutionTarget } from './execution-context-options'
import { type ContextBreakdownSegment } from './context-breakdown'

function formatFollowUpChipText(
  text: string,
  fallback: string,
  maxLength = 50,
): string {
  const normalized = text.replace(/\s+/g, ' ').trim()
  if (!normalized) return fallback

  return normalized.length > maxLength
    ? `${normalized.slice(0, maxLength - 1).trimEnd()}…`
    : normalized
}

/** Platform-specific modifier key for keyboard shortcuts */
const cmdKey = isMac ? '⌘' : 'Ctrl'

/** Default rotating placeholders are now generated inside FreeFormInput via useMemo + t() */

/** Fisher-Yates shuffle — returns a new array in random order */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

export interface FollowUpInputItem {
  id: string
  messageId: string
  annotationId: string
  index?: number
  noteLabel: string
  selectedText: string
  color?: string
}

export interface FreeFormInputProps {
  /** Placeholder text(s) for the textarea - can be array for rotation */
  placeholder?: string | string[]
  /** Whether input is disabled */
  disabled?: boolean
  /** Whether the session is currently processing */
  isProcessing?: boolean
  /** Callback when message is submitted (skillSlugs from @mentions) */
  onSubmit: (
    message: string,
    attachments?: FileAttachment[],
    skillSlugs?: string[],
  ) => void
  /** Callback to stop processing. Pass silent=true to skip "Response interrupted" message */
  onStop?: (silent?: boolean) => void
  /** External ref for the input */
  inputRef?: React.RefObject<RichTextInputHandle>
  /** Current model ID */
  currentModel: string
  /** Callback when model changes (includes connection slug for proper persistence) */
  onModelChange: (model: string, connection?: string) => void
  // Thinking level (session-level setting)
  /** Current thinking level ('off', 'think', 'max') */
  thinkingLevel?: ThinkingLevel
  /** Callback when thinking level changes */
  onThinkingLevelChange?: (level: ThinkingLevel) => void
  /** Provider low-latency mode for this session. */
  fastMode?: boolean
  onFastModeChange?: (enabled: boolean) => void
  runtimeMode?: string | null
  onRuntimeModeChange?: (mode: string | null) => void
  // Advanced options
  permissionMode?: PermissionMode
  // Controlled input value (for persisting across mode switches and conversation changes)
  /** Current input value - if provided, component becomes controlled */
  inputValue?: string
  /** Callback when input value changes */
  onInputChange?: (value: string) => void
  /** Persisted attachment draft for this session (seeds local state on session switch) */
  attachmentsValue?: FileAttachment[]
  /** Callback when attachment list changes (add, remove, clear on send) */
  onAttachmentsChange?: (attachments: FileAttachment[]) => void
  /** When true, removes container styling (shadow, bg, rounded) - used when wrapped by InputContainer */
  unstyled?: boolean
  /** Callback when component height changes (for external animation sync) */
  onHeightChange?: (height: number) => void
  /** Callback when focus state changes */
  onFocusChange?: (focused: boolean) => void
  // Source selection
  /** Available sources (enabled only) */
  sources?: LoadedSource[]
  /** Currently enabled source slugs for this session */
  enabledSourceSlugs?: string[]
  /** Callback when source selection changes */
  onSourcesChange?: (slugs: string[]) => void
  // Skill selection (for @mentions)
  /** Available skills for @mention autocomplete */
  skills?: LoadedSkill[]
  // Label selection (for #labels)
  /** Available labels for #label autocomplete */
  labels?: LabelConfig[]
  /** Currently applied session labels */
  sessionLabels?: string[]
  /** Callback when a label is added via # menu */
  onLabelAdd?: (labelId: string) => void
  /** Workspace ID for loading skill icons */
  workspaceId?: string
  /** Current working directory path */
  workingDirectory?: string
  /** Callback when working directory changes */
  onWorkingDirectoryChange?: (path: string) => void
  /** Change the execution workspace for an empty session. */
  onExecutionWorkspaceChange?: (
    workspaceId: string,
    workspace?: Workspace,
  ) => void
  /** Session folder path (for "Reset to Session Root" option) */
  sessionFolderPath?: string
  /** Session ID for scoping events like approve-plan */
  sessionId?: string
  /** Current session status of the session (for # menu state selection) */
  currentSessionStatus?: string
  /** Disable send action (for tutorial guidance) */
  disableSend?: boolean
  /** Whether the session is empty (no messages yet) - affects context badge prominence */
  isEmptySession?: boolean
  /** Context status for showing compaction indicator and token usage */
  contextStatus?: {
    /** True when SDK is actively compacting the conversation */
    isCompacting?: boolean
    /** Input tokens used so far in this session */
    inputTokens?: number
    /** Model's context window size in tokens */
    contextWindow?: number
    /** Accumulated output tokens for the session */
    outputTokens?: number
    /** Input tokens served from the provider cache */
    cacheReadTokens?: number
    /** Input tokens written to the provider cache */
    cacheCreationTokens?: number
    /** Provider-reported accumulated session cost */
    costUsd?: number
    /** Estimated visible-message composition, scaled to the exact input total. */
    breakdown?: ContextBreakdownSegment[]
  }
  /** Follow-up annotations shown as context chips above the input */
  followUpItems?: FollowUpInputItem[]
  /** Callback when user clicks a follow-up chip body */
  onFollowUpClick?: (
    item: FollowUpInputItem,
    anchor?: { x: number; y: number },
  ) => void
  /** Callback when user clicks the follow-up index badge */
  onFollowUpIndexClick?: (item: FollowUpInputItem) => void
  /**
   * Compact-footer layout. Used by EditPopover (popover embedding) and by
   * ChatPage in auto-compact / WebUI mobile mode. The popover case hides the
   * model picker; the auto-compact case opts the compact picker in via
   * `enableCompactModelPicker`.
   */
  compactMode?: boolean
  /**
   * When `compactMode` is true, render the compact (drawer-based) model
   * selector next to the permission-mode pill. Defaults to false so that
   * EditPopover (which has no use for a model picker) keeps its current
   * behavior.
   */
  enableCompactModelPicker?: boolean
  // Connection selection (hierarchical connection → model selector)
  /** Current LLM connection slug (locked after first message) */
  currentConnection?: string
  /** Callback when connection changes (only works when session is empty) */
  onConnectionChange?: (connectionSlug: string) => void
  /** When true, the session's locked connection has been removed */
  connectionUnavailable?: boolean
  /**
   * True when the input is collapsed because the agent is processing in
   * compact mode and the user hasn't expanded it yet. Owned by
   * `InputContainer`; toggle back via `onRequestExpand`.
   */
  isCollapsedInCompact?: boolean
  /** Callback fired when the user clicks or hovers the collapsed-input strip. */
  onRequestExpand?: () => void
}

/**
 * FreeFormInput - Self-contained textarea input with attachments and controls
 *
 * Features:
 * - Auto-growing textarea
 * - File attachments via button or drag-drop
 * - Slash commands menu
 * - Model selector
 * - Active option badges
 */
export function FreeFormInput({
  placeholder,
  disabled = false,
  isProcessing = false,
  onSubmit,
  onStop,
  inputRef: externalInputRef,
  currentModel,
  onModelChange,
  thinkingLevel = 'medium',
  onThinkingLevelChange,
  fastMode = false,
  onFastModeChange,
  runtimeMode = null,
  onRuntimeModeChange,
  permissionMode = 'ask',
  inputValue,
  onInputChange,
  attachmentsValue,
  onAttachmentsChange,
  unstyled = false,
  onHeightChange,
  onFocusChange,
  sources = [],
  enabledSourceSlugs = [],
  onSourcesChange,
  skills = [],
  labels = [],
  sessionLabels = [],
  onLabelAdd,
  workspaceId,
  workingDirectory,
  onWorkingDirectoryChange,
  onExecutionWorkspaceChange,
  sessionFolderPath,
  sessionId,
  currentSessionStatus: _currentSessionStatus,
  disableSend = false,
  isEmptySession = false,
  contextStatus,
  followUpItems = [],
  onFollowUpClick,
  onFollowUpIndexClick,
  compactMode = false,
  enableCompactModelPicker = false,
  currentConnection,
  onConnectionChange,
  connectionUnavailable = false,
  isCollapsedInCompact = false,
  onRequestExpand,
}: FreeFormInputProps) {
  const { t } = useTranslation()

  // Default rotating placeholders for onboarding/empty state (i18n-aware)
  const defaultPlaceholders = React.useMemo(
    () => [
      t('chatInput.placeholder.workOn'),
      t('chatInput.placeholder.addContext'),
      t('chatInput.placeholder.mention'),
      t('chatInput.placeholder.labels'),
      t('chatInput.placeholder.newLine'),
      t('chatInput.placeholder.sidebar', { key: cmdKey }),
      t('chatInput.placeholder.focusMode', { key: cmdKey }),
    ],
    [t],
  )

  // Read connection default model, connections, and workspace info from context.
  // Uses optional variant so playground (no provider) doesn't crash.
  const appShellCtx = useOptionalAppShellContext()
  const llmConnections = React.useMemo(
    () => appShellCtx?.llmConnections ?? [],
    [appShellCtx?.llmConnections],
  )
  const workspaceDefaultConnection = appShellCtx?.workspaceDefaultLlmConnection
  const workModeOptions = sessionId
    ? (appShellCtx?.sessionOptions.get(sessionId) ?? defaultSessionOptions)
    : defaultSessionOptions
  const setWorkMode = React.useCallback(
    (selection: 'auto' | 'manual', mode?: WorkMode) => {
      if (!sessionId) return
      appShellCtx?.onSessionOptionsChange(sessionId, {
        workModeSelection: selection,
        ...(mode ? { workMode: mode } : {}),
      })
    },
    [appShellCtx, sessionId],
  )

  // Derive connectionDefaultModel per-session from the effective connection.
  // Only non-null for compat providers (custom endpoints with fixed models).
  // Standard providers (anthropic, pi) → null → normal model picker.
  const connectionDefaultModel = React.useMemo(() => {
    const effectiveSlug = resolveEffectiveConnectionSlug(
      currentConnection,
      workspaceDefaultConnection,
      llmConnections,
    )
    const conn = llmConnections.find((c) => c.slug === effectiveSlug)
    if (!conn) return null
    if (!isCompatProvider(conn.providerType)) return null
    // Allow model switching when connection has multiple models
    if (conn.models && conn.models.length > 1) return null
    return conn.defaultModel ?? null
  }, [currentConnection, workspaceDefaultConnection, llmConnections])

  // Decide which of the four picker UIs to render. The `switcher` branch
  // wins over `locked-single` so users with a single-model pi_compat default
  // can still reach the connection list on a fresh session (#727).
  const pickerMode = derivePickerMode({
    connectionUnavailable,
    connectionDefaultModel,
    isEmptySession,
    connectionCount: llmConnections.length,
  })

  // Compute available models from the effective connection.
  // All connections have models populated by backfillAllConnectionModels().
  const availableModels = React.useMemo(() => {
    // Connection removed — don't fall through to another connection's models
    if (connectionUnavailable) return []

    // Determine effective connection using the canonical fallback chain
    const effectiveSlug = resolveEffectiveConnectionSlug(
      currentConnection,
      workspaceDefaultConnection,
      llmConnections,
    )
    const connection = llmConnections.find((c) => c.slug === effectiveSlug)

    if (!connection) {
      return ANTHROPIC_MODELS // Safety net — shouldn't happen
    }

    return getConnectionModels(connection)
  }, [
    llmConnections,
    currentConnection,
    workspaceDefaultConnection,
    connectionUnavailable,
  ])

  // Get display name for current model (full name, not short name)
  const currentModelDisplayName = React.useMemo(() => {
    const modelToDisplay = connectionDefaultModel ?? currentModel
    const model = availableModels.find((m) =>
      typeof m === 'string' ? m === modelToDisplay : m.id === modelToDisplay,
    )
    if (!model) {
      // Fallback: use helper function to format unknown model IDs nicely
      return stripPiPrefixForDisplay(getModelDisplayName(modelToDisplay))
    }
    if (typeof model === 'string') return stripPiPrefixForDisplay(model)
    // Defensive: partial entries (custom-endpoint user-config or vision-toggle
    // promotions) may lack `name`. Fall back to the id so the trigger button
    // never goes blank.
    return model.name ?? stripPiPrefixForDisplay(model.id)
  }, [availableModels, currentModel, connectionDefaultModel])
  const selectedModelId = connectionDefaultModel ?? currentModel

  const allModelPickerGroups = React.useMemo(
    () => buildModelPickerGroups(llmConnections),
    [llmConnections],
  )

  // Find current connection details for display
  const currentConnectionDetails = React.useMemo(() => {
    if (!currentConnection) return null
    return llmConnections.find((c) => c.slug === currentConnection) ?? null
  }, [llmConnections, currentConnection])

  // Effective connection: canonical fallback chain (session → workspace default → global default → first)
  const effectiveConnection = resolveEffectiveConnectionSlug(
    currentConnection,
    workspaceDefaultConnection,
    llmConnections,
  )

  // Effective connection details (with fallbacks) for model list
  // Unlike currentConnectionDetails which is null when no explicit connection is set,
  // this resolves to the actual connection being used (including workspace default)
  const effectiveConnectionDetails = React.useMemo(() => {
    if (!effectiveConnection) return null
    return llmConnections.find((c) => c.slug === effectiveConnection) ?? null
  }, [llmConnections, effectiveConnection])
  const [subscriptionQuota, setSubscriptionQuota] =
    React.useState<SubscriptionQuotaSnapshot | null>(null)
  const quotaConnectionSlug =
    effectiveConnectionDetails?.authType === 'oauth'
      ? effectiveConnectionDetails.slug
      : undefined

  React.useEffect(() => {
    let active = true
    setSubscriptionQuota(null)
    if (
      !quotaConnectionSlug ||
      typeof window === 'undefined' ||
      !window.electronAPI
    ) {
      return () => {
        active = false
      }
    }
    void window.electronAPI
      .getSubscriptionQuota(quotaConnectionSlug)
      .then((snapshot) => {
        if (active) setSubscriptionQuota(snapshot)
      })
      .catch(() => {
        if (active) setSubscriptionQuota(null)
      })
    return () => {
      active = false
    }
  }, [quotaConnectionSlug])

  // A started session remains bound to its connection. Empty sessions may
  // switch provider/account, but both states use the same flat model inventory.
  const visibleModelPickerGroups = React.useMemo(
    () =>
      pickerMode === 'switcher'
        ? allModelPickerGroups
        : allModelPickerGroups.filter(
            (group) => group.connection.slug === effectiveConnection,
          ),
    [allModelPickerGroups, effectiveConnection, pickerMode],
  )

  // Workspace project root — label deep-links, WD chip identity (no dual "My Workspace" chip).
  const workspaceRootPath = React.useMemo(() => {
    if (!appShellCtx || !workspaceId) return undefined
    const match = appShellCtx.workspaces.find(
      (w) =>
        w.id === workspaceId ||
        w.remoteServer?.remoteWorkspaceId === workspaceId,
    )
    return match?.rootPath
  }, [appShellCtx, workspaceId])
  const executionWorkspace = React.useMemo(() => {
    if (!appShellCtx || !workspaceId) return undefined
    return appShellCtx.workspaces.find(
      (w) =>
        w.id === workspaceId ||
        w.remoteServer?.remoteWorkspaceId === workspaceId,
    )
  }, [appShellCtx, workspaceId])
  const executionTargets = React.useMemo(
    () => deriveExecutionTargets(appShellCtx?.workspaces ?? []),
    [appShellCtx?.workspaces],
  )
  const workspaceExecutionTargetId = executionWorkspace
    ? getExecutionTargetId(executionWorkspace)
    : 'local'
  const [executionTargetId, setExecutionTargetId] = React.useState<
    ExecutionTarget['id']
  >(workspaceExecutionTargetId)
  React.useEffect(() => {
    setExecutionTargetId(workspaceExecutionTargetId)
  }, [executionWorkspace?.id, workspaceExecutionTargetId])
  const executionTargetWorkspaces = React.useMemo(
    () =>
      filterWorkspacesForExecutionTarget(
        appShellCtx?.workspaces ?? [],
        executionTargetId,
      ),
    [appShellCtx?.workspaces, executionTargetId],
  )
  const selectedExecutionWorkspace =
    executionWorkspace &&
    getExecutionTargetId(executionWorkspace) === executionTargetId
      ? executionWorkspace
      : undefined
  const remoteTargetCount = executionTargets.filter(
    (target) => target.kind === 'remote',
  ).length

  // Workspace slug for SDK skill qualification (server-computed)
  // SDK expects "workspaceSlug:skillSlug" format, NOT UUID
  const workspaceSlug = React.useMemo(() => {
    if (!appShellCtx || !workspaceId) return workspaceId
    return (
      appShellCtx.workspaces.find((w) => w.id === workspaceId)?.slug ??
      workspaceId
    )
  }, [appShellCtx, workspaceId])

  // Read panel focus state from context (for multi-panel unfocused styling)
  const appShellContext = useOptionalAppShellContext()
  const isFocusedPanel = appShellContext?.isFocusedPanel ?? true

  // Shuffle placeholder order once per mount so each session feels fresh.
  // In compact mode, suppress desktop-keyboard guidance that is noisy or misleading
  // on narrow/mobile-like layouts.
  const effectivePlaceholderProp = React.useMemo(() => {
    const candidate = placeholder ?? defaultPlaceholders
    if (!Array.isArray(candidate)) return candidate
    if (!compactMode) return candidate
    return candidate.filter((entry) => {
      const lower = entry.toLowerCase()
      return (
        !lower.includes('shift + tab') &&
        !lower.includes('shift + return') &&
        !lower.includes('toggle the sidebar') &&
        !lower.includes('focus mode') &&
        !lower.includes('⌘') &&
        !lower.includes('ctrl')
      )
    })
  }, [placeholder, defaultPlaceholders, compactMode])

  // Hide placeholder entirely when panel is unfocused in multi-panel layout
  const shuffledPlaceholder = React.useMemo(
    () =>
      Array.isArray(effectivePlaceholderProp)
        ? shuffleArray(effectivePlaceholderProp)
        : effectivePlaceholderProp,
    [effectivePlaceholderProp],
  )
  const effectivePlaceholder = isFocusedPanel ? shuffledPlaceholder : ''

  // Performance optimization: Always use internal state for typing to avoid parent re-renders
  // Sync FROM parent on mount/change (for restoring drafts)
  // Sync TO parent on blur/submit (debounced persistence)
  const [input, setInput] = React.useState(() => coerceInputText(inputValue))
  const [attachments, setAttachments] = React.useState<FileAttachment[]>(
    attachmentsValue ?? [],
  )

  // Ref to track current attachments for use in event handlers (avoids stale closure issues)
  const attachmentsRef = React.useRef<FileAttachment[]>([])
  React.useEffect(() => {
    attachmentsRef.current = attachments
  }, [attachments])

  // Seed from parent when `attachmentsValue` changes (e.g., switching sessions).
  // `skipPersistRef` tells the save effect below that the next `attachments` change
  // is a prop-driven seed, not user intent — otherwise we'd echo the seed back to
  // the parent and risk persisting A's attachments under B's sessionId.
  const attachmentsRefsKey = React.useMemo(() => {
    if (!attachmentsValue) return ''
    return attachmentsValue.map((a) => a.path).join('|')
  }, [attachmentsValue])
  const prevAttachmentsRefsKey = React.useRef(attachmentsRefsKey)
  const skipPersistRef = React.useRef(true) // treat initial mount as a prop-seed
  React.useEffect(() => {
    if (attachmentsValue === undefined) return
    if (attachmentsRefsKey === prevAttachmentsRefsKey.current) return
    prevAttachmentsRefsKey.current = attachmentsRefsKey
    skipPersistRef.current = true
    setAttachments(attachmentsValue)
  }, [attachmentsValue, attachmentsRefsKey])

  // Persist user-initiated attachment changes back to the parent. The parent stores
  // refs (path + name) and debounces the disk write, so we fire eagerly on every
  // change — add/remove/send-clear.
  const onAttachmentsChangeRef = React.useRef(onAttachmentsChange)
  onAttachmentsChangeRef.current = onAttachmentsChange
  React.useEffect(() => {
    if (skipPersistRef.current) {
      skipPersistRef.current = false
      return
    }
    onAttachmentsChangeRef.current?.(attachments)
  }, [attachments])

  // Optimistic state for source selection - updates UI immediately before IPC round-trip completes
  const [optimisticSourceSlugs, setOptimisticSourceSlugs] =
    React.useState(enabledSourceSlugs)

  // Sync from prop when server state changes (reconciles after IPC or on external updates)
  // Use content comparison (not reference) to avoid infinite loops with empty arrays
  const prevEnabledSourceSlugsRef = React.useRef(enabledSourceSlugs)
  React.useEffect(() => {
    const prev = prevEnabledSourceSlugsRef.current
    const changed =
      enabledSourceSlugs.length !== prev.length ||
      enabledSourceSlugs.some((slug, i) => slug !== prev[i])

    if (changed) {
      setOptimisticSourceSlugs(enabledSourceSlugs)
      prevEnabledSourceSlugsRef.current = enabledSourceSlugs
    }
  }, [enabledSourceSlugs])

  // Sync from parent when inputValue changes externally (e.g., switching sessions)
  const prevInputValueRef = React.useRef(coerceInputText(inputValue))
  React.useEffect(() => {
    if (inputValue === undefined) return
    const nextInputValue = coerceInputText(inputValue)
    if (nextInputValue !== prevInputValueRef.current) {
      setInput(nextInputValue)
      prevInputValueRef.current = nextInputValue
    }
  }, [inputValue])

  // Debounced sync to parent (saves draft without blocking typing)
  const syncTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)
  // Tracked setTimeout(0) focus calls — cleared on unmount so they never fire
  // against a detached input.
  const focusTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  React.useEffect(
    () => () => {
      if (focusTimeoutRef.current) clearTimeout(focusTimeoutRef.current)
    },
    [],
  )
  const syncToParent = React.useCallback(
    (value: string) => {
      if (!onInputChange) return
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current)
      syncTimeoutRef.current = setTimeout(() => {
        onInputChange(value)
        prevInputValueRef.current = value
      }, 300) // Debounce 300ms
    },
    [onInputChange],
  )

  // Sync immediately on unmount to preserve input across mode switches
  // Also cleanup any pending debounced sync
  const inputRef = React.useRef(input)
  inputRef.current = input // Keep ref in sync with state

  React.useEffect(() => {
    return () => {
      // Cancel pending debounced sync
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current)
      // Immediately sync current value to parent on unmount
      // This preserves input when switching to structured input (e.g., permission request)
      if (onInputChange && inputRef.current !== prevInputValueRef.current) {
        onInputChange(inputRef.current)
      }
    }
  }, [onInputChange])

  const [isDraggingOver, setIsDraggingOver] = React.useState(false)
  const [loadingCount, setLoadingCount] = React.useState(0)
  const [isFocused, setIsFocused] = React.useState(false)
  const [inputMaxHeight, setInputMaxHeight] = React.useState(540)
  const [modelDropdownOpen, setModelDropdownOpen] = React.useState(false)
  const [addSkillPopoverOpen, setAddSkillPopoverOpen] = React.useState(false)
  const [addMcpPopoverOpen, setAddMcpPopoverOpen] = React.useState(false)

  // Input settings (loaded from config)
  const [autoCapitalisation, setAutoCapitalisation] = React.useState(true)
  const [sendMessageKey, setSendMessageKey] = React.useState<
    'enter' | 'cmd-enter'
  >('enter')
  const [spellCheck, setSpellCheck] = React.useState(false)

  // Load input settings on mount
  React.useEffect(() => {
    const loadInputSettings = async () => {
      if (!window.electronAPI) return
      try {
        const [autoCapEnabled, sendKey, spellCheckEnabled] = await Promise.all([
          window.electronAPI.getAutoCapitalisation(),
          window.electronAPI.getSendMessageKey(),
          window.electronAPI.getSpellCheck(),
        ])
        setAutoCapitalisation(autoCapEnabled)
        setSendMessageKey(sendKey ?? 'enter')
        setSpellCheck(spellCheckEnabled)
      } catch (error) {
        console.error('Failed to load input settings:', error)
      }
    }
    loadInputSettings()
  }, [])

  // Double-Esc interrupt: show warning overlay on first Esc, interrupt on second
  const { showEscapeOverlay } = useEscapeInterrupt()

  // Calculate max height: min(66% of window height, 540px)
  React.useEffect(() => {
    const updateMaxHeight = () => {
      const maxFromWindow = Math.floor(window.innerHeight * 0.66)
      setInputMaxHeight(Math.min(maxFromWindow, 540))
    }
    updateMaxHeight()
    window.addEventListener('resize', updateMaxHeight)
    return () => window.removeEventListener('resize', updateMaxHeight)
  }, [])

  const dragCounterRef = React.useRef(0)
  const containerRef = React.useRef<HTMLDivElement>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  // Merge refs for RichTextInput
  const internalInputRef = React.useRef<RichTextInputHandle>(null)
  const richInputRef = externalInputRef || internalInputRef

  // Track last caret position for focus restoration (e.g., after permission mode popover closes)
  const lastCaretPositionRef = React.useRef<number | null>(null)

  // Listen for craft:insert-text events (generic mechanism for inserting text into input)
  // Used by components that want to pre-fill the input with text
  React.useEffect(() => {
    const handleInsertText = (
      e: CustomEvent<{ text: string; sessionId?: string }>,
    ) => {
      const targetSessionId = e.detail?.sessionId
      if (
        !shouldHandleScopedInputEvent({
          sessionId,
          isFocusedPanel,
          targetSessionId,
        })
      )
        return

      const text = coerceInputText(e.detail?.text)
      setInput(text)
      syncToParent(text)
      // Focus the input after inserting
      if (focusTimeoutRef.current) clearTimeout(focusTimeoutRef.current)
      focusTimeoutRef.current = setTimeout(() => {
        richInputRef.current?.focus()
        // Move cursor to end
        richInputRef.current?.setSelectionRange(text.length, text.length)
      }, 0)
    }

    window.addEventListener(
      'craft:insert-text',
      handleInsertText as EventListener,
    )
    return () =>
      window.removeEventListener(
        'craft:insert-text',
        handleInsertText as EventListener,
      )
  }, [sessionId, isFocusedPanel, syncToParent, richInputRef])

  const clearInputDraft = React.useCallback(() => {
    setInput('')
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current)
    onInputChange?.('')
    prevInputValueRef.current = ''
  }, [onInputChange])

  const handleToggleModelVision = useModelVisionToggle()

  const consumeInputDraftSnapshot = React.useCallback((): string => {
    const snapshot = input.trim()
    clearInputDraft()
    return snapshot
  }, [input, clearInputDraft])

  // Listen for craft:approve-plan events (used by ResponseCard's Accept Plan button).
  // The server owns the Plan → Execute transition and preserves the configured
  // execution approval posture.
  // Only process events for this session (sessionId must match)
  React.useEffect(() => {
    const handleApprovePlan = (e: CustomEvent<PlanApprovalEventDetail>) => {
      // Only handle if this event is for our session
      if (e.detail?.sessionId && e.detail.sessionId !== sessionId) {
        return
      }

      const shouldIncludeDraft = e.detail?.includeDraftInput !== false
      const draftInput = shouldIncludeDraft ? consumeInputDraftSnapshot() : ''
      const text = buildPlanApprovalMessage(
        {
          planPath: e.detail?.planPath,
          draftInput,
        },
        t,
      )

      onSubmit(text, undefined)
    }

    window.addEventListener(
      'craft:approve-plan',
      handleApprovePlan as EventListener,
    )
    return () =>
      window.removeEventListener(
        'craft:approve-plan',
        handleApprovePlan as EventListener,
      )
  }, [sessionId, onSubmit, consumeInputDraftSnapshot])

  // Accept & Compact flow (listener bookkeeping extracted for lifecycle safety)
  useApprovePlanWithCompact({ sessionId, onSubmit, consumeInputDraftSnapshot })

  // Reload recovery: Check for pending plan execution on mount.
  // If the page reloaded after compaction completed (awaitingCompaction = false),
  // we need to send the plan execution message that was interrupted by the reload.
  // Also listen for compaction-complete in case CMD+R happened during compaction.
  React.useEffect(() => {
    if (!sessionId) return

    let hasExecuted = false

    const isExpectedReconnectError = (error: unknown): boolean => {
      const message = error instanceof Error ? error.message : String(error)
      return (
        message.includes('Connection closed') ||
        message.includes('Client disconnected') ||
        message.includes('transport') ||
        message.includes('socket')
      )
    }

    const executePendingPlan = async () => {
      if (hasExecuted) return

      try {
        const pending =
          await window.electronAPI.getPendingPlanExecution(sessionId)
        if (
          !pending ||
          pending.awaitingCompaction ||
          pending.executionDispatched
        )
          return

        // Mark dispatched before sending so reload recovery does not double-submit
        // the same plan if onSubmit succeeds but cleanup fails during a reconnect.
        await window.electronAPI.sessionCommand(sessionId, {
          type: 'markPendingPlanExecutionDispatched',
        })

        // Compaction completed but we never sent the execution message (page reloaded).
        // Send it now and clear the pending state.
        hasExecuted = true
        const executionMessage = buildPlanApprovalMessage(
          {
            planPath: pending.planPath,
            draftInput: pending.draftInputSnapshot,
          },
          t,
        )
        onSubmit(executionMessage, undefined)

        await window.electronAPI.sessionCommand(sessionId, {
          type: 'clearPendingPlanExecution',
        })
      } catch (error) {
        if (!isExpectedReconnectError(error)) {
          console.error(
            '[FreeFormInput] Failed to resume pending plan execution:',
            error,
          )
        }
      }
    }

    // Check immediately on mount (handles case where compaction already completed)
    executePendingPlan()

    // Also listen for compaction-complete in case CMD+R happened during compaction.
    // When compaction finishes after reload, this listener will trigger execution.
    const handleCompactionComplete = async (
      e: CustomEvent<{ sessionId: string }>,
    ) => {
      if (e.detail?.sessionId !== sessionId) return
      // Small delay to ensure markCompactionComplete has been called
      await new Promise((resolve) => setTimeout(resolve, 100))
      executePendingPlan()
    }

    window.addEventListener(
      'craft:compaction-complete',
      handleCompactionComplete as unknown as EventListener,
    )
    return () => {
      window.removeEventListener(
        'craft:compaction-complete',
        handleCompactionComplete as unknown as EventListener,
      )
    }
  }, [sessionId, onSubmit])

  // Listen for craft:focus-input events (restore focus after popover/dropdown closes)
  React.useEffect(() => {
    const handleFocusInput = (e: Event) => {
      const detail = (e as CustomEvent<{ sessionId?: string }>).detail
      const targetSessionId = detail?.sessionId
      if (
        !shouldHandleScopedInputEvent({
          sessionId,
          isFocusedPanel,
          targetSessionId,
        })
      )
        return

      if (targetSessionId) {
        clearPendingFocusForSession(targetSessionId)
      }

      richInputRef.current?.focus()
      // Restore caret position if saved, then clear it (one-shot)
      if (lastCaretPositionRef.current !== null) {
        richInputRef.current?.setSelectionRange(
          lastCaretPositionRef.current,
          lastCaretPositionRef.current,
        )
        lastCaretPositionRef.current = null
      }
    }

    window.addEventListener('craft:focus-input', handleFocusInput)
    return () =>
      window.removeEventListener('craft:focus-input', handleFocusInput)
  }, [sessionId, isFocusedPanel, richInputRef])

  // Recover queued focus requests after session switch/mount races.
  React.useEffect(() => {
    if (!consumePendingFocusForSession(sessionId)) return

    focusTimeoutRef.current = setTimeout(() => {
      richInputRef.current?.focus()
    }, 0)
    return () => {
      if (focusTimeoutRef.current) clearTimeout(focusTimeoutRef.current)
    }
  }, [sessionId, richInputRef])

  // Get the next available number for a pasted file prefix (e.g., pasted-image-1, pasted-image-2)
  const getNextPastedNumber = (
    prefix: 'image' | 'text' | 'file',
    existingAttachments: FileAttachment[],
  ): number => {
    const pattern = new RegExp(`^pasted-${prefix}-(\\d+)\\.`)
    let maxNum = 0
    for (const att of existingAttachments) {
      const match = att.name.match(pattern)
      if (match) {
        maxNum = Math.max(maxNum, parseInt(match[1], 10))
      }
    }
    return maxNum + 1
  }

  // Listen for craft:paste-files events (for global paste when input not focused)
  React.useEffect(() => {
    const handlePasteFiles = async (
      e: CustomEvent<{ files: File[]; sessionId?: string }>,
    ) => {
      if (disabled) return

      const targetSessionId = e.detail?.sessionId
      if (
        !shouldHandleScopedInputEvent({
          sessionId,
          isFocusedPanel,
          targetSessionId,
        })
      )
        return

      const { files } = e.detail
      if (!files || files.length === 0) return

      setLoadingCount((prev) => prev + files.length)

      // Pre-assign sequential names using ref to avoid race conditions
      let nextImageNum = getNextPastedNumber('image', attachmentsRef.current)
      const fileNames: string[] = files.map((file) => {
        if (
          !file.name ||
          file.name === 'image.png' ||
          file.name === 'image.jpg' ||
          file.name === 'blob'
        ) {
          const ext = file.type.split('/')[1] || 'png'
          return `pasted-image-${nextImageNum++}.${ext}`
        }
        return file.name
      })

      for (let i = 0; i < files.length; i++) {
        try {
          const attachment = await readFileAsAttachment(files[i], fileNames[i])
          if (attachment) {
            setAttachments((prev) => [...prev, attachment])
          }
        } catch (error) {
          console.error('[FreeFormInput] Failed to process pasted file:', error)
        }
        setLoadingCount((prev) => prev - 1)
      }

      // Focus the input after adding attachments
      richInputRef.current?.focus()
    }

    window.addEventListener(
      'craft:paste-files',
      handlePasteFiles as unknown as EventListener,
    )
    return () =>
      window.removeEventListener(
        'craft:paste-files',
        handlePasteFiles as unknown as EventListener,
      )
  }, [disabled, sessionId, isFocusedPanel, richInputRef])

  // Active agent for slash menu highlight (OpenCode: build | plan only)
  const activeCommands = React.useMemo(() => {
    const agent = workModeOptions.workMode === 'plan' ? 'plan' : 'execute'
    return [agent] as SlashCommandId[]
  }, [workModeOptions.workMode])

  // Handle slash command selection (OpenCode agent + compact)
  const handleSlashCommand = React.useCallback(
    (commandId: SlashCommandId) => {
      if (commandId === 'plan') setWorkMode('manual', 'plan')
      else if (commandId === 'auto') setWorkMode('auto', 'execute')
      else if (commandId === 'execute') setWorkMode('manual', 'execute')
      else if (commandId === 'explore') setWorkMode('manual', 'explore')
      else if (commandId === 'compact' && !isProcessing)
        onSubmit('/compact', undefined)
    },
    [setWorkMode, isProcessing, onSubmit],
  )

  // Handle folder selection from slash command menu
  const handleSlashFolderSelect = React.useCallback(
    (path: string) => {
      if (onWorkingDirectoryChange) {
        setRecentFolders(addRecentWorkingDir(path, workspaceId))
        onWorkingDirectoryChange(path)
      }
    },
    [onWorkingDirectoryChange, workspaceId],
  )

  // Get recent folders and home directory for slash menu and mention menu
  const [recentFolders, setRecentFolders] = React.useState<string[]>([])
  const [homeDir, setHomeDir] = React.useState<string>('')

  React.useEffect(() => {
    setRecentFolders(getRecentWorkingDirs(workspaceId))
    window.electronAPI?.getHomeDir?.().then((dir: string) => {
      if (dir) setHomeDir(dir)
    })
  }, [workspaceId])

  // Inline slash command hook (modes, features, and folders)
  const inlineSlash = useInlineSlashCommand({
    inputRef: richInputRef,
    onSelectCommand: handleSlashCommand,
    onSelectFolder: handleSlashFolderSelect,
    activeCommands,
    recentFolders,
    homeDir,
  })

  // Handle mention selection (sources, skills, files)
  const handleMentionSelect = React.useCallback(
    (item: MentionItem) => {
      // For sources: enable the source immediately
      if (item.type === 'source' && item.source && onSourcesChange) {
        const slug = item.source.config.slug
        if (!optimisticSourceSlugs.includes(slug)) {
          const newSlugs = [...optimisticSourceSlugs, slug]
          setOptimisticSourceSlugs(newSlugs)
          onSourcesChange(newSlugs)
        }
      }

      // Files via @ mention in text are sufficient context for the agent.
      // Skills also don't need special handling beyond text insertion.
    },
    [optimisticSourceSlugs, onSourcesChange],
  )

  // Inline mention hook (for skills, sources, and files)
  const inlineMention = useInlineMention({
    inputRef: richInputRef,
    skills,
    sources,
    basePath: workingDirectory,
    onSelect: handleMentionSelect,
    // Use workspace slug (not UUID) for SDK skill qualification
    workspaceId: workspaceSlug,
  })

  // Inline label menu hook (for #labels)
  const handleLabelSelect = React.useCallback(
    (labelId: string) => {
      onLabelAdd?.(labelId)
    },
    [onLabelAdd],
  )

  // Labels only in # menu — session status ("todo" etc.) is set from session
  // menu / list / task board, not the chat composer (avoids dual authority).
  const inlineLabel = useInlineLabelMenu({
    inputRef: richInputRef,
    labels,
    sessionLabels,
    onSelect: handleLabelSelect,
  })

  // "Add New Label" handler: cleans up the #trigger text and opens a controlled
  // EditPopover so the user can describe the label before the agent creates it.
  const [addLabelPopoverOpen, setAddLabelPopoverOpen] = React.useState(false)
  const [addLabelPrefill, setAddLabelPrefill] = React.useState('')
  const handleAddLabel = React.useCallback(
    (prefill: string) => {
      if (!workspaceRootPath) return

      // Remove the #trigger text from input
      const cleaned = inlineLabel.handleSelect('')
      setInput(cleaned)
      syncToParent(cleaned)
      inlineLabel.close()

      // Store the prefill text (e.g., "Test" from "#Test") to pre-fill the popover
      // Format: "Add new label {prefill}" so user can just press enter or modify
      setAddLabelPrefill(prefill ? t('labels.addNewLabel', { prefill }) : '')

      // Open the EditPopover for label creation
      setAddLabelPopoverOpen(true)
    },
    [workspaceRootPath, inlineLabel, syncToParent, t],
  )

  // Memoize the add-label config so the EditPopover doesn't recreate on every render
  const addLabelEditConfig = React.useMemo(() => {
    if (!workspaceRootPath) return null
    return getEditConfig('add-label', workspaceRootPath)
  }, [workspaceRootPath])

  // Report height changes to parent (for external animation sync)
  React.useLayoutEffect(() => {
    if (!onHeightChange || !containerRef.current) return

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        onHeightChange(entry.contentRect.height)
      }
    })

    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [onHeightChange])

  // In compact mode, immediately report collapsed height when the input is
  // collapsed during processing. This ensures smooth animation timing.
  // When the user expands (or processing ends), the ResizeObserver takes
  // over and reports the actual rendered height.
  React.useEffect(() => {
    if (!onHeightChange) return
    if (isCollapsedInCompact) {
      // Collapsed state - only bottom bar visible (~44px)
      onHeightChange(44)
    }
  }, [isCollapsedInCompact, onHeightChange])

  // Check if running in Electron environment (has electronAPI)
  const hasElectronAPI = typeof window !== 'undefined' && !!window.electronAPI

  // Shared helper: read a File, add as attachment, decrement loading count
  const processFileAttachment = async (file: File, overrideName?: string) => {
    try {
      const attachment = await readFileAsAttachment(file, overrideName)
      if (attachment) {
        setAttachments((prev) => [...prev, attachment])
      }
    } catch (error) {
      console.error('[FreeFormInput] Failed to read file:', error)
    }
    setLoadingCount((prev) => prev - 1)
  }

  // File attachment handlers — Craft original: hidden <input type="file"> + FileReader.
  const handleAttachClick = () => {
    if (disabled) return
    fileInputRef.current?.click()
  }

  const handleToggleSourceSlug = React.useCallback(
    (slug: string) => {
      if (!onSourcesChange) return
      const isEnabled = optimisticSourceSlugs.includes(slug)
      const newSlugs = isEnabled
        ? optimisticSourceSlugs.filter((s) => s !== slug)
        : [...optimisticSourceSlugs, slug]
      setOptimisticSourceSlugs(newSlugs)
      onSourcesChange(newSlugs)
    },
    [onSourcesChange, optimisticSourceSlugs],
  )

  const handleAddSkill = React.useCallback(
    (skill: LoadedSkill) => {
      const pluginName =
        skill.source === 'workspace' ? workspaceSlug : AGENTS_PLUGIN_NAME
      const qualifiedName = pluginName
        ? `${pluginName}:${skill.slug}`
        : skill.slug
      const spacer = input.length > 0 && !input.endsWith(' ') ? ' ' : ''
      const next = `${input}${spacer}[skill:${qualifiedName}] `
      setInput(next)
      syncToParent(next)
      requestAnimationFrame(() => {
        richInputRef.current?.focus()
        richInputRef.current?.setSelectionRange(next.length, next.length)
      })
    },
    [input, richInputRef, syncToParent, workspaceSlug],
  )

  const insertComposerPrefix = React.useCallback(
    (prefix: string) => {
      const spacer = input.length > 0 && !input.endsWith(' ') ? ' ' : ''
      const next = `${input}${spacer}${prefix}`
      setInput(next)
      syncToParent(next)
      requestAnimationFrame(() => {
        richInputRef.current?.focus()
        richInputRef.current?.setSelectionRange(next.length, next.length)
      })
    },
    [input, richInputRef, syncToParent],
  )

  const mcpSources = React.useMemo(
    () => sources.filter((source) => source.config.type === 'mcp'),
    [sources],
  )
  const otherSources = React.useMemo(
    () => sources.filter((source) => source.config.type !== 'mcp'),
    [sources],
  )

  const handleFileInputChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const fileList = Array.from(files)
    setLoadingCount((prev) => prev + fileList.length)

    for (const file of fileList) {
      await processFileAttachment(file)
    }

    // Reset input so re-selecting the same file triggers onChange again
    e.target.value = ''
  }

  const handleRemoveAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index))
  }

  // Drag and drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounterRef.current++
    if (e.dataTransfer.types.includes('Files')) {
      setIsDraggingOver(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounterRef.current--
    if (dragCounterRef.current === 0) {
      setIsDraggingOver(false)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  // Helper to read a File using FileReader API (Craft original).
  const readFileAsAttachment = async (
    file: File,
    overrideName?: string,
  ): Promise<FileAttachment | null> => {
    // Capture the absolute OS path at attach time. Works for <input type="file"> and
    // OS drag-drop; returns null for clipboard paste and web-drag (no disk origin).
    // When null, the draft layer falls back to persisting content inline (Track C).
    const realPath = hasElectronAPI
      ? (window.electronAPI.getFilePath?.(file) ?? null)
      : null
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = async () => {
        const result = reader.result as ArrayBuffer
        // Chunked base64 encoding — btoa + reduce fails on large files (>1MB)
        // due to O(n²) string concatenation and browser string-length limits
        const bytes = new Uint8Array(result)
        let binary = ''
        const chunkSize = 8192
        for (let i = 0; i < bytes.length; i += chunkSize) {
          binary += String.fromCharCode(
            ...bytes.subarray(i, Math.min(i + chunkSize, bytes.length)),
          )
        }
        const base64 = btoa(binary)

        let type: FileAttachment['type'] = 'unknown'
        const fileName = overrideName || file.name
        if (file.type.startsWith('image/')) type = 'image'
        else if (file.type === 'application/pdf') type = 'pdf'
        else if (
          file.type.includes('text') ||
          fileName.match(/\.(txt|md|json|js|ts|tsx|py|css|html)$/i)
        )
          type = 'text'
        else if (
          file.type.includes('officedocument') ||
          fileName.match(/\.(docx?|xlsx?|pptx?)$/i)
        )
          type = 'office'

        const mimeType = file.type || 'application/octet-stream'

        // For text files, decode the ArrayBuffer as UTF-8 text
        let text: string | undefined
        if (type === 'text') {
          text = new TextDecoder('utf-8').decode(new Uint8Array(result))
        }

        let thumbnailBase64: string | undefined
        if (hasElectronAPI) {
          try {
            const thumb = await window.electronAPI.generateThumbnail(
              base64,
              mimeType,
            )
            if (thumb) thumbnailBase64 = thumb
          } catch {
            // Thumbnail generation is optional, continue without it
          }
        }

        resolve({
          type,
          path: realPath ?? fileName,
          name: fileName,
          mimeType,
          base64,
          text,
          size: file.size,
          thumbnailBase64,
        })
      }
      reader.onerror = () => resolve(null)
      reader.readAsArrayBuffer(file)
    })
  }

  // Clipboard paste handler for files/images
  const handlePaste = async (e: React.ClipboardEvent) => {
    if (disabled) return

    const clipboardItems = e.clipboardData?.files
    if (!clipboardItems || clipboardItems.length === 0) return

    // We have files to process - prevent default text paste behavior
    e.preventDefault()

    const files = Array.from(clipboardItems)
    setLoadingCount((prev) => prev + files.length)

    // Pre-assign sequential names using ref to avoid race conditions
    let nextImageNum = getNextPastedNumber('image', attachmentsRef.current)
    const fileNames: string[] = files.map((file) => {
      if (
        !file.name ||
        file.name === 'image.png' ||
        file.name === 'image.jpg' ||
        file.name === 'blob'
      ) {
        const ext = file.type.split('/')[1] || 'png'
        return `pasted-image-${nextImageNum++}.${ext}`
      }
      return file.name
    })

    for (let i = 0; i < files.length; i++) {
      await processFileAttachment(files[i], fileNames[i])
    }
  }

  // Handle long text paste - convert to file attachment
  const handleLongTextPaste = React.useCallback((text: string) => {
    const nextNum = getNextPastedNumber('text', attachmentsRef.current)
    const fileName = `pasted-text-${nextNum}.txt`
    const attachment: FileAttachment = {
      type: 'text',
      path: fileName,
      name: fileName,
      mimeType: 'text/plain',
      text: text,
      size: new Blob([text]).size,
    }
    setAttachments((prev) => [...prev, attachment])
    // Focus input after adding attachment
    richInputRef.current?.focus()
  }, []) // No deps needed - uses ref

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounterRef.current = 0
    setIsDraggingOver(false)
    if (disabled) return

    const files = Array.from(e.dataTransfer.files)
    setLoadingCount(files.length)

    for (const file of files) {
      await processFileAttachment(file)
    }
  }

  // Submit message - backend handles queueing and interruption
  const submitMessage = React.useCallback(() => {
    const hasContent =
      input.trim() || attachments.length > 0 || followUpItems.length > 0
    if (!hasContent || disabled) return false

    // Tutorial may disable sending to guide user through specific steps
    if (disableSend) return false

    const trimmedInput = input.trim()
    const goalCommand = trimmedInput.match(/^\/goal(?:\s+([\s\S]*))?$/i)
    if (
      goalCommand &&
      sessionId &&
      attachments.length === 0 &&
      followUpItems.length === 0
    ) {
      const requestedGoal = goalCommand[1]?.trim()
      // `/goal clear` is the explicit removal path. A bare `/goal` stays in the
      // composer so the user can finish the command instead of silently clearing.
      if (!requestedGoal) {
        richInputRef.current?.focus()
        return false
      }
      const nextGoal =
        requestedGoal.toLowerCase() === 'clear' ? null : requestedGoal
      void window.electronAPI
        .sessionCommand(sessionId, { type: 'setGoal', goal: nextGoal })
        .catch((error) =>
          console.error('Failed to update session goal:', error),
        )
      setInput('')
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current)
      onInputChange?.('')
      prevInputValueRef.current = ''
      requestAnimationFrame(() => richInputRef.current?.focus())
      return true
    }

    // Parse all @mentions (skills, sources, folders)
    const skillSlugs = skills.map((s) => s.slug)
    const sourceSlugs = sources.map((s) => s.config.slug)
    const mentions = parseMentions(input, skillSlugs, sourceSlugs)

    // Enable any mentioned sources that aren't already enabled
    if (mentions.sources.length > 0 && onSourcesChange) {
      const newSlugs = [
        ...new Set([...optimisticSourceSlugs, ...mentions.sources]),
      ]
      if (newSlugs.length > optimisticSourceSlugs.length) {
        setOptimisticSourceSlugs(newSlugs)
        onSourcesChange(newSlugs)
      }
    }

    const attachmentSnapshot = attachments

    onSubmit(
      input.trim(),
      attachmentSnapshot.length > 0 ? attachmentSnapshot : undefined,
      mentions.skills.length > 0 ? mentions.skills : undefined,
    )
    setInput('')
    setAttachments([])
    // Clear draft immediately (cancel any pending debounced sync)
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current)
    onInputChange?.('')
    onAttachmentsChange?.([])
    prevInputValueRef.current = ''

    // Restore focus after state updates
    requestAnimationFrame(() => {
      richInputRef.current?.focus()
    })

    return true
  }, [
    input,
    attachments,
    followUpItems,
    disabled,
    disableSend,
    sessionId,
    onInputChange,
    onAttachmentsChange,
    onSubmit,
    skills,
    sources,
    optimisticSourceSlugs,
    onSourcesChange,
  ])

  // Listen for craft:submit-input events (simulate pressing the Send button)
  React.useEffect(() => {
    const handleSubmitInput = (e: CustomEvent<{ sessionId?: string }>) => {
      const targetSessionId = e.detail?.sessionId
      if (
        !shouldHandleScopedInputEvent({
          sessionId,
          isFocusedPanel,
          targetSessionId,
        })
      )
        return
      submitMessage()
    }

    window.addEventListener(
      'craft:submit-input',
      handleSubmitInput as EventListener,
    )
    return () =>
      window.removeEventListener(
        'craft:submit-input',
        handleSubmitInput as EventListener,
      )
  }, [sessionId, isFocusedPanel, submitMessage])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    submitMessage()
  }

  const handleStop = (silent = false) => {
    onStop?.(silent)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // During IME composition, ESC should cancel composition, not trigger app/menu ESC behavior.
    if (e.key === 'Escape' && e.nativeEvent.isComposing) {
      return
    }

    // Don't submit when mention menu is open AND has visible content
    if (inlineMention.isOpen) {
      // Only intercept navigation/selection keys if menu actually shows items or is loading
      const hasVisibleContent =
        inlineMention.sections.some((s) => s.items.length > 0) ||
        inlineMention.isSearching
      if (
        hasVisibleContent &&
        (e.key === 'Enter' ||
          e.key === 'Tab' ||
          e.key === 'ArrowUp' ||
          e.key === 'ArrowDown')
      ) {
        // These keys are handled by the InlineMentionMenu component
        return
      }
      if (e.key === 'Escape') {
        e.preventDefault()
        inlineMention.close()
        return
      }
    }

    // Don't submit when slash command menu is open - let it handle the Enter key
    if (inlineSlash.isOpen) {
      if (
        e.key === 'Enter' ||
        e.key === 'Tab' ||
        e.key === 'ArrowUp' ||
        e.key === 'ArrowDown'
      ) {
        // These keys are handled by the InlineSlashCommand component
        return
      }
      if (e.key === 'Escape') {
        e.preventDefault()
        inlineSlash.close()
        return
      }
    }

    // Don't submit when label menu is open - let it handle navigation keys
    if (inlineLabel.isOpen) {
      if (
        e.key === 'Enter' ||
        e.key === 'Tab' ||
        e.key === 'ArrowUp' ||
        e.key === 'ArrowDown'
      ) {
        return
      }
      if (e.key === 'Escape') {
        e.preventDefault()
        inlineLabel.close()
        return
      }
    }

    // Skip submission during IME composition - user is confirming composed characters, not sending
    // Handle send key based on user preference:
    // - 'enter': Enter sends (Shift+Enter for newline)
    // - 'cmd-enter': ⌘/Ctrl+Enter sends (Enter for newline)
    if (sendMessageKey === 'enter') {
      // Enter sends, Shift+Enter adds newline
      if (
        e.key === 'Enter' &&
        !e.shiftKey &&
        !e.metaKey &&
        !e.ctrlKey &&
        !e.nativeEvent.isComposing
      ) {
        e.preventDefault()
        submitMessage()
      }
      // Also allow Cmd/Ctrl+Enter to send (power user shortcut)
      if (
        e.key === 'Enter' &&
        (e.metaKey || e.ctrlKey) &&
        !e.nativeEvent.isComposing
      ) {
        e.preventDefault()
        submitMessage()
      }
    } else {
      // cmd-enter mode: ⌘/Ctrl+Enter sends, plain Enter adds newline
      if (
        e.key === 'Enter' &&
        (e.metaKey || e.ctrlKey) &&
        !e.nativeEvent.isComposing
      ) {
        e.preventDefault()
        submitMessage()
      }
      // Plain Enter is allowed to pass through (adds newline)
    }
    if (e.key === 'Escape') {
      // Skip blur if a popover/overlay is open — let the overlay handle ESC instead.
      // This prevents the input from consuming ESC when focus gets pulled back here
      // while a popover is still visible (portal DOM isolation means the event won't
      // reach the popover's DismissableLayer otherwise).
      if (!hasOpenOverlay()) {
        richInputRef.current?.blur()
      }
    }
  }

  // Handle input changes from RichTextInput
  const handleInputChange = React.useCallback(
    (value: string) => {
      const nextValue = coerceInputText(value)
      // Get previous input value before updating state
      const prevValue = inputRef.current

      setInput(nextValue)
      syncToParent(nextValue) // Debounced sync to parent for draft persistence

      // Sync source selection when mentions are removed from input
      if (onSourcesChange) {
        const sourceSlugs = sources.map((s) => s.config.slug)

        // Parse mentions from previous and current input
        const prevMentions = parseMentions(prevValue, [], sourceSlugs)
        const currMentions = parseMentions(nextValue, [], sourceSlugs)

        // Remove sources that were mentioned before but not anymore
        const removedSources = prevMentions.sources.filter(
          (slug) => !currMentions.sources.includes(slug),
        )
        if (removedSources.length > 0) {
          const newSlugs = optimisticSourceSlugs.filter(
            (slug) => !removedSources.includes(slug),
          )
          setOptimisticSourceSlugs(newSlugs)
          onSourcesChange(newSlugs)
        }
      }
    },
    [syncToParent, sources, optimisticSourceSlugs, onSourcesChange],
  )

  // Handle input with cursor position (for menu detection)
  const handleRichInput = React.useCallback(
    (value: string, cursorPosition: number) => {
      const nextValue = coerceInputText(value)

      // Update inline slash command state
      inlineSlash.handleInputChange(nextValue, cursorPosition)

      // Update inline mention state (for @mentions - skills, sources, folders)
      inlineMention.handleInputChange(nextValue, cursorPosition)

      // Update inline label state (for #labels)
      inlineLabel.handleInputChange(nextValue, cursorPosition)

      // Auto-capitalize first letter (but not for slash commands, @mentions, or #labels)
      // Only if autoCapitalisation setting is enabled
      let newValue = nextValue
      if (
        autoCapitalisation &&
        nextValue.length > 0 &&
        nextValue.charAt(0) !== '/' &&
        nextValue.charAt(0) !== '@' &&
        nextValue.charAt(0) !== '#'
      ) {
        const capitalizedFirst = nextValue.charAt(0).toUpperCase()
        if (capitalizedFirst !== nextValue.charAt(0)) {
          newValue = capitalizedFirst + nextValue.slice(1)
          // Set cursor position BEFORE state update so it's used when useEffect syncs the value
          richInputRef.current?.setSelectionRange(
            cursorPosition,
            cursorPosition,
          )
          setInput(newValue)
          syncToParent(newValue)
          return
        }
      }

      // Apply smart typography (-> to →, etc.)
      const typography = applySmartTypography(nextValue, cursorPosition)
      if (typography.replaced) {
        newValue = typography.text
        // Set cursor position BEFORE state update so it's used when useEffect syncs the value
        richInputRef.current?.setSelectionRange(
          typography.cursor,
          typography.cursor,
        )
        setInput(newValue)
        syncToParent(newValue)
      }
    },
    [inlineSlash, inlineMention, inlineLabel, syncToParent, autoCapitalisation],
  )

  // Handle inline slash command selection (removes the /command text)
  const handleInlineSlashCommandSelect = React.useCallback(
    (commandId: SlashCommandId) => {
      const newValue = inlineSlash.handleSelectCommand(commandId)
      setInput(newValue)
      syncToParent(newValue)
      richInputRef.current?.focus()
    },
    [inlineSlash, syncToParent],
  )

  // Handle inline slash folder selection (inserts a directory badge)
  const handleInlineSlashFolderSelect = React.useCallback(
    (path: string) => {
      const newValue = inlineSlash.handleSelectFolder(path)
      setInput(newValue)
      syncToParent(newValue)
      richInputRef.current?.focus()
    },
    [inlineSlash, syncToParent],
  )

  // Handle inline mention selection (inserts appropriate mention text)
  const handleInlineMentionSelect = React.useCallback(
    (item: MentionItem) => {
      const { value: newValue, cursorPosition } =
        inlineMention.handleSelect(item)
      setInput(newValue)
      syncToParent(newValue)
      // Focus input and restore cursor position after badge renders
      setTimeout(() => {
        richInputRef.current?.focus()
        richInputRef.current?.setSelectionRange(cursorPosition, cursorPosition)
      }, 0)
    },
    [inlineMention, syncToParent],
  )

  // Handle inline label selection (removes the #label text from input)
  const handleInlineLabelSelect = React.useCallback(
    (labelId: string) => {
      const newValue = inlineLabel.handleSelect(labelId)
      setInput(newValue)
      syncToParent(newValue)
      richInputRef.current?.focus()
    },
    [inlineLabel, syncToParent],
  )

  const followUpLayoutKey = React.useMemo(
    () =>
      followUpItems
        .map((item) =>
          [
            item.id,
            item.index ?? '',
            item.noteLabel,
            item.selectedText,
            item.color ?? '',
          ].join('::'),
        )
        .join('|'),
    [followUpItems],
  )
  const previousFollowUpLayoutKeyRef = React.useRef<string | null>(null)
  const [animateFollowUpLayout, setAnimateFollowUpLayout] =
    React.useState(false)

  React.useEffect(() => {
    const previous = previousFollowUpLayoutKeyRef.current
    previousFollowUpLayoutKeyRef.current = followUpLayoutKey

    if (previous == null || previous === followUpLayoutKey) return

    setAnimateFollowUpLayout(true)
    const timer = window.setTimeout(() => {
      setAnimateFollowUpLayout(false)
    }, 220)

    return () => window.clearTimeout(timer)
  }, [followUpLayoutKey])

  const hasContent =
    input.trim() || attachments.length > 0 || followUpItems.length > 0
  const [repositorySnapshot, setRepositorySnapshot] = React.useState<
    import('../../../../shared/types').GitWorkingTreeSnapshot | null
  >(null)
  const [projectPickerOpen, setProjectPickerOpen] = React.useState(false)

  React.useEffect(() => {
    if (!isEmptySession || compactMode || !sessionId || !workingDirectory) {
      setRepositorySnapshot(null)
      return
    }
    let cancelled = false
    window.electronAPI
      .getGitWorkingTree(sessionId)
      .then((snapshot) => {
        if (!cancelled) setRepositorySnapshot(snapshot)
      })
      .catch(() => {
        if (!cancelled) setRepositorySnapshot(null)
      })
    return () => {
      cancelled = true
    }
  }, [compactMode, isEmptySession, sessionId, workingDirectory])

  // Pre-flight image-support check: warn when staged images would be silently
  // stripped by Pi SDK because the active custom-endpoint model is text-only.
  // Gate on pi_compat — built-in catalogs (anthropic/pi) are owned by the SDK
  // and we can't repair them from the UI here.
  const hasStagedImages = attachments.some(
    (a) => a.type === 'image' || a.mimeType?.startsWith('image/'),
  )
  const showVisionWarning =
    hasStagedImages &&
    !!effectiveConnectionDetails &&
    isCompatProvider(effectiveConnectionDetails.providerType) &&
    !modelSupportsImages(effectiveConnectionDetails, currentModel)

  return (
    <div
      ref={containerRef}
      className={cn(
        'overflow-hidden transition-[max-height,opacity]',
        !unstyled && 'rounded-[12px] bg-background shadow-middle',
        isDraggingOver &&
          'ring-2 ring-foreground ring-offset-2 ring-offset-background bg-foreground/5',
      )}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Empty-session execution context expands from the composer surface and
          participates in its measured height. Project folder, execution target,
          and worktree are separate projections over the existing Workspace and
          working-directory authorities; this surface owns no persisted state. */}
      {isEmptySession &&
        !compactMode &&
        onWorkingDirectoryChange &&
        appShellCtx && (
          <Popover open={projectPickerOpen} onOpenChange={setProjectPickerOpen}>
            <div className="bg-muted">
              <div className="flex min-w-0 items-center gap-1 px-3 py-2">
                <PopoverTrigger asChild>
                  <FreeFormInputContextBadge
                    icon={<Icon_Folder className="h-4 w-4" />}
                    label={
                      selectedExecutionWorkspace?.name ?? t('chat.chooseFolder')
                    }
                    isExpanded
                    hasSelection={!!selectedExecutionWorkspace}
                    showChevron
                    isOpen={projectPickerOpen}
                    aria-expanded={projectPickerOpen}
                    className="order-1"
                  />
                </PopoverTrigger>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <FreeFormInputContextBadge
                    icon={
                      executionTargetId === 'local' ? (
                        <Monitor className="h-4 w-4" />
                      ) : (
                        <Cloud className="h-4 w-4" />
                      )
                    }
                    label={t(
                      executionTargetId === 'local'
                        ? 'composer.execution.local'
                        : 'composer.execution.remote',
                    )}
                    isExpanded
                    hasSelection
                    showChevron
                    className="order-2"
                  />
                </DropdownMenuTrigger>
                <StyledDropdownMenuContent
                  side="top"
                  align="start"
                  sideOffset={8}
                  className="min-w-[220px]"
                >
                  {executionTargets.map((target) => {
                    const selected = target.id === executionTargetId
                    return (
                      <StyledDropdownMenuItem
                        key={target.id}
                        onSelect={() => {
                          if (!selected) {
                            setExecutionTargetId(target.id)
                            setProjectPickerOpen(false)
                          }
                        }}
                      >
                        {target.kind === 'local' ? (
                          <Monitor className="h-4 w-4" />
                        ) : (
                          <Cloud className="h-4 w-4" />
                        )}
                        <span className="min-w-0 flex-1 truncate">
                          {t(
                            target.kind === 'local'
                              ? 'composer.execution.local'
                              : 'composer.execution.remote',
                          )}
                        </span>
                        {target.kind === 'remote' && remoteTargetCount > 1 && (
                          <span className="max-w-[140px] truncate text-xs text-muted-foreground">
                            {getRemoteTargetDisplayName(target.url)}
                          </span>
                        )}
                        {selected && <Check className="h-4 w-4" />}
                      </StyledDropdownMenuItem>
                    )
                  })}
                  {appShellCtx.onRequestProjectCreation && (
                    <>
                      <StyledDropdownMenuSeparator className="my-1" />
                      <StyledDropdownMenuItem
                        onSelect={() =>
                          appShellCtx.onRequestProjectCreation?.(
                            'remote',
                            (workspace) => {
                              onExecutionWorkspaceChange?.(
                                workspace.id,
                                workspace,
                              )
                            },
                          )
                        }
                      >
                        <Cloud className="h-4 w-4" />
                        <span>{t('workspace.connectRemote')}</span>
                      </StyledDropdownMenuItem>
                    </>
                  )}
                </StyledDropdownMenuContent>
              </DropdownMenu>

              {selectedExecutionWorkspace &&
              repositorySnapshot &&
              repositorySnapshot.worktrees.length > 1 ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <FreeFormInputContextBadge
                      icon={<GitBranch className="h-4 w-4" />}
                      label={
                        repositorySnapshot.worktrees.find(
                          (entry) => entry.path === workingDirectory,
                        )?.branch ?? t('chat.worktree')
                      }
                      isExpanded
                      hasSelection
                      showChevron
                      className="order-3"
                    />
                  </DropdownMenuTrigger>
                  <StyledDropdownMenuContent
                    side="top"
                    align="start"
                    sideOffset={8}
                    className="min-w-[260px]"
                  >
                    {repositorySnapshot.worktrees
                      .filter((entry) => !entry.bare)
                      .map((entry) => (
                        <StyledDropdownMenuItem
                          key={entry.path}
                          onSelect={() => onWorkingDirectoryChange(entry.path)}
                        >
                          <GitBranch className="h-4 w-4" />
                          <span className="min-w-0 flex-1 truncate">
                            {entry.branch ?? entry.path}
                          </span>
                          {entry.path === workingDirectory && (
                            <Check className="h-4 w-4" />
                          )}
                        </StyledDropdownMenuItem>
                      ))}
                  </StyledDropdownMenuContent>
                </DropdownMenu>
              ) : selectedExecutionWorkspace && repositorySnapshot?.branch ? (
                <FreeFormInputContextBadge
                  icon={<GitBranch className="h-4 w-4" />}
                  label={repositorySnapshot.branch}
                  isExpanded
                  hasSelection
                  interactive={false}
                  className="order-3"
                />
              ) : null}
              </div>
              <PopoverContent
                side="top"
                align="start"
                sideOffset={8}
                className="w-[min(360px,calc(100vw-24px))] p-1"
                onOpenAutoFocus={(event) => event.preventDefault()}
              >
                <div
                  className="max-h-[280px] overflow-y-auto"
                  aria-label={t('chat.chooseFolder')}
                >
                  <div className="space-y-1">
                    {executionTargetWorkspaces.map((workspace) => {
                      const selected =
                        workspace.id === selectedExecutionWorkspace?.id
                      return (
                        <button
                          key={workspace.id}
                          type="button"
                          aria-pressed={selected}
                          className={cn(
                            'relative flex min-h-8 w-full items-center gap-2 rounded-[6px] px-2 py-1.5 text-left text-[13px] outline-none',
                            'hover:bg-foreground/[0.05] focus-visible:bg-foreground/[0.05] focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ring',
                            selected && 'bg-foreground/[0.05]',
                          )}
                          onClick={() => {
                            setProjectPickerOpen(false)
                            if (!selected)
                              onExecutionWorkspaceChange?.(workspace.id)
                          }}
                        >
                          <Icon_Folder className="h-3.5 w-3.5 shrink-0" />
                          <span className="min-w-0 flex-1 truncate">
                            {workspace.name}
                          </span>
                          {selected && <Check className="h-3.5 w-3.5" />}
                        </button>
                      )
                    })}
                  </div>
                  {executionTargetId === 'local' &&
                  appShellCtx.onRequestProjectCreation ? (
                    <div className="mt-1 border-t border-border/60 pt-1">
                      <button
                        type="button"
                        className="relative flex min-h-8 w-full items-center gap-2 rounded-[6px] px-2 py-1.5 text-left text-[13px] outline-none hover:bg-foreground/[0.05] focus-visible:bg-foreground/[0.05] focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ring"
                        onClick={() => {
                          setProjectPickerOpen(false)
                          appShellCtx.onRequestProjectCreation?.(
                            'local',
                            (workspace) => {
                              onExecutionWorkspaceChange?.(
                                workspace.id,
                                workspace,
                              )
                            },
                          )
                        }}
                      >
                        <Icon_Folder className="h-3.5 w-3.5 shrink-0" />
                        <span>{t('workspace.openFolder')}</span>
                      </button>
                    </div>
                  ) : null}
                </div>
              </PopoverContent>
            </div>
          </Popover>
        )}

      <form onSubmit={handleSubmit}>
        <div className="overflow-hidden transition-[max-height,opacity]">
          {/* Inline Slash Command Autocomplete */}
          <InlineSlashCommand
            open={inlineSlash.isOpen}
            onOpenChange={(open) => !open && inlineSlash.close()}
            sections={inlineSlash.sections}
            activeCommands={activeCommands}
            onSelectCommand={handleInlineSlashCommandSelect}
            onSelectFolder={handleInlineSlashFolderSelect}
            filter={inlineSlash.filter}
            position={inlineSlash.position}
          />

          {/* Inline Mention Autocomplete (skills, sources, files) */}
          <InlineMentionMenu
            open={inlineMention.isOpen}
            onOpenChange={(open) => !open && inlineMention.close()}
            sections={inlineMention.sections}
            onSelect={handleInlineMentionSelect}
            filter={inlineMention.filter}
            position={inlineMention.position}
            workspaceId={workspaceId}
            maxWidth={280}
            isSearching={inlineMention.isSearching}
          />

          {/* Inline Label Autocomplete (#labels only — status lives in session/list/board) */}
          <InlineLabelMenu
            open={inlineLabel.isOpen}
            onOpenChange={(open) => !open && inlineLabel.close()}
            items={inlineLabel.items}
            onSelect={handleInlineLabelSelect}
            onAddLabel={handleAddLabel}
            filter={inlineLabel.filter}
            position={inlineLabel.position}
          />

          {/* Controlled EditPopover for "Add New Label" — opens when user selects
            the option from the # menu with no matches.
            Spread the full config so optional fields like `inlineExecution`,
            `displayLabel`, and `displayLabelKey` reach the popover. The previous
            cherry-pick dropped `inlineExecution: true`, which made the popover
            fall back to the same-window deep-link path; that worked inside
            Electron but launched the desktop app from the WebUI via `craftagents://`.
            Match the AppShell pattern (which already uses spread). */}
          {addLabelEditConfig && (
            <EditPopover
              trigger={
                <span className="absolute top-0 left-0 w-0 h-0 overflow-hidden" />
              }
              open={addLabelPopoverOpen}
              onOpenChange={setAddLabelPopoverOpen}
              {...addLabelEditConfig}
              defaultValue={addLabelPrefill}
              secondaryAction={
                workspaceRootPath
                  ? {
                      label: 'Edit File',
                      filePath: `${workspaceRootPath}/labels/config.json`,
                    }
                  : undefined
              }
              side="top"
              align="start"
            />
          )}

          {workspaceRootPath && (
            <>
              <EditPopover
                trigger={
                  <span className="absolute top-0 left-0 h-0 w-0 overflow-hidden" />
                }
                open={addSkillPopoverOpen}
                onOpenChange={setAddSkillPopoverOpen}
                {...getEditConfig('add-skill', workspaceRootPath)}
                side="top"
                align="start"
              />
              <EditPopover
                trigger={
                  <span className="absolute top-0 left-0 h-0 w-0 overflow-hidden" />
                }
                open={addMcpPopoverOpen}
                onOpenChange={setAddMcpPopoverOpen}
                {...getEditConfig('add-source-mcp', workspaceRootPath)}
                side="top"
                align="start"
              />
            </>
          )}

          {/* Pre-flight image-support warning — only for pi_compat connections
            where the renderer can both detect text-only models and offer to
            flip the per-model supportsImages override on the spot. */}
          {showVisionWarning && effectiveConnectionDetails && (
            <ImageSupportWarningBanner
              modelName={currentModelDisplayName}
              onEnable={() =>
                handleToggleModelVision(
                  effectiveConnectionDetails.slug,
                  currentModel,
                  true,
                )
              }
            />
          )}

          {/* Attachment Preview */}
          <AttachmentPreview
            attachments={attachments}
            onRemove={handleRemoveAttachment}
            disabled={disabled}
            loadingCount={loadingCount}
          />

          {/* Follow-up annotation chips (Craft chip band — annotation follow-ups only) */}
          <AnimatePresence initial={false}>
            {followUpItems.length > 0 && (
              <motion.div
                key="composer-context-chips"
                layout={animateFollowUpLayout}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.18, ease: [0.2, 0, 0.2, 1] }}
                className="overflow-hidden"
              >
                <motion.div
                  layout={animateFollowUpLayout}
                  className="px-3 pt-3.5 pb-0"
                >
                  <motion.div
                    layout={animateFollowUpLayout}
                    className="flex flex-wrap gap-1"
                  >
                    <AnimatePresence initial={false}>
                      {followUpItems.map((item, idx) => {
                        const chipIndex = item.index ?? idx + 1
                        const tooltipText =
                          item.selectedText.trim() || t('chat.selectedText')
                        const selectedExcerpt = formatFollowUpChipText(
                          item.selectedText,
                          t('chat.selectedText'),
                          50,
                        )
                        const noteExcerpt = formatFollowUpChipText(
                          item.noteLabel,
                          t('chat.followUp'),
                          50,
                        )

                        return (
                          <motion.button
                            key={item.id}
                            type="button"
                            layout={animateFollowUpLayout}
                            initial={{ opacity: 0, y: 6, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -4, scale: 0.98 }}
                            transition={{
                              duration: 0.16,
                              ease: [0.2, 0, 0.2, 1],
                            }}
                            className="inline-flex max-w-full items-center gap-1.5 overflow-hidden rounded-[6px] bg-foreground/2 pl-1.5 pr-2 py-1 text-[13px] text-foreground/80 select-none transition-colors hover:bg-foreground/5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            onClick={(event) => {
                              const rect =
                                event.currentTarget.getBoundingClientRect()
                              onFollowUpClick?.(item, {
                                x: rect.left + rect.width / 2,
                                y: rect.top - 8,
                              })
                            }}
                          >
                            <Tooltip delayDuration={250}>
                              <TooltipTrigger asChild>
                                <span
                                  role="button"
                                  tabIndex={0}
                                  className="inline-flex h-4 min-w-4 cursor-pointer items-center justify-center rounded-[4px] bg-background px-0.5 text-[10px] font-medium text-foreground shadow-minimal focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                  onMouseDown={(event) => {
                                    event.preventDefault()
                                    event.stopPropagation()
                                  }}
                                  onClick={(event) => {
                                    event.preventDefault()
                                    event.stopPropagation()
                                    onFollowUpIndexClick?.(item)
                                  }}
                                  onKeyDown={(event) => {
                                    if (
                                      event.key === 'Enter' ||
                                      event.key === ' '
                                    ) {
                                      event.preventDefault()
                                      event.stopPropagation()
                                      onFollowUpIndexClick?.(item)
                                    }
                                  }}
                                >
                                  {chipIndex}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent
                                side="top"
                                className="max-w-[420px] break-words text-xs"
                              >
                                {tooltipText}
                              </TooltipContent>
                            </Tooltip>
                            <span className="min-w-0 max-w-full overflow-hidden text-ellipsis whitespace-nowrap pr-0.5 text-left">
                              <span className="italic text-foreground/60">
                                {selectedExcerpt}
                              </span>
                              <span className="mx-1 text-foreground/40">·</span>
                              <span>{noteExcerpt}</span>
                            </span>
                          </motion.button>
                        )
                      })}
                    </AnimatePresence>
                  </motion.div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Rich Text Input with inline mention badges */}
          {/* In compact mode, hide input while the agent is processing — until the
            user clicks / hovers the collapsed bar to expand it back. */}
          {!isCollapsedInCompact && (
            <RichTextInput
              ref={richInputRef}
              value={input}
              onChange={handleInputChange}
              onInput={handleRichInput}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              onLongTextPaste={handleLongTextPaste}
              onFocus={() => {
                setIsFocused(true)
                onFocusChange?.(true)
              }}
              onBlur={() => {
                // Save caret position before losing focus (for restoration via craft:focus-input)
                lastCaretPositionRef.current =
                  richInputRef.current?.selectionStart ?? null
                setIsFocused(false)
                onFocusChange?.(false)
              }}
              placeholder={effectivePlaceholder}
              disabled={disabled}
              skills={skills}
              sources={sources}
              workspaceId={workspaceSlug}
              className="pl-5 pr-4 pt-4 pb-3 overflow-y-auto min-h-[88px]"
              style={{ maxHeight: inputMaxHeight }}
              data-tutorial="chat-input"
              spellCheck={spellCheck}
            />
          )}

          {/* Bottom Row: Controls - wrapped in relative container for status slot overlay */}
          <div className="relative">
            {/* Status slot overlay - escape interrupt (highest priority), browser status, etc. */}
            <ToolbarStatusSlot
              showEscapeOverlay={isProcessing && showEscapeOverlay}
              sessionId={sessionId}
            />

            <div
              className={cn(
                'flex items-center gap-1 px-2 py-2',
                !compactMode && 'border-t border-border/50',
              )}
            >
              {/* Hidden file input for attach button (shared by compact and desktop) */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleFileInputChange}
              />

              {/* One progressive-disclosure Add entry. Every row delegates to the
              existing attachment, working-directory, source, skill or Session
              work-mode authority; the menu owns no duplicate state. */}
              <div className="relative flex items-center gap-1 min-w-0 shrink">
                <DropdownMenu>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DropdownMenuTrigger asChild>
                        <Button
                          type="button"
                          size="icon"
                          variant="secondary"
                          aria-label={t('composer.add.title')}
                          disabled={disabled}
                          className="composer-round-action h-7 w-7 shrink-0 rounded-full"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                    </TooltipTrigger>
                    <TooltipContent
                      side="top"
                      className="flex items-center gap-2"
                    >
                      <span>{t('composer.add.title')}</span>
                      <KbdGroup>
                        <Kbd>@</Kbd>
                        <Kbd>/</Kbd>
                      </KbdGroup>
                    </TooltipContent>
                  </Tooltip>
                  <StyledDropdownMenuContent
                    side="top"
                    align="start"
                    sideOffset={8}
                    className="min-w-[220px]"
                  >
                    <StyledDropdownMenuItem onSelect={handleAttachClick}>
                      <Paperclip className="h-4 w-4" />
                      <span>{t('chat.attachFilesTooltip')}</span>
                    </StyledDropdownMenuItem>

                    {sessionId && (
                      <StyledDropdownMenuItem
                        onSelect={() => insertComposerPrefix('/goal ')}
                      >
                        <Target className="h-4 w-4" />
                        <span className="flex-1">{t('composer.add.goal')}</span>
                        <span className="text-xs text-foreground/40">
                          {t('composer.add.goalDescription')}
                        </span>
                      </StyledDropdownMenuItem>
                    )}

                    {sessionId && (
                      <StyledDropdownMenuItem
                        onSelect={() => {
                          const planActive = workModeOptions.workMode === 'plan'
                          setWorkMode(
                            planActive ? 'auto' : 'manual',
                            planActive ? 'execute' : 'plan',
                          )
                        }}
                      >
                        <Lightbulb className="h-4 w-4" />
                        <span className="flex-1">{t('composer.add.plan')}</span>
                        <span className="text-xs text-foreground/40">
                          {t('composer.add.planDescription')}
                        </span>
                        {workModeOptions.workMode === 'plan' && (
                          <Check className="h-4 w-4" />
                        )}
                      </StyledDropdownMenuItem>
                    )}

                    <StyledDropdownMenuSeparator className="my-1" />

                    {(skills.length > 0 || workspaceRootPath) && (
                      <DropdownMenuSub>
                        <StyledDropdownMenuSubTrigger>
                          <Zap className="h-4 w-4" />
                          <span>{t('sidebar.skills')}</span>
                        </StyledDropdownMenuSubTrigger>
                        <StyledDropdownMenuSubContent className="min-w-[220px] max-h-[280px] overflow-y-auto">
                          {skills.map((skill) => (
                            <StyledDropdownMenuItem
                              key={skill.slug}
                              onSelect={() => handleAddSkill(skill)}
                            >
                              <span className="min-w-0 truncate">
                                {skill.metadata.name}
                              </span>
                            </StyledDropdownMenuItem>
                          ))}
                          {skills.length > 0 && workspaceRootPath && (
                            <StyledDropdownMenuSeparator className="my-1" />
                          )}
                          {workspaceRootPath && (
                            <StyledDropdownMenuItem
                              onSelect={() =>
                                setTimeout(
                                  () => setAddSkillPopoverOpen(true),
                                  0,
                                )
                              }
                            >
                              <Plus className="h-4 w-4" />
                              <span>{t('sidebarMenu.addSkill')}</span>
                            </StyledDropdownMenuItem>
                          )}
                        </StyledDropdownMenuSubContent>
                      </DropdownMenuSub>
                    )}

                    {(mcpSources.length > 0 || workspaceRootPath) && (
                      <DropdownMenuSub>
                        <StyledDropdownMenuSubTrigger>
                          <McpIcon className="h-4 w-4" />
                          <span>{t('composer.add.mcpServers')}</span>
                        </StyledDropdownMenuSubTrigger>
                        <StyledDropdownMenuSubContent className="min-w-[240px] max-h-[280px] overflow-y-auto">
                          {mcpSources.map((source) => {
                            const selected = optimisticSourceSlugs.includes(
                              source.config.slug,
                            )
                            return (
                              <StyledDropdownMenuItem
                                key={source.config.slug}
                                onSelect={() =>
                                  handleToggleSourceSlug(source.config.slug)
                                }
                              >
                                <SourceAvatar source={source} size="xs" />
                                <span className="min-w-0 flex-1 truncate">
                                  {source.config.name}
                                </span>
                                {selected && <Check className="h-4 w-4" />}
                              </StyledDropdownMenuItem>
                            )
                          })}
                          {mcpSources.length > 0 && workspaceRootPath && (
                            <StyledDropdownMenuSeparator className="my-1" />
                          )}
                          {workspaceRootPath && (
                            <StyledDropdownMenuItem
                              onSelect={() =>
                                setTimeout(() => setAddMcpPopoverOpen(true), 0)
                              }
                            >
                              <Plus className="h-4 w-4" />
                              <span>{t('editPopover.label.addMcpServer')}</span>
                            </StyledDropdownMenuItem>
                          )}
                        </StyledDropdownMenuSubContent>
                      </DropdownMenuSub>
                    )}

                    {otherSources.length > 0 && (
                      <StyledDropdownMenuSeparator className="my-1" />
                    )}

                    {onSourcesChange && otherSources.length > 0 && (
                      <DropdownMenuSub>
                        <StyledDropdownMenuSubTrigger>
                          <DatabaseZap className="h-4 w-4" />
                          <span>{t('chat.sourcesTooltip')}</span>
                        </StyledDropdownMenuSubTrigger>
                        <StyledDropdownMenuSubContent className="min-w-[240px] max-h-[280px] overflow-y-auto">
                          {otherSources.map((source) => {
                            const selected = optimisticSourceSlugs.includes(
                              source.config.slug,
                            )
                            return (
                              <StyledDropdownMenuItem
                                key={source.config.slug}
                                onSelect={() =>
                                  handleToggleSourceSlug(source.config.slug)
                                }
                              >
                                <SourceAvatar source={source} size="xs" />
                                <span className="min-w-0 flex-1 truncate">
                                  {source.config.name}
                                </span>
                                {selected && <Check className="h-4 w-4" />}
                              </StyledDropdownMenuItem>
                            )
                          })}
                        </StyledDropdownMenuSubContent>
                      </DropdownMenuSub>
                    )}
                  </StyledDropdownMenuContent>
                </DropdownMenu>

                {compactMode && enableCompactModelPicker && (
                  <>
                    <CompactModelSelector
                      currentModel={currentModel}
                      currentConnection={currentConnection}
                      onModelChange={onModelChange}
                      onConnectionChange={onConnectionChange}
                      isEmptySession={isEmptySession}
                      connectionUnavailable={connectionUnavailable}
                      contextStatus={contextStatus}
                    />
                    <CompactThinkingSelector
                      currentModel={currentModel}
                      currentConnection={currentConnection}
                      thinkingLevel={thinkingLevel}
                      onThinkingLevelChange={onThinkingLevelChange}
                      fastMode={fastMode}
                      onFastModeChange={onFastModeChange}
                      runtimeMode={runtimeMode}
                      onRuntimeModeChange={onRuntimeModeChange}
                      isProcessing={isProcessing}
                      isEmptySession={isEmptySession}
                      connectionUnavailable={connectionUnavailable}
                    />
                  </>
                )}
              </div>

              {/* Spacer — doubles as a tap / hover target while the input is
              collapsed during processing in compact mode, so the user can
              type a follow-up without waiting for the agent to finish. */}
              {isCollapsedInCompact ? (
                <button
                  type="button"
                  onClick={onRequestExpand}
                  onMouseEnter={onRequestExpand}
                  aria-label={t('chat.tapToType')}
                  className="flex-1 h-7 mx-1 flex items-center justify-center text-foreground/30 hover:text-foreground/60 transition-colors cursor-pointer rounded-[6px] hover:bg-foreground/5 focus:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <ChevronUp className="h-4 w-4" />
                </button>
              ) : (
                <div className="order-2 flex-1" />
              )}

              {/* OpenCode ordering: model + reasoning follow the add control;
                  context and send stay pinned to the far edge. */}
              <div className="contents">
                {!compactMode && (
                  <DropdownMenu
                    open={modelDropdownOpen}
                    onOpenChange={setModelDropdownOpen}
                  >
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            className={cn(
                              'input-toolbar-btn inline-flex h-7 shrink-0 items-center gap-0.5 rounded-[6px] px-1.5 text-[13px] transition-colors hover:bg-foreground/5',
                              modelDropdownOpen && 'bg-foreground/5',
                              connectionUnavailable && 'text-destructive',
                            )}
                          >
                            {connectionUnavailable ? (
                              <>
                                <AlertCircle className="size-3.5 shrink-0" />
                                {t('common.unavailable')}
                              </>
                            ) : (
                              <>
                                {effectiveConnectionDetails &&
                                  storage.get(
                                    storage.KEYS.showConnectionIcons,
                                    true,
                                  ) && (
                                    <ConnectionIcon
                                      connection={effectiveConnectionDetails}
                                      size={14}
                                      showTooltip
                                    />
                                  )}
                                <span className="max-w-[180px] truncate">
                                  {currentModelDisplayName}
                                </span>
                                {pickerMode !== 'locked-single' && (
                                  <ChevronDown className="size-3 shrink-0 opacity-50" />
                                )}
                              </>
                            )}
                          </button>
                        </DropdownMenuTrigger>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        {t('common.model')}
                      </TooltipContent>
                    </Tooltip>

                    <StyledDropdownMenuContent
                      side="top"
                      align="end"
                      sideOffset={8}
                      className="w-[320px] max-w-[calc(100vw-24px)] p-1.5"
                    >
                      {pickerMode === 'unavailable' ? (
                        <div className="flex flex-col items-center px-4 py-6 text-center">
                          <AlertCircle className="mb-2 size-8 text-destructive" />
                          <div className="mb-1 text-sm font-medium">
                            {t('chat.connectionUnavailable')}
                          </div>
                          <div className="mb-3 text-xs text-muted-foreground">
                            {t('chat.connectionUnavailableDescription')}
                          </div>
                          <div className="mb-3 text-[11px] text-foreground/50">
                            {t('chat.connectionUnavailableHint', {
                              defaultValue:
                                'Usually the default connection has no API key. Open AI settings, edit the connection, and paste a valid key.',
                            })}
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setModelDropdownOpen(false)
                              navigate(routes.view.settings('ai'))
                            }}
                            className="rounded-[6px] bg-foreground/10 px-3 py-1.5 text-xs text-foreground/80 hover:bg-foreground/10 hover:text-foreground"
                          >
                            {t('chat.modelPicker.openAiSettings')}
                          </button>
                        </div>
                      ) : (
                        <ModelPickerList
                          groups={visibleModelPickerGroups}
                          currentConnection={effectiveConnection}
                          currentModel={selectedModelId}
                          onSelect={(connectionSlug, modelId) => {
                            if (
                              connectionSlug !== effectiveConnection &&
                              onConnectionChange
                            ) {
                              onConnectionChange(connectionSlug)
                            }
                            onModelChange(modelId, connectionSlug)
                            setModelDropdownOpen(false)
                          }}
                          onManageModels={() => {
                            setModelDropdownOpen(false)
                            navigate(routes.view.settings('ai'))
                          }}
                          renderItemAction={(item: ModelPickerItem) => {
                            if (!isCompatProvider(item.connection.providerType))
                              return null
                            const visionOn = modelSupportsImages(
                              item.connection,
                              item.modelId,
                            )
                            return (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    type="button"
                                    aria-label={
                                      visionOn
                                        ? t('chat.modelPicker.supportsImagesOn')
                                        : t(
                                            'chat.modelPicker.supportsImagesOff',
                                          )
                                    }
                                    className="inline-flex size-7 items-center justify-center rounded-[6px] hover:bg-foreground/5"
                                    onClick={(event) => {
                                      event.preventDefault()
                                      event.stopPropagation()
                                      handleToggleModelVision(
                                        item.connection.slug,
                                        item.modelId,
                                        !visionOn,
                                      )
                                    }}
                                  >
                                    <ImageIcon
                                      className={cn(
                                        'size-3.5',
                                        visionOn
                                          ? 'text-foreground/70'
                                          : 'text-foreground/30',
                                      )}
                                    />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {visionOn
                                    ? t('chat.modelPicker.supportsImagesOn')
                                    : t('chat.modelPicker.supportsImagesOff')}
                                </TooltipContent>
                              </Tooltip>
                            )
                          }}
                          className="max-h-[360px]"
                        />
                      )}
                    </StyledDropdownMenuContent>
                  </DropdownMenu>
                )}
                {!compactMode && (
                  <ThinkingSelector
                    currentModel={currentModel}
                    currentConnection={currentConnection}
                    thinkingLevel={thinkingLevel}
                    onThinkingLevelChange={onThinkingLevelChange}
                    fastMode={fastMode}
                    onFastModeChange={onFastModeChange}
                    runtimeMode={runtimeMode}
                    onRuntimeModeChange={onRuntimeModeChange}
                    isProcessing={isProcessing}
                    connectionUnavailable={connectionUnavailable}
                  />
                )}

                {/* Provider-normalized current context. Cache counters are already part
              of inputTokens and must not be added a second time. */}
                {(() => {
                  const effectiveContextWindow = resolveContextWindow(
                    contextStatus?.contextWindow,
                    selectedModelId,
                    availableModels,
                    getModelContextWindow(selectedModelId),
                  )
                  const usage = projectContextUsage(
                    contextStatus?.inputTokens,
                    effectiveContextWindow,
                  )
                  if (!hasKnownContextUsage(usage)) return null
                  const usagePercent = Math.round(usage.percent)
                  const canCompact =
                    usagePercent >= 62 &&
                    !isProcessing &&
                    !contextStatus?.isCompacting
                  const cacheReadTokens = Math.max(
                    0,
                    contextStatus?.cacheReadTokens ?? 0,
                  )
                  const cacheCreationTokens = Math.max(
                    0,
                    contextStatus?.cacheCreationTokens ?? 0,
                  )
                  const uncachedInputTokens = Math.max(
                    0,
                    usage.currentInputTokens -
                      cacheReadTokens -
                      cacheCreationTokens,
                  )
                  const inputSegments = [
                    {
                      label: t('chat.contextUncachedInput'),
                      value: uncachedInputTokens,
                      color: 'var(--foreground)',
                    },
                    {
                      label: t('chat.contextCacheRead'),
                      value: cacheReadTokens,
                      color: 'var(--success)',
                    },
                    {
                      label: t('chat.contextCacheWrite'),
                      value: cacheCreationTokens,
                      color: 'var(--info)',
                    },
                  ].filter((segment) => segment.value > 0)
                  const compositionColors: Record<
                    ContextBreakdownSegment['key'],
                    string
                  > = {
                    user: 'var(--success)',
                    assistant: 'var(--info)',
                    tool: 'var(--foreground)',
                    other:
                      'color-mix(in oklab, var(--foreground) 38%, transparent)',
                  }
                  const compositionLabels: Record<
                    ContextBreakdownSegment['key'],
                    string
                  > = {
                    user: t('chat.contextBreakdownUser'),
                    assistant: t('chat.contextBreakdownAssistant'),
                    tool: t('chat.contextBreakdownTool'),
                    other: t('chat.contextBreakdownOther'),
                  }
                  const composition = contextStatus?.breakdown ?? []

                  return (
                    <Popover>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <PopoverTrigger asChild>
                            <button
                              type="button"
                              className={cn(
                                'order-3 relative inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full',
                                'text-foreground/60 transition-colors hover:bg-foreground/5',
                              )}
                              aria-label={t('chat.contextUsage', {
                                percent: usagePercent,
                              })}
                            >
                              <span
                                aria-hidden
                                className="absolute h-4 w-4 rounded-full"
                                style={{
                                  background: `conic-gradient(var(--foreground) ${usage.percent * 3.6}deg, color-mix(in oklab, var(--foreground) 14%, transparent) 0deg)`,
                                }}
                              />
                              <span
                                aria-hidden
                                className="absolute h-3 w-3 rounded-full bg-background"
                              />
                            </button>
                          </PopoverTrigger>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          {t('chat.contextUsageDetail', {
                            percent: usagePercent,
                            tokens: formatTokenCount(usage.currentInputTokens),
                          })}
                        </TooltipContent>
                      </Tooltip>
                      <PopoverContent
                        side="top"
                        align="end"
                        sideOffset={8}
                        className="w-[340px] max-w-[calc(100vw-24px)] p-3"
                        onOpenAutoFocus={(event) => event.preventDefault()}
                      >
                        <div className="flex items-baseline justify-between gap-3">
                          <div className="text-sm font-semibold">
                            {t('chat.contextUsageTitle')}
                          </div>
                          <div className="text-xs tabular-nums text-muted-foreground">
                            {formatTokenCount(usage.currentInputTokens)}
                            {' / '}
                            {formatTokenCount(usage.contextWindow)}
                          </div>
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {t('chat.contextUsage', { percent: usagePercent })}
                        </div>
                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-foreground/10">
                          <div
                            className="h-full rounded-full bg-foreground/60"
                            style={{
                              width: `${Math.min(100, Math.max(0, usage.percent))}%`,
                            }}
                          />
                        </div>
                        {composition.length > 0 && (
                          <div className="mt-3 border-t border-border/50 pt-3">
                            <div className="flex items-center justify-between gap-3">
                              <div className="text-xs font-medium">
                                {t('chat.contextBreakdownTitle')}
                              </div>
                              <div className="text-[11px] text-muted-foreground">
                                {t('chat.contextBreakdownEstimated')}
                              </div>
                            </div>
                            <div className="mt-2 space-y-1.5">
                              {composition.map((segment) => (
                                <div
                                  key={segment.key}
                                  className="flex items-center gap-2 text-xs"
                                >
                                  <span
                                    aria-hidden
                                    className="h-2.5 w-2.5 shrink-0 rounded-[3px]"
                                    style={{
                                      background:
                                        compositionColors[segment.key],
                                    }}
                                  />
                                  <span className="min-w-0 flex-1 text-muted-foreground">
                                    {compositionLabels[segment.key]}
                                    {segment.messageCount !== undefined &&
                                      ` ${t('chat.contextBreakdownMessages', {
                                        count: segment.messageCount,
                                      })}`}
                                  </span>
                                  <span className="tabular-nums">
                                    {formatTokenCount(segment.tokens)}
                                    {' · '}
                                    {segment.inputSharePercent}%
                                  </span>
                                </div>
                              ))}
                            </div>
                            <div className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
                              {t('chat.contextBreakdownNote')}
                            </div>
                          </div>
                        )}
                        {subscriptionQuota?.status === 'ready' &&
                          subscriptionQuota.windows.length > 0 && (
                            <div className="mt-3 border-t border-border/50 pt-3">
                              <div className="text-xs font-medium">
                                {t('chat.planUsageTitle')}
                              </div>
                              <div className="mt-2 space-y-3">
                                {subscriptionQuota.windows.map((window) => (
                                  <div key={window.id}>
                                    <div className="flex items-center justify-between gap-3 text-xs">
                                      <span className="text-muted-foreground">
                                        {t(
                                          `chat.planUsagePeriod.${window.period}`,
                                        )}
                                      </span>
                                      <span className="tabular-nums">
                                        {Math.round(window.usedPercent)}%
                                      </span>
                                    </div>
                                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-foreground/10">
                                      <div
                                        className="h-full rounded-full bg-foreground/60"
                                        style={{
                                          width: `${window.usedPercent}%`,
                                        }}
                                      />
                                    </div>
                                    {window.resetAt && (
                                      <div className="mt-1 text-[11px] text-muted-foreground">
                                        {t('chat.planUsageResets', {
                                          time: new Intl.DateTimeFormat(
                                            undefined,
                                            {
                                              month: 'short',
                                              day: 'numeric',
                                              hour: 'numeric',
                                              minute: '2-digit',
                                            },
                                          ).format(window.resetAt),
                                        })}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        <div className="mt-3 text-xs font-medium">
                          {t('chat.contextAccountingTitle')}
                        </div>
                        <div className="mt-3 space-y-2">
                          {inputSegments.map((segment) => (
                            <div
                              key={segment.label}
                              className="flex items-center gap-2 text-xs"
                            >
                              <span
                                aria-hidden
                                className="h-2.5 w-2.5 shrink-0 rounded-[3px]"
                                style={{ background: segment.color }}
                              />
                              <span className="min-w-0 flex-1 text-muted-foreground">
                                {segment.label}
                              </span>
                              <span className="tabular-nums">
                                {formatTokenCount(segment.value)}
                              </span>
                            </div>
                          ))}
                          <div className="flex items-center justify-between gap-3 border-t border-border/50 pt-2 text-xs">
                            <span className="text-muted-foreground">
                              {t('chat.contextOutput')}
                            </span>
                            <span className="tabular-nums">
                              {formatTokenCount(
                                Math.max(0, contextStatus?.outputTokens ?? 0),
                              )}
                            </span>
                          </div>
                          {effectiveConnectionDetails?.authType !== 'oauth' && (
                            <div className="flex items-center justify-between gap-3 text-xs">
                              <span className="text-muted-foreground">
                                {t('chat.contextCost')}
                              </span>
                              <span className="tabular-nums">
                                ${(contextStatus?.costUsd ?? 0).toFixed(4)}
                              </span>
                            </div>
                          )}
                        </div>
                        {canCompact && (
                          <button
                            type="button"
                            onClick={() => {
                              onSubmit('/compact', [])
                            }}
                            className="mt-3 h-8 w-full rounded-[6px] bg-foreground/[0.07] px-3 text-xs font-medium transition-colors hover:bg-foreground/10"
                          >
                            {t('chat.contextCompactAction')}
                          </button>
                        )}
                      </PopoverContent>
                    </Popover>
                  )
                })()}

                {/* 6. Send/Stop Button - Always show stop when processing */}
                {isProcessing ? (
                  <Button
                    type="button"
                    size="icon"
                    variant="secondary"
                    aria-label={t('chat.stopResponse')}
                    className="composer-round-action order-3 h-7 w-7 rounded-full shrink-0 active:bg-foreground/20 ml-2"
                    onClick={() => handleStop(false)}
                  >
                    <Square className="h-3 w-3 fill-current" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    size="icon"
                    aria-label={t('shortcuts.sendMessage')}
                    className="composer-round-action order-3 h-7 w-7 rounded-full shrink-0 ml-2"
                    disabled={!hasContent || disabled || disableSend}
                    data-tutorial="send-button"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
