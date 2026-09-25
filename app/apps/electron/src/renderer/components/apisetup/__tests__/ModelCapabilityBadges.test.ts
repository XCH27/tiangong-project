import { describe, expect, it } from 'bun:test'
import { getChatModelCapabilityTags, getMediaCapabilityLabelKey } from '../ModelCapabilityBadges'

describe('model capability labels', () => {
  it('keeps conversation tags to confirmed input abilities and native file routing', () => {
    expect(getChatModelCapabilityTags({ provider: 'pi', contextWindow: 128_000 })).toEqual([])
    expect(getChatModelCapabilityTags({
      provider: 'pi', supportsImages: false, supportsOcr: true,
      modalities: { input: ['text', 'image', 'video', 'audio'], output: ['text'] },
    })).toEqual(['video', 'audio', 'ocr'])
    expect(getChatModelCapabilityTags({ provider: 'anthropic', supportsImages: true })).toEqual(['vision', 'file'])
    expect(getChatModelCapabilityTags()).toEqual([])
  })

  it('does not treat media models as chat models with file or vision input', () => {
    expect(getMediaCapabilityLabelKey({ id: 'image-1', name: 'Image', kind: 'image' })).toBe('settings.ai.mediaImageModels')
    expect(getMediaCapabilityLabelKey({ id: 'video-1', name: 'Video', kind: 'video' })).toBe('settings.ai.mediaVideoModels')
    expect(getMediaCapabilityLabelKey({ id: 'stt-1', name: 'STT', kind: 'audio', audioMode: 'transcription' })).toBe('settings.ai.mediaAudio.transcription')
    expect(getMediaCapabilityLabelKey({ id: 'unknown', name: 'Unknown', kind: 'audio' })).toBeNull()
  })
})
