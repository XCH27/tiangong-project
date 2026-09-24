import { describe, expect, it } from 'bun:test';
import { getPiModelsForAuthProvider } from './models-pi.ts';

describe('Pi model capability projection', () => {
  it('uses Pi defaults for omitted standard efforts without inventing xhigh or max', () => {
    const gemini = getPiModelsForAuthProvider('google').find(model => model.id === 'pi/gemini-2.5-flash');
    expect(gemini?.supportsThinking).toBe(true);
    expect(gemini?.reasoningEfforts).toEqual(['low', 'medium', 'high']);
    expect(gemini?.reasoningDisableSupported).toBe(false);
  });

  it('honors explicit null and opt-in levels from the installed model map', () => {
    const models = getPiModelsForAuthProvider('xai');
    expect(models.find(model => model.id === 'pi/grok-4.5')?.reasoningEfforts).toEqual(['low', 'medium', 'high']);
    expect(models.find(model => model.id === 'pi/grok-4.6')?.reasoningEfforts).toEqual(['low', 'medium', 'high', 'xhigh']);
    expect(models.find(model => model.id === 'pi/grok-4.6')?.reasoningDisableSupported).toBe(false);
    expect(models.find(model => model.id === 'pi/grok-4.3')?.reasoningDisableSupported).toBe(true);
  });
});
