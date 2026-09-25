import { describe, expect, it } from 'bun:test';
import { getThinkingLevelsForModel, reconcileThinkingLevelForModel } from './thinking-levels.ts';

describe('model-advertised reasoning choices', () => {
  it('does not offer Off or Max to a Grok model that only advertises native efforts', () => {
    expect(getThinkingLevelsForModel({
      supportsThinking: true,
      reasoningEfforts: ['low', 'medium', 'high', 'xhigh'],
    }).map(level => level.id)).toEqual(['low', 'medium', 'high', 'xhigh']);
  });

  it('keeps a model-specific Off only when its runtime supports disabling reasoning', () => {
    expect(getThinkingLevelsForModel({
      supportsThinking: true,
      reasoningEfforts: ['low', 'medium', 'high'],
      reasoningDisableSupported: true,
    }).map(level => level.id)).toEqual(['off', 'low', 'medium', 'high']);
  });

  it('hides the control for a known non-reasoning model', () => {
    expect(getThinkingLevelsForModel({ supportsThinking: false })).toEqual([]);
    expect(getThinkingLevelsForModel({ provider: 'pi', supportsThinking: true })).toEqual([]);
  });

  it('does not invent effort levels when a provider has not advertised them', () => {
    expect(getThinkingLevelsForModel({ provider: 'anthropic', supportsThinking: true })).toEqual([]);
  });

  it('keeps a provider-advertised max effort', () => {
    expect(getThinkingLevelsForModel({
      provider: 'pi',
      supportsThinking: true,
      reasoningEfforts: ['low', 'medium', 'high', 'xhigh', 'max'],
    }).map(level => level.id)).toEqual(['low', 'medium', 'high', 'xhigh', 'max']);
  });

  it('keeps effort available when a provider reports thinking separately', () => {
    expect(getThinkingLevelsForModel({
      supportsThinking: false,
      reasoningEfforts: ['low', 'high'],
    }).map(level => level.id)).toEqual(['low', 'high']);
  });

  it('reconciles stale effort on model switch without inventing unknown levels', () => {
    expect(reconcileThinkingLevelForModel('max', {
      supportsThinking: true, reasoningEfforts: ['low', 'medium', 'high'],
    })).toBe('medium');
    expect(reconcileThinkingLevelForModel('high', {
      supportsThinking: true, reasoningEfforts: ['low', 'high'],
    })).toBe('high');
    expect(reconcileThinkingLevelForModel('medium', { supportsThinking: false })).toBe('off');
    expect(reconcileThinkingLevelForModel('max', { supportsThinking: true })).toBe('max');
    expect(reconcileThinkingLevelForModel('medium', {
      supportsThinking: true, reasoningEfforts: ['low', 'high', 'max'],
      defaultReasoningEffort: 'high',
    })).toBe('high');
    expect(reconcileThinkingLevelForModel('medium', {
      supportsThinking: true, reasoningEfforts: ['low'],
      reasoningDisableSupported: true,
      defaultReasoningEffort: 'high',
    })).toBe('low');
  });
});
