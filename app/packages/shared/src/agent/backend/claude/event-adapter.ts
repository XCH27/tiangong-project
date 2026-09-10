/**
 * Claude Event Adapter
 *
 * Maps Claude SDK messages (SDKMessage) to Craft Agent's AgentEvent format.
 * Extracted from ClaudeAgent.convertSDKMessage() for testability and to share
 * lifecycle scaffolding with PiEventAdapter via BaseEventAdapter.
 *
 * Key Claude-specific behavior:
 * - Uses extractToolStarts/extractToolResults from tool-matching.ts (stateless, ID-based)
 * - Handles stream_event for real-time text deltas and tool start detection
 * - Manages pendingText for deferred text_complete (waits for stop_reason from message_delta)
 * - Tracks usage per-message (not cumulative) for accurate context window display
 */

import type { SDKMessage, SDKAssistantMessageError } from '@anthropic-ai/claude-agent-sdk';
import type { AgentEvent, AgentEventUsage } from '@craft-agent/core/types';
import type { AgentError } from '../../errors.ts';
import { normalizeProviderUsage, type NormalizedCacheUsage } from '../../core/cache-economy.ts';

/**
 * Complete-event usage plus the error-path tag. `errored` marks usage from a
 * failed turn: SessionManager skips accumulating it because the retried turn's
 * complete event carries the replacement totals (accumulating both would
 * double-count cost). Provisional side-channel until the core type gains the
 * field — read it back via the same cast in SessionManager's 'complete' case.
 */
type TurnResultUsage = AgentEventUsage & { errored?: boolean; cacheUsage?: NormalizedCacheUsage };
import { BaseEventAdapter } from '../base-event-adapter.ts';
import { ToolIndex, extractToolStarts, extractToolResults, isParentTaskTool, type ContentBlock } from '../../tool-matching.ts';
import { classifyClaudeTaskNotification } from './task-notification.ts';

/**
 * Callbacks injected by ClaudeAgent for operations that depend on agent state.
 */
export interface ClaudeAdapterCallbacks {
  /** Debug logger — wired to ClaudeAgent.onDebug */
  onDebug?: (msg: string) => void;
  /** Maps SDK error codes to typed AgentErrors (depends on debug log parsing) */
  mapSDKError: (errorCode: SDKAssistantMessageError) => Promise<{ type: 'typed_error'; error: AgentError }>;
  /** Session directory for tool metadata (prevents cross-session race condition) */
  sessionDir?: string;
}

/**
 * Pure function: build a typed_error event for Windows SDK setup issues.
 * Returns null if the error doesn't match the pattern.
 */
export function buildWindowsSkillsDirError(errorText: string): { type: 'typed_error'; error: AgentError } | null {
  if (!errorText.includes('ENOENT') || !errorText.includes('skills')) {
    return null;
  }

  const pathMatch = errorText.match(/scandir\s+'([^']+)'/);
  const missingPath = pathMatch?.[1] || 'C:\\ProgramData\\ClaudeCode\\.claude\\skills';

  return {
    type: 'typed_error',
    error: {
      code: 'unknown_error',
      title: 'Windows Setup Required',
      message: `The SDK requires a directory that doesn't exist: ${missingPath} — Create this folder in File Explorer, then restart the app.`,
      details: [
        `PowerShell (run as Administrator):`,
        `New-Item -ItemType Directory -Force -Path "${missingPath}"`,
      ],
      actions: [],
      canRetry: true,
      originalError: errorText,
    },
  };
}

/**
 * Per-message usage snapshot for accurate context window display.
 * result.modelUsage is cumulative; we need per-message granularity.
 */
interface AssistantUsage {
  input_tokens: number;
  cache_read_input_tokens: number;
  cache_creation_input_tokens: number;
  cacheUsage: NormalizedCacheUsage;
}

export class ClaudeEventAdapter extends BaseEventAdapter {
  // Per-turn state (reset on each startTurn)
  private toolIndex = new ToolIndex();
  private emittedToolStarts = new Set<string>();
  private activeParentTools = new Set<string>();
  private pendingText: string | null = null;

