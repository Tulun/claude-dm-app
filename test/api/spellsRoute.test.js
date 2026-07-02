// @vitest-environment node
//
// Characterization tests for /api/spells (app/api/spells/route.js).
//
// The route resolves data/spells.json from process.cwd() at module load time,
// so process.cwd() is mocked to a throwaway temp dir BEFORE the dynamic import.
// Real files in data/ are never touched.

import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { defaultSpells } from '../../app/data/defaultSpells.js';

let tmpDir;
let dataDir;
let cwdSpy;
let route;

const SPELLS_FILE = () => path.join(dataDir, 'spells.json');
const PARTY_FILE = () => path.join(dataDir, 'party.json');

const postRequest = (body) =>
  new Request('http://localhost/api/spells', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

const deleteRequest = (query = '') =>
  new Request(`http://localhost/api/spells${query}`, { method: 'DELETE' });

beforeAll(async () => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dm-app-spells-test-'));
  dataDir = path.join(tmpDir, 'data');
  cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(tmpDir);
  route = await import('../../app/api/spells/route.js');
});

afterAll(() => {
  cwdSpy.mockRestore();
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

beforeEach(() => {
  fs.rmSync(dataDir, { recursive: true, force: true });
  fs.mkdirSync(dataDir, { recursive: true });
});

describe('GET /api/spells', () => {
  it('seeds data/spells.json with all defaults (version 4) when no file exists', async () => {
    const res = await route.GET();
    expect(res.status).toBe(200);
    const spells = await res.json();
    expect(spells).toHaveLength(defaultSpells.length);

    // Seeding writes the file with the current version wrapper
    const onDisk = JSON.parse(fs.readFileSync(SPELLS_FILE(), 'utf8'));
    expect(onDisk.version).toBe(4);
    expect(onDisk.spells).toHaveLength(defaultSpells.length);
  });

  it('returns spells sorted by level then name', async () => {
    fs.writeFileSync(SPELLS_FILE(), JSON.stringify({
      version: 4,
      spells: [
        { id: 's3', name: 'Zeta', level: 1 },
        { id: 's1', name: 'Beta', level: 0 },
        { id: 's2', name: 'Alpha', level: 1 },
      ],
    }));
    const spells = await (await route.GET()).json();
    expect(spells.map(s => s.id)).toEqual(['s1', 's2', 's3']);
  });

  it('migrates an old-version file: merges default fields into edited default spells, keeps custom spells, adds new defaults', async () => {
    const acid = defaultSpells.find(s => s.id === 'spell-acid-splash');
    // User edited the description and never had the source* fields
    const editedAcid = {
      id: 'spell-acid-splash',
      name: 'Acid Splash',
      level: 0,
      description: 'USER EDITED DESCRIPTION',
    };
    const custom = { id: 'custom-my-spell-1', name: 'My Spell', level: 9, description: 'homebrew' };
    fs.writeFileSync(SPELLS_FILE(), JSON.stringify({ version: 2, spells: [editedAcid, custom] }));

    const spells = await (await route.GET()).json();
    expect(spells).toHaveLength(defaultSpells.length + 1);

    const migratedAcid = spells.find(s => s.id === 'spell-acid-splash');
    // User edit preserved...
    expect(migratedAcid.description).toBe('USER EDITED DESCRIPTION');
    // ...new fields backfilled from the default
    expect(migratedAcid.source).toBe(acid.source);
    expect(migratedAcid.sourceShort).toBe(acid.sourceShort);
    expect(migratedAcid.sourceUrl).toBe(acid.sourceUrl);
    expect(migratedAcid.school).toBe(acid.school);

    // Custom spell untouched
    expect(spells.find(s => s.id === 'custom-my-spell-1')).toEqual(custom);

    // File rewritten at the current version so migration only runs once
    const onDisk = JSON.parse(fs.readFileSync(SPELLS_FILE(), 'utf8'));
    expect(onDisk.version).toBe(4);
    expect(onDisk.spells).toHaveLength(defaultSpells.length + 1);
  });

  it('a file with no version field at all is also migrated', async () => {
    fs.writeFileSync(SPELLS_FILE(), JSON.stringify({ spells: [{ id: 'custom-x', name: 'X', level: 1 }] }));
    const spells = await (await route.GET()).json();
    expect(spells).toHaveLength(defaultSpells.length + 1);
  });

  it('QUIRK: a corrupt spells.json is silently overwritten with the defaults (user data lost)', async () => {
    fs.writeFileSync(SPELLS_FILE(), '{not valid json');
    const res = await route.GET();
    expect(res.status).toBe(200);
    const spells = await res.json();
    expect(spells).toHaveLength(defaultSpells.length);
    // The corrupt file has been replaced with a fresh default file
    const onDisk = JSON.parse(fs.readFileSync(SPELLS_FILE(), 'utf8'));
    expect(onDisk.version).toBe(4);
  });
});

describe('POST /api/spells', () => {
  it('adds a new spell, generating a custom- id from the name, and persists it', async () => {
    fs.writeFileSync(SPELLS_FILE(), JSON.stringify({ version: 4, spells: [] }));
    const res = await route.POST(postRequest({ name: 'Test Zap!', level: 1, description: 'zap' }));
    expect(res.status).toBe(200);
    const saved = await res.json();
    expect(saved.id).toMatch(/^custom-test-zap--\d+$/); // '!' and space each become '-'

    const onDisk = JSON.parse(fs.readFileSync(SPELLS_FILE(), 'utf8'));
    expect(onDisk.spells).toHaveLength(1);
    expect(onDisk.spells[0].id).toBe(saved.id);
  });

  it('updates an existing spell in place (round-trip via GET)', async () => {
    fs.writeFileSync(SPELLS_FILE(), JSON.stringify({
      version: 4,
      spells: [{ id: 'custom-a', name: 'Alpha', level: 1, description: 'old' }],
    }));
    await route.POST(postRequest({ id: 'custom-a', name: 'Alpha', level: 1, description: 'new' }));
    const spells = await (await route.GET()).json();
    expect(spells).toHaveLength(1);
    expect(spells[0].description).toBe('new');
  });

  it('returns 500 on a malformed body', async () => {
    const res = await route.POST(new Request('http://localhost/api/spells', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not json{{{',
    }));
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBeTruthy();
  });
});

describe('POST /api/spells — syncSpellToCharacters side effect', () => {
  const baseSpell = {
    id: 'spell-zap', name: 'Zap', level: 1, school: 'Evocation',
    castingTime: 'Action', range: '30 feet', components: 'V', duration: 'Instantaneous',
    description: 'old desc', higherLevels: '', concentration: false, ritual: false,
  };

  it('rewrites data/party.json for characters whose spells reference the edited spell', async () => {
    fs.writeFileSync(SPELLS_FILE(), JSON.stringify({ version: 4, spells: [baseSpell] }));
    fs.writeFileSync(PARTY_FILE(), JSON.stringify([
      {
        id: 'p1', name: 'Mira',
        spells: [
          // matched by sourceId (spellbook reference)
          { id: 'char-spell-1', sourceId: 'spell-zap', name: 'Zap', level: 1, description: 'old desc' },
          // unrelated spell must be untouched
          { id: 'char-spell-2', sourceId: 'spell-other', name: 'Other', level: 2, description: 'other' },
        ],
      },
      // matched directly by spell id
      { id: 'p2', name: 'Theren', spells: [{ id: 'spell-zap', name: 'Zap', level: 1 }] },
      // character without a spells array is left alone
      { id: 'p3', name: 'Thorin' },
    ]));

    const updated = {
      ...baseSpell,
      name: 'Zap Improved', level: 2, castingTime: 'Bonus Action',
      description: 'new desc', concentration: true,
    };
    const res = await route.POST(postRequest(updated));
    expect(res.status).toBe(200);

    const party = JSON.parse(fs.readFileSync(PARTY_FILE(), 'utf8'));

    const synced = party[0].spells[0];
    expect(synced.id).toBe('char-spell-1'); // instance id preserved
    expect(synced.sourceId).toBe('spell-zap');
    expect(synced.name).toBe('Zap Improved');
    expect(synced.level).toBe(2);
    expect(synced.description).toBe('new desc');
    expect(synced.concentration).toBe(true);
    // Sync writes the casting time under both keys
    expect(synced.castTime).toBe('Bonus Action');
    expect(synced.castingTime).toBe('Bonus Action');

    // Unrelated spell untouched
    expect(party[0].spells[1]).toEqual(
      { id: 'char-spell-2', sourceId: 'spell-other', name: 'Other', level: 2, description: 'other' });

    // id-matched spell also synced (keeps its id)
    expect(party[1].spells[0].name).toBe('Zap Improved');
    expect(party[1].spells[0].id).toBe('spell-zap');

    // Spell-less character untouched
    expect(party[2]).toEqual({ id: 'p3', name: 'Thorin' });
  });

  it('does not rewrite party.json when no character references the spell', async () => {
    fs.writeFileSync(SPELLS_FILE(), JSON.stringify({ version: 4, spells: [baseSpell] }));
    const partyJson = JSON.stringify([{ id: 'p1', name: 'Mira', spells: [] }]);
    fs.writeFileSync(PARTY_FILE(), partyJson);

    await route.POST(postRequest({ ...baseSpell, description: 'changed' }));
    // File content byte-identical: sync skipped the write
    expect(fs.readFileSync(PARTY_FILE(), 'utf8')).toBe(partyJson);
  });

  it('sync only runs on updates: adding a NEW spell never touches party.json', async () => {
    fs.writeFileSync(SPELLS_FILE(), JSON.stringify({ version: 4, spells: [] }));
    const partyJson = JSON.stringify([
      { id: 'p1', spells: [{ id: 'spell-new-thing', name: 'stale' }] },
    ]);
    fs.writeFileSync(PARTY_FILE(), partyJson);

    await route.POST(postRequest({ id: 'spell-new-thing', name: 'New Thing', level: 0 }));
    expect(fs.readFileSync(PARTY_FILE(), 'utf8')).toBe(partyJson);
  });

  it('a corrupt party.json does not break the spell save', async () => {
    fs.writeFileSync(SPELLS_FILE(), JSON.stringify({ version: 4, spells: [baseSpell] }));
    fs.writeFileSync(PARTY_FILE(), '{corrupt');
    const res = await route.POST(postRequest({ ...baseSpell, description: 'changed' }));
    expect(res.status).toBe(200);
    expect(JSON.parse(fs.readFileSync(SPELLS_FILE(), 'utf8')).spells[0].description).toBe('changed');
  });
});

describe('DELETE /api/spells', () => {
  it('requires an id (400)', async () => {
    const res = await route.DELETE(deleteRequest());
    expect(res.status).toBe(400);
  });

  it('returns 404 for an unknown id', async () => {
    fs.writeFileSync(SPELLS_FILE(), JSON.stringify({ version: 4, spells: [] }));
    const res = await route.DELETE(deleteRequest('?id=nope'));
    expect(res.status).toBe(404);
  });

  it('deletes a spell and persists the removal (a deleted default stays deleted)', async () => {
    fs.writeFileSync(SPELLS_FILE(), JSON.stringify({
      version: 4,
      spells: [
        { id: 'spell-acid-splash', name: 'Acid Splash', level: 0 },
        { id: 'custom-a', name: 'Alpha', level: 1 },
      ],
    }));
    const res = await route.DELETE(deleteRequest('?id=spell-acid-splash'));
    expect(await res.json()).toEqual({ success: true });

    // File is at the current version, so the default is NOT re-merged on GET
    const spells = await (await route.GET()).json();
    expect(spells.map(s => s.id)).toEqual(['custom-a']);
  });
});
