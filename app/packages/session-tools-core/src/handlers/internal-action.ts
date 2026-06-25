import type { ActionInvocation, ActionSurface, ActionVerb } from '@craft-agent/shared/protocol'
import type { SessionToolContext } from '../context.ts'
import { errorResponse, successResponse } from '../response.ts'
import type { ToolResult } from '../types.ts'

export interface ListInternalActionsArgs {
  surface?: ActionSurface
  verb?: ActionVerb
}

export interface InvokeInternalActionArgs extends ActionInvocation {}

function unavailable(name: string): ToolResult {
  return errorResponse(`${name} is not available in this context.`)
}

export async function handleListInternalActions(ctx: SessionToolContext, args: ListInternalActionsArgs): Promise<ToolResult> {
  if (!ctx.listInternalActions) return unavailable('list_internal_actions')
  try {
    const actions = await ctx.listInternalActions({
      surface: args.surface,
      verb: args.verb,
    })
    return successResponse(JSON.stringify({ count: actions.length, actions }, null, 2))
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : String(error))
  }
}

export async function handleInvokeInternalAction(ctx: SessionToolContext, args: InvokeInternalActionArgs): Promise<ToolResult> {
  if (!ctx.invokeInternalAction) return unavailable('invoke_internal_action')
  if (!args.actionDefinitionId?.trim()) return errorResponse('actionDefinitionId is required.')
  if (!Number.isInteger(args.contractVersion) || args.contractVersion < 1) return errorResponse('contractVersion must be a positive integer.')
  if (!args.actor) return errorResponse('actor is required.')

  try {
    const result = await ctx.invokeInternalAction(args)
    return successResponse(JSON.stringify({ result }, null, 2))
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : String(error))
  }
}
