/**
 * Where a skill lives is where it applies — and until now nothing could put one
 * there.
 *
 * `storage.ts` reads three tiers and can delete from the workspace one; it has
 * no way to create a skill or move it between tiers, so a skill could only be
 * authored by hand on disk. That is the same shape as the kit payload before
 * H38: read paths without write paths.
 *
 * The three scopes are not interchangeable, and the words are the product's:
 *
 * - `global`   — `~/.agents/skills/<slug>/`, reaching every workspace on this
 *                machine. **It is shared with other agent tools** that follow the
 *                same convention, so writing there is visible outside Fleet and
 *                removing from there takes it away from them too. Every result
 *                below says so rather than leaving it to be discovered.
 * - `workspace` — `<workspaceRoot>/skills/<slug>/`, this workspace only.
 * - `project`   — `<projectRoot>/.agents/skills/<slug>/`, this project folder
 *                only, and it travels with the repository.
 *
 * Two refusals are load-bearing. **Nothing overwrites an existing skill**: a
 * slug already present at the target belongs to whoever wrote it, and silently
 * replacing a skill in a directory shared with other tools is the worst thing
 * this module could do. And **a slug must be one safe path segment** — these
 * paths are joined into the user's home directory, so traversal is checked here
 * rather than trusted from a caller or a model.
 */

import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'fs';
import { tmpdir } from 'os';
import { dirname, join } from 'path';
import { GLOBAL_AGENT_SKILLS_DIR, PROJECT_AGENT_SKILLS_DIR, invalidateSkillsCache } from './storage.ts';
import { getWorkspaceSkillsPath } from '../workspaces/storage.ts';
import type { SkillSource } from './types.ts';

/** A scope is exactly the tier a loaded skill reports as its source. */
export type SkillScope = SkillSource;

export interface SkillScopeRoots {
  workspaceRoot: string;
  /** Required only for the `project` scope. */
  projectRoot?: string;
}

/** Slugs become directory names under the user's home; keep them boring. */
const SAFE_SLUG = /^[a-z0-9][a-z0-9._-]*$/i;

export function isValidSkillSlug(slug: string): boolean {
  return (
    SAFE_SLUG.test(slug) &&
    slug !== '.' &&
    slug !== '..' &&
    !slug.includes('/') &&
    !slug.includes('\\')
  );
}

/**
 * The directory a scope resolves to, or `null` when the caller did not supply
 * the root that scope needs.
 */
export function skillScopeDir(scope: SkillScope, roots: SkillScopeRoots): string | null {
  if (scope === 'global') return GLOBAL_AGENT_SKILLS_DIR;
  if (scope === 'workspace') {
    return roots.workspaceRoot ? getWorkspaceSkillsPath(roots.workspaceRoot) : null;
  }
  return roots.projectRoot ? join(roots.projectRoot, PROJECT_AGENT_SKILLS_DIR) : null;
}

/** Absolute path of one skill at one scope, or `null` when the scope is unavailable. */
export function skillScopePath(
  scope: SkillScope,
  slug: string,
  roots: SkillScopeRoots,
): string | null {
  if (!isValidSkillSlug(slug)) return null;
  const dir = skillScopeDir(scope, roots);
  return dir ? join(dir, slug) : null;
}

export type SkillScopeFailure =
  | 'invalid-slug'
  | 'scope-unavailable'
  | 'already-exists'
  | 'not-found'
  | 'write-failed';

export interface SkillScopeResult {
  ok: boolean;
  failure?: SkillScopeFailure;
  /** Plain sentence naming what happened and, when it failed, what to do. */
  message: string;
  path?: string;
  /** True when the operation touched `~/.agents/skills`, which other tools read. */
  touchedSharedGlobal?: boolean;
}

function sharedGlobalNote(scope: SkillScope, verb: string): string {
  return scope === 'global'
    ? ` ${verb} ~/.agents/skills, which other agent tools on this machine also read.`
    : '';
}

/**
 * Write a new skill into a scope.
 *
 * Staged through a temp directory and renamed into place, so a crash cannot
 * leave a half-written `SKILL.md` for `loadAllSkills` to parse into a skill that
 * claims capabilities its body never describes.
 */
