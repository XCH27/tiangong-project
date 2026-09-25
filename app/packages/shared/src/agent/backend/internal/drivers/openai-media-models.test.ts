import { describe, expect, it } from 'bun:test';
import { parseOpenAiMediaModels } from './openai-media-models.ts';

describe('OpenAI account media classification', () => {
  it('separates documented media modes from a mixed account list without making chat routes', () => {
    expect(parseOpenAiMediaModels({ data: [
      { id: 'gpt-5.6-sol', object: 'model' },
      { id: 'gpt-image-2', object: 'model' },
      { id: 'sora-2', object: 'model' },
      { id: 'gpt-4o-mini-tts', object: 'model' },
      { id: 'whisper-1', object: 'model' },
    ] })).toEqual([
      { id: 'gpt-image-2', name: 'gpt-image-2', kind: 'image' },
      { id: 'sora-2', name: 'sora-2', kind: 'video' },
      { id: 'gpt-4o-mini-tts', name: 'gpt-4o-mini-tts', kind: 'audio', audioMode: 'speech' },
      { id: 'whisper-1', name: 'whisper-1', kind: 'audio', audioMode: 'transcription' },
    ]);
  });

  it('prefers explicit output modalities and leaves unknown IDs unclassified', () => {
    expect(parseOpenAiMediaModels({ data: [
      { id: 'gpt-image-2', output_modalities: ['text'] },
      { id: 'unknown-chat' },
      { id: 'future-canvas', output_modalities: ['image'], input_modalities: ['text', 'image'] },
      { id: 'gpt-audio', output_modalities: ['audio'] },
    ] })).toEqual([
      { id: 'future-canvas', name: 'future-canvas', kind: 'image', inputModalities: ['text', 'image'], outputModalities: ['image'] },
      { id: 'gpt-audio', name: 'gpt-audio', kind: 'audio', audioMode: 'generation', outputModalities: ['audio'] },
    ]);
  });

  it('keeps live transcription separate from bidirectional conversation', () => {
    expect(parseOpenAiMediaModels({ data: [
      { id: 'gpt-realtime-whisper', object: 'model', input_modalities: ['audio'], output_modalities: ['text'] },
      { id: 'gpt-realtime-2.1', object: 'model', input_modalities: ['audio', 'text'], output_modalities: ['audio', 'text'] },
      { id: 'gpt-4o-realtime-preview', object: 'model' },
      { id: 'gpt-live-1', object: 'model' },
      { id: 'gpt-4o-audio-preview', object: 'model' },
    ] })).toEqual([
      { id: 'gpt-realtime-whisper', name: 'gpt-realtime-whisper', kind: 'audio', audioMode: 'transcription', inputModalities: ['audio'], outputModalities: ['text'] },
      { id: 'gpt-realtime-2.1', name: 'gpt-realtime-2.1', kind: 'audio', audioMode: 'realtime', inputModalities: ['audio', 'text'], outputModalities: ['audio', 'text'] },
      { id: 'gpt-4o-realtime-preview', name: 'gpt-4o-realtime-preview', kind: 'audio', audioMode: 'realtime' },
      { id: 'gpt-live-1', name: 'gpt-live-1', kind: 'audio', audioMode: 'realtime' },
      { id: 'gpt-4o-audio-preview', name: 'gpt-4o-audio-preview', kind: 'audio', audioMode: 'generation' },
    ]);
  });

  it('rejects malformed lists and ignores malformed or inactive rows', () => {
    expect(() => parseOpenAiMediaModels({ data: 'invalid' })).toThrow('invalid model list');
    expect(parseOpenAiMediaModels({ data: [
      { id: 'gpt-image-2', active: false },
      { id: 'sora-2', object: 'not-model' },
      { id: 'gpt-image-2\nforged' },
    ] })).toEqual([]);
  });
});
