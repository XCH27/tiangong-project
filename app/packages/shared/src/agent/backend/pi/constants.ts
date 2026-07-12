/**
 * Pi Backend Constants
 *
 * Shared constants used by the Pi agent and its event adapter.
 * Extracted here to avoid circular imports between pi-agent.ts and event-adapter.ts.
 */

import type { ThinkingLevel as PiThinkingLevel } from '@earendil-works/pi-agent-core';
import type { ThinkingLevel } from '../../thinking-levels.ts';

/**
 * Map Craft's {@link ThinkingLevel} to Pi's `ThinkingLevel`.
 * Pi's ceiling is `xhigh`; Craft's `max` saturates there.
 *
 * Owner decision (docs/02-DECISIONS.md E9, 2026-07-11): the product keeps one
 * thinking-level vocabulary and each backend adapts it to what the SDK/model
 * actually supports — saturate at the provider ceiling, never send a level the
 * installed SDK's type does not accept. `max` may only pass through 1:1 after
 * a published pi SDK release whose `ThinkingLevel` includes `'max'` (none
 * exists as of 0.80.6) and an owner-approved dependency bump.
 */
export const THINKING_TO_PI: Record<ThinkingLevel, PiThinkingLevel> = {
  off: 'off',
  low: 'low',
  medium: 'medium',
  high: 'high',
  xhigh: 'xhigh',
  max: 'xhigh',
};

/**
 * Map Pi SDK lowercase tool names to PascalCase names used by our permission system.
 * Pi's built-in tools use lowercase names (e.g., 'read', 'bash') but
 * ALWAYS_ALLOWED_TOOLS and shouldAllowToolInMode expect PascalCase (e.g., 'Read', 'Bash').
 *
 * Used by PiAgent (permission enforcement) and PiEventAdapter (tool name normalization).
 */
export const PI_TOOL_NAME_MAP: Record<string, string> = {
  bash: 'Bash',
  read: 'Read',
  write: 'Write',
  edit: 'Edit',
  grep: 'Grep',
  find: 'Find',
  ls: 'Ls',
  // Additional mappings for possible tool names
  multi_edit: 'MultiEdit',
  web_fetch: 'WebFetch',
  web_search: 'WebSearch',
  notebook_edit: 'NotebookEdit',
  glob: 'Glob',
  task: 'Task',
};
