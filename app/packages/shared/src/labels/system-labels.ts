/** Stable built-in label catalog used only to localize untouched starter names. */
export const SYSTEM_LABELS = {
  automation: { id: 'automation', defaultName: 'Automation', nameKey: 'labels.default.automation' },
  bug: { id: 'bug', defaultName: 'Bug', nameKey: 'labels.default.bug' },
  code: { id: 'code', defaultName: 'Code', nameKey: 'labels.default.code' },
  content: { id: 'content', defaultName: 'Content', nameKey: 'labels.default.content' },
  design: { id: 'design', defaultName: 'Design', nameKey: 'labels.default.design' },
  development: { id: 'development', defaultName: 'Development', nameKey: 'labels.default.development' },
  priority: { id: 'priority', defaultName: 'Priority', nameKey: 'labels.default.priority' },
  project: { id: 'project', defaultName: 'Project', nameKey: 'labels.default.project' },
  research: { id: 'research', defaultName: 'Research', nameKey: 'labels.default.research' },
  writing: { id: 'writing', defaultName: 'Writing', nameKey: 'labels.default.writing' },
} as const

export type SystemLabelId = keyof typeof SYSTEM_LABELS

export function getSystemLabel(id: string) {
  return SYSTEM_LABELS[id as SystemLabelId]
}
