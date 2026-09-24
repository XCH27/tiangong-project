import type { AgentSession } from '@earendil-works/pi-coding-agent';

/**
 * Pi 0.87 projects `forceSystemPrompt` from normalized prompt options onto the
 * provider request. The old state.systemPrompt/_baseSystemPrompt stamp no
 * longer reaches that request. Keep the Craft prompt on the current run and
 * reapply it whenever Pi rebuilds base options after a tool/resource change.
 *
 * Pi has no public per-session setter for this option yet. Keep this private
 * adapter here until one is available rather than scattering SDK internals.
 */
type PromptOptions = { forceSystemPrompt?: string };
type MutableSession = {
  _baseSystemPromptOptions?: PromptOptions;
  _runSystemPromptOptions?: PromptOptions;
  _rebuildSystemPrompt: (toolNames: string[]) => void;
};

const overrides = new WeakMap<AgentSession, { prompt: string }>();

export function applySystemPromptOverride(session: AgentSession, prompt: string): void {
  const mutable = session as unknown as MutableSession;
  let override = overrides.get(session);
  if (!override) {
    override = { prompt };
    overrides.set(session, override);
    const originalRebuild = mutable._rebuildSystemPrompt.bind(session);
    mutable._rebuildSystemPrompt = (toolNames) => {
      originalRebuild(toolNames);
      if (mutable._baseSystemPromptOptions) {
        mutable._baseSystemPromptOptions.forceSystemPrompt = override!.prompt;
      }
    };
  } else {
    override.prompt = prompt;
  }
  if (mutable._baseSystemPromptOptions) {
    mutable._baseSystemPromptOptions.forceSystemPrompt = prompt;
  }
  if (mutable._runSystemPromptOptions) {
    mutable._runSystemPromptOptions.forceSystemPrompt = prompt;
  }
}