  // Session-persistent state (survives across turns)
  private lastAssistantUsage: AssistantUsage | null = null;
  private cachedContextWindow?: number;
  private _sdkTools: string[] = [];

  private callbacks: ClaudeAdapterCallbacks;

  constructor(callbacks: ClaudeAdapterCallbacks) {
    super('claude-adapter');
    this.callbacks = callbacks;
  }

  // ============================================================
  // Turn Lifecycle
  // ============================================================

  protected onTurnStart(): void {
    this.toolIndex = new ToolIndex();
    this.emittedToolStarts = new Set();
    this.activeParentTools = new Set();
    this.pendingText = null;
    this.lastAssistantUsage = null;
  }

  // ============================================================
  // Public API
  // ============================================================

  /**
   * Convert an SDK message to AgentEvents.
   * Main entry point called from ClaudeAgent's for-await loop.
   */
  async adapt(message: SDKMessage): Promise<AgentEvent[]> {
    const events: AgentEvent[] = [];

    // Debug: log non-streaming SDK message types (stream_event is too frequent)
    if (this.callbacks.onDebug && message.type !== 'stream_event') {
      const msgInfo = message.type === 'user' && 'tool_use_result' in message
        ? `user (tool_result for ${(message as any).parent_tool_use_id})`
        : message.type;
      this.callbacks.onDebug(`SDK message: ${msgInfo}`);
    }

    switch (message.type) {
      case 'assistant':
        await this.adaptAssistant(message, events);
        break;

      case 'stream_event':
        this.adaptStreamEvent(message, events);
        break;

      case 'user':
        this.adaptUser(message, events);
        break;

      case 'tool_progress':
        this.adaptToolProgress(message, events);
        break;

      case 'result':
        this.adaptResult(message, events);
        break;

      case 'system':
        this.adaptSystem(message, events);
        break;

      case 'auth_status':
        this.adaptAuthStatus(message, events);
        break;

      default:
        if (this.callbacks.onDebug) {
          this.callbacks.onDebug(`Unhandled SDK message type: ${(message as any).type}`);
        }
        break;
    }

    return events;
  }

  /**
   * Flush any pending text that hasn't been emitted.
   * Called after the for-await loop exits to handle edge cases
   * (e.g., SDK sends assistant message with text but skips message_delta).
   */
  flushPending(): AgentEvent | null {
    if (this.pendingText) {
      const event: AgentEvent = {
        type: 'text_complete',
        text: this.pendingText,
        isIntermediate: false,
        turnId: this.currentTurnId || undefined,
      };
      this.pendingText = null;
      return event;
    }
    return null;
  }

  /**
   * Get SDK tools captured from init message.
   */
  get sdkTools(): string[] {
    return this._sdkTools;
  }

  /**
   * Get the tool index (for agent-level operations like inactive source detection).
   */
  getToolIndex(): ToolIndex {
    return this.toolIndex;
  }

  /**
   * Get the set of active parent tools (exposed for source activation detection).
   */
  getActiveParentTools(): Set<string> {
    return this.activeParentTools;
  }

  /**
   * Update the session directory for tool metadata lookups.
   */
  updateSessionDir(sessionDir: string): void {
    this.callbacks.sessionDir = sessionDir;
  }

  // ============================================================
  // Per-message-type Handlers
  // ============================================================

