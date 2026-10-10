import * as React from 'react'
import { useTranslation } from "react-i18next"
import { AnimatePresence, motion } from 'motion/react'
import {
  Plus,
  ArrowUp,
  Square,
} from 'lucide-react'
import { Icon_Folder, Spinner } from '@craft-agent/ui'

import * as storage from '@/lib/local-storage'
import { Button } from '@/components/ui/button'
import {
  InlineSlashCommand,
  useInlineSlashCommand,
  type SlashCommandId,
} from '@/components/ui/slash-command-menu'
import {
  InlineMentionMenu,
  useInlineMention,
  type MentionItem,
} from '@/components/ui/mention-menu'
import {
  InlineLabelMenu,
  useInlineLabelMenu,
} from '@/components/ui/label-menu'
import { flattenLabels, parseLabelEntry, type LabelConfig } from '@craft-agent/shared/labels'
import { LabelBadgeRow } from '@/components/ui/label-badge-row'
import { parseMentions } from '@/lib/mentions'
import { RichTextInput, type RichTextInputHandle } from '@/components/ui/rich-text-input'
import { useInputAvailableHeight } from '@/hooks/useInputAvailableHeight'
import { getComposerMaxHeight } from './composer-height'
import { getContextDisplay, getContextDisplayLabels, type ContextStatus } from './context-display'
import { ContextUsageRing } from './ContextUsageRing'
import { createPendingPlanDispatcher } from './pending-plan-dispatch'
import { scrollFocusedCaretIntoView } from '@/lib/scroll-focused-caret'
import { Tooltip, TooltipContent, TooltipTrigger } from '@craft-agent/ui'
import { cn } from '@/lib/utils'
import { coerceInputText } from '@/lib/input-text'
import { applySmartTypography } from '@/lib/smart-typography'
import { AttachmentPreview } from '../AttachmentPreview'
import { ImageSupportWarningBanner } from './ImageSupportWarningBanner'
import { getModelDisplayName, getModelContextWindow, type ModelDefinition } from '@config/models'
import {
  resolveEffectiveConnectionSlug,
  isCompatProvider,
  modelSupportsImages,
} from '@config/llm-connections'
import { useOptionalAppShellContext } from '@/context/AppShellContext'
import { EditPopover, getEditConfig } from '@/components/ui/EditPopover'
import { FreeFormInputContextBadge } from './FreeFormInputContextBadge'
import type { FileAttachment, LoadedSource, LoadedSkill } from '../../../../shared/types'
import type { PermissionMode } from '@craft-agent/shared/agent/modes'
import { type ThinkingLevel, getThinkingLevelsForModel, reconcileThinkingLevelForModel } from '@craft-agent/shared/agent/thinking-levels'
import { useEscapeInterrupt } from '@/context/EscapeInterruptContext'
import { hasOpenOverlay } from '@/lib/overlay-detection'
import { ToolbarStatusSlot } from './ToolbarStatusSlot'
import { buildPlanApprovalMessage } from '../plan-approval-message'
import { shouldHandleScopedInputEvent, shouldRecallPromptOnArrowUp } from './input-event-guards'
import { clearPendingFocusForSession, consumePendingFocusForSession } from './focus-input-events'
import {
  getRecentWorkingDirs,
  addRecentWorkingDir,
} from './working-directory-history'
import { WorkingDirectorySelector, formatPathForDisplay } from './WorkingDirectorySelector'
import { CompactPermissionModeSelector } from './CompactPermissionModeSelector'
import { PermissionModeDropdown } from '../ActiveOptionBadges'
import { CompactModelSelector } from './CompactModelSelector'
import { ThinkingLevelControl } from './ThinkingLevelControl'
import {
  stripPiPrefixForDisplay,
} from './model-picker-helpers'
import { useModelVisionToggle } from './useModelVisionToggle'

function formatFollowUpChipText(text: string, fallback: string, maxLength = 50): string {
  const normalized = text.replace(/\s+/g, ' ').trim()
  if (!normalized) return fallback

  return normalized.length > maxLength
    ? `${normalized.slice(0, maxLength - 1).trimEnd()}…`
    : normalized
}


/** Platform-specific modifier key for keyboard shortcuts */

