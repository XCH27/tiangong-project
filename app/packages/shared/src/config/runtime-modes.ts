/**
 * Classified provider runtime modes (Page Architecture §3B).
 *
 * Reasoning effort and the existing Fast toggle stay separate. A generic mode
 * is selectable only when discovery left a request body or header the adapter
 * can emit. Unknown catalog names without that proof stay hidden.
 */

import type { ModelDefinition, ModelRuntimeMode } from './models.ts';

export interface SelectableRuntimeMode {
  id: string;
  mode: ModelRuntimeMode;
}

function hasRequestProof(mode: ModelRuntimeMode | undefined): mode is ModelRuntimeMode {
  if (!mode) return false;
  if (mode.requestBody && Object.keys(mode.requestBody).length > 0) return true;
  return Boolean(mode.requestHeaders && Object.keys(mode.requestHeaders).length > 0);
}

/** Non-fast modes the composer may list. Fast stays the existing speed toggle. */
export function listGenericRuntimeModes(
  definition?: Pick<ModelDefinition, 'runtimeModes'> | null,
): readonly SelectableRuntimeMode[] {
  const modes = definition?.runtimeModes;
  if (!modes) return [];
  return Object.entries(modes)
    .filter(([id, mode]) => id !== 'fast' && hasRequestProof(mode))
    .map(([id, mode]) => ({ id, mode }));
}

export function isSelectableGenericRuntimeMode(
  definition: Pick<ModelDefinition, 'runtimeModes'> | null | undefined,
  id: string | null | undefined,
): boolean {
  if (!id) return false;
  return listGenericRuntimeModes(definition).some((entry) => entry.id === id);
}

export function mergeRuntimeModes(
  ...modes: Array<ModelRuntimeMode | undefined>
): ModelRuntimeMode | undefined {
  const present = modes.filter((mode): mode is ModelRuntimeMode => mode !== undefined);
  if (present.length === 0) return undefined;

  const requestBody: Record<string, unknown> = {};
  const requestHeaders: Record<string, string> = {};
  let quotaMultiplier: number | undefined;

  for (const mode of present) {
    if (mode.requestBody) mergeRequestFragment(requestBody, { ...mode.requestBody });
    if (mode.requestHeaders) Object.assign(requestHeaders, mode.requestHeaders);
    if (mode.quotaMultiplier !== undefined) quotaMultiplier = mode.quotaMultiplier;
  }

  return {
    ...(Object.keys(requestBody).length > 0 ? { requestBody } : {}),
    ...(Object.keys(requestHeaders).length > 0 ? { requestHeaders } : {}),
    ...(quotaMultiplier !== undefined ? { quotaMultiplier } : {}),
  };
}

export function resolveSessionRuntimeModePayload(input: {
  fastMode?: boolean;
  runtimeMode?: string | null;
  definition?: Pick<ModelDefinition, 'runtimeModes'> | null;
}): ModelRuntimeMode | undefined {
  const modes = input.definition?.runtimeModes;
  const fast = input.fastMode ? modes?.fast : undefined;
  const generic = input.runtimeMode && isSelectableGenericRuntimeMode(input.definition, input.runtimeMode)
    ? modes?.[input.runtimeMode]
    : undefined;
  return mergeRuntimeModes(fast, generic);
}

function mergeRequestFragment(
  target: Record<string, unknown>,
  fragment: Record<string, unknown>,
): void {
  for (const [key, value] of Object.entries(fragment)) {
    const current = target[key];
    if (
      value !== null
      && typeof value === 'object'
      && !Array.isArray(value)
      && current !== null
      && typeof current === 'object'
      && !Array.isArray(current)
    ) {
      mergeRequestFragment(current as Record<string, unknown>, value as Record<string, unknown>);
    } else {
      target[key] = value;
    }
  }
}
