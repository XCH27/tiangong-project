import type { SessionToolContext } from '../context.ts'
import { errorResponse, successResponse } from '../response.ts'
import type { ToolResult } from '../types.ts'

function unavailable(name: string): ToolResult {
  return errorResponse(`${name} is not available in this context.`)
}

export async function handleGetTeam(ctx: SessionToolContext, _args: Record<string, never>): Promise<ToolResult> {
  if (!ctx.getTeam) return unavailable('get_team')
  try {
    return successResponse(JSON.stringify(await ctx.getTeam(), null, 2))
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : String(error))
  }
}

export async function handleSendTeamMessage(
  ctx: SessionToolContext,
  args: { content: string; audienceSessionIds?: string[]; taskId?: string; runId?: string },
): Promise<ToolResult> {
  if (!ctx.sendTeamMessage) return unavailable('send_team_message')
  if (!args.content?.trim()) return errorResponse('content is required.')
  try {
    const result = await ctx.sendTeamMessage({ ...args, content: args.content.trim() })
    return successResponse(`Team message queued as ${result.messageId}.`)
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : String(error))
  }
}

export async function handleAssignTeamTask(
  ctx: SessionToolContext,
  args: { taskId: string; assigneeSessionId: string; title: string; description?: string; autoRun?: boolean },
): Promise<ToolResult> {
  if (!ctx.assignTeamTask) return unavailable('assign_team_task')
  if (!args.taskId?.trim() || !args.assigneeSessionId?.trim() || !args.title?.trim()) {
    return errorResponse('taskId, assigneeSessionId, and title are required.')
  }
  try {
    const result = await ctx.assignTeamTask({
      taskId: args.taskId.trim(),
      assigneeSessionId: args.assigneeSessionId.trim(),
      title: args.title.trim(),
      description: args.description?.trim() || undefined,
      autoRun: args.autoRun ?? false,
    })
    return successResponse(result.runId
      ? `Task ${result.taskId} assigned and started as run ${result.runId}.`
      : `Task ${result.taskId} queued without starting the assignee.`)
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : String(error))
  }
}

export async function handleSubmitTeamReport(
  ctx: SessionToolContext,
  args: { taskId: string; runId: string; summary: string; artifactPaths?: string[] },
): Promise<ToolResult> {
  if (!ctx.submitTeamReport) return unavailable('submit_team_report')
  if (!args.taskId?.trim() || !args.runId?.trim() || !args.summary?.trim()) {
    return errorResponse('taskId, runId, and summary are required.')
  }
  try {
    const result = await ctx.submitTeamReport({
      taskId: args.taskId.trim(),
      runId: args.runId.trim(),
      summary: args.summary.trim(),
      artifactPaths: args.artifactPaths,
    })
    return successResponse(`Report ${result.reportId} queued for review as ${result.reviewId}.`)
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : String(error))
  }
}
