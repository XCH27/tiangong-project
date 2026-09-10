/**
 * Installing a kit — one call, because it is one thing to the person doing it.
 *
 * A kit listing carries its skills as content, not as references: `EXAMPLE_KITS`
 * ships `ExpertSkill` objects with bodies, and nothing on disk corresponds to
 * them yet. So installing is two writes — the skill files, then the kit that
 * names them — and doing that from the renderer would leave a half-installed kit
 * whenever the second write failed: skills on disk belonging to nothing, or a
 * kit whose every slug resolves to nothing, which is the exact failure H36
 * recorded and this page exists to stop showing.
 *
 * So it happens here, in one function, and a failure part-way through removes
 * the skills it wrote. Not a transaction — a best-effort unwind — but the
 * difference between "nothing happened" and "something half happened" is the
 * whole reason this is not two calls.
 */

import { createLabel } from './crud.ts';
import { writeSkillToScope } from '../skills/scope.ts';
import { deleteSkill } from '../skills/storage.ts';
import type { ExpertSkill } from './skill-routing.ts';
import type { LabelConfig } from './types.ts';

export interface KitInstallInput {
  workspaceRoot: string;
  /** Display name for the kit label. */
  name: string;
  /** Skill bodies to write. Slugs are the skill ids. */
  skills: readonly ExpertSkill[];
  systemPromptPreset?: string;
}

export type KitInstallResult =
  | { ok: true; label: LabelConfig; skillsWritten: readonly string[] }
  | { ok: false; message: string; skillsWritten: readonly string[] };

/**
 * Render one skill to the SKILL.md the loader expects.
 *
 * Triggers are written out because they are what makes the kit route; a skill
 * installed without them is reachable only by its own name, which quietly turns
 * a routed kit into one that loads everything.
 */
export function skillToMarkdown(skill: ExpertSkill): string {
  const lines = ['---', `name: ${skill.name}`, `description: ${skill.name}`];
  if (skill.triggers.length > 0) {
    lines.push('triggers:');
    for (const trigger of skill.triggers) lines.push(`  - ${JSON.stringify(trigger)}`);
  }
  lines.push('---', '', skill.body.trim(), '');
  return lines.join('\n');
}

export function installKit(input: KitInstallInput): KitInstallResult {
  const { workspaceRoot, name, skills, systemPromptPreset } = input;
  const written: string[] = [];

  const unwind = () => {
    for (const slug of written) {
      try {
        deleteSkill(workspaceRoot, slug);
      } catch {
        // Best effort. A skill left behind is recoverable by hand; failing the
        // unwind loudly would replace one problem with two.
      }
    }
  };

  for (const skill of skills) {
    const result = writeSkillToScope({
      slug: skill.id,
      scope: 'workspace',
      roots: { workspaceRoot },
      content: skillToMarkdown(skill),
    });

    if (result.ok) {
      written.push(skill.id);
      continue;
    }

    // A skill already present under that name is not a failure: the user may be
    // reinstalling, or another kit shipped the same skill. Take the existing one
    // rather than overwriting someone's edits.
    if (result.failure === 'already-exists') continue;

    unwind();
    return { ok: false, message: result.message, skillsWritten: [] };
  }

  try {
    const label = createLabel(workspaceRoot, {
      name,
      kind: 'expert',
      ...(systemPromptPreset ? { systemPromptPreset } : {}),
      expertKit: { skills: skills.map((skill) => skill.id) },
    });
    return { ok: true, label, skillsWritten: written };
  } catch (error) {
    unwind();
    return {
      ok: false,
      message: `Could not create the kit: ${error instanceof Error ? error.message : String(error)}`,
      skillsWritten: [],
    };
  }
}
