/**
 * Fixture states for the Office viewer and the MCP Apps read projection.
 * A completed save is not a state here. The shipping UI does not admit one.
 */

import type { DocumentViewerInput, McpAppsPaneInput } from '../../admission-presentation'

export const documentViewerFixtures: Array<{ name: string; input: DocumentViewerInput; phase: string; status: string; reason?: string }> = [
  {
    name: 'wired docx reader',
    input: { filePath: '/work/note.docx', load: 'ready', expectedSuite: 'docx' },
    phase: 'viewer',
    status: 'wired',
    reason: 'read_only',
  },
  {
    name: 'xlsx still loading',
    input: { filePath: '/work/budget.xlsx', load: 'loading', expectedSuite: 'xlsx' },
    phase: 'loading',
    status: 'wired',
  },
  {
    name: 'empty pptx',
    input: { filePath: '/work/talk.pptx', load: 'ready', expectedSuite: 'pptx', empty: true },
    phase: 'empty',
    status: 'wired',
    reason: 'no_body',
  },
  {
    name: 'docx read error',
    input: { filePath: '/work/note.docx', load: 'error', error: 'invalid_docx', expectedSuite: 'docx' },
    phase: 'error',
    status: 'display-only',
    reason: 'invalid_docx',
  },
  {
    name: 'legacy xls stays locked before a parse',
    input: { filePath: '/work/legacy.xls', load: 'error', error: 'invalid_xlsx', expectedSuite: 'xlsx' },
    phase: 'locked',
    status: 'Locked',
    reason: 'suite_locked',
  },
  {
    name: 'macro deck stays locked',
    input: { filePath: '/work/macros.pptm', load: 'ready' },
    phase: 'locked',
    status: 'Locked',
    reason: 'suite_locked',
  },
]

export const mcpAppsPaneFixtures: Array<{ name: string; input: McpAppsPaneInput; phase: string; status: string; reason?: string }> = [
  {
    name: 'loadout still loading',
    input: { read: 'loading', appCount: 0, workspace: true },
    phase: 'loading',
    status: 'display-only',
  },
  {
    name: 'no enabled app',
    input: { read: 'missing', appCount: 0, workspace: true },
    phase: 'empty',
    status: 'display-only',
  },
  {
    name: 'enabled list is a read projection',
    input: { read: 'ok', appCount: 2, workspace: true },
    phase: 'viewer',
    status: 'display-only',
    reason: 'read_projection',
  },
  {
    name: 'loadout read failed',
    input: { read: 'failed', readReason: 'invalid_loadout', appCount: 0, workspace: true },
    phase: 'error',
    status: 'display-only',
    reason: 'invalid_loadout',
  },
  {
    name: 'no workspace',
    input: { read: 'missing', appCount: 0, workspace: false },
    phase: 'empty',
    status: 'display-only',
    reason: 'no_workspace',
  },
]
