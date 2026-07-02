// @vitest-environment node
//
// Tests for the user-data API routes: /api/party, /api/dm-npcs,
// /api/encounter, /api/encounters.
//
// The routes resolve their data directory from process.cwd() at module load
// time, so each suite mocks process.cwd() to point at a throwaway temp dir
// BEFORE dynamically importing the route. Real files in data/ are never touched.

import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

let tmpDir;
let dataDir;
let cwdSpy;

const postRequest = (body) =>
  new Request('http://localhost/api/test', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

const badRequest = () =>
  new Request('http://localhost/api/test', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: 'not json{{{',
  });

beforeAll(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dm-app-route-test-'));
  dataDir = path.join(tmpDir, 'data');
  cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(tmpDir);
});

afterAll(() => {
  cwdSpy.mockRestore();
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

beforeEach(() => {
  // Start every test from an empty data dir
  fs.rmSync(dataDir, { recursive: true, force: true });
  fs.mkdirSync(dataDir, { recursive: true });
});

describe('/api/party', () => {
  let route;
  beforeAll(async () => {
    route = await import('../../app/api/party/route.js');
  });

  it('GET returns null when no party file exists', async () => {
    const res = await route.GET();
    expect(res.status).toBe(200);
    expect(await res.json()).toBeNull();
  });

  it('POST writes the party and GET reads it back unchanged (round-trip)', async () => {
    const party = [
      { id: 'p1', name: 'Theren', class: 'Ranger', level: 5, currentHp: 38, maxHp: 44,
        inventory: [{ id: 'i1', name: 'Longbow', equipped: true }],
        companions: [{ id: 'c1', name: 'Wolf', active: true, inCombat: true }] },
      { id: 'p2', name: 'Mira', class: 'Cleric', level: 5, currentHp: 40, maxHp: 40 },
    ];
    const postRes = await route.POST(postRequest(party));
    expect(await postRes.json()).toEqual({ success: true });

    const getRes = await route.GET();
    expect(await getRes.json()).toEqual(party);
  });

  it('POST persists to data/party.json as pretty-printed JSON', async () => {
    await route.POST(postRequest([{ id: 'p1', name: 'Theren' }]));
    const raw = fs.readFileSync(path.join(dataDir, 'party.json'), 'utf8');
    expect(JSON.parse(raw)).toEqual([{ id: 'p1', name: 'Theren' }]);
    expect(raw).toContain('\n'); // pretty-printed, human-diffable
  });

  it('POST with a malformed body returns 500 and does not clobber existing data', async () => {
    await route.POST(postRequest([{ id: 'p1', name: 'Theren' }]));
    const res = await route.POST(badRequest());
    expect(res.status).toBe(500);
    const getRes = await route.GET();
    expect(await getRes.json()).toEqual([{ id: 'p1', name: 'Theren' }]);
  });

  it('GET returns 500 when the party file is corrupt', async () => {
    fs.writeFileSync(path.join(dataDir, 'party.json'), '{corrupt');
    const res = await route.GET();
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBeTruthy();
  });

  it('recreates the data dir if it was deleted', async () => {
    fs.rmSync(dataDir, { recursive: true, force: true });
    const res = await route.POST(postRequest([{ id: 'p1' }]));
    expect(await res.json()).toEqual({ success: true });
    expect(fs.existsSync(path.join(dataDir, 'party.json'))).toBe(true);
  });
});

describe('/api/dm-npcs', () => {
  let route;
  beforeAll(async () => {
    route = await import('../../app/api/dm-npcs/route.js');
  });

  it('GET returns [] when no file exists', async () => {
    const res = await route.GET();
    expect(await res.json()).toEqual([]);
  });

  it('round-trips NPC data', async () => {
    const npcs = [{ id: 'dm-npc-1', name: 'Bartender Olm', isDmNpc: true, maxHp: 12 }];
    await route.POST(postRequest(npcs));
    expect(await (await route.GET()).json()).toEqual(npcs);
  });
});

describe('/api/encounter (active combat state)', () => {
  let route;
  beforeAll(async () => {
    route = await import('../../app/api/encounter/route.js');
  });

  it('GET returns the empty default state when no file exists', async () => {
    const res = await route.GET();
    expect(await res.json()).toEqual({ enemies: [], round: 1, turnIndex: 0 });
  });

  it('round-trips enemies and lair action', async () => {
    const state = {
      enemies: [{ id: 'enemy-1', name: 'Goblin 1', currentHp: 7, maxHp: 7, initiative: 12 }],
      lairAction: { initiative: 20, notes: 'Rocks fall' },
    };
    await route.POST(postRequest(state));
    expect(await (await route.GET()).json()).toEqual(state);
  });

  it('GET falls back to the default state (not an error) when the file is corrupt', async () => {
    fs.writeFileSync(path.join(dataDir, 'encounter.json'), '{nope');
    const res = await route.GET();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ enemies: [], round: 1, turnIndex: 0 });
  });

  it('DELETE removes the saved encounter and is idempotent', async () => {
    await route.POST(postRequest({ enemies: [{ id: 'e1' }] }));
    expect(fs.existsSync(path.join(dataDir, 'encounter.json'))).toBe(true);

    const res1 = await route.DELETE();
    expect(await res1.json()).toEqual({ success: true });
    expect(fs.existsSync(path.join(dataDir, 'encounter.json'))).toBe(false);

    const res2 = await route.DELETE(); // no file — still succeeds
    expect(await res2.json()).toEqual({ success: true });
  });
});

describe('/api/encounters (saved encounter library)', () => {
  let route;
  beforeAll(async () => {
    route = await import('../../app/api/encounters/route.js');
  });

  it('GET returns [] when no file exists', async () => {
    expect(await (await route.GET()).json()).toEqual([]);
  });

  it('round-trips a saved encounter list', async () => {
    const encounters = [{
      id: 'encounter-1',
      name: 'Goblin Ambush',
      monsters: [{ id: 'm1', templateId: 't-goblin', name: 'Goblin', quantity: 4 }],
      createdAt: '2026-01-01T00:00:00.000Z',
    }];
    await route.POST(postRequest(encounters));
    expect(await (await route.GET()).json()).toEqual(encounters);
  });

  it('GET falls back to [] when the file is corrupt', async () => {
    fs.writeFileSync(path.join(dataDir, 'encounters.json'), 'not json');
    const res = await route.GET();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([]);
  });
});
