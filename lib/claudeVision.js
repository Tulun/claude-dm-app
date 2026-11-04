// Shared Claude settings for the screenshot parsers (/api/parse-monster,
// /api/parse-spell). ONE place for the model id — the old hard-coded
// 'claude-sonnet-4-20250514' was retired and both routes 404'd.

export const VISION_MODEL = 'claude-opus-5-5';

// Common request fields. Transcribing a stat block is straightforward, so low
// effort keeps it fast and cheap. Thinking is always on for this model and its
// tokens count against max_tokens, so leave generous headroom (a beholder's
// JSON alone is several thousand tokens). `fallbacks: 'default'` re-runs the
// request on a fallback model if a safety classifier declines it (monster
// text — "disintegration ray", "necrotic damage" — can trip one).
export const visionRequest = ({ content }) => ({
  model: VISION_MODEL,
  max_tokens: 16000,
  output_config: { effort: 'low' },
  betas: ['server-side-fallback-2026-07-01'],
  fallbacks: 'default',
  messages: [{ role: 'user', content }],
});

// Pull the model's text answer out of a response. Responses can lead with
// thinking blocks, so never assume content[0] is the text.
// Returns { text } or { error } (a user-facing message).
export const extractText = (response) => {
  if (response?.stop_reason === 'refusal') {
    return { error: 'The AI declined to read this image. Try a different screenshot.' };
  }
  if (response?.stop_reason === 'max_tokens') {
    return { error: 'The AI response was cut off before it finished. Try splitting the stat block into more screenshots.' };
  }
  const block = response?.content?.find(c => c.type === 'text');
  if (!block || !block.text) {
    return { error: 'No response from AI' };
  }
  return { text: block.text };
};
