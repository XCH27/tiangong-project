import type { AddMemoryInput, MemoryQuery } from '@craft-agent/shared/protocol'
import type { SessionToolContext } from '../context.ts'
import { errorResponse, successResponse } from '../response.ts'
import type { ToolResult } from '../types.ts'

function unavailable(name: string): ToolResult {
  return errorResponse(`${name} is not available in this context.`)
}

export async function handleListMemory(ctx: SessionToolContext, args: MemoryQuery): Promise<ToolResult> {
  if (!ctx.listMemory) return unavailable('list_memory')
  try {
    const entries = await ctx.listMemory(args ?? {})
    return successResponse(JSON.stringify({ count: entries.length, entries }, null, 2))
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : String(error))
  }
}

export async function handleAddMemory(ctx: SessionToolContext, args: AddMemoryInput): Promise<ToolResult> {
  if (!ctx.addMemory) return unavailable('add_memory')
  if (!args.partition) return errorResponse('partition is required.')
  if (!args.content?.trim()) return errorResponse('content is required.')
  try {
    const entry = await ctx.addMemory({ ...args, content: args.content.trim() })
    return successResponse(`Memory saved: ${entry.id}`)
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : String(error))
  }
}

export async function handleDeleteMemory(ctx: SessionToolContext, args: { id: string }): Promise<ToolResult> {
  if (!ctx.deleteMemory) return unavailable('delete_memory')
  const id = args.id?.trim()
  if (!id) return errorResponse('id is required.')
  try {
    const deleted = await ctx.deleteMemory(id)
    return successResponse(deleted ? `Memory deleted: ${id}` : `Memory not found: ${id}`)
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : String(error))
  }
}
