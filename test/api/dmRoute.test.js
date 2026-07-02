// @vitest-environment node
//
// Characterization tests for /api/dm (app/api/dm/route.js).
//
// process.cwd() is mocked to a temp dir before the route module is imported;
// the real data/ directory is never touched.

import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

let tmpDir;
let dataDir;
let cwdSpy;
let route;

const DM_FILE = () => path.join(dataDir, 'dm.json');

const EMPTY_DM_DATA = {
  version: 1,
  characters: [],
  world: { places: [], npcs: [], lore: [], gods: [], factions: [], items: [] },
  sessionNotes: { current: '', sessions: [] },
};

const postRequest = (body) =>
  new Request('http://localhost/api/dm', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

const deleteRequest = (query = '') =>
  new Request(`http://localhost/api/dm${query}`, { method: 'DELETE' });

beforeAll(async () => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dm-app-dm-test-'));
  dataDir = path.join(tmpDir, 'data');
  cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(tmpDir);
  route = await import('../../app/api/dm/route.js');
});

afterAll(() => {
  cwdSpy.mockRestore();
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

beforeEach(() => {
  fs.rmSync(dataDir, { recursive: true, force: true });
  fs.mkdirSync(dataDir, { recursive: true });
});

describe('GET /api/dm', () => {
  it('seeds data/dm.json with the empty default structure (version 1) when no file exists', async () => {
    const res = await route.GET();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(EMPTY_DM_DATA);
    expect(JSON.parse(fs.readFileSync(DM_FILE(), 'utf8'))).toEqual(EMPTY_DM_DATA);
  });

  it('returns saved data as-is when the file is at the current version', async () => {
    const saved = {
      ...EMPTY_DM_DATA,
      characters: [{ id: 'bbeg-1', name: 'Strahd' }],
      sessionNotes: { current: 'notes', sessions: [{ id: 'sess-1', text: 'session 1' }] },
    };
    fs.writeFileSync(DM_FILE(), JSON.stringify(saved));
    expect(await (await route.GET()).json()).toEqual(saved);
  });

  it('migrates a version-less file by merging in the default top-level keys', async () => {
    fs.writeFileSync(DM_FILE(), JSON.stringify({ characters: [{ id: 'c1', name: 'Old NPC' }] }));
    const data = await (await route.GET()).json();
    expect(data.version).toBe(1);
    expect(data.characters).toEqual([{ id: 'c1', name: 'Old NPC' }]);
    expect(data.world).toEqual(EMPTY_DM_DATA.world);
    expect(data.sessionNotes).toEqual(EMPTY_DM_DATA.sessionNotes);
    // Migration persists the merged result
    expect(JSON.parse(fs.readFileSync(DM_FILE(), 'utf8')).version).toBe(1);
  });

  it('QUIRK: migration merge is shallow — a partial world object in an old file loses the other default world keys', async () => {
    fs.writeFileSync(DM_FILE(), JSON.stringify({
      world: { places: [{ id: 'pl-1', name: 'Barovia' }] },
    }));
    const data = await (await route.GET()).json();
    expect(data.world.places).toEqual([{ id: 'pl-1', name: 'Barovia' }]);
    // gods/factions/etc. are gone, not backfilled from the defaults
    expect(data.world.gods).toBeUndefined();
    expect(data.world.factions).toBeUndefined();
  });

  it('QUIRK: a corrupt dm.json is silently overwritten with the defaults (user data lost)', async () => {
    fs.writeFileSync(DM_FILE(), 'not json at all');
    const res = await route.GET();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(EMPTY_DM_DATA);
    expect(JSON.parse(fs.readFileSync(DM_FILE(), 'utf8'))).toEqual(EMPTY_DM_DATA);
  });
});

describe('POST /api/dm', () => {
  it('merges a partial top-level update and returns the full merged document', async () => {
    await route.GET(); // seed defaults
    const res = await route.POST(postRequest({ characters: [{ id: 'c1', name: 'Vex' }] }));
    const merged = await res.json();
    expect(merged.characters).toEqual([{ id: 'c1', name: 'Vex' }]);
    expect(merged.world).toEqual(EMPTY_DM_DATA.world);       // untouched
    expect(merged.sessionNotes).toEqual(EMPTY_DM_DATA.sessionNotes);
  });

  it('deep-merges world: updating one world key preserves the others', async () => {
    await route.POST(postRequest({
      world: { gods: [{ id: 'god-1', name: 'The Raven Queen' }] },
    }));
    const res = await route.POST(postRequest({
      world: { places: [{ id: 'pl-1', name: 'Neverwinter' }] },
    }));
    const merged = await res.json();
    expect(merged.world.gods).toEqual([{ id: 'god-1', name: 'The Raven Queen' }]);
    expect(merged.world.places).toEqual([{ id: 'pl-1', name: 'Neverwinter' }]);
    expect(merged.world.lore).toEqual([]);
  });

  it('deep-merges sessionNotes: updating current preserves the sessions list', async () => {
    await route.POST(postRequest({
      sessionNotes: { sessions: [{ id: 'sess-1', text: 'Session one' }] },
    }));
    const res = await route.POST(postRequest({ sessionNotes: { current: 'live notes' } }));
    const merged = await res.json();
    expect(merged.sessionNotes).toEqual({
      current: 'live notes',
      sessions: [{ id: 'sess-1', text: 'Session one' }],
    });
  });

  it('persists the merged document to disk (round-trip via GET)', async () => {
    await route.POST(postRequest({ characters: [{ id: 'c1' }] }));
    const data = await (await route.GET()).json();
    expect(data.characters).toEqual([{ id: 'c1' }]);
    expect(JSON.parse(fs.readFileSync(DM_FILE(), 'utf8')).characters).toEqual([{ id: 'c1' }]);
  });

  it('returns 500 on a malformed body', async () => {
    const res = await route.POST(new Request('http://localhost/api/dm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{{{',
    }));
    expect(res.status).toBe(500);
  });
});

describe('DELETE /api/dm', () => {
  beforeEach(async () => {
    fs.writeFileSync(DM_FILE(), JSON.stringify({
      ...EMPTY_DM_DATA,
      characters: [{ id: 'c1', name: 'Vex' }, { id: 'c2', name: 'Strahd' }],
      world: {
        ...EMPTY_DM_DATA.world,
        places: [{ id: 'pl-1', name: 'Barovia' }],
        gods: [{ id: 'god-1', name: 'The Raven Queen' }],
      },
      sessionNotes: { current: '', sessions: [{ id: 'sess-1', text: 'one' }] },
    }));
  });

  it('requires both type and id (400)', async () => {
    expect((await route.DELETE(deleteRequest('?type=character'))).status).toBe(400);
    expect((await route.DELETE(deleteRequest('?id=c1'))).status).toBe(400);
  });

  it('deletes a character by id', async () => {
    const res = await route.DELETE(deleteRequest('?type=character&id=c1'));
    expect(await res.json()).toEqual({ success: true });
    const data = await (await route.GET()).json();
    expect(data.characters.map(c => c.id)).toEqual(['c2']);
  });

  it('deletes a session note by id', async () => {
    await route.DELETE(deleteRequest('?type=session&id=sess-1'));
    const data = await (await route.GET()).json();
    expect(data.sessionNotes.sessions).toEqual([]);
  });

  it('deletes world entries by pluralizing the type (place -> world.places, god -> world.gods)', async () => {
    await route.DELETE(deleteRequest('?type=place&id=pl-1'));
    await route.DELETE(deleteRequest('?type=god&id=god-1'));
    const data = await (await route.GET()).json();
    expect(data.world.places).toEqual([]);
    expect(data.world.gods).toEqual([]);
  });

  it('returns 400 for an unknown type', async () => {
    const res = await route.DELETE(deleteRequest('?type=starship&id=x'));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('Invalid type');
  });

  it('QUIRK: deleting a nonexistent id still returns success (no 404)', async () => {
    const res = await route.DELETE(deleteRequest('?type=character&id=does-not-exist'));
    expect(await res.json()).toEqual({ success: true });
    const data = await (await route.GET()).json();
    expect(data.characters).toHaveLength(2); // nothing removed
  });
});