  private async adaptAssistant(message: SDKMessage, events: AgentEvent[]): Promise<void> {
    // Check for SDK-level errors FIRST (auth, network, rate limits, etc.)
    if ('error' in message && message.error) {
      const errorEvent = await this.callbacks.mapSDKError(
        message.error as SDKAssistantMessageError,
      );
      events.push(errorEvent);
      return;
    }

    // Skip replayed messages when resuming a session
    if ('isReplay' in message && message.isReplay) {
      return;
    }

    // Track usage from non-sidechain assistant messages
    const isSidechain = (message as any).parent_tool_use_id !== null;
    if (!isSidechain && (message as any).message?.usage) {
      const usage = (message as any).message.usage;
      const cacheUsage = normalizeProviderUsage({
        input_tokens: usage.input_tokens,
        cache_read_input_tokens: usage.cache_read_input_tokens,
        cache_creation_input_tokens: usage.cache_creation_input_tokens,
        output_tokens: usage.output_tokens,
      });
      this.lastAssistantUsage = {
        input_tokens: cacheUsage.uncachedInputTokens,
        cache_read_input_tokens: cacheUsage.cacheReadTokens,
        cache_creation_input_tokens: cacheUsage.cacheWriteTokens,
        cacheUsage,
      };

      events.push({
        type: 'usage_update',
        usage: {
          inputTokens: cacheUsage.totalInputTokens,
          cacheReadTokens: cacheUsage.cacheReadTokens,
          cacheCreationTokens: cacheUsage.cacheWriteTokens,
          contextWindow: this.cachedContextWindow,
          cacheUsage,
        } as AgentEvent extends { type: 'usage_update'; usage: infer U } ? U : never,
      });
    }

    // Full assistant message with content blocks
    const content = (message as any).message?.content ?? [];

    // Extract text from content blocks
    let textContent = '';
    for (const block of content) {
      if (block.type === 'text') {
        textContent += block.text;
      }
    }

    // Stateless tool start extraction
    const sdkParentId = (message as any).parent_tool_use_id;
    const toolStartEvents = extractToolStarts(
      content as ContentBlock[],
      sdkParentId,
      this.toolIndex,
      this.emittedToolStarts,
      this.currentTurnId || undefined,
      this.activeParentTools,
      this.callbacks.sessionDir,
    );

    // Track active Task tools for fallback parent assignment
    for (const event of toolStartEvents) {
      if (event.type === 'tool_start' && isParentTaskTool(event.toolName)) {
        this.activeParentTools.add(event.toolUseId);
      }
    }

    events.push(...toolStartEvents);

    if (textContent) {
      // Don't emit text_complete yet — wait for message_delta to get stop_reason
      this.pendingText = textContent;
    }
  }

