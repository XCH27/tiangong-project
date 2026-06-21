/**
 * Registers codegraph/rtk detectors on System Tools and resolves executable paths.
 * Detectors live in BUILTIN_DETECTORS; this module only resolves via registry.
 */

import type { ToolCapability } from '@craft-agent/shared/protocol'
import type { SystemToolsRegistry } from './system-tools-registry'
import type { ContextAdapterAvailability, ContextAdapterToolKind } from './context-adapter-types'

const DETECTOR_TOOL_IDS: Record<ContextAdapterToolKind, string> = {
  codegraph: 'codegraph',
  rtk: 'rtk',
}

export function registerContextAdapterDetectors(registry: SystemToolsRegistry): void {
  // Detectors are registered via BUILTIN_DETECTORS; keep helper for adapter callers.
  void registry
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
  const toolId = DETECTOR_TOOL_IDS[kind]
  const cap = await registry.detectTool(toolId, force)
  return capabilityToAvailability(toolId, cap)
}
