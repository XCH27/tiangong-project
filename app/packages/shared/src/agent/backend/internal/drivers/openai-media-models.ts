import type { MediaCatalogModel } from '../../../../config/model-fetcher.ts';

/**
 * The OpenAI Models API returns IDs, not a capability schema. Classify only
 * families documented in OpenAI's model catalog, or an explicit output mode.
 * Unknown IDs stay unknown; this projection never creates an execution route.
 */
function documentedKind(id: string): Pick<MediaCatalogModel, 'kind' | 'audioMode'> | null {
  const bare = id.replace(/^openai\//, '');
  if (/^(?:gpt-image-\d|dall-e-\d|chatgpt-image-latest(?:-|$))/.test(bare)) return { kind: 'image' };
  if (/^sora-\d/.test(bare)) return { kind: 'video' };
  if (/^(?:gpt-4o-mini-tts|tts-1(?:-hd)?)(?:-|$)/.test(bare)) return { kind: 'audio', audioMode: 'speech' };
  // A live transcription endpoint is still STT, not a speech-to-speech agent.
  if (/^(?:whisper-1|gpt-realtime-whisper|gpt-(?:4o(?:-mini)?-|live-|realtime-)?transcribe)(?:-|$)/.test(bare)) {
    return { kind: 'audio', audioMode: 'transcription' };
  }
  if (/^(?:gpt-audio|gpt-4o-audio)(?:-|$)/.test(bare)) return { kind: 'audio', audioMode: 'generation' };
  if (/^(?:gpt-realtime|gpt-4o-realtime|gpt-live)(?:-|$)/.test(bare)) return { kind: 'audio', audioMode: 'realtime' };
  return null;
}

function modalities(value: unknown): string[] | undefined {
  if (!Array.isArray(value) || value.length > 16) return undefined;
  const entries = value.map(item => typeof item === 'string' ? item.toLowerCase() : '');
  if (entries.some(item => !/^[a-z][a-z0-9_]{0,63}$/.test(item))) return undefined;
  return [...new Set(entries)];
}

export function parseOpenAiMediaModels(payload: unknown): MediaCatalogModel[] {
  if (!payload || typeof payload !== 'object' || !('data' in payload) || !Array.isArray(payload.data)) {
    throw new Error('OpenAI returned an invalid model list');
  }
  const result: MediaCatalogModel[] = [];
  const seen = new Set<string>();
  for (const value of payload.data) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) continue;
    const row = value as Record<string, unknown>;
    const id = typeof row.id === 'string' ? row.id.trim() : '';
    if (!id || id.length > 256 || /[\u0000-\u001f\u007f]/.test(id) || seen.has(id)
      || (row.object !== undefined && row.object !== 'model') || row.active === false) continue;
    seen.add(id);
    const input = modalities(row.input_modalities ?? row.inputModalities);
    const output = modalities(row.output_modalities ?? row.outputModalities);
    const known = documentedKind(id);
    const kind = output?.includes('image') ? { kind: 'image' as const }
      : output?.includes('video') ? { kind: 'video' as const }
        : output?.includes('audio') ? { kind: 'audio' as const, audioMode: known?.audioMode ?? 'generation' as const }
          : known;
    // Explicit output metadata can contradict a documented family after a
    // provider change. Never keep the old label in that case.
    if (!kind || (output && !output.includes(kind.kind)
      && !(kind.kind === 'audio' && kind.audioMode === 'transcription' && output.includes('text')))) continue;
    result.push({
      id,
      name: typeof row.name === 'string' && row.name.trim() ? row.name.trim() : id,
      ...kind,
      ...(input ? { inputModalities: input } : {}),
      ...(output ? { outputModalities: output } : {}),
    });
  }
  return result;
}
