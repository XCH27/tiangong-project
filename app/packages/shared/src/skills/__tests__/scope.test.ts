import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import {
  isValidSkillSlug,
  moveSkillScope,
  skillScopeDir,
  skillScopePath,
  writeSkillToScope,
} from '../scope.ts';

let workspaceRoot: string;
let projectRoot: string;

const SKILL = `---\nname: Compliance review\ndescription: reviews compliance\n---\n\nSteps.\n`;

function roots() {
  return { workspaceRoot, projectRoot };
}

beforeEach(() => {
  workspaceRoot = mkdtempSync(join(tmpdir(), 'skill-scope-ws-'));
  projectRoot = mkdtempSync(join(tmpdir(), 'skill-scope-proj-'));
});

afterEach(() => {
  rmSync(workspaceRoot, { recursive: true, force: true });
  rmSync(projectRoot, { recursive: true, force: true });
});

describe('isValidSkillSlug', () => {
  it('accepts ordinary slugs', () => {
    for (const slug of ['pdf', 'compliance-review', 'a.b_c', 'Skill1']) {
      expect(isValidSkillSlug(slug)).toBe(true);
    }
  });

  it('refuses anything that could escape the scope directory', () => {
    // These paths get joined into the user's home directory, so traversal is
    // rejected here rather than trusted from a caller or a model.
    for (const slug of ['..', '.', '../evil', 'a/b', 'a\\b', '', '-leading', '/abs']) {
      expect(isValidSkillSlug(slug)).toBe(false);
    }
  });
});

describe('skillScopeDir / skillScopePath', () => {
  it('maps each scope to its own directory', () => {
    expect(skillScopeDir('workspace', roots())).toBe(join(workspaceRoot, 'skills'));
    expect(skillScopeDir('project', roots())).toBe(join(projectRoot, '.agents/skills'));
    expect(skillScopeDir('global', roots())).toContain(join('.agents', 'skills'));
  });

  it('returns null for a project scope with no project bound', () => {
    expect(skillScopeDir('project', { workspaceRoot })).toBeNull();
    expect(skillScopePath('project', 'pdf', { workspaceRoot })).toBeNull();
  });

  it('returns null rather than a traversal path for an unsafe slug', () => {
    expect(skillScopePath('workspace', '../escape', roots())).toBeNull();
  });
});

describe('writeSkillToScope', () => {
  it('writes a SKILL.md into the workspace scope', () => {
    const result = writeSkillToScope({ slug: 'compliance-review', scope: 'workspace', roots: roots(), content: SKILL });
    expect(result.ok).toBe(true);
    const written = join(workspaceRoot, 'skills', 'compliance-review', 'SKILL.md');
    expect(existsSync(written)).toBe(true);
    expect(readFileSync(written, 'utf-8')).toBe(SKILL);
    expect(result.touchedSharedGlobal).toBe(false);
  });

  it('writes into the project scope under .agents/skills', () => {
    const result = writeSkillToScope({ slug: 'pdf', scope: 'project', roots: roots(), content: SKILL });
    expect(result.ok).toBe(true);
    expect(existsSync(join(projectRoot, '.agents/skills/pdf/SKILL.md'))).toBe(true);
  });

  it('refuses to overwrite an existing skill', () => {
    writeSkillToScope({ slug: 'pdf', scope: 'workspace', roots: roots(), content: SKILL });
    const second = writeSkillToScope({
      slug: 'pdf',
      scope: 'workspace',
      roots: roots(),
      content: '---\nname: Other\ndescription: other\n---\n',
    });
    expect(second.ok).toBe(false);
    expect(second.failure).toBe('already-exists');
    // The first skill must survive intact — a directory shared with other tools
    // is the worst possible place to clobber someone's file.
    expect(readFileSync(join(workspaceRoot, 'skills/pdf/SKILL.md'), 'utf-8')).toBe(SKILL);
  });

  it('refuses an unsafe slug before touching the filesystem', () => {
    const result = writeSkillToScope({ slug: '../escape', scope: 'workspace', roots: roots(), content: SKILL });
    expect(result.ok).toBe(false);
    expect(result.failure).toBe('invalid-slug');
    expect(existsSync(join(workspaceRoot, 'skills'))).toBe(false);
  });

  it('says the project scope is unavailable rather than guessing a folder', () => {
    const result = writeSkillToScope({ slug: 'pdf', scope: 'project', roots: { workspaceRoot }, content: SKILL });
    expect(result.ok).toBe(false);
    expect(result.failure).toBe('scope-unavailable');
    expect(result.message).toContain('project folder');
  });
});

describe('moveSkillScope', () => {
  function install(scope: 'workspace' | 'project', slug: string, content = SKILL) {
    const dir =
      scope === 'workspace'
        ? join(workspaceRoot, 'skills', slug)
        : join(projectRoot, '.agents/skills', slug);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'SKILL.md'), content, 'utf-8');
    return dir;
  }

  it('moves a skill from the workspace scope to the project scope', () => {
    install('workspace', 'pdf');
    const result = moveSkillScope({ slug: 'pdf', from: 'workspace', to: 'project', roots: roots() });
    expect(result.ok).toBe(true);
    expect(existsSync(join(projectRoot, '.agents/skills/pdf/SKILL.md'))).toBe(true);
    expect(existsSync(join(workspaceRoot, 'skills/pdf'))).toBe(false);
  });

  it('carries every file in the skill directory, not just SKILL.md', () => {
    const dir = install('workspace', 'pdf');
    writeFileSync(join(dir, 'icon.png'), 'x', 'utf-8');
    moveSkillScope({ slug: 'pdf', from: 'workspace', to: 'project', roots: roots() });
    expect(existsSync(join(projectRoot, '.agents/skills/pdf/icon.png'))).toBe(true);
  });

  it('is a no-op when the scopes match', () => {
    install('workspace', 'pdf');
    const result = moveSkillScope({ slug: 'pdf', from: 'workspace', to: 'workspace', roots: roots() });
    expect(result.ok).toBe(true);
    expect(existsSync(join(workspaceRoot, 'skills/pdf/SKILL.md'))).toBe(true);
  });

  it('reports a missing source instead of creating an empty target', () => {
    const result = moveSkillScope({ slug: 'ghost', from: 'workspace', to: 'project', roots: roots() });
    expect(result.ok).toBe(false);
    expect(result.failure).toBe('not-found');
    expect(existsSync(join(projectRoot, '.agents/skills/ghost'))).toBe(false);
  });

  it('refuses when a different skill already holds that name at the target', () => {
    install('workspace', 'pdf', SKILL);
    install('project', 'pdf', '---\nname: Project pdf\ndescription: theirs\n---\n');
    const result = moveSkillScope({ slug: 'pdf', from: 'workspace', to: 'project', roots: roots() });
    expect(result.ok).toBe(false);
    expect(result.failure).toBe('already-exists');
    // Both survive: the move must not silently replace the target, and must not
    // remove the source it failed to move.
    expect(readFileSync(join(projectRoot, '.agents/skills/pdf/SKILL.md'), 'utf-8')).toContain('Project pdf');
    expect(existsSync(join(workspaceRoot, 'skills/pdf/SKILL.md'))).toBe(true);
  });

  it('warns that leaving the global scope takes the skill from other tools too', () => {
    // Path-only assertion: ~/.agents/skills is the machine's real shared
    // directory and no test writes into it.
    const result = moveSkillScope({ slug: 'ghost', from: 'global', to: 'workspace', roots: roots() });
    expect(result.ok).toBe(false);
    expect(result.failure).toBe('not-found');
  });
});