export function writeSkillToScope(input: {
  slug: string;
  scope: SkillScope;
  roots: SkillScopeRoots;
  /** Complete SKILL.md content, frontmatter included. */
  content: string;
}): SkillScopeResult {
  const { slug, scope, roots, content } = input;

  if (!isValidSkillSlug(slug)) {
    return {
      ok: false,
      failure: 'invalid-slug',
      message: `"${slug}" is not a usable skill name. Use letters, digits, dots, dashes or underscores.`,
    };
  }

  const target = skillScopePath(scope, slug, roots);
  if (!target) {
    return {
      ok: false,
      failure: 'scope-unavailable',
      message:
        scope === 'project'
          ? 'No project folder is bound to this session, so there is no project scope to write to.'
          : `The ${scope} scope is not available here.`,
    };
  }

  if (existsSync(target)) {
    return {
      ok: false,
      failure: 'already-exists',
      message:
        `A skill named "${slug}" already exists in the ${scope} scope.` +
        sharedGlobalNote(scope, 'It lives in') +
        ' Pick another name, or edit that skill instead — nothing here overwrites it.',
      path: target,
    };
  }

  let staging = '';
  let landed = false;
  try {
    mkdirSync(dirname(target), { recursive: true });
    staging = mkdtempSync(join(tmpdir(), 'fleet-skill-'));
    writeFileSync(join(staging, 'SKILL.md'), content, 'utf-8');
    try {
      renameSync(staging, target);
    } catch {
      // A rename across filesystems fails, and the temp directory routinely
      // sits on a different one from a project on an external volume. Copy
      // instead rather than making the whole operation impossible there.
      cpSync(staging, target, { recursive: true });
      rmSync(staging, { recursive: true, force: true });
    }
    landed = true;
  } catch (error) {
    if (staging) rmSync(staging, { recursive: true, force: true });
    return {
      ok: false,
      failure: 'write-failed',
      message: `Could not write the skill: ${error instanceof Error ? error.message : String(error)}`,
    };
  }

  if (!landed) {
    return { ok: false, failure: 'write-failed', message: 'Could not write the skill.' };
  }

  invalidateSkillsCache();
  return {
    ok: true,
    message: `Wrote "${slug}" to the ${scope} scope.` + sharedGlobalNote(scope, 'It now lives in'),
    path: target,
    touchedSharedGlobal: scope === 'global',
  };
}

/**
 * Move a skill from one scope to another.
 *
 * Copy-then-remove rather than rename, because the three scopes routinely sit on
 * different filesystems (home directory, workspace, a project on an external
 * volume). The source is removed only after the copy lands, so an interrupted
 * move leaves the skill where it was rather than nowhere.
 */
export function moveSkillScope(input: {
  slug: string;
  from: SkillScope;
  to: SkillScope;
  roots: SkillScopeRoots;
}): SkillScopeResult {
  const { slug, from, to, roots } = input;

  if (!isValidSkillSlug(slug)) {
    return { ok: false, failure: 'invalid-slug', message: `"${slug}" is not a usable skill name.` };
  }
  if (from === to) {
    return { ok: true, message: `"${slug}" is already in the ${to} scope.` };
  }

  const source = skillScopePath(from, slug, roots);
  const target = skillScopePath(to, slug, roots);
  if (!source || !target) {
    return {
      ok: false,
      failure: 'scope-unavailable',
      message: 'That scope is not available here — a project move needs a project folder.',
    };
  }
  if (!existsSync(source)) {
    return {
      ok: false,
      failure: 'not-found',
      message: `No skill named "${slug}" in the ${from} scope.`,
    };
  }
  if (existsSync(target)) {
    return {
      ok: false,
      failure: 'already-exists',
      message:
        `A different skill named "${slug}" already exists in the ${to} scope.` +
        ' Nothing here overwrites it — rename one of them first.',
      path: target,
    };
  }

  try {
    mkdirSync(dirname(target), { recursive: true });
    cpSync(source, target, { recursive: true });
    rmSync(source, { recursive: true, force: true });
  } catch (error) {
    return {
      ok: false,
      failure: 'write-failed',
      message: `Could not move the skill: ${error instanceof Error ? error.message : String(error)}`,
    };
  }

  invalidateSkillsCache();
  const leavingGlobal = from === 'global'
    ? ' It is no longer in ~/.agents/skills, so other agent tools on this machine lose it too.'
    : '';
  return {
    ok: true,
    message: `Moved "${slug}" from the ${from} scope to the ${to} scope.` +
      sharedGlobalNote(to, 'It now lives in') +
      leavingGlobal,
    path: target,
    touchedSharedGlobal: from === 'global' || to === 'global',
  };
}
