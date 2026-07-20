type WorkspaceNameTranslator = (
  key: 'settings.workspace.title' | 'workspace.myRemoteWorkspace' | 'workspace.myWorkspace'
) => string

/** Localize Craft's built-in default names while preserving user-defined names. */
export function getWorkspaceDisplayName(
  name: string | null | undefined,
  t: WorkspaceNameTranslator
): string {
  if (name === 'My Workspace') return t('workspace.myWorkspace')
  if (name === 'My Remote Workspace') return t('workspace.myRemoteWorkspace')
  return name?.trim() || t('settings.workspace.title')
}
