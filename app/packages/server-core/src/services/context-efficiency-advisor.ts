import type {
  ContextCenterOverview,
  ContextEfficiencyRecommendation,
  ToolCapability,
  ToolCapabilityTag,
} from '@craft-agent/shared/protocol'

function availableTool(
  tools: ToolCapability[],
  capability: ToolCapabilityTag,
): ToolCapability | undefined {
  return tools.find((tool) => tool.status === 'available' && tool.capabilities.includes(capability))
}

function findTool(tools: ToolCapability[], toolId: string): ToolCapability | undefined {
  return tools.find((tool) => tool.toolId === toolId)
}

function sidecarInstallHint(tool: ToolCapability | undefined, installLabel: string): string {
  if (!tool) return `未检测到 ${installLabel}。请在系统工具页确认 PATH，或按官方文档安装后重新检测。Fleet 不会自动安装。`
  if (tool.status === 'missing') {
    return `${installLabel} 不在 PATH。${tool.diagnostics[0]?.repairSuggestion ?? '请安装后重新检测。'}`
  }
  if (tool.status === 'broken') {
    return `${installLabel} 路径存在但验证失败：${tool.diagnostics[0]?.message ?? '请检查是否撞名 shim。'}`
  }
  if (tool.status === 'conflict') {
    return `${installLabel} 可用但存在多版本冲突；当前使用 ${tool.path ?? '未知路径'}。`
  }
  return `${installLabel} 不可用（${tool.status}）。`
}

export function buildContextEfficiencyRecommendations(
  overview: Omit<ContextCenterOverview, 'recommendations'>,
): ContextEfficiencyRecommendation[] {
  const recommendations: ContextEfficiencyRecommendation[] = []
  const tools = overview.contextTools.value
  const graphTool = findTool(tools, 'codegraph') ?? availableTool(tools, 'graph-query')
  const rtkTool = findTool(tools, 'rtk')

  if (!overview.usage) {
    recommendations.push({
      action: 'inspect_usage',
      status: 'unavailable',
      reason: '当前没有真实会话用量，不能判断上下文压力。',
      requiresPermission: false,
    })
  } else if ((overview.usage.estimatedContextPercent?.value ?? 0) >= 0.75) {
    recommendations.push({
      action: 'inspect_usage',
      status: 'ready',
      reason: '估算上下文占用已达到 75%，应优先减少整文件读取和重复输出。',
      requiresPermission: false,
    })
  } else {
    recommendations.push({
      action: 'inspect_usage',
      status: 'not_needed',
      reason: '现有真实用量未显示高上下文压力。',
      requiresPermission: false,
    })
  }

  recommendations.push({
    action: 'query_code_graph',
    status: graphTool?.status === 'available' || graphTool?.status === 'conflict' ? 'ready' : 'unavailable',
    reason: graphTool?.status === 'available' || graphTool?.status === 'conflict'
      ? `codegraph 可用（${graphTool.path ?? 'System Tools 已解析路径'}），结构查询可替代部分整文件读取。`
      : sidecarInstallHint(graphTool, 'codegraph'),
    toolId: graphTool?.toolId,
    requiresPermission: false,
  })

  recommendations.push({
    action: 'compress_command_output',
    status: rtkTool?.status === 'available' || rtkTool?.status === 'conflict' ? 'ready' : 'unavailable',
    reason: rtkTool?.status === 'available' || rtkTool?.status === 'conflict'
      ? 'rtk 可用；压缩命令输出仍需用户授权，adapter 统计为估算 token。'
      : `${sidecarInstallHint(rtkTool, 'rtk')} 未安装时仍可使用 Fleet 本地降级压缩逻辑。`,
    toolId: rtkTool?.toolId,
    requiresPermission: true,
  })

  const reviewStatus = overview.reviewReadiness.status.value
  recommendations.push({
    action: 'create_project_pack',
    status: reviewStatus === 'needs_pack' ? 'ready' : 'not_needed',
    reason: reviewStatus === 'needs_pack'
      ? '尚无项目包；可先用 ProjectPack delta 规划增量范围，再生成完整包并执行 secret scan。'
      : '已有项目包证据或当前审查被其他条件阻断。',
    requiresPermission: true,
  })

  recommendations.push({
    action: 'submit_external_review',
    status: reviewStatus === 'ready' ? 'ready' : 'unavailable',
    reason: reviewStatus === 'ready'
      ? '项目包允许外发；提交仍需用户授权。外部平台成本未知，且不自动登录/上传。'
      : `当前外部审查状态为 ${reviewStatus}，不能自动提交。`,
    requiresPermission: true,
  })

  return recommendations
}

export function buildContextCenterSidecarNotes(tools: ToolCapability[]): string[] {
  const notes: string[] = []
  for (const toolId of ['codegraph', 'rtk'] as const) {
    const tool = findTool(tools, toolId)
    if (!tool) {
      notes.push(`${toolId} 未纳入 System Tools 检测结果。`)
      continue
    }
    if (tool.status === 'available') {
      notes.push(`${tool.displayName} 可用：${tool.path ?? '路径未知'}${tool.version ? ` (${tool.version})` : ''}。`)
    } else if (tool.status === 'conflict') {
      notes.push(`${tool.displayName} 可用但存在版本冲突；运行时将使用 ${tool.path ?? '当前路径'}。`)
    } else {
      notes.push(sidecarInstallHint(tool, tool.displayName))
    }
  }
  return notes
}
