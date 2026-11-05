// @vitest-environment node
//
// Tests for /api/parse-monster (app/api/parse-monster/route.js). The Anthropic
// SDK is mocked; we only check the request the route builds and its input
// validation — single-image (legacy body) and multi-screenshot stat blocks.

import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from 'vitest';

const create = vi.fn();

vi.mock('@anthropic-ai/sdk', () => ({
  default: class {
    constructor() {
      this.beta = { messages: { create } };
    }
  },
}));

let route;
const ORIGINAL_KEY = process.env.ANTHROPIC_API_KEY;

const post = (body) =>
  route.POST(
    new Request('http://localhost/api/parse-monster', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  );

// Current models lead with a (usually empty) thinking block
const replyWith = (monster) =>
  create.mockResolvedValue({
    stop_reason: 'end_turn',
    content: [
      { type: 'thinking', thinking: '' },
      { type: 'text', text: JSON.stringify(monster) },
    ],
  });

beforeAll(async () => {
  process.env.ANTHROPIC_API_KEY = 'test-key';
  route = await import('../../app/api/parse-monster/route.js');
});

afterAll(() => {
  if (ORIGINAL_KEY === undefined) delete process.env.ANTHROPIC_API_KEY;
  else process.env.ANTHROPIC_API_KEY = ORIGINAL_KEY;
});

beforeEach(() => {
  create.mockReset();
  replyWith({ name: 'Beholder', ac: 18, maxHp: 190 });
});

const imageBlocks = (call) => call.messages[0].content.filter(c => c.type === 'image');
const lastText = (call) => call.messages[0].content.at(-1).text;

describe('POST /api/parse-monster', () => {
  it('rejects a body with no images', async () => {
    const res = await post({});
    expect(res.status).toBe(400);
    const res2 = await post({ images: [] });
    expect(res2.status).toBe(400);
    expect(create).not.toHaveBeenCalled();
  });

  it('still accepts the legacy single { image, mediaType } body', async () => {
    const res = await post({ image: 'AAAA', mediaType: 'image/jpeg' });
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.monster.name).toBe('Beholder');

    const call = create.mock.calls[0][0];
    const imgs = imageBlocks(call);
    expect(imgs).toHaveLength(1);
    expect(imgs[0].source).toEqual({ type: 'base64', media_type: 'image/jpeg', data: 'AAAA' });
    expect(lastText(call)).not.toMatch(/consecutive screenshots/);
    expect(call.model).toBe('claude-opus-5-5');
  });

  it('sends every screenshot, in order, as one stat block', async () => {
    const res = await post({
      images: [
        { data: 'TOP', mediaType: 'image/png' },
        { data: 'BOTTOM', mediaType: 'image/webp' },
      ],
    });
    expect((await res.json()).success).toBe(true);
    expect(create).toHaveBeenCalledTimes(1);

    const call = create.mock.calls[0][0];
    const imgs = imageBlocks(call);
    expect(imgs.map(i => i.source.data)).toEqual(['TOP', 'BOTTOM']);
    expect(imgs.map(i => i.source.media_type)).toEqual(['image/png', 'image/webp']);

    const prompt = lastText(call);
    expect(prompt).toMatch(/2 images are consecutive screenshots of a SINGLE monster stat block/);
    expect(prompt).toMatch(/Analyze these images/);
  });

  it('labels each image with its position', async () => {
    await post({ images: [{ data: 'A' }, { data: 'B' }, { data: 'C' }] });
    const texts = create.mock.calls[0][0].messages[0].content
      .filter(c => c.type === 'text')
      .map(c => c.text);
    expect(texts.slice(0, 3)).toEqual(['Image 1 of 3:', 'Image 2 of 3:', 'Image 3 of 3:']);
  });

  it('defaults a missing mediaType and drops empty entries', async () => {
    await post({ images: [{ data: 'A' }, { data: '' }, null] });
    const imgs = imageBlocks(create.mock.calls[0][0]);
    expect(imgs).toHaveLength(1);
    expect(imgs[0].source.media_type).toBe('image/png');
  });

  it('rejects more than 6 screenshots', async () => {
    const res = await post({ images: Array.from({ length: 7 }, () => ({ data: 'A' })) });
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/max 6/);
    expect(create).not.toHaveBeenCalled();
  });

  it('reports a refusal instead of trying to parse it', async () => {
    create.mockResolvedValue({ stop_reason: 'refusal', content: [] });
    const res = await post({ image: 'AAAA' });
    expect(res.status).toBe(502);
    expect((await res.json()).error).toMatch(/declined/);
  });

  it('reports a truncated response', async () => {
    create.mockResolvedValue({
      stop_reason: 'max_tokens',
      content: [{ type: 'text', text: '{"name": "Behol' }],
    });
    const res = await post({ images: [{ data: 'A' }, { data: 'B' }] });
    expect(res.status).toBe(502);
    expect((await res.json()).error).toMatch(/cut off/);
  });

  it('asks for the flavor text and returns it as lore', async () => {
    replyWith({ name: 'Beholder', lore: '  Eyes of the Deep\nA floating orb.  ' });
    const res = await post({ image: 'AAAA' });
    expect(lastText(create.mock.calls[0][0])).toMatch(/"lore"/);
    expect((await res.json()).monster.lore).toBe('Eyes of the Deep\nA floating orb.');
  });

  it('returns empty lore when the screenshot has none (or the model sends junk)', async () => {
    replyWith({ name: 'Goblin', lore: { nope: true } });
    const res = await post({ image: 'AAAA' });
    expect((await res.json()).monster.lore).toBe('');
  });
});
