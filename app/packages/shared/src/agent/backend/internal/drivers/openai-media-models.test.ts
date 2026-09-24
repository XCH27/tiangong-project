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

  it('rejects malformed lists and ignores malformed or inactive rows', () => {
    expect(() => parseOpenAiMediaModels({ data: 'invalid' })).toThrow('invalid model list');
    expect(parseOpenAiMediaModels({ data: [
      { id: 'gpt-image-2', active: false },
      { id: 'sora-2', object: 'not-model' },
      { id: 'gpt-image-2\nforged' },
    ] })).toEqual([]);
  });
});
