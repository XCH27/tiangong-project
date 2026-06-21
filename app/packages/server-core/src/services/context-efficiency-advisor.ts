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

export function buildContextEfficiencyRecommendations(
  overview: Omit<ContextCenterOverview, 'recommendations'>,
): ContextEfficiencyRecommendation[] {
  const recommendations: ContextEfficiencyRecommendation[] = []
  const tools = overview.contextTools.value
  const graph = availableTool(tools, 'graph-query')
  const compressor = tools.find((tool) =>
    tool.status === 'available' && (tool.toolId === 'rtk' || tool.capabilities.includes('search-content')),
  )

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
    status: graph ? 'ready' : 'unavailable',
    reason: graph
      ? '代码图谱可用，结构查询可替代部分整文件读取。'
      : '没有检测到可用的代码图谱工具。',
    toolId: graph?.toolId,
    requiresPermission: false,
  })

  recommendations.push({
    action: 'compress_command_output',
    status: compressor ? 'ready' : 'unavailable',
    reason: compressor
      ? '命令输出压缩工具可用；启用或改写命令仍需用户授权。'
      : '没有检测到可用的命令输出压缩工具。',
    toolId: compressor?.toolId,
    requiresPermission: true,
  })

  const reviewStatus = overview.reviewReadiness.status.value
  recommendations.push({
    action: 'create_project_pack',
    status: reviewStatus === 'needs_pack' ? 'ready' : 'not_needed',
    reason: reviewStatus === 'needs_pack'
      ? '尚无项目包；外部审查前应先生成本地 ProjectPack 并执行 secret scan。'
      : '已有项目包证据或当前审查被其他条件阻断。',
    requiresPermission: true,
  })

  recommendations.push({
    action: 'submit_external_review',
    status: reviewStatus === 'ready' ? 'ready' : 'unavailable',
    reason: reviewStatus === 'ready'
      ? '项目包允许外发；提交仍需用户授权，外部平台成本单独记录。'
      : `当前外部审查状态为 ${reviewStatus}，不能自动提交。`,
    requiresPermission: true,
  })

  return recommendations
}

