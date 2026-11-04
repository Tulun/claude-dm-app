// lib/claudeVision.js — shared model/request settings for the screenshot
// parsers. The model id lives here only (the old hard-coded one was retired
// and both parse routes 404'd).

import { describe, it, expect } from 'vitest';
import { VISION_MODEL, visionRequest, extractText } from '../../lib/claudeVision.js';

describe('visionRequest', () => {
  it('builds one user message on the shared model', () => {
    const content = [{ type: 'text', text: 'hi' }];
    const req = visionRequest({ content });
    expect(req.model).toBe(VISION_MODEL);
    expect(req.messages).toEqual([{ role: 'user', content }]);
    expect(req.max_tokens).toBeGreaterThanOrEqual(16000);
  });
});

describe('extractText', () => {
  it('finds the text block even when thinking comes first', () => {
    const res = { stop_reason: 'end_turn', content: [{ type: 'thinking', thinking: '' }, { type: 'text', text: '{}' }] };
    expect(extractText(res)).toEqual({ text: '{}' });
  });

  it('errors on refusal, truncation, and missing text', () => {
    expect(extractText({ stop_reason: 'refusal', content: [] }).error).toMatch(/declined/);
    expect(extractText({ stop_reason: 'max_tokens', content: [{ type: 'text', text: '{' }] }).error).toMatch(/cut off/);
    expect(extractText({ stop_reason: 'end_turn', content: [] }).error).toMatch(/No response/);
  });
});
