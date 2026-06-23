import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { loadLabelConfig, saveLabelConfig } from '../storage.ts';
import { flattenLabels } from '../tree.ts';

let workspaceRoot: string;

beforeEach(() => {
  workspaceRoot = mkdtempSync(join(tmpdir(), 'labels-storage-test-'));
});

afterEach(() => {
  rmSync(workspaceRoot, { recursive: true, force: true });
});

describe('loadLabelConfig migrations', () => {
  it('normalizes legacy default labels in place instead of adding an identity group', () => {
    saveLabelConfig(workspaceRoot, {
      version: 1,
      labels: [
        { id: 'content', name: 'Content', color: { light: '#8B5CF6', dark: '#A78BFA' }, children: [{ id: 'design', name: 'Design', color: { light: '#D946EF', dark: '#E879F9' } }, { id: 'research', name: 'Research', color: { light: '#A855F7', dark: '#C084FC' } }] },
        { id: 'development', name: 'Development', color: { light: '#3B82F6', dark: '#60A5FA' }, children: [{ id: 'code', name: 'Code', color: { light: '#4F46E5', dark: '#818CF8' } }, { id: 'bug', name: 'Bug', color: { light: '#0EA5E9', dark: '#38BDF8' } }] },
        { id: 'priority', name: 'Priority', color: { light: '#F59E0B', dark: '#FBBF24' }, valueType: 'number' },
      ],
    });

    const config = loadLabelConfig(workspaceRoot);
    const flat = flattenLabels(config.labels);

    expect(config.labels.find(label => label.id === 'identity')).toBeUndefined();
    expect(flat.find(label => label.id === 'content')?.name).toBe('内容');
    expect(flat.find(label => label.id === 'development')?.name).toBe('开发');
    expect(flat.find(label => label.id === 'priority')?.name).toBe('队长');
    expect(flat.find(label => label.id === 'priority')?.kind).toBe('identity');
    expect(flat.find(label => label.id === 'priority')?.valueType).toBeUndefined();
    expect(flat.find(label => label.id === 'code')?.kind).toBe('identity');
    expect(flat.find(label => label.id === 'design')?.kind).toBe('identity');
    expect(flat.find(label => label.id === 'research')?.name).toBe('审查');
    expect(flat.find(label => label.id === 'bug')?.name).toBe('测试');
  });

  it('removes the previously-added identity root group on load', () => {
    saveLabelConfig(workspaceRoot, {
      version: 1,
      labels: [
        { id: 'identity', name: '身份', color: { light: '#F59E0B', dark: '#FBBF24' }, children: [{ id: 'leader', name: '队长', color: { light: '#F59E0B', dark: '#FBBF24' }, kind: 'identity' }] },
        { id: 'content', name: 'Content', color: { light: '#8B5CF6', dark: '#A78BFA' }, children: [{ id: 'design', name: 'Design', color: { light: '#D946EF', dark: '#E879F9' } }] },
        { id: 'priority', name: 'Priority', color: { light: '#F59E0B', dark: '#FBBF24' }, valueType: 'number' },
      ],
    });

    const config = loadLabelConfig(workspaceRoot);
    const flat = flattenLabels(config.labels);

    expect(config.labels.find(label => label.id === 'identity')).toBeUndefined();
    expect(flat.find(label => label.id === 'leader')).toBeUndefined();
    expect(flat.find(label => label.id === 'priority')?.name).toBe('队长');
  });

  it('does not backfill identity labels into intentionally minimal configs', () => {
    saveLabelConfig(workspaceRoot, { version: 1, labels: [] });

    const config = loadLabelConfig(workspaceRoot);

    expect(config.labels).toEqual([]);
  });
});