  private adaptStreamEvent(message: SDKMessage, events: AgentEvent[]): void {
    const event = (message as any).event;

    // Debug: log key stream events only (skip per-chunk deltas and frequent pings)
    if (this.callbacks.onDebug && (event.type === 'message_start' || event.type === 'message_stop')) {
      this.callbacks.onDebug(
        `stream_event: ${event.type}`,
      );
    }

    // Capture turn ID from message_start
    if (event.type === 'message_start') {
      const messageId = event.message?.id;
      if (messageId) {
        this.currentTurnId = messageId;
      }
    }

    // message_delta contains the actual stop_reason — emit pending text now
    if (event.type === 'message_delta') {
      const stopReason = event.delta?.stop_reason;
      if (this.pendingText) {
        const isIntermediate = stopReason === 'tool_use';
        events.push({
          type: 'text_complete',
          text: this.pendingText,
          isIntermediate,
          turnId: this.currentTurnId || undefined,
          parentToolUseId: (message as any).parent_tool_use_id || undefined,
        });
        this.pendingText = null;
      }
    }

    if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
      events.push({
        type: 'text_delta',
        text: event.delta.text,
        turnId: this.currentTurnId || undefined,
        parentToolUseId: (message as any).parent_tool_use_id || undefined,
      });
    } else if (event.type === 'content_block_start' && event.content_block.type === 'tool_use') {
      // Stream events arrive with empty input — the full input comes later
      const toolBlock = event.content_block;
      const sdkParentId = (message as any).parent_tool_use_id;
      const streamBlocks: ContentBlock[] = [{
        type: 'tool_use' as const,
        id: toolBlock.id,
        name: toolBlock.name,
        input: (toolBlock.input ?? {}) as Record<string, unknown>,
      }];
      const streamEvents = extractToolStarts(
        streamBlocks,
        sdkParentId,
        this.toolIndex,
        this.emittedToolStarts,
        this.currentTurnId || undefined,
        this.activeParentTools,
        this.callbacks.sessionDir,
      );

      // Track active Task/Agent tools for fallback parent assignment
      for (const evt of streamEvents) {
        if (evt.type === 'tool_start' && isParentTaskTool(evt.toolName)) {
          this.activeParentTools.add(evt.toolUseId);
        }
      }

      events.push(...streamEvents);
    }
  }

  private adaptUser(message: SDKMessage, events: AgentEvent[]): void {
    // Skip replayed messages when resuming
    if ('isReplay' in message && message.isReplay) {
      return;
    }

    // Tool result matching
    if ((message as any).tool_use_result !== undefined || ('message' in message && (message as any).message)) {
      const msgContent = ('message' in message && (message as any).message)
        ? (((message as any).message as { content?: unknown[] }).content ?? [])
        : [];
      const contentBlocks = (Array.isArray(msgContent) ? msgContent : []) as ContentBlock[];

      const sdkParentId = (message as any).parent_tool_use_id;
      const toolUseResultValue = (message as any).tool_use_result;

      const resultEvents = extractToolResults(
        contentBlocks,
        sdkParentId,
        toolUseResultValue,
        this.toolIndex,
        this.currentTurnId || undefined,
      );

      // Remove completed Task/Agent tools from activeParentTools
      for (const event of resultEvents) {
        if (event.type === 'tool_result' && isParentTaskTool(event.toolName ?? '')) {
          this.activeParentTools.delete(event.toolUseId);
        }
      }

      events.push(...resultEvents);
    }
  }

  private adaptToolProgress(message: SDKMessage, events: AgentEvent[]): void {
    const progress = message as unknown as {
      tool_use_id: string;
      tool_name: string;
      parent_tool_use_id: string | null;
      elapsed_time_seconds?: number;
    };

    // Forward elapsed time for live progress updates
    if (progress.elapsed_time_seconds !== undefined) {
      events.push({
        type: 'task_progress',
        toolUseId: progress.parent_tool_use_id || progress.tool_use_id,
        elapsedSeconds: progress.elapsed_time_seconds,
        turnId: this.currentTurnId || undefined,
      });
    }

    // Emit tool_start for tools discovered through progress events
    if (!this.emittedToolStarts.has(progress.tool_use_id)) {
      const progressBlocks: ContentBlock[] = [{
        type: 'tool_use' as const,
        id: progress.tool_use_id,
        name: progress.tool_name,
        input: {},
      }];
      const progressEvents = extractToolStarts(
        progressBlocks,
        progress.parent_tool_use_id,
        this.toolIndex,
        this.emittedToolStarts,
        this.currentTurnId || undefined,
        this.activeParentTools,
        this.callbacks.sessionDir,
      );

      // Track active Task/Agent tools discovered via progress events
      for (const evt of progressEvents) {
        if (evt.type === 'tool_start' && isParentTaskTool(evt.toolName)) {
          this.activeParentTools.add(evt.toolUseId);
        }
      }

      events.push(...progressEvents);
    }
  }

  private adaptResult(message: SDKMessage, events: AgentEvent[]): void {
    const msg = message as any;

    // Debug logging
    console.error(
      `[ClaudeAdapter] result message: subtype=${msg.subtype}, errors=${'errors' in msg ? JSON.stringify(msg.errors) : 'none'}`,
    );

    // Get contextWindow from modelUsage
    const modelUsageEntries = Object.values(msg.modelUsage || {});
    const primaryModelUsage = modelUsageEntries[0] as any;

    if (primaryModelUsage?.contextWindow) {
      this.cachedContextWindow = primaryModelUsage.contextWindow;
    }

    // The result message's msg.usage is the SDK's whole-turn cumulative record
    // (every API call in the turn); lastAssistantUsage is only the FINAL call.
    // SessionManager accumulates every field of the complete event, so all
    // fields must come from the same cumulative record — mixing the final-call
    // input with whole-turn output/cost mis-counts multi-call turns. The
    // per-message snapshot (final-call context size) rides the trailing
    // usage_update below, which is the contextTokens authority.
    const cacheUsage = normalizeProviderUsage({
      input_tokens: msg.usage.input_tokens,
      cache_read_input_tokens: msg.usage.cache_read_input_tokens,
      cache_creation_input_tokens: msg.usage.cache_creation_input_tokens,
      output_tokens: msg.usage.output_tokens,
    });

    const usage: TurnResultUsage = {
      inputTokens: cacheUsage.totalInputTokens,
      outputTokens: cacheUsage.outputTokens,
      cacheReadTokens: cacheUsage.cacheReadTokens,
      cacheCreationTokens: cacheUsage.cacheWriteTokens,
      costUsd: msg.total_cost_usd,
      contextWindow: primaryModelUsage?.contextWindow,
      cacheUsage,
    };

    if (msg.subtype === 'success') {
      events.push({ type: 'complete', usage });
    } else {
      const errorMsg = 'errors' in msg ? msg.errors.join(', ') : 'Query failed';

      const windowsError = buildWindowsSkillsDirError(errorMsg);
      if (windowsError) {
        events.push(windowsError);
      } else {
        events.push({ type: 'error', message: errorMsg });
      }
      // Tag error-path usage so the accumulator skips it — a failed-then-retried
      // turn reports its full replacement usage on the retry's complete event.
      const erroredUsage: TurnResultUsage = { ...usage, errored: true };
      events.push({ type: 'complete', usage: erroredUsage });
    }

    // Re-assert the per-message context snapshot after the complete event:
    // complete now carries whole-turn cumulative input, but contextTokens (and
    // the renderer badge) track the final API call's actual context size.
    if (this.lastAssistantUsage) {
      events.push({
        type: 'usage_update',
        usage: {
          inputTokens:
            this.lastAssistantUsage.input_tokens +
            this.lastAssistantUsage.cache_read_input_tokens +
            this.lastAssistantUsage.cache_creation_input_tokens,
          cacheReadTokens: this.lastAssistantUsage.cache_read_input_tokens,
          cacheCreationTokens: this.lastAssistantUsage.cache_creation_input_tokens,
          contextWindow: this.cachedContextWindow,
          cacheUsage: this.lastAssistantUsage.cacheUsage,
        } as AgentEvent extends { type: 'usage_update'; usage: infer U } ? U : never,
      });
    }
  }

  private adaptSystem(message: SDKMessage, events: AgentEvent[]): void {
    const msg = message as any;

    if (msg.subtype === 'init') {
      // Capture tools list from SDK init message
      if ('tools' in msg && Array.isArray(msg.tools)) {
        this._sdkTools = msg.tools;
        this.callbacks.onDebug?.(`SDK init: captured ${this._sdkTools.length} tools`);
      }
    } else if (msg.subtype === 'compact_boundary') {
      events.push({
        type: 'info',
        message: 'Compacted Conversation',
      });
    } else if (msg.subtype === 'status' && msg.status === 'compacting') {
      events.push({ type: 'status', message: 'Compacting conversation...' });
    } else if (msg.subtype === 'task_notification') {
      const classification = classifyClaudeTaskNotification(message);
      if (classification.kind === 'missing-task-id') {
        this.callbacks.onDebug?.('[EventAdapter] task_notification missing task_id, skipping');
        return;
      }
      if (classification.kind === 'valid') {
        events.push({
          type: 'task_completed',
          taskId: classification.notification.taskId,
          status: classification.notification.status,
          outputFile: classification.notification.outputFile,
          summary: classification.notification.summary,
          turnId: this.currentTurnId || undefined,
        });
      }
    }
  }

  private adaptAuthStatus(message: SDKMessage, events: AgentEvent[]): void {
    const msg = message as any;
    if (msg.error) {
      events.push({
        type: 'error',
        message: `Auth error: ${msg.error}. Try running /auth to re-authenticate.`,
      });
    }
  }
}
