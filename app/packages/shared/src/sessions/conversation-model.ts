/**
 * Model choice for a new conversation in an existing workspace (the project).
 *
 * An explicit caller model wins, including the `fast` and `default` tier hints
 * that createSession resolves afterwards. A branch reuses the parent session
 * model. Otherwise the newest visible project conversation's model is reused.
 * A project with no stored model falls through to the workspace default.
 * Connection defaults stay in resolveBackendContext when this returns undefined.
 */

export interface ProjectConversationModel {
  id: string
  model?: string
  hidden?: boolean
}

export interface NewProjectConversationModelInput {
  explicitModel?: string
  branchFromSessionId?: string
  workspaceDefaultModel?: string
  /** Newest first, matching listSessions. */
  conversations: readonly ProjectConversationModel[]
}

function usableModel(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

function reusableProjectModel(value: string | undefined): string | undefined {
  const model = usableModel(value)
  if (!model || model === 'fast' || model === 'default') return undefined
  return model
}

export function modelForNewProjectConversation(input: NewProjectConversationModelInput): string | undefined {
  const explicit = usableModel(input.explicitModel)
  if (explicit) return explicit

  if (input.branchFromSessionId) {
    const parent = input.conversations.find((conversation) => conversation.id === input.branchFromSessionId)
    const parentModel = reusableProjectModel(parent?.model)
    if (parentModel) return parentModel
  }

  for (const conversation of input.conversations) {
    if (conversation.hidden) continue
    const model = reusableProjectModel(conversation.model)
    if (model) return model
  }

  return usableModel(input.workspaceDefaultModel)
}
