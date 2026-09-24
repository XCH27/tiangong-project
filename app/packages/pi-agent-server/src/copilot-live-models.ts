/** Register account-advertised Copilot models in Pi's existing provider. */
import { getModels } from '@earendil-works/pi-ai/compat';
import type { ModelRegistry } from '@earendil-works/pi-coding-agent';
import type { PiRuntimeModelEntry } from '../../shared/src/agent/backend/internal/driver-types.ts';

const COPILOT_API_BASE = 'https://api.individual.githubcopilot.com';
const COPILOT_HEADERS = {
  'User-Agent': 'GitHubCopilotChat/0.35.0',
  'Editor-Version': 'vscode/1.107.0',
  'Editor-Plugin-Version': 'copilot-chat/0.35.0',
  'Copilot-Integration-Id': 'vscode-chat',
};
const EFFORTS = ['low', 'medium', 'high', 'xhigh', 'max'] as const;
type Effort = typeof EFFORTS[number];

export function registerCopilotLiveModels(registry: ModelRegistry, entries: readonly PiRuntimeModelEntry[]): number {
  const bundled = new Map(getModels('github-copilot').map(model => [model.id, model]));
  const models: NonNullable<Parameters<ModelRegistry['registerProvider']>[1]>['models'] = [];
  const seen = new Set<string>();

  for (const entry of entries) {
    if (typeof entry === 'string') continue;
    const id = entry.id.startsWith('pi/') ? entry.id.slice(3) : entry.id;
    if (!id || seen.has(id)) continue;
    const native = bundled.get(id);
    const contextWindow = entry.contextWindow ?? native?.contextWindow;
    const maxTokens = entry.maxOutputTokens ?? native?.maxTokens;
    const api = entry.runtimeApi ?? native?.api;
    if (!contextWindow || !Number.isSafeInteger(contextWindow) || contextWindow <= 0 ||
        !maxTokens || !Number.isSafeInteger(maxTokens) || maxTokens <= 0 || !api) continue;

    const efforts = entry.reasoningEfforts
      ? new Set(entry.reasoningEfforts.filter((level): level is Effort => EFFORTS.includes(level as Effort)))
      : undefined;
    const thinkingLevelMap = efforts ? {
      off: null,
      minimal: null,
      low: efforts.has('low') ? 'low' : null,
      medium: efforts.has('medium') ? 'medium' : null,
      high: efforts.has('high') ? 'high' : null,
      xhigh: efforts.has('xhigh') ? 'xhigh' : null,
      max: efforts.has('max') ? 'max' : null,
    } as const : native?.thinkingLevelMap;

    seen.add(id);
    models.push({
      id,
      name: native?.name ?? id,
      api,
      baseUrl: native?.baseUrl ?? COPILOT_API_BASE,
      headers: { ...COPILOT_HEADERS },
      reasoning: efforts ? efforts.size > 0 : native?.reasoning ?? false,
      ...(thinkingLevelMap ? { thinkingLevelMap } : {}),
      input: entry.supportsImages ?? native?.input.includes('image') ? ['text', 'image'] : ['text'],
      // Copilot is an account allowance; API token prices are not its charge.
      cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
      contextWindow,
      maxTokens,
      ...(native?.compat ? { compat: native.compat } : {}),
    });
  }

  if (!models.length) return 0;
  registry.registerProvider('github-copilot', { models });
  return models.length;
}
