import { describe, expect, it } from 'bun:test';
import type { AgentSession } from '@earendil-works/pi-coding-agent';
import { applySystemPromptOverride } from './system-prompt-override.ts';

type FakeSession = {
  _baseSystemPromptOptions: { forceSystemPrompt?: string };
  _runSystemPromptOptions: { forceSystemPrompt?: string };
  _rebuildSystemPrompt: (toolNames: string[]) => void;
};

function makeFakeSession(): FakeSession {
  return {
    _baseSystemPromptOptions: {},
    _runSystemPromptOptions: {},
    _rebuildSystemPrompt() {
      this._baseSystemPromptOptions = {};
    },
  };
}

describe('Pi system prompt override', () => {
  it('keeps the Craft prompt on both the active request and rebuilt options', () => {
    const session = makeFakeSession();
    applySystemPromptOverride(session as unknown as AgentSession, 'FIRST');
    expect(session._baseSystemPromptOptions.forceSystemPrompt).toBe('FIRST');
    expect(session._runSystemPromptOptions.forceSystemPrompt).toBe('FIRST');

    session._rebuildSystemPrompt(['read']);
    expect(session._baseSystemPromptOptions.forceSystemPrompt).toBe('FIRST');

    applySystemPromptOverride(session as unknown as AgentSession, 'SECOND');
    session._rebuildSystemPrompt(['read', 'bash']);
    expect(session._baseSystemPromptOptions.forceSystemPrompt).toBe('SECOND');
    expect(session._runSystemPromptOptions.forceSystemPrompt).toBe('SECOND');
  });
});
