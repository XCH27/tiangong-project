import { describe, expect, it } from 'bun:test';
import { LEADER_LABEL_ID, resolveIdentityLabelEffects } from '../identity.ts';
import type { LabelConfig } from '../types.ts';

describe('resolveIdentityLabelEffects', () => {
  const labels: LabelConfig[] = [
    {
      id: LEADER_LABEL_ID,
      name: '队长',
      kind: 'identity',
      systemPromptPreset: '负责拆分任务。',
      permissionProfile: 'ask',
    },
    {
      id: 'project',
      name: '项目',
      valueType: 'string',
    },
    {
      id: 'design',
      name: '设计',
      kind: 'identity',
      systemPromptPreset: '负责设计验收。',
      permissionProfile: 'safe',
    },
  ];

  it('derives prompt and permission only from identity labels', () => {
    const effects = resolveIdentityLabelEffects(
      [LEADER_LABEL_ID, 'project::G-01', 'design'],
      labels,
    );

    expect(effects.identities.map(label => label.id)).toEqual([LEADER_LABEL_ID, 'design']);
    expect(effects.permissionMode).toBe('ask');
    expect(effects.systemPromptPreset).toContain('负责拆分任务。');
    expect(effects.systemPromptPreset).toContain('负责设计验收。');
  });

  it('does not treat valued priority labels as leader identity', () => {
    const effects = resolveIdentityLabelEffects([`${LEADER_LABEL_ID}::3`], labels);

    expect(effects.identities).toEqual([]);
    expect(effects.permissionMode).toBeUndefined();
    expect(effects.systemPromptPreset).toBeUndefined();
  });
});