/** Default rotating placeholders are now generated inside FreeFormInput via useMemo + t() */



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
  onSubmit: (message: string, attachments?: FileAttachment[], skillSlugs?: string[]) => void
  /** Callback to stop processing. Pass silent=true to skip "Response interrupted" message */
  onStop?: (silent?: boolean) => void
  /** Session command path, independent of the message draft and follow-up annotations. */
  onCompact?: () => void
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
  // Advanced options
  permissionMode?: PermissionMode
  onPermissionModeChange?: (mode: PermissionMode) => void
  /** Enabled permission modes for Shift+Tab cycling (min 2 modes) */
  enabledModes?: PermissionMode[]
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
  /** Total height budget, including actions; supplied by InputContainer when wrapped. */
  maxHeight?: number
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
  onLabelsChange?: (labels: string[]) => void
  autoOpenLabelId?: string | null
  onAutoOpenLabelConsumed?: () => void
  /** Workspace ID for loading skill icons */
  workspaceId?: string
  /** Current working directory path */
  workingDirectory?: string
  /** Callback when working directory changes */
  onWorkingDirectoryChange?: (path: string) => void
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
  contextStatus?: ContextStatus
  /** Follow-up annotations shown as context chips above the input */
  followUpItems?: FollowUpInputItem[]
  /** Callback when user clicks a follow-up chip body */
  onFollowUpClick?: (item: FollowUpInputItem, anchor?: { x: number; y: number }) => void
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
  /** When true, the session's locked connection has been removed */
  connectionUnavailable?: boolean
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
  onCompact,
  inputRef: externalInputRef,
  currentModel,
  onModelChange,
  thinkingLevel = 'medium',
  onThinkingLevelChange,
  permissionMode = 'ask',
  onPermissionModeChange,
  enabledModes = ['safe', 'ask', 'allow-all'],
  inputValue,
  onInputChange,
  attachmentsValue,
  onAttachmentsChange,
  unstyled = false,
  onHeightChange,
  maxHeight,
  onFocusChange,
  sources = [],
  enabledSourceSlugs = [],
  onSourcesChange,
  skills = [],
  labels = [],
  sessionLabels = [],
  onLabelAdd,
  onLabelsChange,
  autoOpenLabelId,
  onAutoOpenLabelConsumed,
  workspaceId,
  workingDirectory,
  onWorkingDirectoryChange,
  sessionFolderPath,
  sessionId,
  currentSessionStatus,
  disableSend = false,
  isEmptySession = false,
  contextStatus,
  followUpItems = [],
  onFollowUpClick,
  onFollowUpIndexClick,
  compactMode = false,
  enableCompactModelPicker = false,
  currentConnection,
  connectionUnavailable = false,
}: FreeFormInputProps) {
  const { t } = useTranslation()

  // Read connection default model, connections, and workspace info from context.
  // Uses optional variant so playground (no provider) doesn't crash.
  const appShellCtx = useOptionalAppShellContext()
  const llmConnections = appShellCtx?.llmConnections ?? []
  const workspaceDefaultConnection = appShellCtx?.workspaceDefaultLlmConnection

  // Derive connectionDefaultModel per-session from the effective connection.
  // Only non-null for compat providers (custom endpoints with fixed models).
  // Standard providers (anthropic, pi) → null → normal model picker.
  const connectionDefaultModel = React.useMemo(() => {
    const effectiveSlug = resolveEffectiveConnectionSlug(currentConnection, workspaceDefaultConnection, llmConnections)
    const conn = llmConnections.find(c => c.slug === effectiveSlug)
    if (!conn) return null
    if (!isCompatProvider(conn.providerType)) return null
    // Allow model switching when connection has multiple models
    if (conn.models && conn.models.length > 1) return null
    return conn.defaultModel ?? null
  }, [currentConnection, workspaceDefaultConnection, llmConnections])

  // Compute available models from the effective connection.
  // An empty or unavailable account catalog must stay empty in the composer.
  const availableModels = React.useMemo(() => {
    // Connection removed — don't fall through to another connection's models
    if (connectionUnavailable) return []

    // Determine effective connection using the canonical fallback chain
    const effectiveSlug = resolveEffectiveConnectionSlug(currentConnection, workspaceDefaultConnection, llmConnections)
    const connection = llmConnections.find(c => c.slug === effectiveSlug)

    return connection?.models ?? []
  }, [llmConnections, currentConnection, workspaceDefaultConnection, connectionUnavailable])

  const selectedModelDefinition = React.useMemo(() => {
    const model = availableModels.find(m => typeof m !== 'string' && m.id === currentModel)
    return typeof model === 'string' ? undefined : model
  }, [availableModels, currentModel])
  const availableThinkingLevels = getThinkingLevelsForModel(selectedModelDefinition)

  // Get display name for current model (full name, not short name)
  const currentModelDisplayName = React.useMemo(() => {
    const modelToDisplay = connectionDefaultModel ?? currentModel
    const model = availableModels.find(m =>
      typeof m === 'string' ? m === modelToDisplay : m.id === modelToDisplay
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

  // Effective connection: canonical fallback chain (session → workspace default → global default → first)
  const effectiveConnection = resolveEffectiveConnectionSlug(currentConnection, workspaceDefaultConnection, llmConnections)

  // Effective connection details (with fallbacks) for model list
  // Unlike currentConnectionDetails which is null when no explicit connection is set,
  // this resolves to the actual connection being used (including workspace default)
  const effectiveConnectionDetails = React.useMemo(() => {
    if (!effectiveConnection) return null
    return llmConnections.find(c => c.slug === effectiveConnection) ?? null
  }, [llmConnections, effectiveConnection])


  // Resolve workspace rootPath for "Add New Label" deep link
  const workspaceRootPath = React.useMemo(() => {
    if (!appShellCtx || !workspaceId) return null
    return appShellCtx.workspaces.find(w => w.id === workspaceId)?.rootPath ?? null
  }, [appShellCtx, workspaceId])

  // Workspace slug for SDK skill qualification (server-computed)
  // SDK expects "workspaceSlug:skillSlug" format, NOT UUID
  const workspaceSlug = React.useMemo(() => {
    if (!appShellCtx || !workspaceId) return workspaceId
    return appShellCtx.workspaces.find(w => w.id === workspaceId)?.slug ?? workspaceId
  }, [appShellCtx, workspaceId])

  // Read panel focus state from context (for multi-panel unfocused styling)
  const appShellContext = useOptionalAppShellContext()
  const isFocusedPanel = appShellContext?.isFocusedPanel ?? true

  // One stable instruction, shared by empty/ongoing and focused/unfocused panels.
  const effectivePlaceholder = (Array.isArray(placeholder) ? placeholder[0] : placeholder)
    ?? t(isEmptySession ? 'chatInput.placeholder.startConversation' : 'chatInput.placeholder.followUp')

  // Performance optimization: Always use internal state for typing to avoid parent re-renders
  // Sync FROM parent on mount/change (for restoring drafts)
  // Sync TO parent on blur/submit (debounced persistence)
  const [input, setInput] = React.useState(() => coerceInputText(inputValue))
  const [attachments, setAttachments] = React.useState<FileAttachment[]>(attachmentsValue ?? [])

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
    return attachmentsValue.map(a => a.path).join('|')
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
  const [optimisticSourceSlugs, setOptimisticSourceSlugs] = React.useState(enabledSourceSlugs)

  // Sync from prop when server state changes (reconciles after IPC or on external updates)
  // Use content comparison (not reference) to avoid infinite loops with empty arrays
  const prevEnabledSourceSlugsRef = React.useRef(enabledSourceSlugs)
  React.useEffect(() => {
    const prev = prevEnabledSourceSlugsRef.current
    const changed = enabledSourceSlugs.length !== prev.length ||
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
  const syncToParent = React.useCallback((value: string) => {
    if (!onInputChange) return
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current)
    syncTimeoutRef.current = setTimeout(() => {
      onInputChange(value)
      prevInputValueRef.current = value
    }, 300) // Debounce 300ms
  }, [onInputChange])

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

  // Input settings (loaded from config)
  const [autoCapitalisation, setAutoCapitalisation] = React.useState(true)
  const [sendMessageKey, setSendMessageKey] = React.useState<'enter' | 'cmd-enter'>('enter')
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

  const dragCounterRef = React.useRef(0)
  const containerRef = React.useRef<HTMLDivElement>(null)
  const [contextMenuWidth, setContextMenuWidth] = React.useState(280)
  const contentScrollRef = React.useRef<HTMLDivElement>(null)
  const availableHeight = useInputAvailableHeight(containerRef, maxHeight === undefined)
  const composerMaxHeight = maxHeight ?? getComposerMaxHeight(availableHeight, 'freeform')
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  // Merge refs for RichTextInput
  const internalInputRef = React.useRef<RichTextInputHandle>(null)
  const richInputRef = externalInputRef || internalInputRef

  // Track last caret position for focus restoration (e.g., after permission mode popover closes)
  const lastCaretPositionRef = React.useRef<number | null>(null)

  // Listen for craft:insert-text events (generic mechanism for inserting text into input)
  // Used by components that want to pre-fill the input with text
  React.useEffect(() => {
    const handleInsertText = (e: CustomEvent<{ text: string; sessionId?: string }>) => {
      const targetSessionId = e.detail?.sessionId
      if (!shouldHandleScopedInputEvent({ sessionId, isFocusedPanel, targetSessionId })) return

      const text = coerceInputText(e.detail?.text)
      setInput(text)
      syncToParent(text)
      // Focus the input after inserting
      setTimeout(() => {
        richInputRef.current?.focus()
        // Move cursor to end
        richInputRef.current?.setSelectionRange(text.length, text.length)
      }, 0)
    }

    window.addEventListener('craft:insert-text', handleInsertText as EventListener)
    return () => window.removeEventListener('craft:insert-text', handleInsertText as EventListener)
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

  type PlanApprovalEventDetail = {
    sessionId?: string
    planPath?: string
    includeDraftInput?: boolean
    source?: string
  }

  // Listen for craft:approve-plan events (used by ResponseCard's Accept Plan button)
  // This disables safe mode AND submits the message in one action
  // Only process events for this session (sessionId must match)
  React.useEffect(() => {
    const handleApprovePlan = (e: CustomEvent<PlanApprovalEventDetail>) => {
      // Only handle if this event is for our session
      if (e.detail?.sessionId && e.detail.sessionId !== sessionId) {
        return
      }

      const shouldIncludeDraft = e.detail?.includeDraftInput !== false
      const draftInput = shouldIncludeDraft ? consumeInputDraftSnapshot() : ''
      const text = buildPlanApprovalMessage({
        planPath: e.detail?.planPath,
        draftInput,
      })

      // Switch to allow-all (Auto) mode if in Explore mode (allow execution without prompts)
      // Only switch if currently in safe mode - if user is in 'ask' mode, respect their choice
      if (permissionMode === 'safe') {
        onPermissionModeChange?.('allow-all')
      }

      onSubmit(text, undefined)
    }

    window.addEventListener('craft:approve-plan', handleApprovePlan as EventListener)
    return () => window.removeEventListener('craft:approve-plan', handleApprovePlan as EventListener)
  }, [sessionId, permissionMode, onPermissionModeChange, onSubmit, consumeInputDraftSnapshot])

  // Live completion and reload recovery share one persisted-state dispatcher.
  // Register its listener before the approval listener can send /compact.
  const processingRef = React.useRef(isProcessing)
  processingRef.current = isProcessing
  const requestPendingPlanRef = React.useRef<(() => void) | null>(null)

  React.useEffect(() => {
    if (!sessionId) return
    const dispatcher = createPendingPlanDispatcher({
      isBusy: () => processingRef.current,
      load: () => window.electronAPI.getPendingPlanExecution(sessionId),
      claim: () => window.electronAPI.sessionCommand(sessionId, { type: 'markPendingPlanExecutionDispatched' }),
      submit: pending => onSubmit(buildPlanApprovalMessage({
        planPath: pending.planPath,
        draftInput: pending.draftInputSnapshot,
      }), undefined),
      clear: () => window.electronAPI.sessionCommand(sessionId, { type: 'clearPendingPlanExecution' }),
    })
    const request = () => {
      void dispatcher.request().catch(error => {
        const message = error instanceof Error ? error.message : String(error)
        if (!/Connection closed|Client disconnected|transport|socket/.test(message)) {
          console.error('[FreeFormInput] Failed to resume pending plan execution:', error)
        }
      })
    }
    const handleCompactionComplete = (event: Event) => {
      if ((event as CustomEvent<{ sessionId?: string }>).detail?.sessionId === sessionId) request()
    }
    requestPendingPlanRef.current = request
    window.addEventListener('craft:compaction-complete', handleCompactionComplete)
    request()
    return () => {
      window.removeEventListener('craft:compaction-complete', handleCompactionComplete)
      if (requestPendingPlanRef.current === request) requestPendingPlanRef.current = null
      dispatcher.dispose()
    }
  }, [sessionId, onSubmit])

  // Completion may be published while the host is finishing the current turn.
  // Its idle transition is a second wakeup, not a timing-based guess.
  React.useEffect(() => {
    if (!isProcessing) requestPendingPlanRef.current?.()
  }, [isProcessing, sessionId])

  React.useEffect(() => {
    if (!sessionId) return
    let preparing = false
    const handleApprovePlanWithCompact = async (event: CustomEvent<PlanApprovalEventDetail>) => {
      if (!shouldHandleScopedInputEvent({ sessionId, isFocusedPanel, targetSessionId: event.detail?.sessionId })) return
      if (preparing || processingRef.current) return
      preparing = true
      try {
        const draftInputSnapshot = event.detail?.includeDraftInput !== false ? consumeInputDraftSnapshot() : ''
        if (permissionMode === 'safe') onPermissionModeChange?.('allow-all')
        // Persist first. Only actual successful manual compaction changes this
        // readiness; failure/automatic compaction events never authorize a send.
        await window.electronAPI.sessionCommand(sessionId, {
          type: 'setPendingPlanExecution',
          planPath: event.detail?.planPath ?? '',
          draftInputSnapshot,
        })
        onSubmit('/compact', undefined)
      } catch (error) {
        console.error('[FreeFormInput] Failed to start plan compaction:', error)
      } finally {
        preparing = false
      }
    }
    window.addEventListener('craft:approve-plan-with-compact', handleApprovePlanWithCompact as unknown as EventListener)
    return () => window.removeEventListener('craft:approve-plan-with-compact', handleApprovePlanWithCompact as unknown as EventListener)
  }, [sessionId, isFocusedPanel, permissionMode, onPermissionModeChange, onSubmit, consumeInputDraftSnapshot])

  // Listen for craft:focus-input events (restore focus after popover/dropdown closes)
  React.useEffect(() => {
    const handleFocusInput = (e: Event) => {
      const detail = (e as CustomEvent<{ sessionId?: string }>).detail
      const targetSessionId = detail?.sessionId
      if (!shouldHandleScopedInputEvent({ sessionId, isFocusedPanel, targetSessionId })) return

      if (targetSessionId) {
        clearPendingFocusForSession(targetSessionId)
      }

      richInputRef.current?.focus()
      // Restore caret position if saved, then clear it (one-shot)
      if (lastCaretPositionRef.current !== null) {
        richInputRef.current?.setSelectionRange(
          lastCaretPositionRef.current,
          lastCaretPositionRef.current
        )
        lastCaretPositionRef.current = null
      }
    }

    window.addEventListener('craft:focus-input', handleFocusInput)
    return () => window.removeEventListener('craft:focus-input', handleFocusInput)
  }, [sessionId, isFocusedPanel, richInputRef])

  // Recover queued focus requests after session switch/mount races.
  React.useEffect(() => {
    if (!consumePendingFocusForSession(sessionId)) return

    setTimeout(() => {
      richInputRef.current?.focus()
    }, 0)
  }, [sessionId, richInputRef])

  // Get the next available number for a pasted file prefix (e.g., pasted-image-1, pasted-image-2)
  const getNextPastedNumber = (
    prefix: 'image' | 'text' | 'file',
    existingAttachments: FileAttachment[]
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
    const handlePasteFiles = async (e: CustomEvent<{ files: File[]; sessionId?: string }>) => {
      if (disabled) return

      const targetSessionId = e.detail?.sessionId
      if (!shouldHandleScopedInputEvent({ sessionId, isFocusedPanel, targetSessionId })) return

      const { files } = e.detail
      if (!files || files.length === 0) return

      setLoadingCount(prev => prev + files.length)

      // Pre-assign sequential names using ref to avoid race conditions
      let nextImageNum = getNextPastedNumber('image', attachmentsRef.current)
      const fileNames: string[] = files.map(file => {
        if (!file.name || file.name === 'image.png' || file.name === 'image.jpg' || file.name === 'blob') {
          const ext = file.type.split('/')[1] || 'png'
          return `pasted-image-${nextImageNum++}.${ext}`
        }
        return file.name
      })

      for (let i = 0; i < files.length; i++) {
        try {
          const attachment = await readFileAsAttachment(files[i], fileNames[i])
          if (attachment) {
            setAttachments(prev => [...prev, attachment])
          }
        } catch (error) {
          console.error('[FreeFormInput] Failed to process pasted file:', error)
        }
        setLoadingCount(prev => prev - 1)
      }

      // Focus the input after adding attachments
      richInputRef.current?.focus()
    }

    window.addEventListener('craft:paste-files', handlePasteFiles as unknown as EventListener)
    return () => window.removeEventListener('craft:paste-files', handlePasteFiles as unknown as EventListener)
  }, [disabled, sessionId, isFocusedPanel, richInputRef])

  // Build active commands list for slash command menu
  const activeCommands = React.useMemo(() => {
    const active: SlashCommandId[] = []
    // Add the currently active permission mode
    if (permissionMode === 'safe') active.push('safe')
    else if (permissionMode === 'ask') active.push('ask')
    else if (permissionMode === 'allow-all') active.push('allow-all')
    return active
  }, [permissionMode])

  // Handle slash command selection (mode/feature commands)
  const handleSlashCommand = React.useCallback((commandId: SlashCommandId) => {
    if (commandId === 'safe') onPermissionModeChange?.('safe')
    else if (commandId === 'ask') onPermissionModeChange?.('ask')
    else if (commandId === 'allow-all') onPermissionModeChange?.('allow-all')
    else if (commandId === 'compact' && !isProcessing) onSubmit('/compact', undefined)
  }, [onPermissionModeChange, isProcessing, onSubmit])

  // Handle folder selection from slash command menu
  const handleSlashFolderSelect = React.useCallback((path: string) => {
    if (onWorkingDirectoryChange) {
      setRecentFolders(addRecentWorkingDir(path, workspaceId))
      onWorkingDirectoryChange(path)
    }
  }, [onWorkingDirectoryChange, workspaceId])

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
  const handleMentionSelect = React.useCallback((item: MentionItem) => {
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
  }, [optimisticSourceSlugs, onSourcesChange])

  // Inline mention hook (for skills, sources, and files)
  const inlineMention = useInlineMention({
    inputRef: richInputRef,
    skills,
    sources,
    basePath: workingDirectory,
    onSelect: handleMentionSelect,
    // Use workspace slug (not UUID) for SDK skill qualification
    workspaceId: workspaceSlug,
    scopeKey: sessionId,
  })

  // Inline label menu hook (for #labels)
  const handleLabelSelect = React.useCallback((labelId: string) => {
    onLabelAdd?.(labelId)
  }, [onLabelAdd])

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
  const handleAddLabel = React.useCallback((prefill: string) => {
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
  }, [workspaceRootPath, inlineLabel, syncToParent, t])

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

  // Check if running in Electron environment (has electronAPI)
  const hasElectronAPI = typeof window !== 'undefined' && !!window.electronAPI

  // Shared helper: read a File, add as attachment, decrement loading count
  const processFileAttachment = async (file: File, overrideName?: string) => {
    try {
      const attachment = await readFileAsAttachment(file, overrideName)
      if (attachment) {
        setAttachments(prev => [...prev, attachment])
      }
    } catch (error) {
      console.error('[FreeFormInput] Failed to read file:', error)
    }
    setLoadingCount(prev => prev - 1)
  }

  // File attachment handlers
  const handleAttachClick = React.useCallback(() => {
    if (disabled) return
    fileInputRef.current?.click()
  }, [disabled])

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const fileList = Array.from(files)
    setLoadingCount(prev => prev + fileList.length)

    for (const file of fileList) {
      await processFileAttachment(file)
    }

    // Reset input so re-selecting the same file triggers onChange again
    e.target.value = ''
  }

  const handleRemoveAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
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

  // Helper to read a File using FileReader API
  const readFileAsAttachment = async (file: File, overrideName?: string): Promise<FileAttachment | null> => {
    // Capture the absolute OS path at attach time. Works for <input type="file"> and
    // OS drag-drop; returns null for clipboard paste and web-drag (no disk origin).
    // When null, the draft layer falls back to persisting content inline (Track C).
    const realPath = hasElectronAPI ? window.electronAPI.getFilePath?.(file) ?? null : null

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
          binary += String.fromCharCode(...bytes.subarray(i, Math.min(i + chunkSize, bytes.length)))
        }
        const base64 = btoa(binary)

        let type: FileAttachment['type'] = 'unknown'
        const fileName = overrideName || file.name
        if (file.type.startsWith('image/')) type = 'image'
        else if (file.type === 'application/pdf') type = 'pdf'
        else if (file.type.includes('text') || fileName.match(/\.(txt|md|json|js|ts|tsx|py|css|html)$/i)) type = 'text'
        else if (file.type.includes('officedocument') || fileName.match(/\.(docx?|xlsx?|pptx?)$/i)) type = 'office'

        const mimeType = file.type || 'application/octet-stream'

        // For text files, decode the ArrayBuffer as UTF-8 text
        let text: string | undefined
        if (type === 'text') {
          text = new TextDecoder('utf-8').decode(new Uint8Array(result))
        }

        let thumbnailBase64: string | undefined
        if (hasElectronAPI) {
          try {
            const thumb = await window.electronAPI.generateThumbnail(base64, mimeType)
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
    setLoadingCount(prev => prev + files.length)

    // Pre-assign sequential names using ref to avoid race conditions
    let nextImageNum = getNextPastedNumber('image', attachmentsRef.current)
    const fileNames: string[] = files.map(file => {
      if (!file.name || file.name === 'image.png' || file.name === 'image.jpg' || file.name === 'blob') {
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
    setAttachments(prev => [...prev, attachment])
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
    const hasContent = input.trim() || attachments.length > 0 || followUpItems.length > 0
    if (!hasContent || disabled) return false

    // Tutorial may disable sending to guide user through specific steps
    if (disableSend) return false

    // Parse all @mentions (skills, sources, folders)
    const skillSlugs = skills.map(s => s.slug)
    const sourceSlugs = sources.map(s => s.config.slug)
    const mentions = parseMentions(input, skillSlugs, sourceSlugs)

    // Enable any mentioned sources that aren't already enabled
    if (mentions.sources.length > 0 && onSourcesChange) {
      const newSlugs = [...new Set([...optimisticSourceSlugs, ...mentions.sources])]
      if (newSlugs.length > optimisticSourceSlugs.length) {
        setOptimisticSourceSlugs(newSlugs)
        onSourcesChange(newSlugs)
      }
    }

    const attachmentSnapshot = attachments

    onSubmit(
      input.trim(),
      attachmentSnapshot.length > 0 ? attachmentSnapshot : undefined,
      mentions.skills.length > 0 ? mentions.skills : undefined
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
  }, [input, attachments, followUpItems, disabled, disableSend, onInputChange, onAttachmentsChange, onSubmit, skills, sources, optimisticSourceSlugs, onSourcesChange, onWorkingDirectoryChange, homeDir])

  // Listen for craft:submit-input events (simulate pressing the Send button)
  React.useEffect(() => {
    const handleSubmitInput = (e: CustomEvent<{ sessionId?: string }>) => {
      const targetSessionId = e.detail?.sessionId
      if (!shouldHandleScopedInputEvent({ sessionId, isFocusedPanel, targetSessionId })) return
      submitMessage()
    }

    window.addEventListener('craft:submit-input', handleSubmitInput as EventListener)
    return () => window.removeEventListener('craft:submit-input', handleSubmitInput as EventListener)
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
      const hasVisibleContent = inlineMention.sections.some(s => s.items.length > 0) || inlineMention.isSearching
      if (hasVisibleContent && (e.key === 'Enter' || e.key === 'Tab' || e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
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
      if (e.key === 'Enter' || e.key === 'Tab' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
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
      if (e.key === 'Enter' || e.key === 'Tab' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        return
      }
      if (e.key === 'Escape') {
        e.preventDefault()
        inlineLabel.close()
        return
      }
    }

    // Plain Arrow Up with no draft content cancels the running turn and recalls
    // its prompt through ChatDisplay.handleStop. The pure guard deliberately
    // treats whitespace, attachments, loading files, and follow-up chips as draft
    // content so normal editing is never hijacked.
    if (shouldRecallPromptOnArrowUp({
      key: e.key,
      shiftKey: e.shiftKey,
      metaKey: e.metaKey,
      ctrlKey: e.ctrlKey,
      altKey: e.altKey,
      isComposing: e.nativeEvent.isComposing,
      isProcessing,
      input,
      attachmentCount: attachments.length,
      loadingAttachmentCount: loadingCount,
      followUpItemCount: followUpItems.length,
      inlineMenuOpen: inlineMention.isOpen || inlineSlash.isOpen || inlineLabel.isOpen,
      disabled,
      disableSend,
    })) {
      e.preventDefault()
      handleStop()
      return
    }

    // Skip submission during IME composition - user is confirming composed characters, not sending
    // Handle send key based on user preference:
    // - 'enter': Enter sends (Shift+Enter for newline)
    // - 'cmd-enter': ⌘/Ctrl+Enter sends (Enter for newline)
    if (sendMessageKey === 'enter') {
      // Enter sends, Shift+Enter adds newline
      if (e.key === 'Enter' && !e.shiftKey && !e.metaKey && !e.ctrlKey && !e.nativeEvent.isComposing) {
        e.preventDefault()
        submitMessage()
      }
      // Also allow Cmd/Ctrl+Enter to send (power user shortcut)
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && !e.nativeEvent.isComposing) {
        e.preventDefault()
        submitMessage()
      }
    } else {
      // cmd-enter mode: ⌘/Ctrl+Enter sends, plain Enter adds newline
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && !e.nativeEvent.isComposing) {
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
  const handleInputChange = React.useCallback((value: string) => {
    const nextValue = coerceInputText(value)
    // Get previous input value before updating state
    const prevValue = inputRef.current

    setInput(nextValue)
    syncToParent(nextValue) // Debounced sync to parent for draft persistence

    // Sync source selection when mentions are removed from input
    if (onSourcesChange) {
      const sourceSlugs = sources.map(s => s.config.slug)

      // Parse mentions from previous and current input
      const prevMentions = parseMentions(prevValue, [], sourceSlugs)
      const currMentions = parseMentions(nextValue, [], sourceSlugs)

      // Remove sources that were mentioned before but not anymore
      const removedSources = prevMentions.sources.filter(slug => !currMentions.sources.includes(slug))
      if (removedSources.length > 0) {
        const newSlugs = optimisticSourceSlugs.filter(slug => !removedSources.includes(slug))
        setOptimisticSourceSlugs(newSlugs)
        onSourcesChange(newSlugs)
      }
    }
  }, [syncToParent, sources, optimisticSourceSlugs, onSourcesChange])

  // Handle input with cursor position (for menu detection)
  const handleRichInput = React.useCallback((value: string, cursorPosition: number) => {
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
    if (autoCapitalisation && nextValue.length > 0 && nextValue.charAt(0) !== '/' && nextValue.charAt(0) !== '@' && nextValue.charAt(0) !== '#') {
      const capitalizedFirst = nextValue.charAt(0).toUpperCase()
      if (capitalizedFirst !== nextValue.charAt(0)) {
        newValue = capitalizedFirst + nextValue.slice(1)
        // Set cursor position BEFORE state update so it's used when useEffect syncs the value
        richInputRef.current?.setSelectionRange(cursorPosition, cursorPosition)
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
      richInputRef.current?.setSelectionRange(typography.cursor, typography.cursor)
      setInput(newValue)
      syncToParent(newValue)
    }
  }, [inlineSlash, inlineMention, inlineLabel, syncToParent, autoCapitalisation])

  // Handle inline slash command selection (removes the /command text)
  const handleInlineSlashCommandSelect = React.useCallback((commandId: SlashCommandId) => {
    const newValue = inlineSlash.handleSelectCommand(commandId)
    setInput(newValue)
    syncToParent(newValue)
    richInputRef.current?.focus()
  }, [inlineSlash, syncToParent])

  // Handle inline slash folder selection (inserts a directory badge)
  const handleInlineSlashFolderSelect = React.useCallback((path: string) => {
    const newValue = inlineSlash.handleSelectFolder(path)
    setInput(newValue)
    syncToParent(newValue)
    richInputRef.current?.focus()
  }, [inlineSlash, syncToParent])

  // Handle inline mention selection (inserts appropriate mention text)
  const handleInlineMentionSelect = React.useCallback((item: MentionItem) => {
    if (item.type === 'attachment') { inlineMention.close(); handleAttachClick(); return }
    if (item.type === 'label') {
      onLabelAdd?.(item.id)
      inlineMention.close()
      if (!flattenLabels(labels).find(label => label.id === item.id)?.valueType) {
        requestAnimationFrame(() => richInputRef.current?.focus())
      }
      return
    }
    const { value: newValue, cursorPosition } = inlineMention.handleSelect(item)
    setInput(newValue)
    syncToParent(newValue)
    // Focus input and restore cursor position after badge renders
    setTimeout(() => {
      richInputRef.current?.focus()
      richInputRef.current?.setSelectionRange(cursorPosition, cursorPosition)
    }, 0)
  }, [inlineMention, syncToParent, handleAttachClick, onLabelAdd, richInputRef, labels])

  // Handle inline label selection (removes the #label text from input)
  const handleInlineLabelSelect = React.useCallback((labelId: string) => {
    const newValue = inlineLabel.handleSelect(labelId)
    setInput(newValue)
    syncToParent(newValue)
    richInputRef.current?.focus()
  }, [inlineLabel, syncToParent])


  const followUpLayoutKey = React.useMemo(
    () => followUpItems.map(item => [
      item.id,
      item.index ?? '',
      item.noteLabel,
      item.selectedText,
      item.color ?? '',
    ].join('::')).join('|'),
    [followUpItems]
  )
  const previousFollowUpLayoutKeyRef = React.useRef<string | null>(null)
  const [animateFollowUpLayout, setAnimateFollowUpLayout] = React.useState(false)

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

  const hasContent = input.trim() || attachments.length > 0 || followUpItems.length > 0

  // Pre-flight image-support check: warn when staged images would be silently
  // stripped by Pi SDK because the active custom-endpoint model is text-only.
  // Gate on pi_compat — built-in catalogs (anthropic/pi) are owned by the SDK
  // and we can't repair them from the UI here.
  const hasStagedImages = attachments.some(a => a.type === 'image' || a.mimeType?.startsWith('image/'))
  const showVisionWarning =
    hasStagedImages
    && !!effectiveConnectionDetails
    && isCompatProvider(effectiveConnectionDetails.providerType)
    && !modelSupportsImages(effectiveConnectionDetails, currentModel)
  const contextDisplay = getContextDisplay(
    contextStatus,
    selectedModelDefinition?.contextWindow ?? getModelContextWindow(currentModel),
  )
  const contextLabels = getContextDisplayLabels(contextDisplay, t)

  React.useLayoutEffect(() => {
    if (contentScrollRef.current) scrollFocusedCaretIntoView(contentScrollRef.current)
  }, [composerMaxHeight, attachments, followUpItems, showVisionWarning])

  return (
    <form onSubmit={handleSubmit} className={cn('relative', isEmptySession && onWorkingDirectoryChange && !unstyled && 'rounded-[12px] bg-foreground/3 shadow-minimal')}>
      {/* ZCode ConversationComposer: draft context is outside the editor surface. */}
      {isEmptySession && onWorkingDirectoryChange && (
        <div className="flex min-w-0 flex-wrap items-center p-1.5">
          <WorkingDirectoryBadge
            workingDirectory={workingDirectory}
            onWorkingDirectoryChange={onWorkingDirectoryChange}
            sessionFolderPath={sessionFolderPath}
            isEmptySession
            workspaceId={workspaceId}
          />
        </div>
      )}
      <div
        ref={containerRef}
        className={cn(
          'flex flex-col min-h-0 overflow-hidden transition-colors',
          !unstyled && 'rounded-[12px] border border-foreground/10 bg-background shadow-minimal hover:border-foreground/20 focus-within:border-foreground/30 focus-within:shadow-middle',
          isDraggingOver && 'ring-2 ring-foreground ring-offset-2 ring-offset-background bg-foreground/5'
        )}
        style={{ maxHeight: composerMaxHeight }}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
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
          onOpenChange={(open) => {
            if (open) return
            inlineMention.close()
            if (inlineMention.fromButton) requestAnimationFrame(() => richInputRef.current?.focus())
          }}
          sections={inlineMention.fromButton ? [
            { id: 'attach', label: t('chat.attachFiles'), items: [{ id: 'attach', type: 'attachment', label: t('chat.attachFiles') }] },
            ...inlineMention.sections,
            ...(onLabelAdd ? [{ id: 'labels', label: t('settings.labels.title'), items: flattenLabels(labels)
              .filter(label => !sessionLabels.some(entry => parseLabelEntry(entry).id === label.id))
              .map(label => ({ id: label.id, type: 'label' as const, label: label.name })) }] : []),
          ] : inlineMention.sections}
          onSelect={handleInlineMentionSelect}
          filter={inlineMention.filter}
          position={inlineMention.position}
          workspaceId={workspaceId}
          maxWidth={inlineMention.fromButton ? contextMenuWidth : 280}
          isSearching={inlineMention.isSearching}
          searchFailed={inlineMention.searchFailed}
          onFilterChange={inlineMention.fromButton ? inlineMention.search : undefined}
          selectedSourceSlugs={optimisticSourceSlugs}
          onToggleSource={inlineMention.fromButton && onSourcesChange ? (slug) => {
            const next = optimisticSourceSlugs.includes(slug)
              ? optimisticSourceSlugs.filter(current => current !== slug) : [...optimisticSourceSlugs, slug]
            setOptimisticSourceSlugs(next)
            onSourcesChange(next)
          } : undefined}
        />

        {/* Inline Label & State Autocomplete (#labels / #states) */}
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
            trigger={<span className="absolute top-0 left-0 w-0 h-0 overflow-hidden" />}
            open={addLabelPopoverOpen}
            onOpenChange={setAddLabelPopoverOpen}
            {...addLabelEditConfig}
            defaultValue={addLabelPrefill}
            secondaryAction={workspaceRootPath ? {
              label: 'Edit File',
              filePath: `${workspaceRootPath}/labels/config.json`,
            } : undefined}
            side="top"
            align="start"
          />
        )}

        <div className="flex min-h-0 flex-col">
        {/* Text and ancillary content share one scroll region. Keeping actions
            outside it reserves their measured flex height, even with many chips. */}
        <div ref={contentScrollRef} className="min-h-0 overflow-y-auto overscroll-contain" data-composer-content>
        {/* Pre-flight image-support warning — only for pi_compat connections
            where the renderer can both detect text-only models and offer to
            flip the per-model supportsImages override on the spot. */}
        {showVisionWarning && effectiveConnectionDetails && (
          <ImageSupportWarningBanner
            modelName={currentModelDisplayName}
            onEnable={() => handleToggleModelVision(effectiveConnectionDetails.slug, currentModel, true)}
          />
        )}

        <LabelBadgeRow
          sessionLabels={sessionLabels}
          labels={labels}
          onLabelsChange={onLabelsChange}
          autoOpenLabelId={autoOpenLabelId}
          onAutoOpenConsumed={onAutoOpenLabelConsumed}
        />

        {/* Attachment Preview */}
        <AttachmentPreview
          attachments={attachments}
          onRemove={handleRemoveAttachment}
          disabled={disabled}
          loadingCount={loadingCount}
        />

        {/* Follow-up context chips */}
        <AnimatePresence initial={false}>
          {followUpItems.length > 0 && (
            <motion.div
              key="follow-up-chips"
              layout={animateFollowUpLayout}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.18, ease: [0.2, 0, 0.2, 1] }}
              className="overflow-hidden"
            >
              <motion.div layout={animateFollowUpLayout} className="px-3 pt-3.5 pb-0">
                <motion.div layout={animateFollowUpLayout} className="flex flex-wrap gap-1">
                  <AnimatePresence initial={false}>
                    {followUpItems.map((item, idx) => {
                      const chipIndex = item.index ?? idx + 1
                      const tooltipText = item.selectedText.trim() || t('chat.selectedText')
                      const selectedExcerpt = formatFollowUpChipText(item.selectedText, t('chat.selectedText'), 50)
                      const noteExcerpt = formatFollowUpChipText(item.noteLabel, t('chat.followUp'), 50)

                      return (
                        <motion.button
                          key={item.id}
                          type="button"
                          layout={animateFollowUpLayout}
                          initial={{ opacity: 0, y: 6, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -4, scale: 0.98 }}
                          transition={{ duration: 0.16, ease: [0.2, 0, 0.2, 1] }}
                          className="inline-flex max-w-full items-center gap-1.5 overflow-hidden rounded-[6px] bg-foreground/2 pl-1.5 pr-2 py-1 text-[13px] text-foreground/80 select-none transition-colors hover:bg-foreground/5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                          onClick={(event) => {
                            const rect = event.currentTarget.getBoundingClientRect()
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
                                  if (event.key === 'Enter' || event.key === ' ') {
                                    event.preventDefault()
                                    event.stopPropagation()
                                    onFollowUpIndexClick?.(item)
                                  }
                                }}
                              >
                                {chipIndex}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-[420px] break-words text-xs">
                              {tooltipText}
                            </TooltipContent>
                          </Tooltip>
                          <span className="min-w-0 max-w-full overflow-hidden text-ellipsis whitespace-nowrap pr-0.5 text-left">
                            <span className="italic text-foreground/60">{selectedExcerpt}</span>
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
        <RichTextInput
          ref={richInputRef}
          value={input}
          onChange={handleInputChange}
          onInput={handleRichInput}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onLongTextPaste={handleLongTextPaste}
          onFocus={() => { setIsFocused(true); onFocusChange?.(true) }}
          onBlur={() => {
            // Save caret position before losing focus (for restoration via craft:focus-input)
            lastCaretPositionRef.current = richInputRef.current?.selectionStart ?? null
            setIsFocused(false)
            onFocusChange?.(false)
          }}
          placeholder={effectivePlaceholder}
          disabled={disabled}
          skills={skills}
          sources={sources}
          workspaceId={workspaceSlug}
          className="px-3 pt-2 pb-3 min-h-[88px]"
          data-tutorial="chat-input"
          spellCheck={spellCheck}
        />

        </div>

        {/* Bottom Row: Controls - never shrinks into the scrolling draft region. */}
        <div className="relative shrink-0" data-composer-actions>
          {/* Status slot overlay - escape interrupt (highest priority), browser status, etc. */}
          <ToolbarStatusSlot
            showEscapeOverlay={isProcessing && showEscapeOverlay}
            sessionId={sessionId}
          />

          <div className="flex items-center gap-1 px-3 pb-3 pt-1">
          {/* Hidden file input for attach button (shared by compact and desktop) */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileInputChange}
          />

          {/* ZCode/Cindy: + and @ share a catalogue; permission belongs beside +. */}
          <div className="flex min-w-0 items-center gap-1">
            <Button type="button" variant="ghost" size="icon" disabled={disabled}
              aria-label={t('chat.addContext')} aria-haspopup="listbox" aria-expanded={inlineMention.isOpen && inlineMention.fromButton}
              data-mention-trigger data-tutorial="source-selector-button" className="h-7 w-7 shrink-0 rounded-[6px]"
              onMouseDown={event => event.preventDefault()}
              onClick={event => {
                if (inlineMention.isOpen && inlineMention.fromButton) inlineMention.close()
                else {
                  inlineSlash.close(); inlineLabel.close()
                  const rect = containerRef.current?.getBoundingClientRect() ?? event.currentTarget.getBoundingClientRect()
                  setContextMenuWidth(rect.width)
                  inlineMention.openFromButton({ x: rect.left, y: rect.top })
                }
              }}>
              <Plus className="h-4 w-4" />
            </Button>
            {onPermissionModeChange && (compactMode
              ? <CompactPermissionModeSelector permissionMode={permissionMode} onPermissionModeChange={onPermissionModeChange} />
              : <PermissionModeDropdown toolbar permissionMode={permissionMode} onPermissionModeChange={onPermissionModeChange} sessionId={sessionId} />)}
          </div>

          <div className="flex-1" />

          {/* Right side: Model + Send - never shrink so they're always visible */}
          <div className="flex min-w-0 items-center">
          <ContextUsageRing
            display={contextDisplay}
            labels={contextLabels}
            compactHint={contextDisplay.canCompact ? t(isProcessing ? 'chat.contextUsage.waitToCompact' : 'chat.contextUsage.compact') : undefined}
            onCompact={contextDisplay.canCompact && !isProcessing && !connectionUnavailable && !disabled && !disableSend ? onCompact : undefined}
          />
          {/* 5. Model/Connection Selector - Hidden in compact mode (EditPopover embedding) */}
          {(!compactMode || enableCompactModelPicker) && (
          <CompactModelSelector
            presentation={compactMode ? 'drawer' : 'popover'}
            currentModel={currentModel}
            currentConnection={currentConnection}
            onModelChange={onModelChange}
            isEmptySession={isEmptySession}
            connectionUnavailable={connectionUnavailable}
            contextStatus={contextStatus}
          />
          )}

          {!connectionUnavailable && <ThinkingLevelControl
            level={reconcileThinkingLevelForModel(thinkingLevel, selectedModelDefinition)}
            levels={availableThinkingLevels}
            compact={compactMode}
            onChange={onThinkingLevelChange}
            onRequestFocus={() => richInputRef.current?.focus()}
          />}



          {/* 6. Send/Stop Button - Always show stop when processing */}
          {isProcessing ? (
            <Button
              type="button"
              size="icon"
              variant="secondary"
              aria-label={t('chat.stopResponse')}
              className="send-btn h-7 w-7 rounded-[6px] shrink-0 hover:bg-foreground/15 active:bg-foreground/20 ml-2"
              onClick={() => handleStop(false)}
            >
              <Square className="h-3 w-3 fill-current" />
            </Button>
          ) : (
            <Button
              type="submit"
              size="icon"
              aria-label={t('shortcuts.sendMessage')}
              className="send-btn h-7 w-7 rounded-[6px] shrink-0 ml-2"
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
      </div>
    </form>
  )
}

/**
 * WorkingDirectoryBadge - chat-input trigger for the shared WorkingDirectorySelector.
 *
 * Renders the context-badge trigger; the picker popover + folder state machine
 * live in {@link WorkingDirectorySelector} so the Tasks editor reuses the same
 * picker (and can supply its own trigger).
 */
export function WorkingDirectoryBadge({
  workingDirectory,
  onWorkingDirectoryChange,
  sessionFolderPath,
  isEmptySession = false,
  workspaceId,
}: {
  workingDirectory?: string
  onWorkingDirectoryChange: (path: string) => void
  sessionFolderPath?: string
  isEmptySession?: boolean
  workspaceId?: string
}) {
  const { t } = useTranslation()
  return (
    <WorkingDirectorySelector
      workingDirectory={workingDirectory}
      onWorkingDirectoryChange={onWorkingDirectoryChange}
      sessionFolderPath={sessionFolderPath}
      workspaceId={workspaceId}
      renderTrigger={({ open, hasFolder, folderName, workingDirectory: wd, homeDir, gitBranch }) => (
        <span className="shrink min-w-0 overflow-hidden">
          <FreeFormInputContextBadge
            icon={<Icon_Folder className="h-4 w-4" />}
            label={folderName ?? t('chat.selectProject')}
            isExpanded={isEmptySession}
            hasSelection={hasFolder}
            showChevron={true}
            isOpen={open}
            tooltip={
              hasFolder ? (
                <span className="flex flex-col gap-0.5">
                  <span className="font-medium">{t("chat.workingDirectory")}</span>
                  <span className="text-xs opacity-70">{formatPathForDisplay(wd, homeDir)}</span>
                  {gitBranch && <span className="text-xs opacity-70">{t("chat.onBranch", { branch: gitBranch })}</span>}
                </span>
              ) : t("chat.chooseWorkingDirectory")
            }
          />
        </span>
      )}
    />
  )
}
