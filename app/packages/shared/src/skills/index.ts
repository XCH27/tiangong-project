/**
 * Skills Module
 *
 * Workspace skills are specialized instructions that extend Claude's capabilities.
 */

export * from './types.ts';
export {
  GLOBAL_AGENT_SKILLS_DIR,
  PROJECT_AGENT_SKILLS_DIR,
  loadSkill,
  loadAllSkills,
  invalidateSkillsCache,
  loadSkillBySlug,
  getSkillIconPath,
  deleteSkill,
  skillExists,
  listSkillSlugs,
  skillNeedsIconDownload,
  downloadSkillIcon,
} from './storage.ts';

// Where a skill applies: the shared global directory, this workspace, or the
// project it travels with. Scope is what makes a skill installable by an agent
// without silently changing something outside the product the person is looking
// at, so the writer and the mover live beside the storage they use.
export {
  skillScopeDir,
  skillScopePath,
  writeSkillToScope,
  moveSkillScope,
  isValidSkillSlug,
  type SkillScope,
  type SkillScopeResult,
  type SkillScopeRoots,
} from './scope.ts';
