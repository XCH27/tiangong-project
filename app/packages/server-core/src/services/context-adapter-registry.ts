/**
 * Registers codegraph/rtk detectors on System Tools and resolves executable paths.
 * Adapters must not call `which` directly — paths come from SystemToolsRegistry.
 */

import type { ToolCapability } from '@craft-agent/shared/protocol'
import type { ToolDetectorDef } from './system-tools-detector'
import type { SystemToolsRegistry } from './system-tools-registry'
import type { ContextAdapterAvailability, ContextAdapterToolKind } from './context-adapter-types'

export const CODEGRAPH_DETECTOR: ToolDetectorDef = {
  toolId: 'codegraph',
  category: 'context',
  displayName: 'Codegraph',
  capabilities: ['graph-query'],
  risk: 'read-only',
  command: 'codegraph',
  priority: 1,
  versionArgs: ['--version'],
  versionRegex: /(\d+\.\d+\.\d+)/,
  helpArgs: ['--help'],
  identityKeyword: 'codegraph',
  usedBy: ['Context Center', '上下文压缩'],
}

export const RTK_DETECTOR: ToolDetectorDef = {
  toolId: 'rtk',
  category: 'context',
  displayName: 'rtk',
  capabilities: ['search-content'],
  risk: 'local-exec',
  command: 'rtk',
  priority: 2,
  versionArgs: ['--version'],
  versionRegex: /(\d+\.\d+\.\d+)/,
  helpArgs: ['--help'],
  identityKeyword: 'rtk',
  usedBy: ['Context Center', '命令输出压缩'],
}

const DETECTOR_BY_KIND: Record<ContextAdapterToolKind, ToolDetectorDef> = {
  codegraph: CODEGRAPH_DETECTOR,
  rtk: RTK_DETECTOR,
}

export function registerContextAdapterDetectors(registry: SystemToolsRegistry): void {
  registry.registerDetector(CODEGRAPH_DETECTOR)
  registry.registerDetector(RTK_DETECTOR)
}

function capabilityToAvailability(toolId: string, cap: ToolCapability): ContextAdapterAvailability {
  if ((cap.status === 'available' || cap.status === 'conflict') && cap.path) {
    return {
      available: true,
      toolId,
      path: cap.path,
      resolvedPathEnv: cap.resolvedPathEnv,
      version: cap.version,
    }
  }
  const diagnostics = cap.diagnostics?.map((d) => d.message) ?? []
  const reason =
    cap.status === 'missing'
      ? `${cap.displayName} 未安装或不在 PATH`
      : cap.status === 'broken'
        ? `${cap.displayName} 存在但验证失败`
        : `${cap.displayName} 当前不可用 (${cap.status})`
  return { available: false, toolId, reason, diagnostics }
}

export async function resolveContextAdapterTool(
  registry: SystemToolsRegistry,
  kind: ContextAdapterToolKind,
  force = false,
): Promise<ContextAdapterAvailability> {
  registerContextAdapterDetectors(registry)
  const def = DETECTOR_BY_KIND[kind]
  const cap = await registry.detectTool(def.toolId, force)
  return capabilityToAvailability(def.toolId, cap)
}
