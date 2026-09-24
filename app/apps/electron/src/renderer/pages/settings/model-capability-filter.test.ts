import { describe, expect, it } from 'bun:test'
import type { ModelDefinition } from '@config/models'
import { chatInputModalities, chatModelMatchesFilter, mediaModelMatchesFilter } from './model-capability-filter'

const model = (fields: Partial<ModelDefinition>): ModelDefinition => ({
  id: 'pi/example', name: 'Example', shortName: 'Example', description: '',
  provider: 'pi', ...fields,
})

describe('model settings capability filters', () => {
  it('keeps a multimodal chat model in the chat group without claiming it generates media', () => {
    const vision = model({ supportsImages: true, modalities: { input: ['text', 'image'], output: ['text'] } })
    expect(chatInputModalities(vision)).toEqual(['image'])
    expect(chatModelMatchesFilter(vision, 'chat')).toBe(true)
    expect(chatModelMatchesFilter(vision, 'multimodal')).toBe(true)
    expect(chatModelMatchesFilter(vision, 'image')).toBe(false)
  })

  it('does not infer audio capability from a model name or unknown metadata', () => {
    const unknown = model({ id: 'pi/gpt-audio-preview' })
    expect(chatInputModalities(unknown)).toEqual([])
    expect(chatModelMatchesFilter(unknown, 'multimodal')).toBe(false)
    expect(chatModelMatchesFilter(unknown, 'chat')).toBe(true)
  })

  it('uses explicit provider modalities for audio and video input', () => {
    expect(chatInputModalities(model({
      modalities: { input: ['text', 'audio', 'video'], output: ['text'] },
    }))).toEqual(['audio', 'video'])
  })

  it('does not put a media-only model in the conversation group', () => {
    expect(mediaModelMatchesFilter('image', 'chat')).toBe(false)
    expect(mediaModelMatchesFilter('image', 'image')).toBe(true)
    expect(mediaModelMatchesFilter('video', 'image')).toBe(false)
    expect(mediaModelMatchesFilter('audio', 'audio')).toBe(true)
    expect(mediaModelMatchesFilter('audio', 'chat')).toBe(false)
  })
})
